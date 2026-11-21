import React, { useMemo, useRef, useState } from 'react';
import { Camera, Check, Plus, Trash2, X } from 'lucide-react';
import {
  AppSettings,
  MealInstruction,
  Medicine,
  MedicineType,
  ReminderTimeItem,
  RepeatType,
  TimeOfDaySlot,
} from '../types/medicine';
import { getSlotLabel, getTranslations, getTypeLabel } from '../i18n/translations';
import { formatDateKey, inferSlotFromTime } from '../services/scheduleEngine';
import { compressImageFile } from '../services/storage';
import { MEDICINE_CATALOG } from '../data/medicineCatalog';
import { MedicineTypeIcon, MedicineVisual } from './MedicineIconBadge';

interface AddMedicineViewProps {
  settings: AppSettings;
  editingMedicine?: Medicine | null;
  prefill?: {
    name?: string;
    type?: MedicineType;
    dosage?: string;
    notes?: string;
  } | null;
  onSave: (medicine: Medicine) => void;
  onCancel: () => void;
}

const MEDICINE_TYPES: MedicineType[] = ['tablet', 'capsule', 'syrup', 'injection', 'other'];

const SLOT_DEFAULTS: Record<TimeOfDaySlot, string> = {
  morning: '08:00',
  afternoon: '13:00',
  evening: '18:00',
  night: '21:30',
};

const DOSAGE_PRESETS: Record<MedicineType, string[]> = {
  tablet: ['1 Tablet', '1/2 Tablet', '2 Tablets', '500 mg'],
  capsule: ['1 Capsule', '2 Capsules', '500 mg'],
  syrup: ['5 ml', '10 ml', '15 ml'],
  injection: ['10 Units', '1 Injection', '0.5 ml'],
  other: ['1 Drop', '2 Puffs', '1 Sachet'],
};

const MEAL_OPTIONS: MealInstruction[] = ['none', 'before_food', 'after_food', 'with_food'];

