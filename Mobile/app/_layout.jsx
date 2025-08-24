import { Slot } from "expo-router";
import SafeScreen from "@/components/SafeScreen";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <LanguageProvider>
        <SafeScreen>
          <Slot />
        </SafeScreen>
        <StatusBar style="dark" />
      </LanguageProvider>
    </ClerkProvider>
  );
}