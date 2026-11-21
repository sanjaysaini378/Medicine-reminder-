import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock, PlusCircle, Search, Settings } from 'lucide-react';
import {
  ActiveAlarmPayload,
  AppSettings,
  IntakeLog,
  Medicine,
  MedicineType,
  ScheduledDoseInstance,
} from './types/medicine';
import { getTranslations } from './i18n/translations';
import {
  buildBackupPayload,
  createSampleSchedule,
  DEFAULT_SETTINGS,
  loadAppData,
  parseBackupPayload,
  saveLogs,
  saveMedicines,
  saveSettings,
} from './services/storage';
import { formatDateKey, getScheduleForDate } from './services/scheduleEngine';
import {
  AlarmPermissionStatus,
  dispatchSystemNotification,
  drainNativeNotificationActions,
  getAlarmPermissions,
  requestExactAlarmAccess,
  requestNotificationAccess,
  scheduleNativeSnooze,
  stopNativeAlarm,
  syncNativeAndroidAlarms,
} from './services/nativeAlarmBridge';
import { DashboardView } from './components/DashboardView';
import { AddMedicineView } from './components/AddMedicineView';
import { MedicineSearchView } from './components/MedicineSearchView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AlarmOverlayModal } from './components/AlarmOverlayModal';

type TabKey = 'dashboard' | 'add' | 'search' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [loaded, setLoaded] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [now, setNow] = useState<Date>(() => new Date());

  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [addPrefill, setAddPrefill] = useState<{
    name?: string;
    type?: MedicineType;
    dosage?: string;
    notes?: string;
  } | null>(null);

  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarmPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<AlarmPermissionStatus>({
    isNativeAndroid: false,
    notifications: 'prompt',
    exactAlarm: 'prompt',
    bootReceiverActive: false,
  });

  const firedAlarmsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  const t = getTranslations(settings.language);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  // Load persisted data from IndexedDB/localStorage and check permissions on startup
  useEffect(() => {
    let active = true;
    (async () => {
      const data = await loadAppData();
      const perms = await getAlarmPermissions();
      const nativeActions = await drainNativeNotificationActions();

      if (!active) return;

      let mergedLogs = [...data.logs];
      if (nativeActions.length > 0) {
        const logMap = new Map(mergedLogs.map((l) => [l.id, l]));
        for (const act of nativeActions) {
          const id = `${act.medicineId}_${act.date}_${act.reminderId}`;
          logMap.set(id, {
            id,
            medicineId: act.medicineId,
            medicineName: act.medicineName,
            medicineType: act.medicineType,
            dosage: act.dosage,
            date: act.date,
            reminderId: act.reminderId,
            slot: act.slot,
            scheduledTime: act.scheduledTime,
            status: act.action,
            actionAt: act.actionAt,
            snoozeUntil: act.snoozeUntil,
          });
        }
        mergedLogs = Array.from(logMap.values());
        await saveLogs(mergedLogs);
      }

      setMedicines(data.medicines);
      setLogs(mergedLogs);
      setSettings(data.settings);
      setPermissions(perms);
      setLoaded(true);

      // Keep native Android AlarmManager schedules synced
      syncNativeAndroidAlarms(data.medicines, data.settings).catch(() => {});
    })();

    return () => {
      active = false;
    };
  }, []);

  // Apply text scale attribute & language to documentElement
  useEffect(() => {
    document.documentElement.setAttribute('data-text-scale', settings.textScale);
    document.documentElement.lang = settings.language;
  }, [settings.textScale, settings.language]);

  // Keep current clock updated and sync native shade actions when app resumes foreground
  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(new Date());
    }, 15000);

    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
        const perms = await getAlarmPermissions();
        setPermissions(perms);
        const actions = await drainNativeNotificationActions();
        if (actions.length > 0) {
          setLogs((prev) => {
            const map = new Map(prev.map((l) => [l.id, l]));
            for (const act of actions) {
              const id = `${act.medicineId}_${act.date}_${act.reminderId}`;
              map.set(id, {
                id,
                medicineId: act.medicineId,
                medicineName: act.medicineName,
                medicineType: act.medicineType,
                dosage: act.dosage,
                date: act.date,
                reminderId: act.reminderId,
                slot: act.slot,
                scheduledTime: act.scheduledTime,
                status: act.action,
                actionAt: act.actionAt,
                snoozeUntil: act.snoozeUntil,
              });
            }
            const next = Array.from(map.values());
            saveLogs(next).catch(() => {});
            return next;
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Active foreground schedule monitor (complements native Android AlarmManager / BootCompletedReceiver)
  const todayKey = formatDateKey(now);
  const todaySchedule = useMemo(
    () => getScheduleForDate(medicines, logs, todayKey, now),
    [medicines, logs, todayKey, now]
  );

  const selectedDateSchedule = useMemo(
    () => getScheduleForDate(medicines, logs, selectedDate, now),
    [medicines, logs, selectedDate, now]
  );

  useEffect(() => {
    if (!loaded || activeAlarm) return;
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const dose of todaySchedule) {
      if (dose.status === 'taken' || dose.status === 'skipped') continue;

      let shouldFire = false;
      let fireToken = `${dose.key}_${currentHHMM}`;

      if (dose.status === 'snoozed' && dose.snoozeUntil) {
        const snoozeTime = new Date(dose.snoozeUntil);
        if (now.getTime() >= snoozeTime.getTime()) {
          shouldFire = true;
          fireToken = `${dose.key}_snooze_${dose.snoozeUntil}`;
        }
      } else if (dose.status === 'pending' && dose.reminder.time === currentHHMM) {
        shouldFire = true;
      }

      if (shouldFire && !firedAlarmsRef.current.has(fireToken)) {
        firedAlarmsRef.current.add(fireToken);
        const payload: ActiveAlarmPayload = {
          key: dose.key,
          medicineId: dose.medicine.id,
          medicineName: dose.medicine.name,
          medicineType: dose.medicine.type,
          dosage: dose.medicine.dosage,
          photoUrl: dose.medicine.photoUrl,
          mealInstruction: dose.medicine.mealInstruction,
          reminderId: dose.reminder.id,
          slot: dose.reminder.slot,
          scheduledTime: dose.reminder.time,
          date: dose.date,
        };
        setActiveAlarm(payload);
        dispatchSystemNotification(payload, t.alarm.title).catch(() => {});
        break;
      }
    }
  }, [loaded, activeAlarm, todaySchedule, now, t.alarm.title]);

  // Persistence helpers
  const persistMedicines = useCallback(
    (nextMeds: Medicine[]) => {
      setMedicines(nextMeds);
      saveMedicines(nextMeds).catch(() => {});
      syncNativeAndroidAlarms(nextMeds, settings).catch(() => {});
    },
    [settings]
  );

  const persistLogs = useCallback((nextLogs: IntakeLog[]) => {
    setLogs(nextLogs);
    saveLogs(nextLogs).catch(() => {});
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        saveSettings(next).catch(() => {});
        syncNativeAndroidAlarms(medicines, next).catch(() => {});
        return next;
      });
    },
    [medicines]
  );

  // Dose actions
  const recordDoseStatus = useCallback(
    (
      dose: {
        key: string;
        medicineId: string;
        medicineName: string;
        medicineType: MedicineType;
        dosage: string;
        date: string;
        reminderId: string;
        slot: IntakeLog['slot'];
        scheduledTime: string;
      },
      status: IntakeLog['status'],
      snoozeUntil?: string
    ) => {
      const entry: IntakeLog = {
        id: dose.key,
        medicineId: dose.medicineId,
        medicineName: dose.medicineName,
        medicineType: dose.medicineType,
        dosage: dose.dosage,
        date: dose.date,
        reminderId: dose.reminderId,
        slot: dose.slot,
        scheduledTime: dose.scheduledTime,
        status,
        actionAt: new Date().toISOString(),
        snoozeUntil,
      };
      const filtered = logs.filter((l) => l.id !== dose.key);
      persistLogs([entry, ...filtered]);
    },
    [logs, persistLogs]
  );

  const handleMarkTaken = useCallback(
    (dose: ScheduledDoseInstance) => {
      recordDoseStatus(
        {
          key: dose.key,
          medicineId: dose.medicine.id,
          medicineName: dose.medicine.name,
          medicineType: dose.medicine.type,
          dosage: dose.medicine.dosage,
          date: dose.date,
          reminderId: dose.reminder.id,
          slot: dose.reminder.slot,
          scheduledTime: dose.reminder.time,
        },
        'taken'
      );
      stopNativeAlarm().catch(() => {});
    },
    [recordDoseStatus]
  );

  const handleMarkSkipped = useCallback(
    (dose: ScheduledDoseInstance) => {
      recordDoseStatus(
        {
          key: dose.key,
          medicineId: dose.medicine.id,
          medicineName: dose.medicine.name,
          medicineType: dose.medicine.type,
          dosage: dose.medicine.dosage,
          date: dose.date,
          reminderId: dose.reminder.id,
          slot: dose.reminder.slot,
          scheduledTime: dose.reminder.time,
        },
        'skipped'
      );
      stopNativeAlarm().catch(() => {});
    },
    [recordDoseStatus]
  );

  const handleSnoozeDose = useCallback(
    (dose: ScheduledDoseInstance) => {
      const snoozeUntil = new Date(Date.now() + settings.snoozeMinutes * 60000).toISOString();
      recordDoseStatus(
        {
          key: dose.key,
          medicineId: dose.medicine.id,
          medicineName: dose.medicine.name,
          medicineType: dose.medicine.type,
          dosage: dose.medicine.dosage,
          date: dose.date,
          reminderId: dose.reminder.id,
          slot: dose.reminder.slot,
          scheduledTime: dose.reminder.time,
        },
        'snoozed',
        snoozeUntil
      );
      scheduleNativeSnooze(
        {
          key: dose.key,
          medicineId: dose.medicine.id,
          medicineName: dose.medicine.name,
          medicineType: dose.medicine.type,
          dosage: dose.medicine.dosage,
          photoUrl: dose.medicine.photoUrl,
          mealInstruction: dose.medicine.mealInstruction,
          reminderId: dose.reminder.id,
          slot: dose.reminder.slot,
          scheduledTime: dose.reminder.time,
          date: dose.date,
        },
        settings.snoozeMinutes
      ).catch(() => {});
    },
    [recordDoseStatus, settings.snoozeMinutes]
  );

  const handleUndoDose = useCallback(
    (dose: ScheduledDoseInstance) => {
      persistLogs(logs.filter((l) => l.id !== dose.key));
    },
    [logs, persistLogs]
  );

  // Medicine CRUD
  const handleSaveMedicine = (med: Medicine) => {
    const exists = medicines.some((m) => m.id === med.id);
    const next = exists ? medicines.map((m) => (m.id === med.id ? med : m)) : [med, ...medicines];
    persistMedicines(next);
    setEditingMedicine(null);
    setAddPrefill(null);
    setActiveTab('dashboard');
    showToast(t.addForm.savedSuccess);
  };

  const handleDeleteMedicine = (medicineId: string) => {
    persistMedicines(medicines.filter((m) => m.id !== medicineId));
  };

  // Alarm Modal Handlers
  const handleAlarmTaken = (alarm: ActiveAlarmPayload) => {
    if (!alarm.isTest) {
      recordDoseStatus(alarm, 'taken');
    }
    stopNativeAlarm().catch(() => {});
    setActiveAlarm(null);
  };

  const handleAlarmSnooze = (alarm: ActiveAlarmPayload) => {
    if (!alarm.isTest) {
      const snoozeUntil = new Date(Date.now() + settings.snoozeMinutes * 60000).toISOString();
      recordDoseStatus(alarm, 'snoozed', snoozeUntil);
      scheduleNativeSnooze(alarm, settings.snoozeMinutes).catch(() => {});
    }
    stopNativeAlarm().catch(() => {});
    setActiveAlarm(null);
  };

  const handleAlarmSkip = (alarm: ActiveAlarmPayload) => {
    if (!alarm.isTest) {
      recordDoseStatus(alarm, 'skipped');
    }
    stopNativeAlarm().catch(() => {});
    setActiveAlarm(null);
  };

  const handleTestAlarmFromSettings = () => {
    const sampleMed = medicines[0];
    const payload: ActiveAlarmPayload = {
      key: `test_${Date.now()}`,
      medicineId: sampleMed?.id ?? 'test-med',
      medicineName: sampleMed?.name ?? 'Paracetamol 500 mg',
      medicineType: sampleMed?.type ?? 'tablet',
      dosage: sampleMed?.dosage ?? '1 Tablet (500 mg)',
      photoUrl: sampleMed?.photoUrl,
      mealInstruction: sampleMed?.mealInstruction ?? 'after_food',
      reminderId: sampleMed?.reminders[0]?.id ?? 'test-rem',
      slot: sampleMed?.reminders[0]?.slot ?? 'morning',
      scheduledTime:
        sampleMed?.reminders[0]?.time ??
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      date: todayKey,
      isTest: true,
    };
    setActiveAlarm(payload);
    dispatchSystemNotification(payload, t.alarm.testBadge).catch(() => {});
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const payload = buildBackupPayload(medicines, logs, settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicine-reminder-backup-${todayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (fileText: string) => {
    const parsed = parseBackupPayload(fileText);
    if (!parsed) return { ok: false };
    persistMedicines(parsed.medicines);
    persistLogs(parsed.logs);
    updateSettings(parsed.settings);
    return { ok: true, meds: parsed.medicines.length, logs: parsed.logs.length };
  };

  const handleLoadSample = () => {
    const sample = createSampleSchedule();
    persistMedicines(sample.medicines);
    persistLogs(sample.logs);
    setActiveTab('dashboard');
    setSelectedDate(todayKey);
  };

  const handleClearAll = () => {
    persistMedicines([]);
    persistLogs([]);
    setActiveTab('dashboard');
  };

  const navItems: Array<{ id: TabKey; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'add', label: t.nav.add, icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'search', label: t.nav.search, icon: <Search className="w-5 h-5" /> },
    { id: 'history', label: t.nav.history, icon: <Clock className="w-5 h-5" /> },
    { id: 'settings', label: t.nav.settings, icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTabSelect = (tab: TabKey) => {
    if (tab === 'add' && activeTab !== 'add') {
      setEditingMedicine(null);
      setAddPrefill(null);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FA] text-[#0F172A]">
      {/* Desktop 3-Zone Top Bar & Mobile Static Header (keeps mobile fixed chrome < 10%) */}
      <header className="bg-white border-b border-slate-200/90 md:sticky md:top-0 md:z-30 pt-safe">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleTabSelect('dashboard')}
            className="text-xl font-bold tracking-tight text-[#0D7A6F] whitespace-nowrap shrink-0 text-left"
          >
            {t.appName}
          </button>

          {/* Zone 2: Clean single-line text navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSelect(item.id)}
                  className={`min-h-[44px] px-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'text-[#0D7A6F] border-[#0D7A6F]'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingMedicine(null);
                setAddPrefill(null);
                setActiveTab('add');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0A645B] transition-colors whitespace-nowrap shrink-0"
            >
              {t.dashboard.addMedicineCta}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-10">
        {!loaded ? (
          <div className="py-20 text-center text-sm font-medium text-slate-500">Loading...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                medicines={medicines}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                schedule={selectedDateSchedule}
                settings={settings}
                now={now}
                onMarkTaken={handleMarkTaken}
                onMarkSkipped={handleMarkSkipped}
                onSnooze={handleSnoozeDose}
                onUndoDose={handleUndoDose}
                onAddNew={() => {
                  setEditingMedicine(null);
                  setAddPrefill(null);
                  setActiveTab('add');
                }}
                onEditMedicine={(med) => {
                  setEditingMedicine(med);
                  setAddPrefill(null);
                  setActiveTab('add');
                }}
                onDeleteMedicine={handleDeleteMedicine}
                onTriggerTestAlarm={(payload) => {
                  setActiveAlarm(payload);
                  dispatchSystemNotification(payload, t.alarm.testBadge).catch(() => {});
                }}
              />
            )}

            {activeTab === 'add' && (
              <AddMedicineView
                key={editingMedicine?.id || addPrefill?.name || 'new'}
                settings={settings}
                editingMedicine={editingMedicine}
                prefill={addPrefill}
                onSave={handleSaveMedicine}
                onCancel={() => {
                  setEditingMedicine(null);
                  setAddPrefill(null);
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'search' && (
              <MedicineSearchView
                settings={settings}
                onAddFromCatalog={(item) => {
                  setEditingMedicine(null);
                  setAddPrefill(item);
                  setActiveTab('add');
                }}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                medicines={medicines}
                logs={logs}
                settings={settings}
                now={now}
                onMarkTaken={handleMarkTaken}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                permissions={permissions}
                onUpdateSettings={updateSettings}
                onRequestNotifications={async () => {
                  const res = await requestNotificationAccess();
                  setPermissions((prev) => ({
                    ...prev,
                    notifications: res,
                    exactAlarm: prev.isNativeAndroid ? prev.exactAlarm : res,
                  }));
                }}
                onRequestExactAlarm={async () => {
                  await requestExactAlarmAccess();
                  const perms = await getAlarmPermissions();
                  setPermissions(perms);
                }}
                onTestAlarm={handleTestAlarmFromSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onLoadSample={handleLoadSample}
                onClearAll={handleClearAll}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Tab Navigation on Mobile (< 768px) — 64px height (< 10% viewport) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabSelect(item.id)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                  active ? 'text-[#0D7A6F] font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                {item.icon}
                <span className="text-[11px] leading-none truncate max-w-[64px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-lg whitespace-nowrap"
        >
          {toast}
        </div>
      )}

      {/* Full-Screen Alarm Overlay */}
      <AlarmOverlayModal
        alarm={activeAlarm}
        settings={settings}
        onTaken={handleAlarmTaken}
        onSnooze={handleAlarmSnooze}
        onSkip={handleAlarmSkip}
        onDismissTest={() => setActiveAlarm(null)}
      />
    </div>
  );
}
