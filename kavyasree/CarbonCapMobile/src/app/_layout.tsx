import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="trader-dashboard" options={{ title: 'Trader Dashboard' }} />
      <Stack.Screen name="verifier-dashboard" options={{ title: 'Verifier Dashboard' }} />
      <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
    </Stack>
  );
}
