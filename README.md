# cms-mobile

## Android (local emulator/device)

If you see `Failed to resolve the Android SDK path` or `spawn adb ENOENT`, your shell can’t find the Android SDK / `adb`.

This repo includes a helper you can source to set the right env vars and PATH:

```bash
source scripts/android-env.sh
npm run android
```

Notes:
- The Android SDK is commonly installed at `~/Android/Sdk` (capital `S`) by Android Studio on Linux.
- For a permanent setup, add the exported `ANDROID_HOME`/`PATH` entries to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).
