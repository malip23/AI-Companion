# AI Companion

A React Native AI companion app built with Expo and Vapi.

---

## What the Mac person needs to install

- [Node.js](https://nodejs.org) v18+
- [Xcode](https://developer.apple.com/xcode/) (from the Mac App Store, free)
- Xcode Command Line Tools: `xcode-select --install`
- [CocoaPods](https://cocoapods.org): `sudo gem install cocoapods`
- An [Expo account](https://expo.dev) (free)

No Apple Developer account needed for the iOS Simulator.

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd AI-Companion
```

### 2. Create your .env file

```bash
cp .env.example .env
```

Fill in your Vapi keys in `.env`:
- `VAPI_WEBHOOK_SECRET` — Vapi dashboard → Webhooks
- `EXPO_PUBLIC_VAPI_KEY` — Vapi dashboard → API Keys
- `EXPO_PUBLIC_ASSISTANT_ID` — Vapi dashboard → Assistants
- `EXPO_PUBLIC_API_URL` — your local IP, e.g. `http://192.168.1.x:3001`

### 3. Install server dependencies

```bash
cd server && npm install
```

### 4. Install mobile dependencies

```bash
cd mobile && npm install --legacy-peer-deps
```

### 5. Install iOS native dependencies

```bash
cd mobile/ios && pod install
```

---

## Running

### Start the server (in one terminal)

```bash
cd server && node index.js
```

### Run on iOS Simulator (in another terminal)

```bash
cd mobile
npx expo run:ios
```

This compiles the native code via Xcode and opens the iOS Simulator automatically. First run takes a few minutes.

---

## Notes

- `npx expo start` alone won't work — the app uses native modules that require a full build via `expo run:ios`
- The server must be running for push notifications to work
- Push notifications only work on a physical device, not the simulator
