import * as SecureStore from "expo-secure-store";
import { createRefreshTokenStorage } from "./refresh-token-storage";

const REFRESH_TOKEN_KEY = "sipat.mobile.refresh-token.v1";
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const refreshTokenStorage = createRefreshTokenStorage({
  get: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY, OPTIONS),
  set: (token) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, OPTIONS),
  delete: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, OPTIONS),
});
