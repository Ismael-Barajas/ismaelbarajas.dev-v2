/**
 * The terminal's typing queue: one line animates at a time.
 *
 * Lines that land together (a click and the route change it causes, the boot
 * sequence) each wait for the previous line to finish, so the log reads top
 * to bottom instead of several lines racing. The queue is explicit rather
 * than a promise chain so the boot intro (lib/introStore.ts) can wait for it
 * to drain and, on skip, jump every line to its end state at once.
 */

/** Per-character reveal, capped so long lines don't drag. */
export const TYPE_MS_PER_CHAR = 14;
export const TYPE_MAX_MS = 600;
/** Beat between one line finishing and the next starting. */
export const LINE_GAP_MS = 90;

/** How long a line takes to type out, gap included. */
export const typingDuration = (text: string): number =>
  Math.min(TYPE_MS_PER_CHAR * text.length, TYPE_MAX_MS) + LINE_GAP_MS;

export interface TypingJob {
  /** Begin animating; call `finish` once the line and its trailing gap are done. */
  start(finish: () => void): void;
  /** Jump straight to the end state. The queue moves on by itself. */
  complete(): void;
}

let active: TypingJob | null = null;
let pending: TypingJob[] = [];
let idleWaiters: Array<() => void> = [];

const settleIdle = () => {
  if (active || pending.length) return;
  const waiters = idleWaiters;
  idleWaiters = [];
  waiters.forEach((resolve) => resolve());
};

function runNext() {
  const job = pending.shift() ?? null;
  active = job;
  if (!job) {
    settleIdle();
    return;
  }
  // Start on a microtask, not synchronously: React StrictMode runs an
  // effect, cleans it up and runs it again in one go, and the cancelled
  // first run must not have marked the line (or the next one) as started.
  queueMicrotask(() => {
    if (active !== job) return; // cancelled or flushed before it began
    job.start(() => {
      // A stale finish (the job was cancelled or flushed) must not advance
      // whatever is running now.
      if (active !== job) return;
      runNext();
    });
  });
}

/**
 * Adds a job; it starts (on the next microtask) when nothing else is
 * running. Returns a cancel function for unmounts: a waiting job is dropped,
 * a running one hands its turn on.
 */
export function enqueue(job: TypingJob): () => void {
  pending.push(job);
  if (!active) runNext();
  return () => {
    if (active === job) {
      runNext();
    } else {
      pending = pending.filter((j) => j !== job);
      settleIdle();
    }
  };
}

/** Resolves once nothing is running or waiting. */
export function typingIdle(): Promise<void> {
  if (!active && !pending.length) return Promise.resolve();
  return new Promise((resolve) => {
    idleWaiters.push(resolve);
  });
}

/** Completes the running job and every waiting one, then reports idle. */
export function flushTyping() {
  const running = active;
  const waiting = pending;
  active = null;
  pending = [];
  running?.complete();
  waiting.forEach((job) => job.complete());
  settleIdle();
}

/** Test-only reset. */
export function resetTypingQueue() {
  active = null;
  pending = [];
  idleWaiters = [];
}
