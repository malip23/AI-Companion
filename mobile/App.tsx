import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import {
  registerForPushNotifications,
  syncTokenWithServer,
  setupNotificationHandlers,
} from './services/notificationService';
import CompanionScreen from './screens/CompanionScreen';

// TODO: Replace with real user ID from auth system in production
const userId = 'user-001';

export default function App() {
  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        syncTokenWithServer(token, userId);
      }
    });

    const cleanup = setupNotificationHandlers(
      (notification) => console.log('Notification received:', notification),
      (response) => console.log('Notification response:', response),
    );

    return cleanup;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <CompanionScreen userId={userId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
