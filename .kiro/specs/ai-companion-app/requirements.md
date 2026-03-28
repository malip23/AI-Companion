# Requirements Document

## Introduction

This document defines the requirements for the AI Companion App — a React Native (Expo) mobile application that lets users have voice conversations with an AI companion powered by Vapi. The system consists of three layers: a mobile app (React Native/Expo), an Express.js backend, and the Vapi voice AI platform. The mobile app initiates voice calls via the Vapi React Native SDK; the backend receives Vapi webhook events to persist transcripts and trigger Expo Push Notifications that re-engage users after conversations end.

Requirements are organized by team ownership to support parallel development: Vapi integration, push notifications, backend, and UI are separated so team members can work independently.

---

## Glossary

- **App**: The React Native/Expo mobile application
- **VapiService**: The client-side module wrapping the `@vapi-ai/react-native` SDK
- **CompanionScreen**: The primary UI screen where the user interacts with the AI companion
- **Backend**: The Express.js server running on port 3001
- **WebhookHandler**: The `/vapi-webhook` endpoint on the Backend
- **NotificationService**: The client-side module managing Expo Push Notification registration and handling
- **ConversationStore**: The server-side storage for call transcripts and summaries
- **PushTokenStore**: The server-side storage for Expo push tokens keyed by userId
- **Conversation**: A persisted record of a completed call, containing callId, transcript, summary, and metadata
- **PushTokenRecord**: A persisted record associating a userId with an Expo push token
- **CallState**: The current state of a voice call on the client — one of `idle`, `connecting`, `in-call`, or `ending`
- **Vapi**: The third-party voice AI platform (Vapi.ai)
- **ExpoPN**: The Expo Push Notification infrastructure used to deliver notifications to iOS and Android

---

## Requirements

---

### Requirement 1: Vapi Voice Call Lifecycle

**User Story:** As a user, I want to start and end voice conversations with my AI companion, so that I can have natural spoken interactions with it.

#### Acceptance Criteria

1. WHEN a user initiates a call and microphone permission is granted, THE VapiService SHALL start a Vapi session using the configured `publicKey` and `assistantId`.
2. WHEN `vapi.start()` succeeds, THE VapiService SHALL transition CallState from `idle` to `connecting`, then to `in-call` upon receiving the `call-start` SDK event.
3. WHEN a user ends a call, THE VapiService SHALL invoke `vapi.stop()` and transition CallState to `ending`.
4. WHEN the Vapi SDK emits a `call-end` event, THE VapiService SHALL transition CallState to `idle`.
5. IF `vapi.start()` throws or times out, THEN THE VapiService SHALL reset CallState to `idle` and emit an error event to registered error listeners.
6. WHILE CallState is not `idle`, THE VapiService SHALL reject any new `startCall` invocation without mutating external state.
7. THE VapiService SHALL expose typed event registration methods: `onCallStart`, `onCallEnd`, `onMessage`, and `onError`.

---

### Requirement 2: Microphone Permission Handling

**User Story:** As a user, I want the app to request microphone access before my first call, so that voice input works correctly.

#### Acceptance Criteria

1. WHEN a user attempts to start a call, THE CompanionScreen SHALL request microphone permission via `expo-av` before invoking `VapiService.startCall`.
2. IF microphone permission is denied, THEN THE CompanionScreen SHALL display an in-app alert explaining why the permission is needed and SHALL NOT attempt to start the call.
3. WHERE the device supports deep-linking to app settings, THE CompanionScreen SHALL provide a control that opens the system settings via `Linking.openSettings()` when permission has been denied.

---

### Requirement 3: Live Transcript Display

**User Story:** As a user, I want to see a live transcript of my conversation as it happens, so that I can follow along and review what was said.

#### Acceptance Criteria

1. WHEN THE VapiService emits a `message` event with a transcript chunk, THE CompanionScreen SHALL append the chunk to the displayed transcript.
2. WHEN a new call begins, THE CompanionScreen SHALL clear any transcript from a previous call.
3. WHILE CallState is `in-call`, THE CompanionScreen SHALL display the accumulating transcript in real time.

---

### Requirement 4: Vapi Webhook Event Processing

**User Story:** As a system operator, I want the backend to reliably process Vapi webhook events, so that conversation data is captured and downstream actions are triggered.

#### Acceptance Criteria

1. WHEN THE WebhookHandler receives a `call-started` event, THE Backend SHALL log the call ID and respond with HTTP 200.
2. WHEN THE WebhookHandler receives a `transcript` event, THE Backend SHALL log the transcript chunk and respond with HTTP 200.
3. WHEN THE WebhookHandler receives an `end-of-call-report` event, THE Backend SHALL extract `transcript`, `summary`, and `callId` from the payload and invoke `processCallReport`.
4. WHEN THE WebhookHandler receives a `function-call` event, THE Backend SHALL execute the named function with the provided parameters and respond with a JSON result object.
5. IF THE WebhookHandler receives an unrecognized event type, THEN THE Backend SHALL log the event type and respond with HTTP 200.
6. IF `processCallReport` throws an internal error, THEN THE WebhookHandler SHALL log the error and still respond with HTTP 200 to prevent Vapi from retrying the webhook.
7. THE WebhookHandler SHALL validate incoming requests using the `x-vapi-secret` header before processing any event.

