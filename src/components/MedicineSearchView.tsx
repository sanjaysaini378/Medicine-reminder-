import React, { useMemo, useState } from 'react';
import { Globe, Info, Plus, Search, X } from 'lucide-react';
import { AppSettings, MedicineCatalogItem, MedicineType } from '../types/medicine';
import { MEDICINE_CATALOG, searchOpenFDA } from '../data/medicineCatalog';
import { getTranslations, getTypeLabel } from '../i18n/translations';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { MedicineVisual } from './MedicineIconBadge';

interface MedicineSearchViewProps {
  settings: AppSettings;
  onAddFromCatalog: (item: { name: string; type: MedicineType; dosage: string; notes?: string }) => void;
}

export const MedicineSearchView: React.FC<MedicineSearchViewProps> = ({
  settings,
  onAddFromCatalog,
}) => {
  const t = getTranslations(settings.language);
  const isOnline = useOnlineStatus();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MedicineType>('all');
  const [fdaResults, setFdaResults] = useState<MedicineCatalogItem[]>([]);
  const [searchingFda, setSearchingFda] = useState(false);
  const [fdaSearchedQuery, setFdaSearchedQuery] = useState('');

  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICINE_CATALOG.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.genericName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.categoryHi.toLowerCase().includes(q) ||
        item.commonBrands.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [query, typeFilter]);

  const combinedResults = useMemo(() => {
    const seen = new Set(localResults.map((i) => i.name.toLowerCase()));
    const merged = [...localResults];
    for (const fda of fdaResults) {
      if (typeFilter !== 'all' && fda.type !== typeFilter) continue;
      if (!seen.has(fda.name.toLowerCase())) {
        merged.push(fda);
      }
    }
    return merged;
  }, [localResults, fdaResults, typeFilter]);

  const handleOpenFDASearch = async () => {
    if (!query.trim() || !isOnline) return;
    setSearchingFda(true);
    try {
      const results = await searchOpenFDA(query);
      setFdaResults(results);
      setFdaSearchedQuery(query.trim());
    } catch {
      setFdaResults([]);
    } finally {
      setSearchingFda(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t.search.title}</h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">{t.search.subtitle}</p>
      </div>

      {/* Honest Medical Reference Disclaimer */}
      <div className="rounded-2xl bg-slate-100/90 border border-slate-200 px-4 py-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed">{t.search.disclaimer}</p>
      </div>

      {/* Search Bar & Type Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setFdaResults([]);
                  setFdaSearchedQuery('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim().length >= 2 && isOnline) {
                  handleOpenFDASearch();
                }
              }}
              placeholder={t.search.placeholder}
              className="w-full min-h-[50px] pl-12 pr-11 py-3 rounded-2xl border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0D7A6F] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setFdaResults([]);
                  setFdaSearchedQuery('');
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {query.trim().length >= 2 && isOnline && (
            <button
              type="button"
              onClick={handleOpenFDASearch}
              disabled={searchingFda}
              className="min-h-[50px] px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Globe className="w-4 h-4 text-[#0D7A6F]" />
              <span>{searchingFda ? t.search.searchingOnline : t.search.searchOnline}</span>
            </button>
          )}
        </div>

        {/* Interactive Form Type Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          {(['all', 'tablet', 'capsule', 'syrup', 'injection', 'other'] as const).map((filterOpt) => (
            <button
              key={filterOpt}
              type="button"
              onClick={() => setTypeFilter(filterOpt)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                typeFilter === filterOpt
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filterOpt === 'all' ? t.history.filterAll : getTypeLabel(settings.language, filterOpt)}
            </button>
          ))}
        </div>

        {!isOnline && (
          <p className="text-xs font-medium text-amber-800">{t.search.offlineNotice}</p>
        )}
      </div>

      {/* Results List */}
      {combinedResults.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-600 tabular-nums">
              {t.search.resultsCount.replace('{count}', String(combinedResults.length))}
            </p>
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onAddFromCatalog({
                    name: query.trim(),
                    type: typeFilter === 'all' ? 'tablet' : typeFilter,
                    dosage: '1 Tablet',
                  })
                }
                className="min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-semibold text-[#0D7A6F] hover:bg-teal-50 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{t.search.addManually}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combinedResults.map((item) => {
              const isHi = settings.language === 'hi';
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <MedicineVisual type={item.type} name={item.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-slate-900 leading-snug">{item.name}</h2>
                        <p className="mt-0.5 text-sm font-medium text-slate-600">
                          {isHi ? item.categoryHi : item.category} ·{' '}
                          {getTypeLabel(settings.language, item.type)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.source === 'openfda' ? t.search.fdaBadge : t.search.curatedBadge}
                        </p>
                      </div>
                    </div>

                    <dl className="space-y-1.5 text-sm">
                      <div>
                        <dt className="inline font-semibold text-slate-800">{t.search.genericLabel}: </dt>
                        <dd className="inline text-slate-600">{item.genericName}</dd>
                      </div>
                      {item.commonBrands.length > 0 && (
                        <div>
                          <dt className="inline font-semibold text-slate-800">{t.search.brandsLabel}: </dt>
                          <dd className="inline text-slate-600">{item.commonBrands.join(', ')}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="inline font-semibold text-slate-800">{t.search.typicalFormLabel}: </dt>
                        <dd className="inline text-slate-600">{item.typicalDosage}</dd>
                      </div>
                    </dl>

                    <p className="text-sm text-slate-700 leading-relaxed">
                      {isHi ? item.generalInfoHi : item.generalInfo}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                      <strong className="text-slate-800">{t.search.usageTipLabel}: </strong>
                      {isHi ? item.administrationTipHi : item.administrationTip}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onAddFromCatalog({
                        name: item.name,
                        type: item.type,
                        dosage: item.typicalDosage,
                        notes: isHi ? item.administrationTipHi : item.administrationTip,
                      })
                    }
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#0A645B] transition-colors"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{t.search.addToSchedule}</span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200/90 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">{t.search.notFoundTitle}</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {t.search.notFoundSubtitle.replace('{query}', query.trim() || '...')}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isOnline && query.trim().length >= 2 && fdaSearchedQuery !== query.trim() && (
              <button
                type="button"
                onClick={handleOpenFDASearch}
                disabled={searchingFda}
                className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-50"
              >
                <Globe className="w-4 h-4 text-[#0D7A6F]" />
                <span>{searchingFda ? t.search.searchingOnline : t.search.searchOnline}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onAddFromCatalog({
                  name: query.trim(),
                  type: typeFilter === 'all' ? 'tablet' : typeFilter,
                  dosage: '1 Tablet',
                })
              }
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#0D7A6F] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#0A645B]"
            >
              <Plus className="w-5 h-5" />
              <span>{t.search.addManually}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
