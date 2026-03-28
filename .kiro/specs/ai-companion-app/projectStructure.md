mobile/
  types.ts                        ← shared interfaces (CallState, VapiMessage, etc.)
  App.tsx                         ← entry point, push token init
  services/
    vapiService.ts                ← Vapi voice call logic
    notificationService.ts        ← Expo push notifications
  screens/
    CompanionScreen.tsx           ← main UI

server/
  index.js                        ← Express entry point (replaces server.js)
  webhookHandler.js               ← Vapi webhook + token registration routes
  conversationStore.js            ← in-memory conversation storage
  pushTokenStore.js               ← in-memory push token storage
  notificationSender.js           ← Expo Push API calls


# install this from terminal
cd mobile

npx expo install @vapi-ai/react-native expo-notifications expo-av expo-device expo-constants

# to start backend
node server/index.js

# install Node.js 
https://nodejs.org/en

Go to https://nodejs.org and download the LTS version
Run the installer — make sure "Add to PATH" is checked
Close and reopen your terminal
Verify it worked:

node --version
npm --version

# initialize project with package.json
npm init -y
npm pkg set type=module
npm install express dotenv
