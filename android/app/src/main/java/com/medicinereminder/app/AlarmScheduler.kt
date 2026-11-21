package com.medicinereminder.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object AlarmScheduler {
    const val CHANNEL_ID = "medicine_alarm_channel"
    const val CHANNEL_NAME = "Medicine Alarms"

    private const val PREFS_NAME = "medicine_reminder_native_prefs"
    private const val KEY_MEDICINES_JSON = "medicines_json"
    private const val KEY_SNOOZE_MINUTES = "snooze_minutes"
    private const val KEY_SOUND_ENABLED = "sound_enabled"
    private const val KEY_VIBRATION_ENABLED = "vibration_enabled"
    private const val KEY_REQUEST_CODES = "scheduled_request_codes"
    private const val KEY_PENDING_ACTIONS = "pending_notification_actions"

    const val EXTRA_MEDICINE_ID = "medicine_id"
    const val EXTRA_MEDICINE_NAME = "medicine_name"
    const val EXTRA_MEDICINE_TYPE = "medicine_type"
    const val EXTRA_DOSAGE = "dosage"
    const val EXTRA_REMINDER_ID = "reminder_id"
    const val EXTRA_SLOT = "slot"
    const val EXTRA_TIME = "scheduled_time"
    const val EXTRA_DATE = "date_key"
    const val EXTRA_NOTIFICATION_ID = "notification_id"
    const val EXTRA_IS_TEST = "is_test"

    fun ensureNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val existing = manager.getNotificationChannel(CHANNEL_ID)
            if (existing != null) return

            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority exact medicine reminder alarms"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 400, 200, 400)
                setSound(alarmUri, audioAttrs)
                setBypassDnd(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(channel)
        }
    }

    fun saveConfig(
        context: Context,
        medicinesJson: String,
        snoozeMinutes: Int,
        soundEnabled: Boolean,
        vibrationEnabled: Boolean
    ) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putString(KEY_MEDICINES_JSON, medicinesJson)
            .putInt(KEY_SNOOZE_MINUTES, snoozeMinutes)
            .putBoolean(KEY_SOUND_ENABLED, soundEnabled)
            .putBoolean(KEY_VIBRATION_ENABLED, vibrationEnabled)
            .apply()
    }

    fun isSoundEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(KEY_SOUND_ENABLED, true)

    fun isVibrationEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(KEY_VIBRATION_ENABLED, true)

    fun getSnoozeMinutes(context: Context): Int =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getInt(KEY_SNOOZE_MINUTES, 10)

    fun rescheduleAll(context: Context): Int {
        ensureNotificationChannel(context)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Cancel previously registered alarms
        val oldCodes = prefs.getStringSet(KEY_REQUEST_CODES, emptySet()) ?: emptySet()
        for (codeStr in oldCodes) {
            val code = codeStr.toIntOrNull() ?: continue
            val cancelIntent = Intent(context, AlarmReceiver::class.java)
            val pi = PendingIntent.getBroadcast(
                context,
                code,
                cancelIntent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pi != null) {
                alarmManager.cancel(pi)
                pi.cancel()
            }
        }

        val medicinesJson = prefs.getString(KEY_MEDICINES_JSON, "[]") ?: "[]"
        val arr = try {
            JSONArray(medicinesJson)
        } catch (_: Exception) {
            JSONArray()
        }

        val newCodes = mutableSetOf<String>()
        var scheduledCount = 0

        for (i in 0 until arr.length()) {
            val med = arr.optJSONObject(i) ?: continue
            if (!med.optBoolean("active", true)) continue

            val medId = med.optString("id")
            val medName = med.optString("name", "Medicine")
            val medType = med.optString("type", "tablet")
            val dosage = med.optString("dosage", "")
            val startDate = med.optString("startDate", "")
            val endDate = med.optString("endDate", "")
            val repeatType = med.optString("repeatType", "daily")
            val selectedDaysArr = med.optJSONArray("selectedDays")
            val selectedDays = mutableSetOf<Int>()
            if (selectedDaysArr != null) {
                for (d in 0 until selectedDaysArr.length()) {
                    selectedDays.add(selectedDaysArr.optInt(d))
                }
            }

            val reminders = med.optJSONArray("reminders") ?: continue
            for (r in 0 until reminders.length()) {
                val rem = reminders.optJSONObject(r) ?: continue
                val remId = rem.optString("id")
                val slot = rem.optString("slot", "morning")
                val timeStr = rem.optString("time", "08:00")

                val triggerAtMillis = computeNextTriggerMillis(
                    timeStr = timeStr,
                    startDate = startDate,
                    endDate = endDate,
                    repeatType = repeatType,
                    selectedDays = selectedDays
                ) ?: continue

                val requestCode = ("$medId:$remId").hashCode()
                val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(triggerAtMillis))

                val intent = Intent(context, AlarmReceiver::class.java).apply {
                    putExtra(EXTRA_MEDICINE_ID, medId)
                    putExtra(EXTRA_MEDICINE_NAME, medName)
                    putExtra(EXTRA_MEDICINE_TYPE, medType)
                    putExtra(EXTRA_DOSAGE, dosage)
                    putExtra(EXTRA_REMINDER_ID, remId)
                    putExtra(EXTRA_SLOT, slot)
                    putExtra(EXTRA_TIME, timeStr)
                    putExtra(EXTRA_DATE, dateKey)
                    putExtra(EXTRA_NOTIFICATION_ID, requestCode)
                }

                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                scheduleExact(context, alarmManager, triggerAtMillis, pendingIntent)
                newCodes.add(requestCode.toString())
                scheduledCount++
            }
        }

        prefs.edit().putStringSet(KEY_REQUEST_CODES, newCodes).apply()
        return scheduledCount
    }

    fun scheduleSnoozeAlarm(
        context: Context,
        medicineId: String,
        medicineName: String,
        medicineType: String,
        dosage: String,
        reminderId: String,
        slot: String,
        scheduledTime: String,
        delayMinutes: Int
    ) {
        ensureNotificationChannel(context)
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val triggerAtMillis = System.currentTimeMillis() + delayMinutes * 60_000L
        val requestCode = ("snooze:$medicineId:$reminderId").hashCode()
        val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(triggerAtMillis))

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(EXTRA_MEDICINE_ID, medicineId)
            putExtra(EXTRA_MEDICINE_NAME, medicineName)
            putExtra(EXTRA_MEDICINE_TYPE, medicineType)
            putExtra(EXTRA_DOSAGE, dosage)
            putExtra(EXTRA_REMINDER_ID, reminderId)
            putExtra(EXTRA_SLOT, slot)
            putExtra(EXTRA_TIME, scheduledTime)
            putExtra(EXTRA_DATE, dateKey)
            putExtra(EXTRA_NOTIFICATION_ID, requestCode)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        scheduleExact(context, alarmManager, triggerAtMillis, pendingIntent)
    }

    private fun scheduleExact(
        context: Context,
        alarmManager: AlarmManager,
        triggerAtMillis: Long,
        pendingIntent: PendingIntent
    ) {
        val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true
        }

        if (canExact) {
            val showIntent = Intent(context, MainActivity::class.java)
            val showPi = PendingIntent.getActivity(
                context,
                0,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerAtMillis, showPi)
            alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
        }
    }

    private fun computeNextTriggerMillis(
        timeStr: String,
        startDate: String,
        endDate: String,
        repeatType: String,
        selectedDays: Set<Int>
    ): Long? {
        val parts = timeStr.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: return null
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: return null

        val dateFmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val now = System.currentTimeMillis()
        val cal = Calendar.getInstance()

        // Search up to 366 days ahead for the next valid occurrence
        for (offset in 0..366) {
            val candidate = (cal.clone() as Calendar).apply {
                add(Calendar.DAY_OF_YEAR, offset)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            if (candidate.timeInMillis <= now + 1000L) continue

            val candidateDateKey = dateFmt.format(candidate.time)
            if (startDate.isNotBlank() && candidateDateKey < startDate) continue
            if (endDate.isNotBlank() && candidateDateKey > endDate) return null

            if (repeatType == "selected_days") {
                // JS weekday: 0=Sun..6=Sat; Calendar.DAY_OF_WEEK: 1=Sun..7=Sat
                val jsDay = candidate.get(Calendar.DAY_OF_WEEK) - 1
                if (!selectedDays.contains(jsDay)) continue
            }

            return candidate.timeInMillis
        }
        return null
    }

    fun recordPendingAction(context: Context, actionObj: JSONObject) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val existing = try {
            JSONArray(prefs.getString(KEY_PENDING_ACTIONS, "[]"))
        } catch (_: Exception) {
            JSONArray()
        }
        existing.put(actionObj)
        prefs.edit().putString(KEY_PENDING_ACTIONS, existing.toString()).apply()
    }

    fun drainPendingActions(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(KEY_PENDING_ACTIONS, "[]") ?: "[]"
        prefs.edit().putString(KEY_PENDING_ACTIONS, "[]").apply()
        return raw
    }

    fun cancelNotification(context: Context, notificationId: Int) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationId)
    }

    fun cancelAllActiveNotifications(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancelAll()
    }
}
