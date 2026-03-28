/** @type {Array<import('../mobile/types').Conversation>} */
const conversations = [];

/**
 * Persists a conversation. Sets `createdAt` to the current time if not provided.
 * @param {Omit<import('../mobile/types').Conversation, 'createdAt'> & { createdAt?: Date }} conversation
 */
export function save(conversation) {
  conversations.push({
    ...conversation,
    createdAt: conversation.createdAt ?? new Date(),
  });
}

/**
 * Returns all conversations for a given userId, sorted by createdAt descending.
 * @param {string} userId
 * @returns {import('../mobile/types').Conversation[]}
 */
export function findByUserId(userId) {
  return conversations
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}
