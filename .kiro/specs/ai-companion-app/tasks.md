# Implementation Plan: AI Companion App

## Overview

Incremental implementation organized by team ownership. Each task maps to a specific file so teams can work in parallel. The shared types file is created first as a foundation, then backend and mobile teams proceed independently, with final wiring at the end.

## Tasks

---

### Shared Foundation

- [x] 1. Create shared TypeScript interfaces in `mobile/types.ts`
  - Define `Conversation`, `PushTokenRecord`, `VapiMessage`, `VapiMessageRole`, and `CallState` interfaces
  - Export all types for use by both mobile services and screens
  - _Requirements: 1.2, 3.1, 5.1, 6.4_

---

### Backend Team

- [x] 2. Implement `server/conversationStore.js`
  - [x] 2.1 Implement in-memory conversation store with `save(conversation)` and `findByUserId(userId)` methods
    - `save` must set `createdAt` to current server time if not provided
    - `findByUserId` must return records sorted by `createdAt` descending
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for conversation store ordering (Property 6)
    - **Property 6: Conversation list is ordered by createdAt descending**
    - **Validates: Requirements 5.4**

- [x] 3. Implement `server/pushTokenStore.js`
  - [x] 3.1 Implement in-memory push token store with `upsert(record)` and `findByUserId(userId)` methods
    - `upsert` must enforce one token per userId (overwrite on conflict)
    - Validate token format matches `ExponentPushToken[...]` before storing; throw on invalid format
    - _Requirements: 6.4, 6.7_

  - [ ]* 3.2 Write property test for push token upsert (Property 7)
    - **Property 7: PushTokenStore upsert maintains one token per userId**
    - **Validates: Requirements 6.4**

  - [ ]* 3.3 Write property test for push token format validation (Property 8)
    - **Property 8: Push token format validation**
    - **Validates: Requirements 6.7**

- [x] 4. Implement `server/notificationSender.js`
  - [x] 4.1 Implement `sendPushNotification(token, payload)` that POSTs to `https://exp.host/--/api/v2/push/send`
    - Accept `{ title, body, data? }` payload shape
    - Log error tickets returned by Expo Push API; do not throw
    - _Requirements: 7.2, 7.4, 7.5_

  - [ ]* 4.2 Write unit tests for notification sender
    - Mock `fetch`; assert correct request shape sent to Expo Push API
    - Assert error tickets are logged and not re-thrown
    - _Requirements: 7.4, 7.5_

- [x] 5. Implement `server/webhookHandler.js`
  - [x] 5.1 Implement Express router for `POST /vapi-webhook` and `POST /register-push-token`
    - Validate `x-vapi-secret` header on `/vapi-webhook`; reject unauthorized requests before any processing
    - Handle `call-started`, `transcript`, `end-of-call-report`, `function-call`, and unknown event types
    - Extract `callId`, `transcript`, `summary` from `end-of-call-report` and call `processCallReport`
    - Wrap `processCallReport` in try/catch; always respond HTTP 200 even on internal error
    - `POST /register-push-token` delegates to `pushTokenStore.upsert`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.4_

  - [ ]* 5.2 Write property test for webhook always responding HTTP 200 (Property 4)
    - **Property 4: Webhook handler always responds HTTP 200**
    - **Validates: Requirements 4.1, 4.2, 4.5, 4.6**

  - [ ]* 5.3 Write property test for webhook secret gate (Property 15)
    - **Property 15: Webhook secret gate blocks unauthorized requests**
    - **Validates: Requirements 4.7**

  - [x] 5.4 Implement `processCallReport(report)` inside `webhookHandler.js`
    - Persist conversation via `conversationStore.save`
    - Look up push token via `pushTokenStore.findByUserId`
    - Send notification via `notificationSender.sendPushNotification` if token exists; skip silently if not
    - Catch all errors internally; never propagate to webhook response
    - _Requirements: 4.3, 5.1, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 5.5 Write property test for end-of-call-report persistence (Property 5)
    - **Property 5: end-of-call-report triggers conversation persistence**
    - **Validates: Requirements 4.3, 5.1**

  - [ ]* 5.6 Write property test for push notification sent only when token exists (Property 9)
    - **Property 9: Push notification sent only when token exists**
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 5.7 Write property test for push API errors not propagating (Property 10)
    - **Property 10: Push API errors do not propagate**
    - **Validates: Requirements 7.4**

- [x] 6. Implement `server/index.js` — Express app entry point
  - Create Express app, mount the webhook router from `webhookHandler.js`
  - Add `GET /conversations/:userId` route that delegates to `conversationStore.findByUserId`
  - Validate required environment variables (`VAPI_WEBHOOK_SECRET`) at startup; log descriptive error and `process.exit(1)` if missing
  - Start server on port 3001
  - _Requirements: 4.1–4.7, 5.4, 10.3, 10.5_

