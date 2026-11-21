# Medicine Reminder — Android APK Build Guide

This project is structured as a hybrid **Capacitor + Native Kotlin Android** application so that it runs both as an installable Progressive Web App and compiles directly into an installable Android APK with true native `AlarmManager` alarms.

## Included Native Android Architecture (`android/`)

- `MainActivity.kt` — Registers the custom `MedicineAlarm` Capacitor plugin.
- `MedicineAlarmPlugin.kt` — Bridges schedules, snooze requests, Android 13+ `POST_NOTIFICATIONS`, Android 12+ `SCHEDULE_EXACT_ALARM`, and notification-shade actions between the React UI and Android OS.
- `AlarmScheduler.kt` — Persists all medicine schedules in Android `SharedPreferences` and schedules exact alarms using `AlarmManager.setAlarmClock(...)` so alarms fire reliably even in Doze mode or when the app is closed.
- `AlarmReceiver.kt` — Acquires a `WakeLock`, starts `AlarmSoundService`, posts a high-priority heads-up alarm notification with **Taken**, **Snooze**, and **Skip** action buttons, and automatically reschedules recurring daily or selected-day reminders.
- `NotificationActionReceiver.kt` — Processes **Taken**, **Snooze**, and **Skip** taps directly from the notification shade and records them so the app syncs them on next open.
- `BootCompletedReceiver.kt` — Listens for `BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`, `TIME_SET`, and `TIMEZONE_CHANGED` to restore all alarms automatically after a phone restart.
- `AlarmSoundService.kt` — Foreground service playing the Android alarm ringtone and vibration until the user responds.

## Prerequisites

- Node.js 20+
- Java 17 (JDK 17)
- Android Studio (with Android SDK Platform 35)

## Build Installable Debug APK

```bash
# 1. Install JavaScript dependencies + Capacitor Android runtime
npm install
npm install @capacitor/android @capacitor/cli

# 2. Build the web bundle
npm run build

# 3. Copy web assets into the Android project
npx cap sync android

# 4. Build the APK via Gradle (or open the android/ folder in Android Studio)
cd android
./gradlew assembleDebug
```

The installable APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Build Signed Release APK / AAB

Open the `android/` directory in **Android Studio**, choose **Build → Generate Signed App Bundle / APK**, and follow the keystore wizard.
