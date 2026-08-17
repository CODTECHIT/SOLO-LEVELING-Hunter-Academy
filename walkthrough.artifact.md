# Walkthrough - Mobile Network Fix

I have configured the mobile application to correctly connect to your development backend.

## Changes Made

### 1. Created Environment Configuration
I added a [.env](file:///C:/Users/MAHAJAN%20ASHOK/OneDrive/Desktop/lms-main/CyberTech/apps/mobile/.env) file to the mobile project.
- Set `EXPO_PUBLIC_API_URL` to `http://192.168.1.2:3000`.
- This ensures Expo uses your machine's network IP instead of `localhost`.

### 2. Updated API Fallback
Modified [api.ts](file:///C:/Users/MAHAJAN%20ASHOK/OneDrive/Desktop/lms-main/CyberTech/apps/mobile/lib/api.ts):
- Changed the fallback URL from `localhost:3000` to `10.0.2.2:3000`.
- `10.0.2.2` is a special IP that Android emulators use to talk to the computer they are running on.

## Final Steps for You

To make this work, you **must** do two things:

1.  **Restart the Web Server with `--host`:**
    Stop your current web server (`apps/web`) and start it again with this command:
    ```powershell
    npm run dev -- --host
    ```
    *This tells the server to listen to connections from your whole network, not just your computer.*

2.  **Clear Expo Cache:**
    In your mobile terminal, restart the Expo server using the clear flag:
    ```powershell
    npx expo start --clear
    ```

Once both are running, try the login again on your emulator.
