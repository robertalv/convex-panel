# 🖥️ Convex Panel Desktop - Mac App Store Readiness Assessment

**Last Updated**: January 8, 2026  
**App Version**: 0.1.0 → 1.0.0 (needs update)  
**Platform**: Tauri v2 (Rust + Web)  
**Status**: ⚠️ **CRITICAL BLOCKERS PRESENT**

---

## 📊 Current Status Overview

### ✅ What's Working

- **Build System**: Tauri v2 configured with production build scripts
- **Icons**: Complete icon set for macOS (.icns), Windows (.ico), and various sizes
- **DMG Background**: Custom DMG installer background (1.6MB)
- **Bundle Config**: macOS bundle category set to "DeveloperTool"
- **Window Config**: Proper window sizing and constraints
- **Entitlements**: Basic keychain access entitlements configured
- **Code Structure**: Well-organized with features, components, and contexts

### 🚨 Critical Blockers

#### 1. TypeScript Compilation Errors ❌

**Status**: Build fails  
**Errors Found**: 3 React type mismatches

- `contexts/QueryContext.tsx:81` - ReactNode type incompatibility
- `features/schema-visualizer/components/SchemaGraph.tsx:42` - Component type mismatch
- `features/schema-visualizer/components/SchemaGraph.tsx:46` - Component type mismatch

**Root Cause**: React 18 vs React 19 type conflicts  
**Impact**: Cannot build production app until fixed

#### 2. App Version (0.1.0) ❌

**Current**: Version still at 0.1.0  
**Required**: Should be 1.0.0 for store submission  
**Files to Update**:

- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `package.json`

#### 3. Mac App Store Entitlements ⚠️

**Current**: Only keychain-access-groups configured  
**Required for Mac App Store**: Full sandboxing entitlements

- `com.apple.security.app-sandbox` (sandbox mode)
- `com.apple.security.network.client` (network access)
- `com.apple.security.files.user-selected.read-write` (file access)
- `com.apple.security.temporary-exception.*` (if needed)

**Current File**: `src-tauri/entitlements.plist` (incomplete)

#### 4. Code Signing & Notarization ⚠️

**Status**: Not configured  
**Required**:

- Apple Developer account with valid certificates
- Code signing identity in Tauri config
- Notarization credentials (Apple ID, app-specific password, team ID)
- `tauri.conf.json` must specify signing identity

**Impact**: App won't run on other Macs without notarization

#### 5. Privacy Policy & App Store Metadata ❌

**Missing**:

- Privacy policy URL (required by App Store)
- App Store description (marketing copy)
- App category justification
- Screenshot requirements (multiple sizes)
- App Store Connect listing

---

## 🔍 Detailed Assessment

### Build Configuration

**Tauri Configuration** (`src-tauri/tauri.conf.json`):

```json
{
  "productName": "Convex Panel",
  "version": "0.1.0", // ❌ Needs to be 1.0.0
  "identifier": "dev.convexpanel.desktop", // ✅ Good
  "bundle": {
    "category": "DeveloperTool", // ✅ Appropriate
    "macOS": {
      "minimumSystemVersion": "10.15", // ✅ Good (Catalina+)
      "entitlements": "entitlements.plist" // ⚠️ Needs expansion
    }
  }
}
```

**Cargo Configuration** (`src-tauri/Cargo.toml`):

```toml
[package]
name = "convex-panel-desktop"
version = "0.1.0"  // ❌ Needs to be 1.0.0
authors = ["Robert Alvarez"]
```

**Dependencies**: ✅ All appropriate for desktop app

- Tauri 2 with plugins (shell, dialog, fs, notification, http)
- AES-GCM encryption for secure storage
- PTY support for terminal
- macOS-specific dependencies (objc2, app-kit)

### Code Quality Issues

**TODOs Found**: 7 items

1. `JsonView.tsx:585` - Nested field editing not implemented
2. `PerformanceAdvisor:122` - Error toast not shown
3. `PerformanceAdvisor:137` - Opening in editor not implemented
4. `AuthCard.tsx:41` - Self-hosted auth placeholder
5. `UnifiedDiffView.tsx:189` - Collapse button for multi-file support
6. `CodeGenerator.ts:98` - Field definition placeholder
7. `InsightBreakdownSheet.tsx:470` - Navigate to function code

**Severity**: Most are nice-to-have features, not blockers

### Git Status

**Uncommitted Changes**: 19 files modified/deleted

- Appears to be in-progress work
- MCP (Model Context Protocol) features being removed
- Should commit or revert before store submission

---

## 🚀 Path to Mac App Store Submission

### Phase 1: Critical Fixes (1-2 days)

#### Task 1.1: Fix TypeScript Errors

**Priority**: CRITICAL  
**Files to Fix**:

```typescript
// contexts/QueryContext.tsx - Fix React.ReactNode type
// features/schema-visualizer/components/SchemaGraph.tsx - Fix component types
```

