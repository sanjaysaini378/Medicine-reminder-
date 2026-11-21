package com.medicinereminder.app

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "MedicineReminder::AlarmWakeLock"
        )
        wakeLock.acquire(15_000L)

        try {
            AlarmScheduler.ensureNotificationChannel(context)

            val medicineId = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_ID) ?: "med"
            val medicineName = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_NAME) ?: "Medicine Reminder"
            val medicineType = intent.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_TYPE) ?: "tablet"
            val dosage = intent.getStringExtra(AlarmScheduler.EXTRA_DOSAGE) ?: ""
            val reminderId = intent.getStringExtra(AlarmScheduler.EXTRA_REMINDER_ID) ?: "rem"
            val slot = intent.getStringExtra(AlarmScheduler.EXTRA_SLOT) ?: "morning"
            val scheduledTime = intent.getStringExtra(AlarmScheduler.EXTRA_TIME) ?: ""
            val dateKey = intent.getStringExtra(AlarmScheduler.EXTRA_DATE) ?: ""
            val isTest = intent.getBooleanExtra(AlarmScheduler.EXTRA_IS_TEST, false)
            val notificationId = intent.getIntExtra(
                AlarmScheduler.EXTRA_NOTIFICATION_ID,
                (System.currentTimeMillis() and 0xFFFFFF).toInt()
            )

            // Start continuous alarm sound + vibration foreground service
            val soundIntent = Intent(context, AlarmSoundService::class.java).apply {
                putExtra(AlarmScheduler.EXTRA_MEDICINE_NAME, medicineName)
                putExtra(AlarmScheduler.EXTRA_DOSAGE, dosage)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(soundIntent)
            } else {
                context.startService(soundIntent)
            }

            // Full-screen / tap intent opens MainActivity
            val openIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(AlarmScheduler.EXTRA_MEDICINE_ID, medicineId)
                putExtra(AlarmScheduler.EXTRA_REMINDER_ID, reminderId)
            }
            val openPendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Action 1: Taken
            val takenPi = buildActionPendingIntent(
                context,
                NotificationActionReceiver.ACTION_TAKEN,
                notificationId * 10 + 1,
                medicineId, medicineName, medicineType, dosage, reminderId, slot, scheduledTime, dateKey, notificationId, isTest
            )

            // Action 2: Snooze
            val snoozePi = buildActionPendingIntent(
                context,
                NotificationActionReceiver.ACTION_SNOOZE,
                notificationId * 10 + 2,
                medicineId, medicineName, medicineType, dosage, reminderId, slot, scheduledTime, dateKey, notificationId, isTest
            )

            // Action 3: Skip
            val skipPi = buildActionPendingIntent(
                context,
                NotificationActionReceiver.ACTION_SKIP,
                notificationId * 10 + 3,
                medicineId, medicineName, medicineType, dosage, reminderId, slot, scheduledTime, dateKey, notificationId, isTest
            )

            val snoozeMins = AlarmScheduler.getSnoozeMinutes(context)
            val contentText = buildString {
                if (dosage.isNotBlank()) append(dosage)
                if (scheduledTime.isNotBlank()) {
                    if (isNotEmpty()) append(" · ")
                    append(scheduledTime)
                }
            }

            val notification = NotificationCompat.Builder(context, AlarmScheduler.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(medicineName)
                .setContentText(contentText.ifBlank { "Time to take your medicine" })
                .setStyle(
                    NotificationCompat.BigTextStyle()
                        .bigText("$medicineName\n$contentText")
                )
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(false)
                .setOngoing(true)
                .setContentIntent(openPendingIntent)
                .setFullScreenIntent(openPendingIntent, true)
                .addAction(0, "Taken", takenPi)
                .addAction(0, "Snooze ${snoozeMins}m", snoozePi)
                .addAction(0, "Skip", skipPi)
                .build()

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(notificationId, notification)

            // Automatically schedule next recurring occurrence for daily / selected days
            if (!isTest) {
                AlarmScheduler.rescheduleAll(context)
            }
        } finally {
            if (wakeLock.isHeld) {
                wakeLock.release()
            }
        }
    }

    private fun buildActionPendingIntent(
        context: Context,
        action: String,
        requestCode: Int,
        medicineId: String,
        medicineName: String,
        medicineType: String,
        dosage: String,
        reminderId: String,
        slot: String,
        scheduledTime: String,
        dateKey: String,
        notificationId: Int,
        isTest: Boolean
    ): PendingIntent {
        val actionIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            this.action = action
            putExtra(AlarmScheduler.EXTRA_MEDICINE_ID, medicineId)
            putExtra(AlarmScheduler.EXTRA_MEDICINE_NAME, medicineName)
            putExtra(AlarmScheduler.EXTRA_MEDICINE_TYPE, medicineType)
            putExtra(AlarmScheduler.EXTRA_DOSAGE, dosage)
            putExtra(AlarmScheduler.EXTRA_REMINDER_ID, reminderId)
            putExtra(AlarmScheduler.EXTRA_SLOT, slot)
            putExtra(AlarmScheduler.EXTRA_TIME, scheduledTime)
            putExtra(AlarmScheduler.EXTRA_DATE, dateKey)
            putExtra(AlarmScheduler.EXTRA_NOTIFICATION_ID, notificationId)
            putExtra(AlarmScheduler.EXTRA_IS_TEST, isTest)
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            actionIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
