import { DoseStatus, IntakeLog, Language, Medicine, ScheduledDoseInstance, TimeOfDaySlot } from '../types/medicine';

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getTimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatDisplayTime(hhmm: string, lang: Language = 'en'): string {
  const [hRaw, mRaw] = hhmm.split(':').map(Number);
  const h = hRaw || 0;
  const m = String(mRaw || 0).padStart(2, '0');
  const period = h >= 12 ? (lang === 'hi' ? 'PM' : 'PM') : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

export function inferSlotFromTime(hhmm: string): TimeOfDaySlot {
  const mins = getTimeMinutes(hhmm);
  if (mins < 12 * 60) return 'morning';
  if (mins < 17 * 60) return 'afternoon';
  if (mins < 20 * 60) return 'evening';
  return 'night';
}

export function isMedicineScheduledOnDate(medicine: Medicine, dateKey: string): boolean {
  if (!medicine.active) return false;
  if (dateKey < medicine.startDate) return false;
  if (medicine.endDate && dateKey > medicine.endDate) return false;

  if (medicine.repeatType === 'daily') return true;
  const dayOfWeek = parseDateKey(dateKey).getDay();
  return medicine.selectedDays.includes(dayOfWeek);
}

export function getScheduleForDate(
  medicines: Medicine[],
  logs: IntakeLog[],
  dateKey: string,
  now: Date = new Date()
): ScheduledDoseInstance[] {
  const logMap = new Map<string, IntakeLog>();
  for (const log of logs) {
    if (log.date === dateKey) {
      logMap.set(log.id, log);
    }
  }

  const todayKey = formatDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const instances: ScheduledDoseInstance[] = [];

  for (const med of medicines) {
    if (!isMedicineScheduledOnDate(med, dateKey)) continue;

    for (const reminder of med.reminders) {
      const key = `${med.id}_${dateKey}_${reminder.id}`;
      const log = logMap.get(key);
      let status: DoseStatus = 'pending';

      if (log) {
        status = log.status;
      } else if (dateKey < todayKey) {
        status = 'missed';
      } else if (dateKey === todayKey) {
        const schedMins = getTimeMinutes(reminder.time);
        // Mark as missed automatically if more than 90 minutes past scheduled time with no action
        if (nowMinutes - schedMins > 90) {
          status = 'missed';
        }
      }

      instances.push({
        key,
        medicine: med,
        reminder,
        date: dateKey,
        status,
        log,
        snoozeUntil: log?.snoozeUntil,
      });
    }
  }

  instances.sort((a, b) => getTimeMinutes(a.reminder.time) - getTimeMinutes(b.reminder.time));
  return instances;
}

export function getNextUpcomingDose(
  todaySchedule: ScheduledDoseInstance[],
  now: Date = new Date()
): ScheduledDoseInstance | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // First check any snoozed or pending doses today
  const actionable = todaySchedule.filter((d) => d.status === 'pending' || d.status === 'snoozed');
  if (actionable.length === 0) return null;

  // Prefer the earliest dose that is upcoming or recently due
  const upcoming = actionable.find((d) => getTimeMinutes(d.reminder.time) >= nowMinutes - 15);
  return upcoming || actionable[0];
}

export function getSevenDayHistory(
  medicines: Medicine[],
  logs: IntakeLog[],
  daysBack = 14,
  now: Date = new Date()
): {
  entries: ScheduledDoseInstance[];
  adherencePercent: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
} {
  const todayKey = formatDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const entries: ScheduledDoseInstance[] = [];

  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateKey = formatDateKey(d);
    const daySchedule = getScheduleForDate(medicines, logs, dateKey, now);

    for (const item of daySchedule) {
      if (dateKey === todayKey) {
        // On today, include items that have been logged OR whose time has passed
        if (item.log || item.status === 'missed' || getTimeMinutes(item.reminder.time) <= nowMinutes) {
          entries.push(item);
        }
      } else {
        entries.push(item);
      }
    }
  }

  // Compute 7-day adherence summary
  const sevenDaysAgo = formatDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const recent = entries.filter((e) => e.date >= sevenDaysAgo && e.status !== 'pending' && e.status !== 'snoozed');
  const takenCount = recent.filter((e) => e.status === 'taken').length;
  const missedCount = recent.filter((e) => e.status === 'missed').length;
  const skippedCount = recent.filter((e) => e.status === 'skipped').length;
  const denom = takenCount + missedCount + skippedCount;
  const adherencePercent = denom > 0 ? Math.round((takenCount / denom) * 100) : 100;

  return {
    entries,
    adherencePercent,
    takenCount,
    missedCount,
    skippedCount,
  };
}

export function getSurroundingDates(centerDateKey: string): string[] {
  const center = parseDateKey(centerDateKey);
  const dates: string[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(center.getFullYear(), center.getMonth(), center.getDate() + offset);
    dates.push(formatDateKey(d));
  }
  return dates;
}
