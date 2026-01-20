# macOS Code Signing & Notarization Setup

This guide explains how to set up code signing for distributing the Convex Panel desktop app to users.

## Prerequisites

1. **Apple Developer Account** - $99/year at https://developer.apple.com
2. **Xcode** installed on your Mac
3. **Apple Developer ID Application certificate**

## Step 1: Create Developer ID Certificate

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click the **+** button to create a new certificate
3. Select **Developer ID Application** (for distributing outside App Store)
4. Follow the instructions to create a Certificate Signing Request (CSR) using Keychain Access
5. Upload the CSR and download the certificate
6. Double-click the certificate to install it in your Keychain

## Step 2: Create App-Specific Password

Apple requires an app-specific password for notarization:

1. Go to https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Under "Security", click **App-Specific Passwords**
4. Click **Generate an app-specific password**
5. Name it something like "convex-panel-notarization"
6. Save the generated password securely

## Step 3: Find Your Team ID

1. Go to https://developer.apple.com/account#MembershipDetailsCard
2. Your **Team ID** is displayed on this page (10 character alphanumeric)

## Step 4: Find Your Signing Identity

Run this command to find your signing identity:

```bash
security find-identity -v -p codesigning
```

Look for an entry like:

```
"Developer ID Application: Your Name (TEAMID)"
```

## Step 5: Set Environment Variables

For local builds, set these environment variables:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="YOURTEAMID"
```

You can add these to your `~/.zshrc` or `~/.bashrc` for persistence.

## Step 6: Build Signed & Notarized DMG

```bash
cd apps/desktop
pnpm tauri:build
```

Tauri will automatically:

1. Build the app
2. Sign with your Developer ID certificate
3. Submit to Apple for notarization
4. Staple the notarization ticket to the DMG

## GitHub Actions Secrets

For CI/CD builds, add these secrets to your GitHub repository:

| Secret Name                  | Description                     |
| ---------------------------- | ------------------------------- |
| `APPLE_CERTIFICATE`          | Base64-encoded .p12 certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the .p12 file      |
| `APPLE_SIGNING_IDENTITY`     | Full signing identity string    |
| `APPLE_ID`                   | Your Apple ID email             |
| `APPLE_PASSWORD`             | App-specific password           |
| `APPLE_TEAM_ID`              | Your 10-char Team ID            |

### Export Certificate for GitHub Actions

1. Open Keychain Access
2. Find your "Developer ID Application" certificate
3. Right-click → Export
4. Save as `.p12` with a strong password
5. Convert to base64:
   ```bash
   base64 -i Certificates.p12 | pbcopy
   ```
6. Paste this value as the `APPLE_CERTIFICATE` secret in GitHub

## Troubleshooting

### "Developer ID Application certificate not found"

- Make sure the certificate is installed in your login keychain
- Run `security find-identity -v -p codesigning` to verify

### "Notarization failed"

- Check that your app-specific password is correct
- Ensure your Apple ID has accepted the latest Apple Developer agreements
- Check notarization status: `xcrun notarytool log <submission-id> --apple-id your@email.com --password xxxx --team-id TEAMID`

### "The app is damaged and can't be opened"

- The app wasn't notarized or the ticket wasn't stapled
- Re-run the build with proper signing credentials

## Verification

After building, verify the signature:

```bash
codesign -dv --verbose=4 "src-tauri/target/release/bundle/macos/Convex Panel.app"
```

Verify notarization:

```bash
spctl -a -vv "src-tauri/target/release/bundle/macos/Convex Panel.app"
```

Expected output: `accepted source=Notarized Developer ID`
