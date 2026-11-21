import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types/medicine';
import { getTranslations } from '../i18n/translations';

interface PWAInstallButtonProps {
  language: Language;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language, variant = 'full' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const t = getTranslations(language);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold hover:bg-[#0A645B] transition-colors whitespace-nowrap shrink-0'
            : 'w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl bg-[#0D7A6F] text-white text-base font-semibold hover:bg-[#0A645B] transition-colors whitespace-nowrap'
        }
      >
        <Download className="w-5 h-5 shrink-0" />
        <span>{t.settings.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'compact'
              ? 'inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0'
              : 'w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-base font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap'
          }
        >
          <Smartphone className="w-5 h-5 shrink-0" />
          <span>{t.settings.installApp}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? 'होम स्क्रीन पर जोड़ें' : 'Add to Home Screen'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                  aria-label={t.settings.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-base text-slate-700 leading-relaxed list-decimal list-inside">
                <li>
                  {language === 'hi'
                    ? 'Safari के नीचे Share बटन पर टैप करें।'
                    : 'Tap the Share icon in the Safari toolbar.'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'नीचे स्क्रॉल करें और "Add to Home Screen" चुनें।'
                    : 'Scroll down and tap "Add to Home Screen".'}
                </li>
                <li>
                  {language === 'hi'
                    ? 'ऊपर दाईं ओर "Add" पर टैप करें।'
                    : 'Tap "Add" in the top-right corner.'}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[48px] rounded-xl bg-slate-900 text-white text-base font-semibold hover:bg-slate-800 transition-colors"
              >
                {t.settings.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