export const AddMedicineView: React.FC<AddMedicineViewProps> = ({
  settings,
  editingMedicine,
  prefill,
  onSave,
  onCancel,
}) => {
  const t = getTranslations(settings.language);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(editingMedicine?.name ?? prefill?.name ?? '');
  const [type, setType] = useState<MedicineType>(editingMedicine?.type ?? prefill?.type ?? 'tablet');
  const [dosage, setDosage] = useState(editingMedicine?.dosage ?? prefill?.dosage ?? '1 Tablet');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(editingMedicine?.photoUrl);
  const [startDate, setStartDate] = useState(editingMedicine?.startDate ?? formatDateKey(new Date()));
  const [ongoing, setOngoing] = useState(!editingMedicine?.endDate);
  const [endDate, setEndDate] = useState(
    editingMedicine?.endDate ?? formatDateKey(new Date(Date.now() + 14 * 86400000))
  );
  const [repeatType, setRepeatType] = useState<RepeatType>(editingMedicine?.repeatType ?? 'daily');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editingMedicine?.selectedDays ?? [0, 1, 2, 3, 4, 5, 6]
  );
  const [reminders, setReminders] = useState<ReminderTimeItem[]>(
    editingMedicine?.reminders ?? [{ id: `rem-${Date.now()}`, slot: 'morning', time: '08:00' }]
  );
  const [mealInstruction, setMealInstruction] = useState<MealInstruction>(
    editingMedicine?.mealInstruction ?? 'after_food'
  );
  const [notes, setNotes] = useState(editingMedicine?.notes ?? prefill?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const nameSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 2) return [];
    return MEDICINE_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.commonBrands.some((b) => b.toLowerCase().includes(q))
    ).slice(0, 4);
  }, [name]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 480);
      setPhotoUrl(compressed);
    } catch {
      setError('Could not load selected photo.');
    }
  };

  const toggleSlot = (slot: TimeOfDaySlot) => {
    const exists = reminders.some((r) => r.slot === slot);
    if (exists) {
      setReminders((prev) => prev.filter((r) => r.slot !== slot));
    } else {
      setReminders((prev) => [
        ...prev,
        { id: `rem-${slot}-${Date.now()}`, slot, time: SLOT_DEFAULTS[slot] },
      ]);
    }
  };

  const updateReminderTime = (id: string, newTime: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, time: newTime, slot: inferSlotFromTime(newTime) } : r))
    );
  };

  const addCustomReminder = () => {
    setReminders((prev) => [
      ...prev,
      { id: `rem-custom-${Date.now()}`, slot: 'morning', time: '09:00' },
    ]);
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleWeekday = (dayIdx: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t.addForm.validationName);
      return;
    }
    if (!dosage.trim()) {
      setError(t.addForm.validationDosage);
      return;
    }
    if (reminders.length === 0) {
      setError(t.addForm.validationTime);
      return;
    }
    if (repeatType === 'selected_days' && selectedDays.length === 0) {
      setError(t.addForm.validationDays);
      return;
    }
    if (!ongoing && endDate < startDate) {
      setError(t.addForm.validationDates);
      return;
    }

    const medicine: Medicine = {
      id: editingMedicine?.id ?? `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      type,
      dosage: dosage.trim(),
      photoUrl,
      startDate,
      endDate: ongoing ? undefined : endDate,
      repeatType,
      selectedDays: repeatType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedDays,
      reminders: [...reminders].sort((a, b) => a.time.localeCompare(b.time)),
      mealInstruction,
      notes: notes.trim() || undefined,
      active: true,
      createdAt: editingMedicine?.createdAt ?? new Date().toISOString(),
    };

    onSave(medicine);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {editingMedicine ? t.addForm.titleEdit : t.addForm.titleAdd}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">{t.addForm.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label={t.addForm.cancelButton}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Medicine Details & Photo */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-5 space-y-5">
          {/* Medicine Name */}
          <div className="relative">
            <label htmlFor="med-name" className="block text-sm font-bold text-slate-900 mb-2">
              {t.addForm.nameLabel}
            </label>
            <input
              id="med-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
              placeholder={t.addForm.namePlaceholder}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0D7A6F] focus:outline-none"
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 z-20 rounded-xl bg-white border border-slate-200 shadow-lg divide-y divide-slate-100 overflow-hidden">
                {nameSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => {
                      setName(s.name);
                      setType(s.type);
                      setDosage(s.typicalDosage);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.genericName}</p>
                    </div>
                    <span className="text-xs font-medium text-[#0D7A6F]">{s.typicalDosage}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Medicine Type */}
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">{t.addForm.typeLabel}</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MEDICINE_TYPES.map((itemType) => {
                const active = type === itemType;
                return (
                  <button
                    key={itemType}
                    type="button"
                    onClick={() => {
                      setType(itemType);
                      if (!editingMedicine && DOSAGE_PRESETS[itemType][0]) {
                        setDosage(DOSAGE_PRESETS[itemType][0]);
                      }
                    }}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-colors ${
                      active
                        ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <MedicineTypeIcon type={itemType} className="w-4 h-4 shrink-0" />
                    <span className="truncate">{getTypeLabel(settings.language, itemType)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medicine Photo */}
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">{t.addForm.photoLabel}</span>
            <div className="flex items-center gap-4">
              <MedicineVisual type={type} name={name || type} photoUrl={photoUrl} size="lg" />
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50"
                >
                  <Camera className="w-4 h-4 text-[#0D7A6F]" />
                  <span>{t.addForm.uploadPhoto}</span>
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(undefined)}
                    className="block text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    {t.addForm.removePhoto}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dosage */}
          <div>
            <label htmlFor="med-dosage" className="block text-sm font-bold text-slate-900 mb-2">
              {t.addForm.dosageLabel}
            </label>
            <input
              id="med-dosage"
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder={t.addForm.dosagePlaceholder}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0D7A6F] focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {DOSAGE_PRESETS[type].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDosage(preset)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    dosage === preset
                      ? 'bg-teal-50 border-[#0D7A6F] text-[#0D7A6F]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Instruction & Notes */}
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">{t.addForm.mealLabel}</span>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealInstruction(m)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    mealInstruction === m
                      ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.meals[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="med-notes" className="block text-sm font-bold text-slate-900 mb-2">
              {t.addForm.notesLabel}
            </label>
            <input
              id="med-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.addForm.notesPlaceholder}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0D7A6F] focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Dates, Time Slots & Repeat */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200/90 p-5 space-y-5">
          <h2 className="text-lg font-bold text-slate-900">{t.addForm.scheduleSection}</h2>

          {/* Morning / Afternoon / Evening / Night Toggle Buttons */}
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">{t.addForm.timeSlotsLabel}</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['morning', 'afternoon', 'evening', 'night'] as TimeOfDaySlot[]).map((slot) => {
                const active = reminders.some((r) => r.slot === slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {getSlotLabel(settings.language, slot)}
                  </button>
                );
              })}
            </div>

            {/* Editable Reminder Times */}
            <div className="mt-3 space-y-2.5">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5"
                >
                  <span className="text-sm font-semibold text-slate-800 min-w-[84px]">
                    {getSlotLabel(settings.language, rem.slot)}
                  </span>
                  <input
                    type="time"
                    value={rem.time}
                    onChange={(e) => updateReminderTime(rem.id, e.target.value)}
                    className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono-tabular text-base font-semibold text-slate-900"
                  />
                  {reminders.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReminder(rem.id)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50"
                      aria-label="Remove reminder time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomReminder}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-[#0D7A6F] inline-flex items-center gap-1.5 hover:bg-teal-50/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addForm.addAnotherTime}</span>
              </button>
            </div>
          </div>

          {/* Repeat Daily or Selected Days */}
          <div>
            <span className="block text-sm font-bold text-slate-900 mb-2">{t.addForm.repeatLabel}</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRepeatType('daily')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  repeatType === 'daily'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.addForm.repeatDaily}
              </button>
              <button
                type="button"
                onClick={() => setRepeatType('selected_days')}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  repeatType === 'selected_days'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.addForm.repeatSelected}
              </button>
            </div>

            {repeatType === 'selected_days' && (
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {t.daysShort.map((dayLabel, idx) => {
                  const chosen = selectedDays.includes(idx);
                  return (
                    <button
                      key={dayLabel}
                      type="button"
                      onClick={() => toggleWeekday(idx)}
                      className={`min-h-[46px] rounded-xl border text-xs font-bold transition-colors ${
                        chosen
                          ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {dayLabel}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Start Date & End Date */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="med-start" className="block text-sm font-bold text-slate-900 mb-1.5">
                  {t.addForm.startDateLabel}
                </label>
                <input
                  id="med-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono-tabular text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="med-end" className="block text-sm font-bold text-slate-900 mb-1.5">
                  {t.addForm.endDateLabel}
                </label>
                <input
                  id="med-end"
                  type="date"
                  value={endDate}
                  disabled={ongoing}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border font-mono-tabular text-sm font-medium ${
                    ongoing
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ongoing}
                onChange={(e) => setOngoing(e.target.checked)}
                className="w-5 h-5 accent-[#0D7A6F] rounded"
              />
              <span className="text-sm font-semibold text-slate-800">{t.addForm.ongoingToggle}</span>
            </label>
          </div>

          {/* Save & Cancel */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 min-h-[52px] px-6 py-3 rounded-xl bg-[#0D7A6F] text-white text-base font-bold inline-flex items-center justify-center gap-2 hover:bg-[#0A645B] transition-colors"
            >
              <Check className="w-5 h-5 shrink-0" />
              <span>{editingMedicine ? t.addForm.updateButton : t.addForm.saveButton}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[52px] px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-base font-semibold hover:bg-slate-50 transition-colors"
            >
              {t.addForm.cancelButton}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
