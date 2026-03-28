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

# install node_modules
cd mobile
& "C:\Program Files\nodejs\npm.cmd" install

# initialize project with package.json
npm init -y
npm pkg set type=module
npm install express dotenv

# to run the project:
# terminal 1 - backend
cd server
node index.js
# terminal 2 - frontend
cd mobile
npx expo start

# Here's what still needs to be filled in before the app is fully functional:

Environment variables (the big ones)

In your root .env:

VAPI_WEBHOOK_SECRET=your_webhook_secret
In 
.env
 (create this):

EXPO_PUBLIC_VAPI_KEY=your_vapi_public_key
EXPO_PUBLIC_ASSISTANT_ID=your_assistant_id
EXPO_PUBLIC_API_URL=http://your-server-ip:3001
Get EXPO_PUBLIC_VAPI_KEY and EXPO_PUBLIC_ASSISTANT_ID from your Vapi dashboard under API Keys and Assistants.

Vapi Assistant setup

Create an assistant in the Vapi dashboard if you haven't — give it a persona/personality for the AI companion
Copy its ID into EXPO_PUBLIC_ASSISTANT_ID
Real user auth (currently hardcoded)

App.tsx
 has const userId = 'user-001' — this needs to be replaced with real auth (e.g. Firebase Auth, Supabase, etc.) when you're ready
Webhook URL

Your backend needs to be publicly accessible for Vapi to hit it. For local dev use ngrok:
ngrok http 3001
Then paste the ngrok URL into Vapi dashboard as your webhook URL.

EAS Project ID (for push notifications)

Run npx eas init inside mobile/ to get a project ID, then add it to 
app.json
 under extra.eas.projectId
That's the full checklist. The code itself is done — it's mostly config and credentials at this point.