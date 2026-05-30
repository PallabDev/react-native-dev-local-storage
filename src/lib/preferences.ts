import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { ThemePreference } from "@/types/snippet";

const THEME_KEY = "devsnippets.theme";
const MODEL_KEY = "devsnippets.aiModel";
const API_KEY = "devsnippets.openaiKey";
const WEB_API_KEY = "devsnippets.webOpenaiKey";

export async function getThemePreference(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export async function setThemePreference(theme: ThemePreference) {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function getAiModel() {
  return (await AsyncStorage.getItem(MODEL_KEY)) ?? "gpt-5-mini";
}

export async function setAiModel(model: string) {
  await AsyncStorage.setItem(MODEL_KEY, model.trim() || "gpt-5-mini");
}

export async function getApiKey() {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(API_KEY);
  }

  return AsyncStorage.getItem(WEB_API_KEY);
}

export async function setApiKey(value: string) {
  const trimmed = value.trim();
  const secureStoreAvailable = await canUseSecureStore();

  if (!trimmed) {
    if (secureStoreAvailable) {
      await SecureStore.deleteItemAsync(API_KEY);
    } else {
      await AsyncStorage.removeItem(WEB_API_KEY);
    }
    return;
  }

  if (secureStoreAvailable) {
    await SecureStore.setItemAsync(API_KEY, trimmed);
  } else {
    await AsyncStorage.setItem(WEB_API_KEY, trimmed);
  }
}

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}
