package com.medicinereminder.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(MedicineAlarmPlugin::class.java)
        super.onCreate(savedInstanceState)
        AlarmScheduler.ensureNotificationChannel(this)
    }
}