- [ ] 7. Backend checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Vapi Team

- [x] 8. Implement `mobile/services/vapiService.ts`
  - [x] 8.1 Implement `VapiService` class wrapping `@vapi-ai/react-native`
    - Initialize Vapi instance with `publicKey` from `EXPO_PUBLIC_VAPI_KEY`
    - Implement `startCall(config)`: assert `callState === 'idle'`, set state to `'connecting'`, call `vapi.start()`; on error reset to `'idle'` and emit `onError`
    - Implement `endCall()`: call `vapi.stop()`, set state to `'ending'`
    - Wire SDK `call-start` event → set state to `'in-call'`, fire `onCallStart` callbacks
    - Wire SDK `call-end` event → set state to `'idle'`, fire `onCallEnd` callbacks
    - Wire SDK `message` event → fire `onMessage` callbacks with typed `VapiMessage`
    - Wire SDK `error` event → fire `onError` callbacks
    - Expose `onCallStart`, `onCallEnd`, `onMessage`, `onError` registration methods
    - Read `publicKey` from `EXPO_PUBLIC_VAPI_KEY` and `assistantId` from `EXPO_PUBLIC_ASSISTANT_ID`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1, 10.2_

  - [ ]* 8.2 Write property test for CallState machine transitions (Property 1)
    - **Property 1: CallState machine transitions are deterministic**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 8.3 Write property test for startCall rejected when not idle (Property 2)
    - **Property 2: startCall is rejected when not idle**
    - **Validates: Requirements 1.6**

  - [ ]* 8.4 Write property test for startCall error resets state (Property 3)
    - **Property 3: startCall error resets state**
    - **Validates: Requirements 1.5**

- [ ] 9. Vapi team checkpoint — Ensure all VapiService tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### Notifications Team

- [x] 10. Implement `mobile/services/notificationService.ts`
  - [x] 10.1 Implement `registerForPushNotifications(): Promise<string | null>`
    - Return `null` on simulator (use `expo-device` `isDevice` check)
    - Request permissions via `Notifications.requestPermissionsAsync()`; return `null` if denied
    - Retrieve token via `Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig.extra.eas.projectId })`
    - Return token string on success
    - _Requirements: 6.1, 6.2, 6.5, 6.6, 10.4_

  - [x] 10.2 Implement `syncTokenWithServer(token, userId): Promise<void>`
    - POST `{ token, userId }` to backend `/register-push-token`
    - Log errors but do not re-throw (best-effort sync)
    - _Requirements: 6.3_

  - [x] 10.3 Implement `setupNotificationHandlers(onReceive, onResponse): () => void`
    - Register foreground notification listener → invoke `onReceive`
    - Register notification response listener → invoke `onResponse`
    - Return cleanup function that removes both listeners
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 10.4 Write property test for notification callbacks routed correctly (Property 14)
    - **Property 14: Notification callbacks are routed correctly**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 11. Notifications team checkpoint — Ensure all NotificationService tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

### UI Team

- [x] 12. Implement `mobile/screens/CompanionScreen.tsx`
  - [x] 12.1 Implement `CompanionScreen` component with `userId` prop
    - Manage local `callState: CallState` and `transcript: string` state
    - Render idle state: enabled "Talk to Companion" button
    - Render connecting state: loading indicator, disabled start button
    - Render in-call state: enabled "End Call" button, live transcript `ScrollView`
    - Render ending state: all controls disabled, transitional indicator
    - On call initiation: request microphone permission via `expo-av`; show alert with settings deep-link if denied; invoke `vapiService.startCall` if granted
    - Subscribe to `vapiService.onMessage` to append transcript chunks; clear transcript on new call start
    - Subscribe to `vapiService.onCallStart`, `onCallEnd`, `onError` to update `callState`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for CompanionScreen UI reflecting CallState (Property 13)
    - **Property 13: CompanionScreen UI reflects CallState**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

  - [ ]* 12.3 Write property test for transcript chunk accumulation (Property 11)
    - **Property 11: Transcript chunks accumulate correctly**
    - **Validates: Requirements 3.1**

  - [ ]* 12.4 Write property test for new call clearing transcript (Property 12)
    - **Property 12: New call clears previous transcript**
    - **Validates: Requirements 3.2**

- [x] 13. Implement `mobile/App.tsx` — App entry point
  - Initialize `NotificationService` on mount: call `registerForPushNotifications()`, then `syncTokenWithServer(token, userId)` if token is non-null
  - Set up notification handlers via `setupNotificationHandlers`; call cleanup on unmount
  - Render `CompanionScreen` with a `userId` value (from auth context or hardcoded placeholder for v1)
  - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` as specified in the design
- Backend team can start on tasks 2–6 immediately after task 1 is complete
- Vapi team and Notifications team can work in parallel after task 1
- UI team (tasks 12–13) depends on `VapiService` and `NotificationService` interfaces being stable
