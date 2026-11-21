interface CapacitorAppConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: 'https' | 'http';
  };
  android?: {
    allowMixedContent?: boolean;
    backgroundColor?: string;
    captureInput?: boolean;
    webContentsDebuggingEnabled?: boolean;
  };
  plugins?: Record<string, Record<string, unknown>>;
}

const config: CapacitorAppConfig = {
  appId: 'com.medicinereminder.app',
  appName: 'Medicine Reminder',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F7F9FA',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    MedicineAlarm: {
      channelId: 'medicine_alarm_channel',
      channelName: 'Medicine Alarms',
    },
  },
};

export default config;
