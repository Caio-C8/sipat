import { focusManager } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  AppState,
  Platform,
  type AppStateStatus,
  type NativeEventSubscription,
} from "react-native";

type AppStateSource = Readonly<{
  currentState: string | null | undefined;
  addEventListener: (
    type: "change",
    listener: (state: AppStateStatus) => void,
  ) => NativeEventSubscription;
}>;

type SetFocused = (focused?: boolean) => void;

export function installNativeQueryFocusLifecycle(
  platform: string,
  appState: AppStateSource,
  setFocused: SetFocused,
) {
  if (platform === "web") return () => undefined;

  const updateFocus = (state: string | null | undefined) => {
    setFocused(state === "active");
  };

  updateFocus(appState.currentState);
  const subscription = appState.addEventListener("change", updateFocus);

  return () => {
    subscription.remove();
    setFocused(undefined);
  };
}

export function NativeQueryFocusLifecycle() {
  useEffect(
    () =>
      installNativeQueryFocusLifecycle(Platform.OS, AppState, (focused) =>
        focusManager.setFocused(focused),
      ),
    [],
  );

  return null;
}
