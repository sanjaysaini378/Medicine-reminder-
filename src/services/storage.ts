import { AppSettings, BackupPayload, IntakeLog, Medicine } from '../types/medicine';
import { formatDateKey } from './scheduleEngine';

const DB_NAME = 'medicine_reminder_db';
const DB_VERSION = 1;
const STORE_KV = 'kv_store';

const KEY_MEDICINES = 'mr_medicines_v1';
const KEY_LOGS = 'mr_logs_v1';
const KEY_SETTINGS = 'mr_settings_v1';
const KEY_INITIALIZED = 'mr_initialized_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  textScale: 'normal',
  soundEnabled: true,
  alarmTone: 'gentle',
  vibrationEnabled: true,
  snoozeMinutes: 10,
  notificationsEnabled: true,
};

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readonly');
      const store = tx.objectStore(STORE_KV);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — IndexedDB still retains full photos & payload
  }
}

export function createSampleSchedule(): { medicines: Medicine[]; logs: IntakeLog[] } {
  const today = new Date();
  const startDate = formatDateKey(new Date(today.getTime() - 5 * 86400000));
  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(new Date(today.getTime() - 86400000));

  const medicines: Medicine[] = [
    {
      id: 'med-sample-1',
      name: 'Metformin 500 mg',
      type: 'tablet',
      dosage: '1 Tablet (500 mg)',
      startDate,
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      reminders: [
        { id: 'rem-1a', slot: 'morning', time: '08:00' },
        { id: 'rem-1b', slot: 'night', time: '20:30' },
      ],
      mealInstruction: 'after_food',
      notes: 'Take with a full glass of water',
      active: true,
      createdAt: new Date(today.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'med-sample-2',
      name: 'Vitamin D3 1000 IU',
      type: 'capsule',
      dosage: '1 Capsule',
      startDate,
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      reminders: [{ id: 'rem-2a', slot: 'afternoon', time: '13:30' }],
      mealInstruction: 'after_food',
      notes: 'After lunch',
      active: true,
      createdAt: new Date(today.getTime() - 4 * 86400000).toISOString(),
    },
    {
      id: 'med-sample-3',
      name: 'Atorvastatin 10 mg',
      type: 'tablet',
      dosage: '1 Tablet (10 mg)',
      startDate,
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      reminders: [{ id: 'rem-3a', slot: 'evening', time: '19:00' }],
      mealInstruction: 'none',
      notes: 'Same time every evening',
      active: true,
      createdAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'med-sample-4',
      name: 'Antacid Oral Suspension',
      type: 'syrup',
      dosage: '10 ml',
      startDate,
      endDate: formatDateKey(new Date(today.getTime() + 10 * 86400000)),
      repeatType: 'daily',
      selectedDays: [0, 1, 2, 3, 4, 5, 6],
      reminders: [{ id: 'rem-4a', slot: 'night', time: '21:30' }],
      mealInstruction: 'after_food',
      notes: 'Shake well before measuring',
      active: true,
      createdAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  const logs: IntakeLog[] = [
    {
      id: `med-sample-1_${todayKey}_rem-1a`,
      medicineId: 'med-sample-1',
      medicineName: 'Metformin 500 mg',
      medicineType: 'tablet',
      dosage: '1 Tablet (500 mg)',
      date: todayKey,
      reminderId: 'rem-1a',
      slot: 'morning',
      scheduledTime: '08:00',
      status: 'taken',
      actionAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 6).toISOString(),
    },
    {
      id: `med-sample-1_${yesterdayKey}_rem-1a`,
      medicineId: 'med-sample-1',
      medicineName: 'Metformin 500 mg',
      medicineType: 'tablet',
      dosage: '1 Tablet (500 mg)',
      date: yesterdayKey,
      reminderId: 'rem-1a',
      slot: 'morning',
      scheduledTime: '08:00',
      status: 'taken',
      actionAt: new Date(today.getTime() - 86400000).toISOString(),
    },
    {
      id: `med-sample-2_${yesterdayKey}_rem-2a`,
      medicineId: 'med-sample-2',
      medicineName: 'Vitamin D3 1000 IU',
      medicineType: 'capsule',
      dosage: '1 Capsule',
      date: yesterdayKey,
      reminderId: 'rem-2a',
      slot: 'afternoon',
      scheduledTime: '13:30',
      status: 'taken',
      actionAt: new Date(today.getTime() - 86400000).toISOString(),
    },
    {
      id: `med-sample-3_${yesterdayKey}_rem-3a`,
      medicineId: 'med-sample-3',
      medicineName: 'Atorvastatin 10 mg',
      medicineType: 'tablet',
      dosage: '1 Tablet (10 mg)',
      date: yesterdayKey,
      reminderId: 'rem-3a',
      slot: 'evening',
      scheduledTime: '19:00',
      status: 'missed',
      actionAt: new Date(today.getTime() - 86400000).toISOString(),
    },
    {
      id: `med-sample-1_${yesterdayKey}_rem-1b`,
      medicineId: 'med-sample-1',
      medicineName: 'Metformin 500 mg',
      medicineType: 'tablet',
      dosage: '1 Tablet (500 mg)',
      date: yesterdayKey,
      reminderId: 'rem-1b',
      slot: 'night',
      scheduledTime: '20:30',
      status: 'taken',
      actionAt: new Date(today.getTime() - 86400000).toISOString(),
    },
  ];

  return { medicines, logs };
}

export async function loadAppData(): Promise<{
  medicines: Medicine[];
  logs: IntakeLog[];
  settings: AppSettings;
}> {
  const initialized = (await idbGet<boolean>(KEY_INITIALIZED)) ?? lsGet<boolean>(KEY_INITIALIZED);

  if (!initialized) {
    const sample = createSampleSchedule();
    await saveMedicines(sample.medicines);
    await saveLogs(sample.logs);
    await saveSettings(DEFAULT_SETTINGS);
    await idbSet(KEY_INITIALIZED, true);
    lsSet(KEY_INITIALIZED, true);
    return {
      medicines: sample.medicines,
      logs: sample.logs,
      settings: DEFAULT_SETTINGS,
    };
  }

  const medicines = (await idbGet<Medicine[]>(KEY_MEDICINES)) ?? lsGet<Medicine[]>(KEY_MEDICINES) ?? [];
  const logs = (await idbGet<IntakeLog[]>(KEY_LOGS)) ?? lsGet<IntakeLog[]>(KEY_LOGS) ?? [];
  const storedSettings = (await idbGet<AppSettings>(KEY_SETTINGS)) ?? lsGet<AppSettings>(KEY_SETTINGS);

  return {
    medicines,
    logs,
    settings: { ...DEFAULT_SETTINGS, ...(storedSettings || {}) },
  };
}

export async function saveMedicines(medicines: Medicine[]): Promise<void> {
  await idbSet(KEY_MEDICINES, medicines);
  lsSet(KEY_MEDICINES, medicines);
}

export async function saveLogs(logs: IntakeLog[]): Promise<void> {
  await idbSet(KEY_LOGS, logs);
  lsSet(KEY_LOGS, logs);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await idbSet(KEY_SETTINGS, settings);
  lsSet(KEY_SETTINGS, settings);
}

export function buildBackupPayload(
  medicines: Medicine[],
  logs: IntakeLog[],
  settings: AppSettings
): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Medicine Reminder',
    medicines,
    logs,
    settings,
  };
}

export function parseBackupPayload(jsonText: string): BackupPayload | null {
  try {
    const parsed = JSON.parse(jsonText) as Partial<BackupPayload>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.medicines) || !Array.isArray(parsed.logs)) return null;

    const validMedicines = parsed.medicines.filter(
      (m): m is Medicine =>
        Boolean(m && typeof m.id === 'string' && typeof m.name === 'string' && Array.isArray(m.reminders))
    );
    const validLogs = parsed.logs.filter(
      (l): l is IntakeLog =>
        Boolean(l && typeof l.id === 'string' && typeof l.medicineId === 'string' && typeof l.date === 'string')
    );

    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      appName: 'Medicine Reminder',
      medicines: validMedicines,
      logs: validLogs,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return null;
  }
}

export async function compressImageFile(file: File, maxDimension = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height >= width && height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Could not decode image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}
