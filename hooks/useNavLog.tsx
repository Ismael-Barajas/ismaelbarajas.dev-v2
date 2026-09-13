import { useSyncExternalStore } from "react";
import {
  EMPTY,
  getEntries,
  getView,
  subscribe,
  type LogEntry,
  type TerminalView,
} from "lib/navLog";

const getServerEntries = () => EMPTY;
/** Expanded on the server, so the markup matches before the width is known. */
const getServerView = (): TerminalView => "expanded";

/** The navigation terminal's lines, newest last. */
const useNavLog = (): readonly LogEntry[] =>
  useSyncExternalStore(subscribe, getEntries, getServerEntries);

/** Whether the panel is expanded, collapsed to a one-line strip, or hidden. */
export const useNavLogView = (): TerminalView =>
  useSyncExternalStore(subscribe, getView, getServerView);

export default useNavLog;
