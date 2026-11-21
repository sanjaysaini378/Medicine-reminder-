import React, { useMemo, useState } from 'react';
import {
  AlarmClock,
  AlertCircle,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  ActiveAlarmPayload,
  AppSettings,
  Medicine,
  ScheduledDoseInstance,
  TimeOfDaySlot,
} from '../types/medicine';
import { getMealLabel, getSlotLabel, getTranslations, getTypeLabel } from '../i18n/translations';
import {
  formatDateKey,
  formatDisplayTime,
  getNextUpcomingDose,
  getSurroundingDates,
  getTimeMinutes,
  parseDateKey,
} from '../services/scheduleEngine';
import { MedicineVisual } from './MedicineIconBadge';

interface DashboardViewProps {
  medicines: Medicine[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  schedule: ScheduledDoseInstance[];
  settings: AppSettings;
  now: Date;
  onMarkTaken: (dose: ScheduledDoseInstance) => void;
  onMarkSkipped: (dose: ScheduledDoseInstance) => void;
  onSnooze: (dose: ScheduledDoseInstance) => void;
  onUndoDose: (dose: ScheduledDoseInstance) => void;
  onAddNew: () => void;
  onEditMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (medicineId: string) => void;
  onTriggerTestAlarm: (payload: ActiveAlarmPayload) => void;
}

const SLOT_ORDER: TimeOfDaySlot[] = ['morning', 'afternoon', 'evening', 'night'];

const SlotIcon: React.FC<{ slot: TimeOfDaySlot; className?: string }> = ({ slot, className = 'w-5 h-5' }) => {
  switch (slot) {
    case 'morning':
      return <Sunrise className={className} />;
    case 'afternoon':
      return <Sun className={className} />;
    case 'evening':
      return <Sunset className={className} />;
    case 'night':
      return <Moon className={className} />;
  }
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  medicines,
  selectedDate,
  onSelectDate,
  schedule,
  settings,
  now,
  onMarkTaken,
  onMarkSkipped,
  onSnooze,
  onUndoDose,
  onAddNew,
  onEditMedicine,
  onDeleteMedicine,
  onTriggerTestAlarm,
}) => {
  const t = getTranslations(settings.language);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showManageList, setShowManageList] = useState(false);

  const todayKey = formatDateKey(now);
  const isToday = selectedDate === todayKey;
  const dateStrip = useMemo(() => getSurroundingDates(todayKey), [todayKey]);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return t.dashboard.goodMorning;
    if (h < 17) return t.dashboard.goodAfternoon;
    return t.dashboard.goodEvening;
  }, [now, t]);

  const stats = useMemo(() => {
    const total = schedule.length;
    const taken = schedule.filter((s) => s.status === 'taken').length;
    const missed = schedule.filter((s) => s.status === 'missed').length;
    const skipped = schedule.filter((s) => s.status === 'skipped').length;
    const pending = schedule.filter((s) => s.status === 'pending' || s.status === 'snoozed').length;
    const pct = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { total, taken, pending, missed, skipped, pct };
  }, [schedule]);

  const nextDose = useMemo(() => {
    if (!isToday) return null;
    return getNextUpcomingDose(schedule, now);
  }, [isToday, schedule, now]);

  const groupedBySlot = useMemo(() => {
    const groups: Record<TimeOfDaySlot, ScheduledDoseInstance[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };
    for (const item of schedule) {
      groups[item.reminder.slot].push(item);
    }
    return groups;
  }, [schedule]);

  const getRelativeCountdown = (dose: ScheduledDoseInstance): string => {
    if (dose.status === 'snoozed' && dose.snoozeUntil) {
      const snoozeDate = new Date(dose.snoozeUntil);
      const hhmm = `${String(snoozeDate.getHours()).padStart(2, '0')}:${String(snoozeDate.getMinutes()).padStart(2, '0')}`;
      return t.dashboard.snoozedUntil.replace('{time}', formatDisplayTime(hhmm, settings.language));
    }
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const diff = getTimeMinutes(dose.reminder.time) - nowMins;
    if (diff < -5) return t.dashboard.overdue;
    if (diff <= 5) return t.dashboard.dueNow;
    if (diff < 60) return t.dashboard.inMinutes.replace('{m}', String(diff));
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return t.dashboard.inHoursMinutes.replace('{h}', String(h)).replace('{m}', String(m));
  };

  const formattedHeaderDate = useMemo(() => {
    const d = parseDateKey(selectedDate);
    return d.toLocaleDateString(settings.language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate, settings.language]);

  // SVG Ring math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.pct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Greeting & Date Scroller */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-600">{formattedHeaderDate}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              {isToday ? greeting : t.dashboard.scheduleForDate}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                type="button"
                onClick={() => onSelectDate(todayKey)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {t.dashboard.today}
              </button>
            )}
            <button
              type="button"
              onClick={onAddNew}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0A645B] transition-colors whitespace-nowrap"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>{t.dashboard.addMedicineCta}</span>
            </button>
          </div>
        </div>

        {/* 7-Day Horizontal Date Picker */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label="Select date">
          {dateStrip.map((dateKey) => {
            const d = parseDateKey(dateKey);
            const active = dateKey === selectedDate;
            const isTodayBtn = dateKey === todayKey;
            return (
              <button
                key={dateKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDate(dateKey)}
                className={`min-h-[58px] flex flex-col items-center justify-center rounded-2xl border transition-colors ${
                  active
                    ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                    : isTodayBtn
                    ? 'bg-teal-50/70 border-teal-200 text-slate-900 hover:bg-teal-50'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-medium ${active ? 'text-teal-100' : 'text-slate-500'}`}>
                  {t.daysShort[d.getDay()]}
                </span>
                <span className="mt-0.5 text-base font-bold tabular-nums">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top Row: Daily Summary + Next Upcoming Reminder (2-column on lg) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Daily Summary Card */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200/90 p-5 flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#0D7A6F"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute text-base font-bold text-slate-900 tabular-nums">{stats.pct}%</span>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900">{t.dashboard.dailySummary}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-2xl font-bold text-[#15803D] tabular-nums">{stats.taken}</p>
                <p className="text-xs font-medium text-slate-600">{t.dashboard.taken}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 tabular-nums">{stats.pending}</p>
                <p className="text-xs font-medium text-slate-600">{t.dashboard.pending}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 tabular-nums">{stats.missed}</p>
                <p className="text-xs font-medium text-slate-600">{t.dashboard.missed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Upcoming Reminder Spotlight */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between">
          {nextDose ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0D7A6F] tracking-tight">
                    {t.dashboard.upcomingTitle} · {getRelativeCountdown(nextDose)}
                  </p>
                  <div className="mt-2.5 flex items-center gap-3.5">
                    <MedicineVisual
                      type={nextDose.medicine.type}
                      name={nextDose.medicine.name}
                      photoUrl={nextDose.medicine.photoUrl}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-slate-900 truncate">{nextDose.medicine.name}</h2>
                      <p className="text-sm font-medium text-slate-600">
                        {nextDose.medicine.dosage} ·{' '}
                        <span className="font-mono-tabular font-semibold text-slate-900">
                          {formatDisplayTime(nextDose.reminder.time, settings.language)}
                        </span>
                        {nextDose.medicine.mealInstruction !== 'none'
                          ? ` · ${getMealLabel(settings.language, nextDose.medicine.mealInstruction)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onTriggerTestAlarm({
                      key: nextDose.key,
                      medicineId: nextDose.medicine.id,
                      medicineName: nextDose.medicine.name,
                      medicineType: nextDose.medicine.type,
                      dosage: nextDose.medicine.dosage,
                      photoUrl: nextDose.medicine.photoUrl,
                      mealInstruction: nextDose.medicine.mealInstruction,
                      reminderId: nextDose.reminder.id,
                      slot: nextDose.reminder.slot,
                      scheduledTime: nextDose.reminder.time,
                      date: nextDose.date,
                      isTest: true,
                    })
                  }
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                  title={t.dashboard.testAlarm}
                >
                  <BellRing className="w-4 h-4 text-[#0D7A6F]" />
                  <span className="hidden sm:inline">{t.dashboard.testAlarm}</span>
                </button>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMarkTaken(nextDose)}
                  className="flex-1 min-w-[120px] min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0A645B] transition-colors whitespace-nowrap"
                >
                  <Check className="w-5 h-5 shrink-0" />
                  <span>{t.dashboard.markTaken}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSnooze(nextDose)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors whitespace-nowrap"
                >
                  <AlarmClock className="w-4 h-4 shrink-0" />
                  <span>{t.dashboard.snooze}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMarkSkipped(nextDose)}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  {t.dashboard.skip}
                </button>
              </div>
            </>
          ) : stats.total > 0 && stats.pending === 0 ? (
            <div className="flex items-center gap-4 my-auto py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#15803D] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.dashboard.allDoneTitle}</h2>
                <p className="text-sm text-slate-600 mt-0.5">{t.dashboard.allDoneSubtitle}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 my-auto py-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t.dashboard.noMedicinesTitle}</h2>
                <p className="text-sm text-slate-600 mt-0.5">{t.dashboard.noMedicinesSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onAddNew}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0A645B] whitespace-nowrap shrink-0"
              >
                {t.dashboard.addMedicineCta}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Schedule Grouped by Morning / Afternoon / Evening / Night */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {isToday ? t.dashboard.todaySchedule : t.dashboard.scheduleForDate}
          </h2>
          {medicines.length > 0 && (
            <button
              type="button"
              onClick={() => setShowManageList((v) => !v)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-sm font-semibold text-[#0D7A6F] hover:bg-teal-50 transition-colors whitespace-nowrap"
            >
              {t.dashboard.manageAll} ({medicines.length})
            </button>
          )}
        </div>

        {schedule.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/90 p-8 text-center">
            <p className="text-lg font-bold text-slate-900">{t.dashboard.noMedicinesTitle}</p>
            <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{t.dashboard.noMedicinesSubtitle}</p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-5 min-h-[48px] px-6 py-3 rounded-xl bg-[#0D7A6F] text-white text-base font-semibold inline-flex items-center gap-2 hover:bg-[#0A645B] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>{t.dashboard.addMedicineCta}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {SLOT_ORDER.map((slot) => {
              const items = groupedBySlot[slot];
              if (items.length === 0) return null;

              return (
                <div key={slot} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-700 px-1">
                    <SlotIcon slot={slot} className="w-5 h-5 text-[#0D7A6F]" />
                    <h3 className="text-base font-bold text-slate-900">{getSlotLabel(settings.language, slot)}</h3>
                    <span className="text-sm text-slate-500 tabular-nums">· {items.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((dose) => {
                      const isDone = dose.status === 'taken';
                      const isSkipped = dose.status === 'skipped';
                      const isMissed = dose.status === 'missed';
                      const isSnoozed = dose.status === 'snoozed';

                      return (
                        <article
                          key={dose.key}
                          className={`rounded-2xl border p-4 transition-colors ${
                            isDone
                              ? 'bg-emerald-50/40 border-emerald-200/80'
                              : isMissed
                              ? 'bg-red-50/35 border-red-200/80'
                              : 'bg-white border-slate-200/90'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <MedicineVisual
                              type={dose.medicine.type}
                              name={dose.medicine.name}
                              photoUrl={dose.medicine.photoUrl}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-base font-bold text-slate-900 leading-snug break-words">
                                  {dose.medicine.name}
                                </h4>
                                <span className="font-mono-tabular text-sm font-semibold text-slate-900 whitespace-nowrap shrink-0">
                                  {formatDisplayTime(dose.reminder.time, settings.language)}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-600">
                                {dose.medicine.dosage} · {getTypeLabel(settings.language, dose.medicine.type)}
                                {dose.medicine.mealInstruction !== 'none'
                                  ? ` · ${getMealLabel(settings.language, dose.medicine.mealInstruction)}`
                                  : ''}
                              </p>

                              {/* Status line (Icon + Text label, never color alone) */}
                              <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
                                {isDone && (
                                  <span className="inline-flex items-center gap-1.5 text-[#15803D]">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    {t.dashboard.taken}
                                  </span>
                                )}
                                {isMissed && (
                                  <span className="inline-flex items-center gap-1.5 text-red-700">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {t.dashboard.missed}
                                  </span>
                                )}
                                {isSkipped && (
                                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                                    <XCircle className="w-4 h-4 shrink-0" />
                                    {t.dashboard.skipped}
                                  </span>
                                )}
                                {isSnoozed && (
                                  <span className="inline-flex items-center gap-1.5 text-amber-800">
                                    <AlarmClock className="w-4 h-4 shrink-0" />
                                    {getRelativeCountdown(dose)}
                                  </span>
                                )}
                                {dose.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    {t.dashboard.pending}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                            {isDone || isSkipped ? (
                              <button
                                type="button"
                                onClick={() => onUndoDose(dose)}
                                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                                <span>{t.dashboard.undo}</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onMarkTaken(dose)}
                                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#0A645B] transition-colors whitespace-nowrap"
                                >
                                  <Check className="w-4 h-4 shrink-0" />
                                  <span>{t.dashboard.markTaken}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onSnooze(dose)}
                                  className="min-h-[44px] px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold hover:bg-amber-100 transition-colors whitespace-nowrap"
                                >
                                  {t.dashboard.snooze}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onMarkSkipped(dose)}
                                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
                                >
                                  {t.dashboard.skip}
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Expandable Active Medicines Management Section */}
      {showManageList && medicines.length > 0 && (
        <section className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {t.dashboard.myMedicinesCount.replace('{count}', String(medicines.length))}
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {medicines.map((med) => (
              <div key={med.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <MedicineVisual type={med.type} name={med.name} photoUrl={med.photoUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{med.name}</p>
                    <p className="text-sm text-slate-600 truncate">
                      {med.dosage} · {med.reminders.map((r) => formatDisplayTime(r.time, settings.language)).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditMedicine(med)}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>{t.dashboard.edit}</span>
                  </button>
                  {confirmDeleteId === med.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMedicine(med.id);
                        setConfirmDeleteId(null);
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-700 text-white text-sm font-semibold hover:bg-red-800"
                    >
                      {t.dashboard.delete}?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(med.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-red-700 hover:bg-red-50"
                      aria-label={t.dashboard.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
