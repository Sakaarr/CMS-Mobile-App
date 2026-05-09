#!/usr/bin/env bash
set -euo pipefail

# Project helper: configures Android SDK env vars for local Expo/React Native runs.
# Usage: source scripts/android-env.sh

SDK_DIR_CANDIDATES=(
  "${ANDROID_HOME:-}"
  "${ANDROID_SDK_ROOT:-}"
  "${HOME}/Android/Sdk"
  "${HOME}/Android/sdk"
)

SDK_DIR=""
for candidate in "${SDK_DIR_CANDIDATES[@]}"; do
  if [[ -n "${candidate}" && -d "${candidate}" ]]; then
    SDK_DIR="${candidate}"
    break
  fi
done

if [[ -z "${SDK_DIR}" ]]; then
  echo "Android SDK not found."
  echo "Install Android SDK (Android Studio) and set ANDROID_HOME or ANDROID_SDK_ROOT."
  return 1 2>/dev/null || exit 1
fi

export ANDROID_HOME="${SDK_DIR}"
export ANDROID_SDK_ROOT="${SDK_DIR}"

if [[ -d "${SDK_DIR}/platform-tools" ]]; then
  export PATH="${PATH}:${SDK_DIR}/platform-tools"
fi
if [[ -d "${SDK_DIR}/emulator" ]]; then
  export PATH="${PATH}:${SDK_DIR}/emulator"
fi
if [[ -d "${SDK_DIR}/cmdline-tools/latest/bin" ]]; then
  export PATH="${PATH}:${SDK_DIR}/cmdline-tools/latest/bin"
fi

echo "ANDROID_HOME=${ANDROID_HOME}"
command -v adb >/dev/null 2>&1 && adb version | head -n 1 || echo "adb not found on PATH (expected at ${SDK_DIR}/platform-tools/adb)"