**Solution**: Update React types or add type assertions for React 19 compatibility

#### Task 1.2: Update Version to 1.0.0

**Files**:

- `src-tauri/tauri.conf.json` → `"version": "1.0.0"`
- `src-tauri/Cargo.toml` → `version = "1.0.0"`
- `package.json` → `"version": "1.0.0"`

#### Task 1.3: Expand Entitlements for Mac App Store

**File**: `src-tauri/entitlements.plist`

**Required Additions**:

```xml
<key>com.apple.security.app-sandbox</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.files.user-selected.read-write</key>
<true/>
<key>com.apple.security.temporary-exception.files.home-relative-path.read-write</key>
<array>
  <string>/.config/convex/</string>
  <string>/.convex/</string>
</array>
```

**Note**: Mac App Store requires sandbox mode, which may limit some functionality

#### Task 1.4: Configure Code Signing

**Update `tauri.conf.json`**:

```json
"macOS": {
  "signingIdentity": "Developer ID Application: YOUR NAME (TEAM_ID)",
  "hardenedRuntime": true,
  "entitlements": "entitlements.plist"
}
```

**Command to find signing identity**:

```bash
security find-identity -v -p codesigning
```

### Phase 2: Store Preparation (2-3 days)

#### Task 2.1: Privacy Policy

**Action**: Create or verify privacy policy at `https://convexpanel.dev/privacy`

**Must Include**:

- Data collection practices (auth tokens, deployment data)
- OAuth authentication flow
- Local storage of credentials
- Network requests to Convex API
- Analytics (if any)
- Third-party services

#### Task 2.2: App Store Metadata

**Required Information**:

- **Name**: Convex Panel
- **Subtitle**: Debug and monitor Convex applications
- **Description**: Comprehensive marketing copy (4000 char max)
- **Keywords**: convex, developer, debugging, monitoring, serverless
- **Category**: Developer Tools
- **Age Rating**: 4+ (no restricted content)
- **Support URL**: `https://convexpanel.dev/support`
- **Marketing URL**: `https://convexpanel.dev`
- **Copyright**: © 2026 [Your Company Name]

#### Task 2.3: Screenshots

**Required Sizes** (Mac App Store):

- 1280x800 (minimum)
- 1440x900 (recommended)
- 2560x1600 (Retina)
- 2880x1800 (Retina)

**Recommended Screenshots** (3-10 images):

1. Main dashboard view
2. Data browser with table view
3. Logs viewer with filtering
4. Schema visualizer
5. Performance advisor insights
6. Terminal with Convex commands

#### Task 2.4: Review & Remove TODOs

**Decision Required**: For each TODO

- Implement the feature if critical
- Remove UI elements if not ready
- Add "Coming Soon" labels if appropriate

### Phase 3: Build & Test (1-2 days)

#### Task 3.1: Production Build

```bash
# Build for production
npm run tauri:build:prod

# Output location
apps/desktop/src-tauri/target/release/bundle/dmg/Convex Panel_1.0.0_universal.dmg
```

#### Task 3.2: Test Checklist

- [ ] App launches successfully
- [ ] OAuth authentication works
- [ ] Deployment selection functions
- [ ] Data browser loads tables
- [ ] Logs viewer streams correctly
- [ ] Schema visualizer renders
- [ ] Terminal executes commands
- [ ] All keyboard shortcuts work
- [ ] Window resizing works properly
- [ ] App quits cleanly

#### Task 3.3: Notarization

```bash
# After building, notarize for macOS
xcrun notarytool submit "Convex Panel.app" \
  --apple-id "your-apple-id@example.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

# Staple the notarization ticket
xcrun stapler staple "Convex Panel.app"
```

### Phase 4: Store Submission (1-2 weeks)

#### Task 4.1: Create App Store Connect Listing

1. Log in to App Store Connect
2. Create new macOS app
3. Set bundle ID: `dev.convexpanel.desktop`
4. Upload app information
5. Add screenshots
6. Set pricing (free or paid)

#### Task 4.2: Upload Build

```bash
# Using Transporter app or xcrun
xcrun altool --upload-app \
  --type osx \
  --file "Convex Panel_1.0.0_universal.dmg" \
  --username "your-apple-id@example.com" \
  --password "app-specific-password"
```

#### Task 4.3: Submit for Review

- Complete all App Store Connect fields
- Answer App Store review questions
- Submit for review
- Monitor review status

**Typical Review Time**: 1-3 days

---

## ⚠️ Mac App Store Specific Challenges

### Sandboxing Limitations

The Mac App Store requires apps to be sandboxed, which may impact:

1. **File System Access**
   - Limited to user-selected files/folders
   - Cannot access arbitrary paths without permission
   - May need to request folder access for `.convex/` and `.config/convex/`

2. **Network Access**
   - Need `com.apple.security.network.client` entitlement
   - HTTPS should work fine
   - Local development server access may require exceptions

