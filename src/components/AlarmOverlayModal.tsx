import React, { useEffect } from 'react';
import { AlarmClock, BellRing, Check, Clock, X } from 'lucide-react';
import { ActiveAlarmPayload, AppSettings } from '../types/medicine';
import { getMealLabel, getSlotLabel, getTranslations, getTypeLabel } from '../i18n/translations';
import { formatDisplayTime } from '../services/scheduleEngine';
import { startAlarmRinging, stopAlarmRinging } from '../services/alarmAudio';
import { MedicineVisual } from './MedicineIconBadge';

interface AlarmOverlayModalProps {
  alarm: ActiveAlarmPayload | null;
  settings: AppSettings;
  onTaken: (alarm: ActiveAlarmPayload) => void;
  onSnooze: (alarm: ActiveAlarmPayload) => void;
  onSkip: (alarm: ActiveAlarmPayload) => void;
  onDismissTest: () => void;
}

export const AlarmOverlayModal: React.FC<AlarmOverlayModalProps> = ({
  alarm,
  settings,
  onTaken,
  onSnooze,
  onSkip,
  onDismissTest,
}) => {
  const t = getTranslations(settings.language);

  useEffect(() => {
    if (!alarm) {
      stopAlarmRinging();
      return;
    }

    startAlarmRinging(settings.alarmTone, settings.soundEnabled, settings.vibrationEnabled);
    return () => {
      stopAlarmRinging();
    };
  }, [alarm, settings.alarmTone, settings.soundEnabled, settings.vibrationEnabled]);

  if (!alarm) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-medicine-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-[#0D7A6F] text-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-6 h-6 shrink-0" />
              <span className="text-base font-semibold tracking-tight">
                {alarm.isTest ? t.alarm.testBadge : t.alarm.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopAlarmRinging();
                if (alarm.isTest) onDismissTest();
                else onSnooze(alarm);
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white/90 hover:bg-white/15 transition-colors"
              aria-label={t.alarm.dismissBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-teal-100 font-mono-tabular">
            {t.alarm.scheduledFor.replace('{time}', formatDisplayTime(alarm.scheduledTime, settings.language))} ·{' '}
            {getSlotLabel(settings.language, alarm.slot)}
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <MedicineVisual
              type={alarm.medicineType}
              name={alarm.medicineName}
              photoUrl={alarm.photoUrl}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <h2
                id="alarm-medicine-title"
                className="text-2xl font-bold text-slate-900 leading-tight break-words"
              >
                {alarm.medicineName}
              </h2>
              <p className="mt-1.5 text-lg font-semibold text-[#0D7A6F]">{alarm.dosage}</p>
              <p className="mt-1 text-sm text-slate-600">
                {getTypeLabel(settings.language, alarm.medicineType)}
                {alarm.mealInstruction !== 'none' ? ` · ${getMealLabel(settings.language, alarm.mealInstruction)}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={() => {
                stopAlarmRinging();
                onTaken(alarm);
              }}
              className="w-full min-h-[56px] px-5 py-3.5 rounded-2xl bg-[#15803D] text-white text-lg font-bold flex items-center justify-center gap-2.5 hover:bg-[#166534] active:scale-[0.99] transition-all"
            >
              <Check className="w-6 h-6 shrink-0" />
              <span>{t.alarm.takenBtn}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  stopAlarmRinging();
                  onSnooze(alarm);
                }}
                className="min-h-[52px] px-4 py-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-base font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 active:scale-[0.99] transition-all"
              >
                <AlarmClock className="w-5 h-5 shrink-0" />
                <span className="truncate">
                  {t.alarm.snoozeBtn.replace('{min}', String(settings.snoozeMinutes))}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopAlarmRinging();
                  onSkip(alarm);
                }}
                className="min-h-[52px] px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-base font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-[0.99] transition-all"
              >
                <Clock className="w-5 h-5 shrink-0" />
                <span>{t.alarm.skipBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
