export type MedicineType = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'other';

export type TimeOfDaySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export type RepeatType = 'daily' | 'selected_days';

export type MealInstruction = 'none' | 'before_food' | 'after_food' | 'with_food';

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed';

export type Language = 'en' | 'hi';

export type TextScale = 'normal' | 'large' | 'xlarge';

export type AlarmTone = 'gentle' | 'bell' | 'urgent';

export interface ReminderTimeItem {
  id: string;
  slot: TimeOfDaySlot;
  time: string; // "HH:MM" 24-hour format
}

export interface Medicine {
  id: string;
  name: string;
  type: MedicineType;
  dosage: string;
  photoUrl?: string; // Custom uploaded data URL or curated medicine image path
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD" or undefined for ongoing
  repeatType: RepeatType;
  selectedDays: number[]; // 0 = Sun, 1 = Mon, ... 6 = Sat
  reminders: ReminderTimeItem[];
  mealInstruction: MealInstruction;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface IntakeLog {
  id: string; // `${medicineId}_${date}_${reminderId}`
  medicineId: string;
  medicineName: string;
  medicineType: MedicineType;
  dosage: string;
  date: string; // "YYYY-MM-DD"
  reminderId: string;
  slot: TimeOfDaySlot;
  scheduledTime: string; // "HH:MM"
  status: Exclude<DoseStatus, 'pending'>;
  actionAt: string; // ISO timestamp
  snoozeUntil?: string; // ISO timestamp if snoozed
}

export interface AppSettings {
  language: Language;
  textScale: TextScale;
  soundEnabled: boolean;
  alarmTone: AlarmTone;
  vibrationEnabled: boolean;
  snoozeMinutes: number;
  notificationsEnabled: boolean;
}

export interface ScheduledDoseInstance {
  key: string; // `${medicine.id}_${date}_${reminder.id}`
  medicine: Medicine;
  reminder: ReminderTimeItem;
  date: string;
  status: DoseStatus;
  log?: IntakeLog;
  snoozeUntil?: string;
}

export interface MedicineCatalogItem {
  id: string;
  name: string;
  genericName: string;
  commonBrands: string[];
  type: MedicineType;
  typicalDosage: string;
  category: string;
  categoryHi: string;
  generalInfo: string;
  generalInfoHi: string;
  administrationTip: string;
  administrationTipHi: string;
  source: 'curated' | 'openfda';
}

export interface ActiveAlarmPayload {
  key: string;
  medicineId: string;
  medicineName: string;
  medicineType: MedicineType;
  dosage: string;
  photoUrl?: string;
  mealInstruction: MealInstruction;
  reminderId: string;
  slot: TimeOfDaySlot;
  scheduledTime: string;
  date: string;
  isTest?: boolean;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  appName: 'Medicine Reminder';
  medicines: Medicine[];
  logs: IntakeLog[];
  settings: AppSettings;
}
