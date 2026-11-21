# Medicine Reminder — Android APK Build Guide

This project is a ready-to-build **Capacitor 8 + Native Kotlin Android** project with the official Gradle wrapper (`android/gradlew`), Android SDK 36 configuration, native `AlarmManager` + `BootCompletedReceiver` Kotlin source code, and an automated GitHub Actions APK workflow.

## Option 1: Build APK Automatically on GitHub (No Android Studio Required)

1. Export or push this repository to GitHub.
2. Open the **Actions** tab → select **Build Android APK** → click **Run workflow** (or push to `main`).
3. When the build finishes, download **Medicine-Reminder-APK** from the **Artifacts** section and install `app-debug.apk` on your Android phone.

## Option 2: Build APK Locally (Requires JDK 21 & Android SDK)

```bash
# 1. Install dependencies (includes @capacitor/android and @capacitor/cli)
npm install

# 2. Build the web bundle
npm run build

# 3. Sync web assets into the Android project
npx cap sync android

# 4. Build the installable Debug APK
cd android
./gradlew assembleDebug
```

Output APK:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Native Android Alarm Architecture (`android/app/src/main/java/com/medicinereminder/app/`)

- `MainActivity.kt` — Registers the `MedicineAlarm` Capacitor plugin.
- `MedicineAlarmPlugin.kt` — Bridges Android 13+ `POST_NOTIFICATIONS`, Android 12+ `SCHEDULE_EXACT_ALARM`, alarm syncing, snooze, and notification actions.
- `AlarmScheduler.kt` — Persists schedules in `SharedPreferences` and schedules exact alarms via `AlarmManager.setAlarmClock(...)`.
- `AlarmReceiver.kt` — Wakes device, starts `AlarmSoundService`, posts a high-priority notification with **Taken**, **Snooze**, and **Skip** buttons, and schedules the next recurring dose.
- `NotificationActionReceiver.kt` — Handles **Taken**, **Snooze**, and **Skip** directly from the notification shade.
- `BootCompletedReceiver.kt` — Reschedules all medicine alarms after device restart or timezone/time changes.
- `AlarmSoundService.kt` — Foreground service playing system alarm audio and vibration until dismissed.
