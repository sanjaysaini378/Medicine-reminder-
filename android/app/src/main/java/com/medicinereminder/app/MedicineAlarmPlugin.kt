package com.medicinereminder.app

import android.Manifest
import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONObject

@CapacitorPlugin(
    name = "MedicineAlarm",
    permissions = [
        Permission(
            alias = "notifications",
            strings = [Manifest.permission.POST_NOTIFICATIONS]
        )
    ]
)
class MedicineAlarmPlugin : Plugin() {

    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        val result = JSObject()
        result.put("notifications", getNotificationPermissionStatus())
        result.put("exactAlarm", getExactAlarmPermissionStatus())
        call.resolve(result)
    }

    @PluginMethod
    fun requestNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            val res = JSObject()
            res.put("notifications", "granted")
            call.resolve(res)
            return
        }
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            val res = JSObject()
            res.put("notifications", "granted")
            call.resolve(res)
            return
        }
        requestPermissionForAlias("notifications", call, "notificationsPermsCallback")
    }

    @PermissionCallback
    private fun notificationsPermsCallback(call: PluginCall) {
        val res = JSObject()
        res.put("notifications", getNotificationPermissionStatus())
        call.resolve(res)
    }

    @PluginMethod
    fun requestExactAlarmPermission(call: PluginCall) {
        val res = JSObject()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (!alarmManager.canScheduleExactAlarms()) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                res.put("openedSettings", true)
                call.resolve(res)
                return
            }
        }
        res.put("openedSettings", false)
        call.resolve(res)
    }

    @PluginMethod
    fun syncAllAlarms(call: PluginCall) {
        val medicinesJson = call.getString("medicinesJson") ?: "[]"
        val snoozeMinutes = call.getInt("snoozeMinutes") ?: 10
        val soundEnabled = call.getBoolean("soundEnabled") ?: true
        val vibrationEnabled = call.getBoolean("vibrationEnabled") ?: true

        AlarmScheduler.saveConfig(context, medicinesJson, snoozeMinutes, soundEnabled, vibrationEnabled)
        val count = AlarmScheduler.rescheduleAll(context)

        val res = JSObject()
        res.put("scheduledCount", count)
        call.resolve(res)
    }

    @PluginMethod
    fun scheduleSnooze(call: PluginCall) {
        val payloadJson = call.getString("payloadJson") ?: "{}"
        val delayMinutes = call.getInt("delayMinutes") ?: 10
        val obj = JSONObject(payloadJson)

        AlarmScheduler.scheduleSnoozeAlarm(
            context = context,
            medicineId = obj.optString("medicineId"),
            medicineName = obj.optString("medicineName", "Medicine"),
            medicineType = obj.optString("medicineType", "tablet"),
            dosage = obj.optString("dosage", ""),
            reminderId = obj.optString("reminderId"),
            slot = obj.optString("slot", "morning"),
            scheduledTime = obj.optString("scheduledTime", ""),
            delayMinutes = delayMinutes
        )

        val res = JSObject()
        res.put("scheduled", true)
        call.resolve(res)
    }

    @PluginMethod
    fun cancelActiveAlarm(call: PluginCall) {
        val notificationId = call.getInt("notificationId")
        AlarmSoundService.stop(context)
        if (notificationId != null) {
            AlarmScheduler.cancelNotification(context, notificationId)
        } else {
            AlarmScheduler.cancelAllActiveNotifications(context)
        }
        call.resolve()
    }

    @PluginMethod
    fun triggerTestAlarm(call: PluginCall) {
        val medicineName = call.getString("medicineName") ?: "Medicine Reminder"
        val dosage = call.getString("dosage") ?: "1 Tablet"

        AlarmScheduler.ensureNotificationChannel(context)
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(AlarmScheduler.EXTRA_MEDICINE_ID, "test-med")
            putExtra(AlarmScheduler.EXTRA_MEDICINE_NAME, medicineName)
            putExtra(AlarmScheduler.EXTRA_MEDICINE_TYPE, "tablet")
            putExtra(AlarmScheduler.EXTRA_DOSAGE, dosage)
            putExtra(AlarmScheduler.EXTRA_REMINDER_ID, "test-rem")
            putExtra(AlarmScheduler.EXTRA_SLOT, "morning")
            putExtra(AlarmScheduler.EXTRA_TIME, "Now")
            putExtra(AlarmScheduler.EXTRA_IS_TEST, true)
        }
        context.sendBroadcast(intent)
        call.resolve()
    }

    @PluginMethod
    fun drainPendingActions(call: PluginCall) {
        val actionsJson = AlarmScheduler.drainPendingActions(context)
        val res = JSObject()
        res.put("actionsJson", actionsJson)
        call.resolve(res)
    }

    private fun getNotificationPermissionStatus(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return "granted"
        val granted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
        return if (granted) "granted" else "prompt"
    }

    private fun getExactAlarmPermissionStatus(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return "granted"
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return if (alarmManager.canScheduleExactAlarms()) "granted" else "prompt"
    }
}
