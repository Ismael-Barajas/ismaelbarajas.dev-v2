import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueue, flushTyping, resetTypingQueue, typingIdle, type TypingJob } from "lib/typingQueue";

/**
 * A job that finishes `ms` after it starts, recording what happened to it.
 * Like the real typing hook, completing it clears its own timer.
 */
const makeJob = (name: string, ms: number, events: string[]): TypingJob => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    start(finish) {
      events.push(`start ${name}`);
      timer = setTimeout(() => {
        events.push(`end ${name}`);
        finish();
      }, ms);
    },
    complete() {
      clearTimeout(timer);
      events.push(`complete ${name}`);
    },
  };
};

/** Jobs start on a microtask; this lets them. */
const tick = () => vi.advanceTimersByTimeAsync(0);

describe("typingQueue", () => {
  let events: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    resetTypingQueue();
    events = [];
  });
  afterEach(() => vi.useRealTimers());

  it("runs jobs strictly one at a time, in order", async () => {
    enqueue(makeJob("a", 100, events));
    enqueue(makeJob("b", 100, events));
    enqueue(makeJob("c", 100, events));
    expect(events).toEqual([]);
    await tick();
    expect(events).toEqual(["start a"]);

    await vi.advanceTimersByTimeAsync(100);
    expect(events).toEqual(["start a", "end a", "start b"]);

    await vi.advanceTimersByTimeAsync(200);
    expect(events).toEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });

  it("does not start a job cancelled before its microtask, as StrictMode does", async () => {
    const cancel = enqueue(makeJob("a", 100, events));
    cancel();
    enqueue(makeJob("a again", 100, events));
    await tick();
    expect(events).toEqual(["start a again"]);
  });

  it("resolves idle only after the last job finishes", async () => {
    let idle = false;
    enqueue(makeJob("a", 100, events));
    enqueue(makeJob("b", 100, events));
    typingIdle().then(() => {
      idle = true;
    });

    await vi.advanceTimersByTimeAsync(150);
    expect(idle).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(idle).toBe(true);
  });

  it("resolves idle immediately when nothing is queued", async () => {
    let idle = false;
    typingIdle().then(() => {
      idle = true;
    });
    await tick();
    expect(idle).toBe(true);
  });

  it("flush completes the running job and every waiting one, then is idle", async () => {
    let idle = false;
    enqueue(makeJob("a", 100, events));
    enqueue(makeJob("b", 100, events));
    enqueue(makeJob("c", 100, events));
    typingIdle().then(() => {
      idle = true;
    });
    await tick();

    flushTyping();
    expect(events).toEqual(["start a", "complete a", "complete b", "complete c"]);
    await tick();
    expect(idle).toBe(true);

    // The queue is clean afterwards.
    enqueue(makeJob("d", 50, events));
    await vi.advanceTimersByTimeAsync(100);
    expect(events.slice(4)).toEqual(["start d", "end d"]);
  });

  it("flush completes a job that was scheduled but had not started", async () => {
    enqueue(makeJob("a", 100, events));
    flushTyping();
    await tick();
    expect(events).toEqual(["complete a"]);
  });

  it("cancelling a waiting job drops it; cancelling the running one advances", async () => {
    enqueue(makeJob("a", 100, events));
    const cancelB = enqueue(makeJob("b", 100, events));
    enqueue(makeJob("c", 100, events));

    cancelB();
    await vi.advanceTimersByTimeAsync(100);
    expect(events).toEqual(["start a", "end a", "start c"]);

    const cancelD = enqueue(makeJob("d", 100, events));
    await vi.advanceTimersByTimeAsync(100);
    expect(events.at(-1)).toBe("start d");
    cancelD();
    await tick();
    // b never started; a, c and d did. Nothing else is waiting to start.
    expect(events.filter((e) => e.startsWith("start"))).toEqual(["start a", "start c", "start d"]);
    // d's own timer firing later is ignored: the queue is already idle.
    await vi.advanceTimersByTimeAsync(100);
    expect(events.at(-1)).toBe("end d");
    expect(events.filter((e) => e.startsWith("start"))).toHaveLength(3);
  });
});
