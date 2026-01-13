# Building Convex Panel Mobile App

This guide covers building the mobile app for iOS and Android using Expo and EAS Build.

## Prerequisites

1. **Node.js** >= 18
2. **pnpm** >= 9
3. **EAS CLI** (already installed)
4. **Expo account** - Sign up at [expo.dev](https://expo.dev)
5. **Apple Developer Account** (for iOS builds)
6. **Xcode** (for local iOS development/testing)

## Setup

### 1. Install Dependencies

```bash
cd apps/mobile
pnpm install
```

### 2. Login to EAS

```bash
eas login
```

### 3. Configure EAS Project (if not already done)

```bash
eas build:configure
```

## Building for iOS

### Development Build (for testing with Expo Dev Client)

```bash
pnpm run build:ios:development
```

This creates a development build that:
- Includes Expo Dev Client
- Can be installed on iOS Simulator
- Allows hot reloading and debugging

### Preview Build (for internal testing)

```bash
pnpm run build:ios:preview
```

This creates a release build for:
- Internal distribution (TestFlight or direct install)
- Testing on physical devices
- Not for App Store submission

### Production Build (for App Store)

```bash
pnpm run build:ios:production
```

This creates a production build ready for:
- App Store submission
- TestFlight distribution
- Production release

### Build Options

You can also use the generic command with options:

```bash
# Build with specific profile
eas build --platform ios --profile production

# Build for simulator only
eas build --platform ios --profile development --local

# Build locally (requires macOS and Xcode)
eas build --platform ios --local
```

## Building for Android

### Development Build

```bash
pnpm run build:android:development
```

### Preview Build (APK)

```bash
pnpm run build:android:preview
```

### Production Build (AAB for Play Store)

```bash
pnpm run build:android:production
```

## Local Development

### Start Development Server

```bash
# Start Expo dev server
pnpm start

# Run on iOS Simulator
pnpm ios

# Run on Android Emulator
pnpm android
```

### Prebuild Native Code (if needed)

If you need to regenerate native iOS/Android folders:

```bash
# iOS
pnpm run prebuild:ios

# Android
pnpm run prebuild:android
```

## Build Profiles

The app uses different build profiles defined in `eas.json`:

- **development**: Development client with debugging tools
- **preview**: Release build for internal testing
- **testflight**: Release build for TestFlight
- **production**: Production build for App Store/Play Store

## iOS-Specific Notes

### Bundle Identifier
- Current: `dev.convex.panel`
- Update in `app.json` if needed

### Minimum iOS Version
- iOS 15.1+ (configured in `app.json`)

### Code Signing
- EAS will handle code signing automatically
- Ensure your Apple Developer account is linked
- Configure credentials: `eas credentials`

### Simulator Builds
- Development profile builds for simulator by default
- Use `--simulator` flag for other profiles if needed

## Troubleshooting

### Build Fails
1. Check EAS build logs: `eas build:list`
2. Verify credentials: `eas credentials`
3. Check app.json configuration
4. Ensure all dependencies are installed

### Local Build Issues
1. Ensure Xcode is installed and updated
2. Run `pod install` in `ios/` directory
3. Check CocoaPods version compatibility

### Credentials Issues
```bash
# View current credentials
eas credentials

# Reset credentials
eas credentials --platform ios
```

## Submitting to App Store

After building, submit using:

```bash
eas submit --platform ios
```

Note: Update `eas.json` with your Apple ID and App Store Connect details.

## Environment Variables

No environment variables are currently required. The app uses production Convex API endpoints.

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo iOS Build Guide](https://docs.expo.dev/build/building-on-ci/)
- [App Store Submission](https://docs.expo.dev/submit/introduction/)
