import { useSyncExternalStore } from "react";
import { getProgress, getServerStage, getStage, subscribe } from "lib/introStore";

/** Which stage the boot intro is in; "idle" once it is over or never played. */
const useIntroStage = () => useSyncExternalStore(subscribe, getStage, getServerStage);

/** The boot intro's status bar: lines done, lines to go, what is loading. */
export const useIntroProgress = () => useSyncExternalStore(subscribe, getProgress, getProgress);

export default useIntroStage;
