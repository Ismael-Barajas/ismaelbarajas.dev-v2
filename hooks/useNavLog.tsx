import { useSyncExternalStore } from "react";
import {
  EMPTY,
  getEntries,
  getView,
  isPeeking,
  subscribe,
  type LogEntry,
  type TerminalView,
} from "lib/navLog";

const getServerEntries = () => EMPTY;
/** Expanded on the server, so the markup matches before the width is known. */
const getServerView = (): TerminalView => "expanded";
const getServerPeek = () => false;

/** The navigation terminal's lines, newest last. */
const useNavLog = (): readonly LogEntry[] =>
  useSyncExternalStore(subscribe, getEntries, getServerEntries);

/** Whether the panel is expanded, collapsed to a one-line strip, or hidden. */
export const useNavLogView = (): TerminalView =>
  useSyncExternalStore(subscribe, getView, getServerView);

/** Whether a collapsed strip is open for a moment to show a new line. */
export const useNavLogPeek = (): boolean =>
  useSyncExternalStore(subscribe, isPeeking, getServerPeek);

export default useNavLog;