---

### Requirement 5: Conversation Persistence

**User Story:** As a user, I want my conversation transcripts and summaries to be saved after each call, so that I can review past conversations.

#### Acceptance Criteria

1. WHEN `processCallReport` is invoked with a valid `callId`, THE ConversationStore SHALL persist a Conversation record containing `callId`, `transcript`, `summary`, and `createdAt`.
2. THE ConversationStore SHALL accept an empty string for `transcript` (short calls may produce no transcript).
3. WHEN a Conversation record is created, THE Backend SHALL set `createdAt` to the current server time.
4. WHEN a client requests `GET /conversations/:userId`, THE Backend SHALL return all Conversation records associated with that userId, ordered by `createdAt` descending.

---

### Requirement 6: Push Token Registration

**User Story:** As a user, I want the app to register my device for push notifications, so that I receive follow-up messages after conversations.

#### Acceptance Criteria

1. WHEN the App launches on a physical device, THE NotificationService SHALL request notification permissions via `expo-notifications`.
2. IF notification permission is granted, THEN THE NotificationService SHALL retrieve the Expo push token using `Notifications.getExpoPushTokenAsync` with the EAS project ID.
3. WHEN a valid Expo push token is obtained, THE NotificationService SHALL POST the token and userId to `POST /register-push-token` on the Backend.
4. WHEN THE Backend receives `POST /register-push-token` with a valid token and userId, THE PushTokenStore SHALL upsert the PushTokenRecord so that at most one token exists per userId.
5. IF the App is running on a simulator, THEN THE NotificationService SHALL return `null` and skip token registration without throwing an error.
6. IF notification permission is denied, THEN THE NotificationService SHALL return `null` and skip token registration without throwing an error.
7. THE PushTokenStore SHALL only accept tokens matching the format `ExponentPushToken[...]`.

---

### Requirement 7: Post-Call Push Notifications

**User Story:** As a user, I want to receive a push notification after a conversation ends, so that I am reminded to return to the app and review my summary.

#### Acceptance Criteria

1. WHEN `processCallReport` completes persisting a Conversation, THE Backend SHALL look up the PushTokenRecord for the associated userId.
2. IF a PushTokenRecord exists for the userId, THEN THE Backend SHALL send a push notification via the Expo Push API with a title and body referencing the conversation summary.
3. IF no PushTokenRecord exists for the userId, THEN THE Backend SHALL skip notification delivery without logging an error.
4. IF the Expo Push API returns an error ticket, THEN THE Backend SHALL log the error ticket and continue without crashing the webhook handler.
5. THE Backend SHALL use `https://exp.host/--/api/v2/push/send` as the Expo Push API endpoint.

---

### Requirement 8: Notification Handling on the Client

**User Story:** As a user, I want the app to respond to incoming push notifications, so that I can navigate to relevant content when I tap a notification.

#### Acceptance Criteria

1. WHEN a push notification is received while the App is in the foreground, THE NotificationService SHALL invoke the registered `onReceive` callback with the notification payload.
2. WHEN a user taps a push notification, THE NotificationService SHALL invoke the registered `onResponse` callback with the notification response.
3. WHEN notification listeners are no longer needed, THE NotificationService SHALL return a cleanup function that removes all registered listeners.

---

### Requirement 9: CompanionScreen UI States

**User Story:** As a user, I want the companion screen to clearly reflect the current call state, so that I always know whether I am connected, connecting, or idle.

#### Acceptance Criteria

1. WHILE CallState is `idle`, THE CompanionScreen SHALL display a control that allows the user to initiate a call.
2. WHILE CallState is `connecting`, THE CompanionScreen SHALL display a loading indicator and disable the call initiation control.
3. WHILE CallState is `in-call`, THE CompanionScreen SHALL display a control that allows the user to end the call and SHALL show the live transcript area.
4. WHILE CallState is `ending`, THE CompanionScreen SHALL display a transitional state and disable both call initiation and end-call controls.
5. WHEN CallState transitions to `idle` after a call, THE CompanionScreen SHALL restore the call initiation control to an enabled state.

---

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want all secrets and environment-specific values to be managed via environment variables, so that the app can be configured for different environments without code changes.

#### Acceptance Criteria

1. THE VapiService SHALL read the Vapi public key from the `EXPO_PUBLIC_VAPI_KEY` environment variable.
2. THE VapiService SHALL read the assistant ID from the `EXPO_PUBLIC_ASSISTANT_ID` environment variable.
3. THE Backend SHALL read the Vapi webhook secret from an environment variable and SHALL NOT hard-code it in source.
4. THE NotificationService SHALL read the EAS project ID from `Constants.expoConfig.extra.eas.projectId`.
5. IF a required environment variable is missing at startup, THEN THE Backend SHALL log a descriptive error and exit with a non-zero status code.
