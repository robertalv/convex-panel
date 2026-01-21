#!/bin/bash
#
# Convex Panel Installer for macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/robertalv/convex-panel/main/install.sh | bash
#

set -e

# Configuration
REPO="robertalv/convex-panel"
APP_NAME="Convex Panel"
INSTALL_DIR="/Applications"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Print functions
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "   ____                          ____                  _ "
    echo "  / ___|___  _ ____   _______  _|  _ \ __ _ _ __   ___| |"
    echo " | |   / _ \| '_ \ \ / / _ \ \/ / |_) / _\` | '_ \ / _ \ |"
    echo " | |__| (_) | | | \ V /  __/>  <|  __/ (_| | | | |  __/ |"
    echo "  \____\___/|_| |_|\_/ \___/_/\_\_|   \__,_|_| |_|\___|_|"
    echo -e "${NC}"
    echo -e "${BOLD}Convex Panel Installer${NC}"
    echo ""
}

# Check if running on macOS
check_os() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "This installer is for macOS only. For Linux, please download from GitHub Releases."
    fi
}

# Detect architecture
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        arm64|aarch64)
            ARCH_NAME="arm64"
            info "Detected Apple Silicon (arm64)"
            ;;
        x86_64)
            ARCH_NAME="x64"
            info "Detected Intel (x86_64)"
            ;;
        *)
            error "Unsupported architecture: $ARCH"
            ;;
    esac
}

# Check for required tools
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed."
    fi
    
    if ! command -v hdiutil &> /dev/null; then
        error "hdiutil is required but not installed."
    fi
}

# Fetch latest release from GitHub
fetch_latest_release() {
    info "Fetching latest release information..."
    
    RELEASE_INFO=$(curl -sL "https://api.github.com/repos/${REPO}/releases/latest")
    
    if echo "$RELEASE_INFO" | grep -q "Not Found"; then
        error "Could not find releases for ${REPO}. Make sure the repository exists and has releases."
    fi
    
    VERSION=$(echo "$RELEASE_INFO" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [[ -z "$VERSION" ]]; then
        error "Could not determine latest version. Please check https://github.com/${REPO}/releases"
    fi
    
    info "Latest version: ${VERSION}"
    
    # Find the DMG URL for our architecture
    if [[ "$ARCH_NAME" == "arm64" ]]; then
        DMG_PATTERN="macos-arm64.*\.dmg"
    else
        DMG_PATTERN="macos-x64.*\.dmg"
    fi
    
    DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -o "https://[^\"]*${DMG_PATTERN}[^\"]*" | head -1)
    
    # Fallback: try to find any DMG if architecture-specific not found
    if [[ -z "$DOWNLOAD_URL" ]]; then
        warn "Architecture-specific DMG not found, looking for any DMG..."
        DOWNLOAD_URL=$(echo "$RELEASE_INFO" | grep -o 'https://[^"]*\.dmg[^"]*' | head -1)
    fi
    
    if [[ -z "$DOWNLOAD_URL" ]]; then
        error "Could not find DMG download URL. Please download manually from https://github.com/${REPO}/releases"
    fi
    
    info "Download URL: ${DOWNLOAD_URL}"
}

# Download the DMG
download_dmg() {
    TEMP_DIR=$(mktemp -d)
    DMG_PATH="${TEMP_DIR}/ConvexPanel.dmg"
    
    info "Downloading ${APP_NAME}..."
    
    if curl -#L "$DOWNLOAD_URL" -o "$DMG_PATH"; then
        success "Download complete!"
    else
        rm -rf "$TEMP_DIR"
        error "Failed to download ${APP_NAME}."
    fi
}

# Mount DMG and install
install_app() {
    info "Installing ${APP_NAME}..."
    
    # Check if app already exists
    if [[ -d "${INSTALL_DIR}/${APP_NAME}.app" ]]; then
        warn "${APP_NAME} is already installed."
        echo -n "Do you want to replace it? [y/N] "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            info "Installation cancelled."
            cleanup
            exit 0
        fi
        info "Removing existing installation..."
        rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
    fi
    
    # Mount DMG
    info "Mounting disk image..."
    MOUNT_POINT=$(hdiutil attach "$DMG_PATH" -nobrowse -noautoopen | grep "/Volumes" | awk '{print $NF}')
    
    if [[ -z "$MOUNT_POINT" ]]; then
        error "Failed to mount disk image."
    fi
    
    # Find the .app in the mounted volume
    APP_PATH=$(find "$MOUNT_POINT" -maxdepth 1 -name "*.app" -print -quit)
    
    if [[ -z "$APP_PATH" ]]; then
        hdiutil detach "$MOUNT_POINT" -quiet
        error "Could not find .app in disk image."
    fi
    
    # Copy to Applications
    info "Copying to ${INSTALL_DIR}..."
    cp -R "$APP_PATH" "$INSTALL_DIR/"
    
    # Unmount DMG
    info "Cleaning up..."
    hdiutil detach "$MOUNT_POINT" -quiet
}

# Cleanup temporary files
cleanup() {
    if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Remove quarantine attribute
remove_quarantine() {
    info "Removing quarantine attribute..."
    xattr -rd com.apple.quarantine "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true
}

# Print success message
print_success() {
    echo ""
    success "${APP_NAME} has been installed successfully!"
    echo ""
    echo -e "  ${BOLD}Location:${NC} ${INSTALL_DIR}/${APP_NAME}.app"
    echo -e "  ${BOLD}Version:${NC}  ${VERSION}"
    echo ""
    echo -e "  To open, run: ${CYAN}open \"${INSTALL_DIR}/${APP_NAME}.app\"${NC}"
    echo ""
    echo -e "  Or find ${APP_NAME} in your Applications folder or Spotlight."
    echo ""
}

# Ask to open app
ask_to_open() {
    echo -n "Would you like to open ${APP_NAME} now? [Y/n] "
    read -r response
    if [[ ! "$response" =~ ^[Nn]$ ]]; then
        open "${INSTALL_DIR}/${APP_NAME}.app"
    fi
}

# Main function
main() {
    print_banner
    check_os
    detect_arch
    check_dependencies
    fetch_latest_release
    download_dmg
    install_app
    cleanup
    remove_quarantine
    print_success
    ask_to_open
}

# Run main
main
