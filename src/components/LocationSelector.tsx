import { WarehouseConfig } from '../types';
import { MapPin } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';

interface LocationSelectorProps {
  config: WarehouseConfig;
  value: string; // e.g. "R1-S2-L3"
  onChange: (newValue: string) => void;
  lang: Language;
}

export default function LocationSelector({ config, value, onChange, lang }: LocationSelectorProps) {
  const t = TRANSLATIONS[lang];

  // Parse current R-S-L from the string, fallback to R1-S1-L1 if invalid
  const parseLocation = (locStr: string) => {
    const parts = locStr.split('-');
    const r = parts[0] || 'R1';
    const s = parts[1] || 'S1';
    const l = parts[2] || 'L1';
    return { r, s, l };
  };

  const { r, s, l } = parseLocation(value);

  const handlePartChange = (type: 'R' | 'S' | 'L', val: string) => {
    let newR = r;
    let newS = s;
    let newL = l;

    if (type === 'R') newR = val;
    if (type === 'S') newS = val;
    if (type === 'L') newL = val;

    onChange(`${newR}-${newS}-${newL}`);
  };

  // Generate lists based on configurable structure
  const racks = Array.from({ length: config.racksCount }, (_, i) => `R${i + 1}`);
  const shelves = Array.from({ length: config.shelvesCount }, (_, i) => `S${i + 1}`);
  const positions = Array.from({ length: config.positionsCount }, (_, i) => `L${i + 1}`);

  const isRtl = lang === 'fa';

  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <MapPin size={12} className="text-blue-600" />
          <span>{t.locationSelector}</span>
        </label>
        <span className="text-xs font-black text-blue-600 font-mono bg-blue-50 px-2.5 py-0.5 rounded-md">
          {value || 'R1-S1-L1'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Rack Selector */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 block px-1 text-center">
            {t.rack}
          </span>
          <select
            value={r}
            onChange={(e) => handlePartChange('R', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
          >
            {racks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Shelf Selector */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 block px-1 text-center">
            {t.shelf}
          </span>
          <select
            value={s}
            onChange={(e) => handlePartChange('S', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
          >
            {shelves.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Position Selector */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 block px-1 text-center">
            {t.position}
          </span>
          <select
            value={l}
            onChange={(e) => handlePartChange('L', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
          >
            {positions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
