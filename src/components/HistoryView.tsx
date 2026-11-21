import React, { useMemo, useState } from 'react';
import { AlertCircle, Calendar, Check, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AppSettings, IntakeLog, Medicine, ScheduledDoseInstance } from '../types/medicine';
import { getSlotLabel, getTranslations } from '../i18n/translations';
import { formatDisplayTime, getSevenDayHistory, parseDateKey } from '../services/scheduleEngine';
import { MedicineVisual } from './MedicineIconBadge';

interface HistoryViewProps {
  medicines: Medicine[];
  logs: IntakeLog[];
  settings: AppSettings;
  now: Date;
  onMarkTaken: (dose: ScheduledDoseInstance) => void;
}

type HistoryFilter = 'all' | 'taken' | 'missed' | 'skipped';

export const HistoryView: React.FC<HistoryViewProps> = ({
  medicines,
  logs,
  settings,
  now,
  onMarkTaken,
}) => {
  const t = getTranslations(settings.language);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const history = useMemo(() => getSevenDayHistory(medicines, logs, 21, now), [medicines, logs, now]);

  const filteredEntries = useMemo(() => {
    return history.entries.filter((entry) => {
      if (dateFilter && entry.date !== dateFilter) return false;
      if (filter === 'all') return true;
      return entry.status === filter;
    });
  }, [history.entries, filter, dateFilter]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ScheduledDoseInstance[]>();
    for (const entry of filteredEntries) {
      const list = map.get(entry.date) || [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries]);

  const formatHeadingDate = (dateKey: string) => {
    const d = parseDateKey(dateKey);
    return d.toLocaleDateString(settings.language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.history.title}</h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">{t.history.subtitle}</p>
      </div>

      {/* 7-Day Adherence Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs font-semibold text-slate-500">{t.history.adherenceRate}</p>
          <p className="mt-1 text-3xl font-bold text-[#0D7A6F] tabular-nums">{history.adherencePercent}%</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs font-semibold text-slate-500">{t.history.takenTotal}</p>
          <p className="mt-1 text-3xl font-bold text-[#15803D] tabular-nums">{history.takenCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs font-semibold text-slate-500">{t.history.missedTotal}</p>
          <p className="mt-1 text-3xl font-bold text-red-700 tabular-nums">{history.missedCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4">
          <p className="text-xs font-semibold text-slate-500">{t.history.skippedTotal}</p>
          <p className="mt-1 text-3xl font-bold text-slate-700 tabular-nums">{history.skippedCount}</p>
        </div>
      </section>

      {/* Filter Bar & Date Picker */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(['all', 'taken', 'missed', 'skipped'] as HistoryFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`min-h-[42px] px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key === 'all'
                ? t.history.filterAll
                : key === 'taken'
                ? t.history.filterTaken
                : key === 'missed'
                ? t.history.filterMissed
                : t.history.filterSkipped}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label={t.history.dateFilter}
              className="min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono-tabular text-sm font-medium text-slate-900"
            />
          </div>
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              {t.history.clearDate}
            </button>
          )}
        </div>
      </section>

      {/* Date-Wise History List */}
      {groupedByDate.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200/90 p-8 text-center">
          <p className="text-lg font-bold text-slate-900">{t.history.emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">{t.history.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map(([dateKey, items]) => (
            <div key={dateKey} className="space-y-2.5">
              <h2 className="text-base font-bold text-slate-900 px-1">{formatHeadingDate(dateKey)}</h2>
              <div className="rounded-2xl bg-white border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
                {items.map((item) => {
                  const loggedTime = item.log?.actionAt
                    ? new Date(item.log.actionAt).toLocaleTimeString(
                        settings.language === 'hi' ? 'hi-IN' : 'en-US',
                        { hour: 'numeric', minute: '2-digit' }
                      )
                    : null;

                  return (
                    <div
                      key={item.key}
                      className="p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <MedicineVisual
                          type={item.medicine.type}
                          name={item.medicine.name}
                          photoUrl={item.medicine.photoUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-base font-bold text-slate-900 truncate">
                            {item.medicine.name}
                          </p>
                          <p className="text-sm text-slate-600">
                            {item.medicine.dosage} ·{' '}
                            <span className="font-mono-tabular">
                              {formatDisplayTime(item.reminder.time, settings.language)}
                            </span>{' '}
                            · {getSlotLabel(settings.language, item.reminder.slot)}
                          </p>
                          {loggedTime && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {t.history.loggedAt.replace('{time}', loggedTime)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.status === 'taken' && (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
                            <CheckCircle2 className="w-4 h-4" />
                            {t.dashboard.taken}
                          </span>
                        )}
                        {item.status === 'missed' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700">
                              <AlertCircle className="w-4 h-4" />
                              {t.dashboard.missed}
                            </span>
                            <button
                              type="button"
                              onClick={() => onMarkTaken(item)}
                              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0D7A6F] text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#0A645B]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t.history.markTakenNow}</span>
                            </button>
                          </div>
                        )}
                        {item.status === 'skipped' && (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                            <XCircle className="w-4 h-4" />
                            {t.dashboard.skipped}
                          </span>
                        )}
                        {(item.status === 'pending' || item.status === 'snoozed') && (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                            <Clock className="w-4 h-4" />
                            {t.dashboard.pending}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
