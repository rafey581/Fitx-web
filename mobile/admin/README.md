# FITX Admin (Android)

The website's admin in a full-screen WebView, so the app **is** the admin pages —
no second UI to maintain. It opens `/admin` and keeps the session cookie.

There is no sign-in screen in the app: when the session has expired the site's
own `/admin/login` page appears inside the app. Sign in once and the cookie is
kept.

## Build

Requires JDK 17 and an Android SDK (`ANDROID_HOME`) with platform 35.

```bash
cd mobile/admin
./gradlew assembleDebug      # first run creates the wrapper
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

Install on a connected phone:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is self-signed with the debug key, which is fine for installing on
the studio's own phones. A Play Store build needs a release keystore and
`assembleRelease`.

## Server address

Defaults to `https://fitxfitnessstudio.com/admin`. To point the app at another
deployment (a staging site, or `http://<lan-ip>:3000/admin` while developing),
long-press the app icon → **Server address**, or use the button on the
"can't reach" screen. The address is remembered.

## What it handles

- Admin cookies/session persist between launches.
- Photo uploads in Admin → Gallery use the system file picker (multi-select).
- Back button walks the page history before leaving the app.
- Links to other sites, `tel:`, `mailto:` and WhatsApp open in their own app.
- Downloads open in the browser.
