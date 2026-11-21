import { Capacitor, registerPlugin } from '@capacitor/core';
import { ActiveAlarmPayload, AppSettings, IntakeLog, Medicine } from '../types/medicine';

export type PermissionStateStatus = 'granted' | 'denied' | 'prompt';

export interface AlarmPermissionStatus {
  isNativeAndroid: boolean;
  notifications: PermissionStateStatus;
  exactAlarm: PermissionStateStatus;
  bootReceiverActive: boolean;
}

export interface NativePendingAction {
  medicineId: string;
  medicineName: string;
  medicineType: Medicine['type'];
  dosage: string;
  reminderId: string;
  slot: IntakeLog['slot'];
  scheduledTime: string;
  date: string;
  action: 'taken' | 'skipped' | 'snoozed';
  actionAt: string;
  snoozeUntil?: string;
}

interface MedicineAlarmPluginInterface {
  checkPermissions(): Promise<{ notifications: PermissionStateStatus; exactAlarm: PermissionStateStatus }>;
  requestNotificationPermission(): Promise<{ notifications: PermissionStateStatus }>;
  requestExactAlarmPermission(): Promise<{ openedSettings: boolean }>;
  syncAllAlarms(options: { medicinesJson: string; snoozeMinutes: number; soundEnabled: boolean; vibrationEnabled: boolean }): Promise<{ scheduledCount: number }>;
  scheduleSnooze(options: { payloadJson: string; delayMinutes: number }): Promise<{ scheduled: boolean }>;
  cancelActiveAlarm(options: { notificationId?: number }): Promise<void>;
  triggerTestAlarm(options: { title: string; body: string; medicineName: string; dosage: string }): Promise<void>;
  drainPendingActions(): Promise<{ actionsJson: string }>;
}

const MedicineAlarmNative = registerPlugin<MedicineAlarmPluginInterface>('MedicineAlarm');

export function isNativeAndroidPlatform(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export async function getAlarmPermissions(): Promise<AlarmPermissionStatus> {
  if (isNativeAndroidPlatform()) {
    try {
      const res = await MedicineAlarmNative.checkPermissions();
      return {
        isNativeAndroid: true,
        notifications: res.notifications,
        exactAlarm: res.exactAlarm,
        bootReceiverActive: true,
      };
    } catch {
      return {
        isNativeAndroid: true,
        notifications: 'prompt',
        exactAlarm: 'prompt',
        bootReceiverActive: true,
      };
    }
  }

  let notifStatus: PermissionStateStatus = 'prompt';
  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') notifStatus = 'granted';
    else if (Notification.permission === 'denied') notifStatus = 'denied';
    else notifStatus = 'prompt';
  }

  return {
    isNativeAndroid: false,
    notifications: notifStatus,
    exactAlarm: notifStatus === 'granted' ? 'granted' : 'prompt',
    bootReceiverActive: false,
  };
}

export async function requestNotificationAccess(): Promise<PermissionStateStatus> {
  if (isNativeAndroidPlatform()) {
    try {
      const res = await MedicineAlarmNative.requestNotificationPermission();
      return res.notifications;
    } catch {
      return 'denied';
    }
  }

  if (typeof Notification === 'undefined') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'denied';
  }
}

export async function requestExactAlarmAccess(): Promise<boolean> {
  if (isNativeAndroidPlatform()) {
    try {
      const res = await MedicineAlarmNative.requestExactAlarmPermission();
      return res.openedSettings;
    } catch {
      return false;
    }
  }
  return false;
}

export async function syncNativeAndroidAlarms(medicines: Medicine[], settings: AppSettings): Promise<number> {
  if (!isNativeAndroidPlatform()) return 0;
  try {
    const res = await MedicineAlarmNative.syncAllAlarms({
      medicinesJson: JSON.stringify(medicines),
      snoozeMinutes: settings.snoozeMinutes,
      soundEnabled: settings.soundEnabled,
      vibrationEnabled: settings.vibrationEnabled,
    });
    return res.scheduledCount;
  } catch {
    return 0;
  }
}

export async function scheduleNativeSnooze(payload: ActiveAlarmPayload, delayMinutes: number): Promise<void> {
  if (!isNativeAndroidPlatform()) return;
  try {
    await MedicineAlarmNative.scheduleSnooze({
      payloadJson: JSON.stringify(payload),
      delayMinutes,
    });
  } catch {
    // Fallback handled in React state
  }
}

export async function stopNativeAlarm(): Promise<void> {
  if (!isNativeAndroidPlatform()) return;
  try {
    await MedicineAlarmNative.cancelActiveAlarm({});
  } catch {
    // Ignore
  }
}

export async function drainNativeNotificationActions(): Promise<NativePendingAction[]> {
  if (!isNativeAndroidPlatform()) return [];
  try {
    const { actionsJson } = await MedicineAlarmNative.drainPendingActions();
    const parsed = JSON.parse(actionsJson);
    return Array.isArray(parsed) ? (parsed as NativePendingAction[]) : [];
  } catch {
    return [];
  }
}

export async function dispatchSystemNotification(payload: ActiveAlarmPayload, titlePrefix: string): Promise<void> {
  if (isNativeAndroidPlatform()) {
    try {
      await MedicineAlarmNative.triggerTestAlarm({
        title: `${titlePrefix}: ${payload.medicineName}`,
        body: `${payload.dosage} · ${payload.scheduledTime}`,
        medicineName: payload.medicineName,
        dosage: payload.dosage,
      });
      return;
    } catch {
      // Fall through to web notification
    }
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    const body = `${payload.medicineName} — ${payload.dosage} (${payload.scheduledTime})`;
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(titlePrefix, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: payload.key,
            requireInteraction: true,
          });
          return;
        }
      }
      new Notification(titlePrefix, {
        body,
        icon: '/pwa-192x192.png',
        tag: payload.key,
      });
    } catch {
      // In-app full-screen modal still alerts user reliably
    }
  }
}
