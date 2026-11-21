package com.medicinereminder.app

import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat

class AlarmSoundService : Service() {
    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    companion object {
        private const val FOREGROUND_ID = 9001

        fun stop(context: Context) {
            context.stopService(Intent(context, AlarmSoundService::class.java))
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        AlarmScheduler.ensureNotificationChannel(this)
        val medName = intent?.getStringExtra(AlarmScheduler.EXTRA_MEDICINE_NAME) ?: "Medicine Reminder"
        val dosage = intent?.getStringExtra(AlarmScheduler.EXTRA_DOSAGE) ?: ""

        val notification = NotificationCompat.Builder(this, AlarmScheduler.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Alarm Active: $medName")
            .setContentText(dosage.ifBlank { "Tap notification to mark taken, snooze, or skip" })
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSilent(true)
            .build()

        startForeground(FOREGROUND_ID, notification)

        if (AlarmScheduler.isSoundEnabled(this)) {
            startRingtone()
        }
        if (AlarmScheduler.isVibrationEnabled(this)) {
            startVibration()
        }

        return START_NOT_STICKY
    }

    private fun startRingtone() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ringtone = RingtoneManager.getRingtone(applicationContext, uri)?.apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    isLooping = true
                }
                audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                play()
            }
        } catch (_: Exception) {
            // Device may be in silent mode or missing default alarm tone
        }
    }

    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            val pattern = longArrayOf(0, 500, 300, 500, 800)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (_: Exception) {
            // Ignore on devices without vibrator
        }
    }

    override fun onDestroy() {
        try {
            ringtone?.stop()
        } catch (_: Exception) {
        }
        try {
            vibrator?.cancel()
        } catch (_: Exception) {
        }
        super.onDestroy()
    }
}
