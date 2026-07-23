# Android release guide

The Android app lives in `android/` and uses the permanent application ID `com.nrnworld.neonpathpuzzle`.

## Local development build

```powershell
npm run android:debug
```

The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Create the upload key once

Keep this file and its passwords backed up securely. Never commit the key.

```powershell
keytool -genkeypair -v -keystore neon-path-puzzle-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

## Build a signed Google Play bundle

Set these values only in the terminal session used for the build:

```powershell
$env:NPP_KEYSTORE_PATH = "D:\secure\neon-path-puzzle-upload.jks"
$env:NPP_KEYSTORE_PASSWORD = "your-keystore-password"
$env:NPP_KEY_ALIAS = "upload"
$env:NPP_KEY_PASSWORD = "your-key-password"
npm run android:bundle
```

The Android App Bundle is created at `android/app/build/outputs/bundle/release/app-release.aab`. Confirm it is signed before upload:

```powershell
jarsigner -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab
```

Use Play App Signing when creating the Google Play app. Increment `versionCode` and update `versionName` in `android/app/build.gradle` for every release.

## Store listing checklist

- Host `PRIVACY_POLICY.md` at a public URL and use that URL in Play Console.
- Declare that the app collects no data, provided no analytics, ads, accounts, or network services have been added.
- Upload phone screenshots, a 512x512 app icon, and a 1024x500 feature graphic.
- Complete content rating, target audience, ads, and app access declarations.
- Test the signed bundle through Play Console internal testing before production.
