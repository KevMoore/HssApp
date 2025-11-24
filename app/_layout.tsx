import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="search"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#ffffff',
            headerTitle: 'Search Results',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name="faqs"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#ffffff',
            headerTitle: 'FAQs',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name="contact-us"
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#ffffff',
            headerTitle: 'Contact Us',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
