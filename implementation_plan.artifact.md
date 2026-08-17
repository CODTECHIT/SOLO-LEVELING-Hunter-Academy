# Implementation Plan - Fix Mobile App Network Error (Iteration 2)

The connection is still failing because the backend server is currently only listening on `[::1]` (IPv6 loopback), making it inaccessible to the Android emulator and the local network. We need to force the backend to listen on all interfaces (`0.0.0.0`) and use IPv4.

## User Review Required

> [!IMPORTANT]
> You must restart your backend server with a specific flag to force it to listen on IPv4 and all network interfaces.

1.  **Stop the current web server** (the one running in `apps/web`).
2.  **Run this exact command**:
    ```bash
    npm run dev -- --host 0.0.0.0
    ```
    *Note: The double dash `--` is important as it passes the following arguments to the underlying Vite command.*

## Proposed Changes

### Mobile App Configuration

#### [MODIFY] [.env](file:///C:/Users/MAHAJAN%20ASHOK/OneDrive/Desktop/lms-main/CyberTech/apps/mobile/.env)
We will keep the current IP but ensure it matches what the server reports when started with `--host 0.0.0.0`.

## Verification Plan

### Manual Verification
1.  Run `npm run dev -- --host 0.0.0.0` in the `apps/web` terminal.
2.  Check the terminal output. It should say something like:
    `➜  Local:   http://localhost:3000/`
    `➜  Network: http://192.168.1.2:3000/`
3.  Restart the Expo server with `npx expo start --clear`.
4.  Try logging in again.

### Troubleshooting Command
If it still fails, run this in a new terminal and show me the output:
```powershell
netstat -ano | findstr :3000
```
*(I expect to see `0.0.0.0:3000` after you use the new command)*
