/** @type {Map<string, { userId: string, expoPushToken: string, platform: string, updatedAt: Date }>} */
const store = new Map();

const EXPO_TOKEN_REGEX = /^ExponentPushToken\[.+\]$/;

/**
 * Stores or overwrites a PushTokenRecord for a userId.
 * @param {{ userId: string, expoPushToken: string, platform: string, updatedAt?: Date }} record
 */
export function upsert(record) {
  if (!EXPO_TOKEN_REGEX.test(record.expoPushToken)) {
    throw new Error(
      `Invalid expoPushToken "${record.expoPushToken}": must match /^ExponentPushToken\\[.+\\]$/`
    );
  }
  store.set(record.userId, {
    ...record,
    updatedAt: new Date(),
  });
}

/**
 * Returns the PushTokenRecord for a userId, or null if not found.
 * @param {string} userId
 * @returns {{ userId: string, expoPushToken: string, platform: string, updatedAt: Date } | null}
 */
export function findByUserId(userId) {
  return store.get(userId) ?? null;
}
