/**
 * Sends push notifications via the Expo Push API.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * @param {string} token - Expo push token
 * @param {{ title: string, body: string, data?: object }} payload
 */
export async function sendPushNotification(token, payload) {
  const { title, body, data } = payload;

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ to: token, title, body, data }),
    });

    const result = await response.json();

    if (result?.data?.[0]?.status === 'error') {
      console.error('[notificationSender] Error ticket from Expo:', result.data[0]);
    }
  } catch (err) {
    console.error('[notificationSender] Failed to send push notification:', err);
  }
}
