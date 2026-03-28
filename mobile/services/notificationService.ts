import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import Device from 'expo-device';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications are only supported on physical devices.');
    return null;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  return tokenData.data;
}

export async function syncTokenWithServer(token: string, userId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/register-push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
    });
  } catch (error) {
    console.error('Failed to sync push token with server:', error);
  }
}

export function setupNotificationHandlers(
  onReceive: (n: Notifications.Notification) => void,
  onResponse: (r: Notifications.NotificationResponse) => void
): () => void {
  const receiveSubscription = Notifications.addNotificationReceivedListener(onReceive);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receiveSubscription.remove();
    responseSubscription.remove();
  };
}
