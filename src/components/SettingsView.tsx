import React, { useRef, useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Download,
  Languages,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { AlarmTone, AppSettings, Language, TextScale } from '../types/medicine';
import { getTranslations } from '../i18n/translations';
import { AlarmPermissionStatus } from '../services/nativeAlarmBridge';
import { playToneOnce } from '../services/alarmAudio';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  permissions: AlarmPermissionStatus;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onRequestNotifications: () => Promise<void>;
  onRequestExactAlarm: () => Promise<void>;
  onTestAlarm: () => void;
  onExportBackup: () => void;
  onImportBackup: (fileText: string) => { ok: boolean; meds?: number; logs?: number };
  onLoadSample: () => void;
  onClearAll: () => void;
}

const SNOOZE_OPTIONS = [5, 10, 15, 30];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  permissions,
  onUpdateSettings,
  onRequestNotifications,
  onRequestExactAlarm,
  onTestAlarm,
  onExportBackup,
  onImportBackup,
  onLoadSample,
  onClearAll,
}) => {
  const t = getTranslations(settings.language);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupNotice, setBackupNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = onImportBackup(String(reader.result || ''));
      if (result.ok) {
        setBackupNotice({
          type: 'success',
          text: t.settings.restoreSuccess
            .replace('{meds}', String(result.meds ?? 0))
            .replace('{logs}', String(result.logs ?? 0)),
        });
      } else {
        setBackupNotice({ type: 'error', text: t.settings.restoreError });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const renderPermissionLabel = (state: AlarmPermissionStatus['notifications']) => {
    if (state === 'granted') {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
          <CheckCircle2 className="w-4 h-4" />
          {t.settings.permGranted}
        </span>
      );
    }
    if (state === 'denied') {
      return <span className="text-sm font-semibold text-red-700">{t.settings.permDenied}</span>;
    }
    return <span className="text-sm font-semibold text-amber-800">{t.settings.permPrompt}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.settings.title}</h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">{t.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Language & Readability */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-[#0D7A6F]" />
            <h2 className="text-lg font-bold text-slate-900">{t.settings.languageSection}</h2>
          </div>
          <p className="text-sm text-slate-600">{t.settings.languageDesc}</p>

          <div className="grid grid-cols-2 gap-2.5">
            {([
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी (Hindi)' },
            ] as Array<{ id: Language; label: string }>).map((langOpt) => (
              <button
                key={langOpt.id}
                type="button"
                onClick={() => onUpdateSettings({ language: langOpt.id })}
                className={`min-h-[50px] px-4 py-3 rounded-xl border text-base font-bold transition-colors ${
                  settings.language === langOpt.id
                    ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                {langOpt.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{t.settings.textSizeSection}</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'normal', label: t.settings.textNormal },
                { id: 'large', label: t.settings.textLarge },
                { id: 'xlarge', label: t.settings.textXLarge },
              ] as Array<{ id: TextScale; label: string }>).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ textScale: opt.id })}
                  className={`min-h-[46px] px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    settings.textScale === opt.id
                      ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sound & Notifications */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-5">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-[#0D7A6F]" />
            <h2 className="text-lg font-bold text-slate-900">{t.settings.soundSection}</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 min-h-[44px] cursor-pointer">
              <span className="text-base font-semibold text-slate-800">{t.settings.alarmSoundLabel}</span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0D7A6F]"
              />
            </label>

            <label className="flex items-center justify-between gap-4 min-h-[44px] cursor-pointer">
              <span className="text-base font-semibold text-slate-800">{t.settings.vibrationLabel}</span>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0D7A6F]"
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">{t.settings.alarmToneLabel}</span>
                <button
                  type="button"
                  onClick={() => playToneOnce(settings.alarmTone)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0D7A6F] hover:bg-teal-50 inline-flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{t.settings.previewSound}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'gentle', label: t.settings.toneGentle },
                  { id: 'bell', label: t.settings.toneBell },
                  { id: 'urgent', label: t.settings.toneUrgent },
                ] as Array<{ id: AlarmTone; label: string }>).map((toneOpt) => (
                  <button
                    key={toneOpt.id}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ alarmTone: toneOpt.id });
                      playToneOnce(toneOpt.id);
                    }}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                      settings.alarmTone === toneOpt.id
                        ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {toneOpt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-slate-900">{t.settings.snoozeDurationLabel}</span>
              <div className="grid grid-cols-4 gap-2">
                {SNOOZE_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onUpdateSettings({ snoozeMinutes: mins })}
                    className={`min-h-[44px] px-2 py-2 rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                      settings.snoozeMinutes === mins
                        ? 'bg-[#0D7A6F] border-[#0D7A6F] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t.settings.minutesShort.replace('{min}', String(mins))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Android Alarm Permissions & Testing */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0D7A6F]" />
            <h2 className="text-lg font-bold text-slate-900">{t.settings.permissionsSection}</h2>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-3 first:pt-0 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{t.settings.notificationPerm}</p>
                <div className="mt-0.5">{renderPermissionLabel(permissions.notifications)}</div>
              </div>
              {permissions.notifications !== 'granted' && (
                <button
                  type="button"
                  onClick={onRequestNotifications}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0A645B] whitespace-nowrap"
                >
                  {t.settings.requestPerm}
                </button>
              )}
            </div>

            <div className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{t.settings.exactAlarmPerm}</p>
                <div className="mt-0.5">{renderPermissionLabel(permissions.exactAlarm)}</div>
              </div>
              {permissions.isNativeAndroid && permissions.exactAlarm !== 'granted' && (
                <button
                  type="button"
                  onClick={onRequestExactAlarm}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 whitespace-nowrap"
                >
                  {t.settings.openSettings}
                </button>
              )}
            </div>

            <div className="py-3 last:pb-0">
              <p className="text-sm font-bold text-slate-900">{t.settings.bootPersistence}</p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{t.settings.bootPersistenceDesc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onTestAlarm}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <BellRing className="w-5 h-5 shrink-0" />
            <span>{t.settings.testAlarmNow}</span>
          </button>
        </section>

        {/* Backup, Restore & Android APK Export */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-5 space-y-5">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">{t.settings.backupSection}</h2>
            <p className="text-sm text-slate-600">{t.settings.backupDesc}</p>

            {backupNotice && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-semibold border ${
                  backupNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {backupNotice.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0A645B]"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t.settings.exportBackup}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleRestoreFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>{t.settings.importBackup}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onLoadSample}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{t.settings.loadSample}</span>
              </button>

              {confirmClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800"
                >
                  {t.settings.confirmClear}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.settings.clearData}</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#0D7A6F]" />
              <h3 className="text-base font-bold text-slate-900">{t.settings.androidBuildSection}</h3>
            </div>
            <p className="text-sm text-slate-600">{t.settings.androidBuildDesc}</p>
            <div className="space-y-2.5">
              <PWAInstallButton language={settings.language} variant="full" />
              <button
                type="button"
                onClick={() => setShowApkGuide(true)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                {t.settings.viewApkGuide}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Android APK Build Instructions Modal */}
      {showApkGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900">{t.settings.apkModalTitle}</h3>
              <button
                type="button"
                onClick={() => setShowApkGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label={t.settings.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              This project includes a complete Android Gradle + Capacitor project with native Kotlin{' '}
              <strong>AlarmManager</strong>, <strong>BootCompletedReceiver</strong>,{' '}
              <strong>NotificationActionReceiver</strong> (Taken / Snooze / Skip), and Android 12+/13+
              permissions.
            </p>

            <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
              <pre>{`npm install
npm run build
npx @capacitor/cli sync android
cd android && ./gradlew assembleDebug`}</pre>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Output APK path: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>. You can
              also open the <code>android/</code> folder directly in Android Studio to generate a signed
              release APK or AAB.
            </p>

            <button
              type="button"
              onClick={() => setShowApkGuide(false)}
              className="w-full min-h-[48px] rounded-xl bg-[#0D7A6F] text-white text-base font-semibold hover:bg-[#0A645B]"
            >
              {t.settings.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
