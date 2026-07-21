import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Movement, InventoryCorrection } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import InfoCard from './InfoCard';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  MapPin,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface MovementTabProps {
  movements: Movement[];
  corrections: InventoryCorrection[];
  lang: Language;
  role: 'admin' | 'operator';
}

export default function MovementTab({ movements, corrections = [], lang, role }: MovementTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [subTab, setSubTab] = useState<'movements' | 'corrections'>('movements');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Filter regular stock movements
  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.productSku.toLowerCase().includes(search.toLowerCase()) ||
      m.personName.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Filter admin corrections audit trail
  const filteredCorrections = corrections.filter((c) => {
    return (
      c.productName.toLowerCase().includes(search.toLowerCase()) ||
      c.productSku.toLowerCase().includes(search.toLowerCase()) ||
      c.userName.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      c.reason.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 pb-8 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey="movements"
        englishText="View the complete history of all inventory transactions, including stock in and stock out operations."
        persianText="مشاهده تاریخچه کامل تمامی تراکنش‌های موجودی، شامل عملیات‌های ورود کالا به انبار و خروج کالا از انبار."
        lang={lang}
      />
      
      {/* Sub-tab Navigation (Only visible to Administrators) */}
      {role === 'admin' && (
        <div className="flex bg-slate-100 p-1 rounded-2xl max-w-md shadow-inner">
          <button
            onClick={() => {
              setSubTab('movements');
              setSearch('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              subTab === 'movements'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>{lang === 'fa' ? 'تراکنش‌های ورود/خروج' : 'Movements History'}</span>
          </button>
          <button
            onClick={() => {
              setSubTab('corrections');
              setSearch('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              subTab === 'corrections'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={14} className="text-blue-600" />
            <span>{lang === 'fa' ? 'حساب‌رسی اصلاحات' : 'Corrections Audit'}</span>
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {subTab === 'movements'
              ? t.movements
              : lang === 'fa'
                ? 'تاریخچه اصلاحات موجودی'
                : 'Inventory Corrections Audit Log'}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {subTab === 'movements'
              ? `${filteredMovements.length} ${lang === 'fa' ? 'تراکنش یافت شد' : 'movements found'}`
              : `${filteredCorrections.length} ${lang === 'fa' ? 'اصلاحیه ثبت شده است' : 'corrections logged'}`}
          </p>
        </div>
      </div>

      {/* Filter and Search Layout */}
      <div className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className={`${subTab === 'movements' ? 'md:col-span-6' : 'md:col-span-12'} relative`}>
            <div className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-slate-400`}>
              <Search size={16} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                subTab === 'movements'
                  ? lang === 'fa'
                    ? 'جستجوی تراکنش، تحویل‌گیرنده، یادداشت...'
                    : 'Search operators, SKUs, locations...'
                  : lang === 'fa'
                    ? 'جستجوی کاربر، کالا، شناسه SKU، دلیل...'
                    : 'Search users, products, SKUs, audit reasons...'
              }
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 ${
                isRtl ? 'pr-9.5 pl-4' : 'pl-9.5 pr-4'
              } text-xs font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400`}
            />
          </div>

          {/* Segmented Control Filter (Only for stock movements) */}
          {subTab === 'movements' && (
            <div className="md:col-span-6 flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  typeFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.all}
              </button>
              <button
                onClick={() => setTypeFilter('IN')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  typeFilter === 'IN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                {lang === 'fa' ? 'ورودی‌ها (IN)' : 'Inflows'}
              </button>
              <button
                onClick={() => setTypeFilter('OUT')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                  typeFilter === 'OUT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                {lang === 'fa' ? 'خروجی‌ها (OUT)' : 'Outflows'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log list wrapper */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {subTab === 'movements' ? (
          filteredMovements.length === 0 ? (
            <div className="py-24 text-center text-slate-400 font-bold space-y-2 bg-white rounded-3xl border border-slate-100">
              <p className="text-sm">📋</p>
              <p className="text-xs">{t.emptyMovements}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMovements.map((movement) => {
                const isIN = movement.type === 'IN';
                return (
                  <motion.div
                    key={movement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isIN ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800 leading-tight">
                          {movement.productName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-mono font-bold">
                            {movement.productSku}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 font-bold">
                            <MapPin size={10} />
                            {movement.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 font-bold text-slate-500">
                            <User size={10} className="text-blue-600" />
                            {movement.personName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 gap-1 shrink-0">
                      <span className={`text-sm font-black font-mono ${
                        isIN ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isIN ? '+' : '-'}{movement.quantity}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">
                        {new Date(movement.date).toLocaleString(isRtl ? 'fa-IR' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {movement.notes && (
                      <div className="w-full sm:hidden mt-1 bg-slate-50 p-2 rounded-xl text-[10px] text-slate-500 font-medium flex items-start gap-1">
                        <FileText size={10} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{movement.notes}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )
        ) : (
          /* Corrections Sub-tab */
          filteredCorrections.length === 0 ? (
            <div className="py-24 text-center text-slate-400 font-bold space-y-2 bg-white rounded-3xl border border-slate-100">
              <p className="text-sm">🛡️</p>
              <p className="text-xs">{lang === 'fa' ? 'هیچ گزارش اصلاحی یافت نشد.' : 'No audit corrections found.'}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCorrections.map((correction) => {
                const diff = correction.newQuantity - correction.previousQuantity;
                const isIncrease = diff > 0;
                return (
                  <motion.div
                    key={correction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white p-4.5 rounded-3xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col gap-3.5 relative overflow-hidden"
                  >
                    {/* Visual indicators */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <AlertCircle size={18} />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-800 leading-tight">
                            {correction.productName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                            <span className="bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-mono font-bold">
                              {correction.productSku}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-md">
                              <User size={10} className="text-blue-600" />
                              {correction.userName} ({correction.userEmail})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400">
                            {correction.previousQuantity} → {correction.newQuantity}
                          </span>
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                            diff === 0 
                              ? 'bg-slate-100 text-slate-600'
                              : isIncrease 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-rose-50 text-rose-600'
                          }`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono font-bold">
                          {new Date(correction.createdAt).toLocaleString(isRtl ? 'fa-IR' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Audit justification text block */}
                    <div className="bg-slate-50 p-3 rounded-2xl text-[10px] text-slate-700 font-bold border border-slate-100 flex items-start gap-2">
                      <FileText size={12} className="text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="text-slate-400 font-black uppercase text-[8px] tracking-wider block">
                          {lang === 'fa' ? 'دلیل ثبتی اصلاح موجودی' : 'OFFICIAL AUDIT REASON'}
                        </span>
                        <p className="font-bold text-slate-700 leading-relaxed">
                          {correction.reason}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )
        )}
      </div>
    </div>
  );
}
