package com.medicinereminder.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class NotificationActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_TAKEN = "com.medicinereminder.app.ACTION_TAKEN"
        const val ACTION_SNOOZE = "com.medicinereminder.app.ACTION_SNOOZE"
        const val ACTION_SKIP = "com.medicinereminder.app.ACTION_SKIP"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val notificationId = intent.getIntExtra(AlarmScheduler.EXTRA_NOTIFICATION_ID, 0)
        val isTest = intent.getBooleanExtra(AlarmScheduler.EXTRA_IS_TEST, false)

        // Stop ringing alarm & dismiss notification immediately
        AlarmSoundService.stop(context)
        if (notificationId != 0) {
            AlarmScheduler.cancelNotification(context, notificationId)
        }

        if (isTest) return

        val medicineId = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_ID) ?: return
        val medicineName = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_NAME) ?: "Medicine"
        val medicineType = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_TYPE) ?: "tablet"
        val dosage = intent.getStringExtra(AlarmScheduler.EXTRA_DOSAGE) ?: ""
        val reminderId = intent.getStringExtra(AlarmScheduler.EXTRA_REMINDER_ID) ?: ""
        val slot = intent.getStringExtra(AlarmScheduler.EXTRA_SLOT) ?: "morning"
        val scheduledTime = intent.getStringExtra(AlarmScheduler.EXTRA_TIME) ?: ""
        val dateKey = intent.getStringExtra(AlarmScheduler.EXTRA_DATE)
            ?: SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

        val isoFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        val status = when (action) {
            ACTION_TAKEN -> "taken"
            ACTION_SKIP -> "skipped"
            ACTION_SNOOZE -> "snoozed"
            else -> return
        }

        val record = JSONObject().apply {
            put("medicineId", medicineId)
            put("medicineName", medicineName)
            put("medicineType", medicineType)
            put("dosage", dosage)
            put("reminderId", reminderId)
            put("slot", slot)
            put("scheduledTime", scheduledTime)
            put("date", dateKey)
            put("action", status)
            put("actionAt", isoFmt.format(Date()))
        }

        if (status == "snoozed") {
            val snoozeMins = AlarmScheduler.getSnoozeMinutes(context)
            val snoozeUntil = Date(System.currentTimeMillis() + snoozeMins * 60_000L)
            record.put("snoozeUntil", isoFmt.format(snoozeUntil))
            AlarmScheduler.scheduleSnoozeAlarm(
                context = context,
                medicineId = medicineId,
                medicineName = medicineName,
                medicineType = medicineType,
                dosage = dosage,
                reminderId = reminderId,
                slot = slot,
                scheduledTime = scheduledTime,
                delayMinutes = snoozeMins
            )
        }

        AlarmScheduler.recordPendingAction(context, record)
    }
}
