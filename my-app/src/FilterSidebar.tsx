import { useRef, useState } from 'react';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  categories: string[];
  colors: string[];
  inStockOnly: boolean;
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'rating';
}

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'name', label: 'Név szerint' },
  { value: 'price-asc', label: 'Ár (növekvő)' },
  { value: 'price-desc', label: 'Ár (csökkenő)' },
  { value: 'rating', label: 'Értékelés szerint' },
];

export const COLORS: { name: string; hex: string }[] = [
  { name: 'Fekete', hex: '#1e293b' },
  { name: 'Fehér', hex: '#f1f5f9' },
  { name: 'Szürke', hex: '#94a3b8' },
  { name: 'Ezüst', hex: '#cbd5e1' },
  { name: 'Kék', hex: '#2563eb' },
  { name: 'Zöld', hex: '#16a34a' },
];

// ── Dupla húzós range slider ─────────────────────────────────────────────────
interface DualRangeProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

function DualRangeSlider({ min, max, valueMin, valueMax, onChangeMin, onChangeMax }: DualRangeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const range = Math.max(max - min, 1);
  const step = Math.max(1, Math.floor(range / 100));

  function toPercent(v: number) {
    return ((v - min) / range) * 100;
  }

  function eventToVal(e: React.PointerEvent<HTMLDivElement>): number {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const raw = min + pct * range;
    return Math.round(raw / step) * step;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const val = eventToVal(e);
    const distMin = Math.abs(val - valueMin);
    const distMax = Math.abs(val - valueMax);
    const target: 'min' | 'max' = distMin <= distMax ? 'min' : 'max';
    setDragging(target);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    if (target === 'min') onChangeMin(Math.max(min, Math.min(val, valueMax - step)));
    else onChangeMax(Math.min(max, Math.max(val, valueMin + step)));
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const val = eventToVal(e);
    if (dragging === 'min') onChangeMin(Math.max(min, Math.min(val, valueMax - step)));
    else onChangeMax(Math.min(max, Math.max(val, valueMin + step)));
  }

  function handlePointerUp() {
    setDragging(null);
  }

  const minPct = toPercent(valueMin);
  const maxPct = toPercent(valueMax);

  return (
    <div
      ref={trackRef}
      className="relative h-5 flex items-center cursor-pointer select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute w-full h-1.5 rounded-full bg-amber-200 dark:bg-slate-600" />
      <div
        className="absolute h-1.5 rounded-full bg-amber-400 dark:bg-sky-500 pointer-events-none"
        style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
      />
      <div
        className={`absolute w-4 h-4 rounded-full bg-white border-2 border-amber-400 dark:border-sky-500 shadow-md pointer-events-none -translate-x-1/2 transition-transform ${dragging === 'min' ? 'scale-125' : ''}`}
        style={{ left: `${minPct}%` }}
      />
      <div
        className={`absolute w-4 h-4 rounded-full bg-white border-2 border-amber-400 dark:border-sky-500 shadow-md pointer-events-none -translate-x-1/2 transition-transform ${dragging === 'max' ? 'scale-125' : ''}`}
        style={{ left: `${maxPct}%` }}
      />
    </div>
  );
}