3. **Terminal/Shell Access**
   - PTY support should work
   - Shell plugin may have limitations in sandbox
   - Consider using temporary exception entitlements

4. **Keychain Access**
   - Already configured ✅
   - Should work for storing auth tokens

### Alternative: Direct Distribution

If Mac App Store sandboxing is too restrictive, consider:

**Option A: Developer ID Distribution**

- Sign with Developer ID certificate
- Notarize the app
- Distribute via website download
- No sandboxing required
- Full system access

**Option B: Homebrew Cask**

- Distribute via Homebrew
- Easy installation: `brew install --cask convex-panel`
- Developer community friendly
- No Apple review process

---

## 📋 Complete Checklist

### Critical (Must Complete Before Submission)

- [ ] Fix all TypeScript compilation errors
- [ ] Update version to 1.0.0 in all config files
- [ ] Expand entitlements for App Store sandbox
- [ ] Configure code signing with Developer ID
- [ ] Create privacy policy and make it publicly accessible
- [ ] Test production build thoroughly
- [ ] Notarize the app

### Required (App Store Requirements)

- [ ] Create App Store Connect listing
- [ ] Write app description and marketing copy
- [ ] Create 3-10 screenshots (multiple sizes)
- [ ] Set support URL
- [ ] Set pricing model
- [ ] Answer App Store review questions
- [ ] Provide demo account (if needed)

### Recommended (Quality & Polish)

- [ ] Implement or remove TODO features
- [ ] Add crash reporting (Sentry)
- [ ] Performance testing on older Macs
- [ ] Accessibility review (VoiceOver support)
- [ ] Dark mode consistency check
- [ ] Keyboard navigation testing
- [ ] Beta testing with real users

### Optional (Post-Launch)

- [ ] App Store optimization (ASO)
- [ ] Create app preview video
- [ ] Localization (multiple languages)
- [ ] Integration with macOS features (Spotlight, Handoff)

---

## 🔧 Quick Fix Commands

### Fix TypeScript Errors

```bash
cd apps/desktop
npm run build:prod  # Will show exact errors
# Fix the errors in the files mentioned
```

### Update Versions

```bash
# Update all version numbers
sed -i '' 's/"version": "0.1.0"/"version": "1.0.0"/g' apps/desktop/package.json
sed -i '' 's/"version": "0.1.0"/"version": "1.0.0"/g' apps/desktop/src-tauri/tauri.conf.json
sed -i '' 's/version = "0.1.0"/version = "1.0.0"/g' apps/desktop/src-tauri/Cargo.toml
```

### Build Production App

```bash
cd apps/desktop
npm run tauri:build:prod
```

### Find Code Signing Identity

```bash
security find-identity -v -p codesigning
```

---

## 📞 Resources

- **Tauri v2 Docs**: https://v2.tauri.app/
- **Tauri Bundling**: https://v2.tauri.app/develop/macos/
- **Mac App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Sandbox**: https://developer.apple.com/documentation/security/app_sandbox
- **Notarization**: https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution
- **Convex Panel Website**: https://convexpanel.dev

---

## 🎯 Estimated Timeline

- **Phase 1 (Critical Fixes)**: 1-2 days
- **Phase 2 (Store Prep)**: 2-3 days
- **Phase 3 (Build & Test)**: 1-2 days
- **Phase 4 (Submission)**: 1-2 weeks (includes review)

**Total**: 2-3 weeks to Mac App Store availability

---

## 💡 Recommendations

### Immediate Next Steps

1. **Fix TypeScript errors** (highest priority - blocks everything)
2. **Commit or revert current changes** (clean git state)
3. **Update version to 1.0.0**
4. **Verify privacy policy exists** at convexpanel.dev
5. **Test production build locally**

### Consider Before Submitting

**Question 1**: Is sandboxing compatible with your app's functionality?

- If terminal/file system access is critical, consider Developer ID distribution instead
- Test thoroughly in sandbox mode before committing to App Store

**Question 2**: Do you have all Apple accounts set up?

- Apple Developer Program membership ($99/year)
- App Store Connect access
- Code signing certificates generated

**Question 3**: Are you ready for support?

- Support email set up
- Documentation ready
- Bug tracking system in place

---

## ✨ Summary

**Current State**: Desktop app has a solid foundation with Tauri v2, good architecture, and proper icons, but has **critical TypeScript compilation errors** preventing production builds.

**Key Blockers**:

1. TypeScript errors (React 18/19 compatibility)
2. Version still at 0.1.0
3. Incomplete App Store entitlements
4. No code signing configured
5. Missing privacy policy

**Estimated Effort**: 2-3 weeks to Mac App Store submission, assuming TypeScript errors are resolved quickly.

**Alternative Path**: Consider Developer ID distribution if App Store sandboxing proves too restrictive for your use case.