// ── Fő FilterSidebar komponens ────────────────────────────────────────────────
interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  availableCategories: string[];
  absoluteMin: number;
  absoluteMax: number;
  productCount: number;
  totalCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({
  filters,
  onChange,
  availableCategories,
  absoluteMin,
  absoluteMax,
  productCount,
  totalCount,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    update({ categories: next });
  }

  function toggleColor(color: string) {
    const next = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    update({ colors: next });
  }

  function resetAll() {
    onChange({
      priceMin: absoluteMin,
      priceMax: absoluteMax,
      categories: [],
      colors: [],
      inStockOnly: false,
      sortBy: 'name',
    });
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.colors.length > 0 ||
    filters.inStockOnly ||
    filters.priceMin > absoluteMin ||
    filters.priceMax < absoluteMax ||
    filters.sortBy !== 'name';

  const inputCls =
    'w-full px-2 py-1.5 text-sm rounded-lg border border-amber-300 dark:border-sky-600/60 bg-white dark:bg-slate-900 text-amber-950 dark:text-sky-100 focus:ring-1 focus:ring-amber-400 dark:focus:ring-sky-500 focus:outline-none';

  const sidebar = (
    <aside className="w-64 shrink-0 flex flex-col gap-4 bg-amber-50/95 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-2xl p-5 h-fit sticky top-24 shadow-lg">

      {/* Fejléc */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-amber-900 dark:text-sky-100">Szűrők</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={resetAll} className="text-xs text-amber-600 dark:text-sky-400 hover:underline">
              Törlés
            </button>
          )}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-700 dark:text-sky-300"
            aria-label="Szűrők bezárása"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-amber-600 dark:text-sky-400">{productCount} / {totalCount} találat</p>

      <hr className="border-amber-200 dark:border-slate-700" />

      {/* Ár tartomány */}
      <section>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-sky-100 mb-3">Ár tartomány</h3>

        {/* Szám mezők felül */}
        <div className="flex gap-2 items-center mb-4">
          <input
            type="number"
            min={absoluteMin}
            max={filters.priceMax - 1}
            value={filters.priceMin}
            onChange={e => {
              const v = Number(e.target.value);
              if (v < filters.priceMax) update({ priceMin: Math.max(absoluteMin, v) });
            }}
            className={inputCls}
            aria-label="Minimális ár"
          />
          <span className="text-amber-700 dark:text-sky-300 shrink-0 text-sm">–</span>
          <input
            type="number"
            min={filters.priceMin + 1}
            max={absoluteMax}
            value={filters.priceMax}
            onChange={e => {
              const v = Number(e.target.value);
              if (v > filters.priceMin) update({ priceMax: Math.min(absoluteMax, v) });
            }}
            className={inputCls}
            aria-label="Maximális ár"
          />
        </div>

        {/* Húzós slider */}
        <DualRangeSlider
          min={absoluteMin}
          max={absoluteMax}
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChangeMin={v => update({ priceMin: v })}
          onChangeMax={v => update({ priceMax: v })}
        />

        <div className="flex justify-between mt-2 text-xs text-amber-700 dark:text-sky-300 font-medium">
          <span>{filters.priceMin.toLocaleString()} Ft</span>
          <span>{filters.priceMax.toLocaleString()} Ft</span>
        </div>
      </section>

      <hr className="border-amber-200 dark:border-slate-700" />

      {/* Kategória */}
      <section>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-sky-100 mb-3">Kategória</h3>
        <div className="flex flex-col gap-2">
          {availableCategories.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded accent-amber-500 dark:accent-sky-500 cursor-pointer"
              />
              <span className="text-sm text-amber-900 dark:text-sky-100 group-hover:text-amber-600 dark:group-hover:text-sky-300 transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </section>

      <hr className="border-amber-200 dark:border-slate-700" />

      {/* Szín */}
      <section>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-sky-100 mb-3">Szín</h3>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(({ name, hex }) => (
            <button
              key={name}
              onClick={() => toggleColor(name)}
              title={name}
              aria-pressed={filters.colors.includes(name)}
              className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
                filters.colors.includes(name)
                  ? 'border-amber-500 dark:border-sky-400 scale-110 shadow-md'
                  : 'border-amber-200 dark:border-slate-600 hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {filters.colors.length > 0 && (
          <p className="mt-2 text-xs text-amber-600 dark:text-sky-400">{filters.colors.join(', ')}</p>
        )}
      </section>

      <hr className="border-amber-200 dark:border-slate-700" />

      {/* Raktáron */}
      <section>
        <button
          onClick={() => update({ inStockOnly: !filters.inStockOnly })}
          className="flex items-center gap-3 cursor-pointer w-full"
          role="switch"
          aria-checked={filters.inStockOnly}
        >
          <div className={`relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 ${filters.inStockOnly ? 'bg-amber-400 dark:bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${filters.inStockOnly ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm text-amber-900 dark:text-sky-100 font-medium">Csak raktáron</span>
        </button>
      </section>

      <hr className="border-amber-200 dark:border-slate-700" />

      {/* Rendezés */}
      <section>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-sky-100 mb-3">Rendezés</h3>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="sidebar-sort"
                value={opt.value}
                checked={filters.sortBy === opt.value}
                onChange={() => update({ sortBy: opt.value })}
                className="w-4 h-4 accent-amber-500 dark:accent-sky-500 cursor-pointer"
              />
              <span className="text-sm text-amber-900 dark:text-sky-100 group-hover:text-amber-600 dark:group-hover:text-sky-300 transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </section>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">{sidebar}</div>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-amber-50 dark:bg-slate-900 p-4 pb-8 shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
