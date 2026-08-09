import React, { useState, useEffect } from 'react';
import { Product, Movement, MovementType, UserSession } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import InfoCard from './InfoCard';
import SearchableSelect from './SearchableSelect';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Boxes,
  FileText,
  MapPin,
  Clock
} from 'lucide-react';

interface AddMovementTabProps {
  products: Product[];
  onSubmitMovement: (movement: Movement) => void | Promise<void>;
  lang: Language;
  session: UserSession;
  usersList: UserSession[];
}

const EMPLOYEES = [
  "کوروش شادمان",
  "جواد شکرالهی",
  "مهدی آصفی",
  "رامین شهمرادی",
  "مهدی شجاعی",
  "امیر محمدکامران",
  "مرتضی محمدی",
  "مهدی محمدی",
  "سید کاظم صادقیان",
  "مهدی صادقیان",
  "مهندس ظفری پور",
  "مهندس فتح پور",
  "مهدی نوروزی",
  "محمد خرقانی",
  "امید صفوی",
  "محمد"
];

export default function AddMovementTab({ products, onSubmitMovement, lang, session, usersList }: AddMovementTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [personName, setPersonName] = useState(session.name);
  const [productSku, setProductSku] = useState('');
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto pre-fill first product if available
  useEffect(() => {
    if (products.length > 0 && !productSku) {
      setProductSku(products[0].sku);
    }
  }, [products]);

  // Sync personName when logged in session details resolve
  useEffect(() => {
    if (session.name) {
      setPersonName(session.name);
    }
  }, [session.name]);

  // Find currently selected product details
  const selectedProduct = products.find((p) => p.sku === productSku);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productSku) {
      setError(t.validationError);
      return;
    }

    if (!personName.trim()) {
      setError(t.validationError);
      return;
    }

    if (quantity <= 0) {
      setError(t.validationError);
      return;
    }

    if (!selectedProduct) {
      setError(t.validationError);
      return;
    }

    // Prevent negative stock: check bounds if outflowing
    if (type === 'OUT' && quantity > selectedProduct.quantity) {
      setError(t.negativeStockError);
      return;
    }

    const payload: Movement = {
      id: `MOV-${Date.now().toString().slice(-4)}`,
      personName: personName.trim(),
      productSku,
      productName: selectedProduct.name,
      type,
      quantity,
      date: new Date().toISOString(),
      location: selectedProduct.location,
      notes: notes.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSubmitMovement(payload);
      
      // Show success & reset fields
      setSuccess(t.successMovementAdded);
      setQuantity(1);
      setNotes('');

      // Clear success banner after 3 seconds
      setTimeout(() => setSuccess(''), 3500);
    } catch (err: any) {
      setError(err?.message || (lang === 'fa' ? 'خطا در ثبت تراکنش' : 'Error recording transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs max-w-2xl mx-auto font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey={type === 'IN' ? 'stock-in' : 'stock-out'}
        englishText={
          type === 'IN'
            ? 'Register products entering the warehouse. Every operation updates inventory and creates a movement history record.'
            : 'Register products leaving the warehouse. Inventory is reduced automatically and the transaction is recorded.'
        }
        persianText={
          type === 'IN'
            ? 'ثبت کالاهای ورودی به انبار. هر عملیات، موجودی کالا را افزایش داده و یک سند تراکنش در تاریخچه ثبت می‌کند.'
            : 'ثبت کالاهای خروجی از انبار. موجودی کالا به صورت خودکار کاهش یافته و تراکنش مربوطه در سیستم ثبت می‌شود.'
        }
        lang={lang}
      />
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
        <div className="size-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900">{t.addMovement}</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lang === 'fa' ? 'ثبت ورود یا خروج کالا' : 'Log item inbound or outbound action'}</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl text-rose-600 text-xs font-bold mb-4 flex items-center gap-2 animate-shake">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-emerald-600 text-xs font-bold mb-4">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Transaction Type Segmented Control */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
            {t.type} *
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {/* INFLOW BUTTON */}
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white/40'
              }`}
            >
              <ArrowDownLeft size={15} />
              <span>{t.inbound}</span>
            </button>
            
            {/* OUTFLOW BUTTON */}
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white/40'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>{t.outbound}</span>
            </button>
          </div>
        </div>

        {/* Product selection drop-down */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
            <Boxes size={12} className="text-slate-500" />
            <span>{lang === 'fa' ? 'کالای انبار' : 'Inventory Product'} *</span>
          </label>
          {products.length === 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-400 font-bold text-center rounded-xl">
              {t.emptyInventory}
            </div>
          ) : (
            <SearchableSelect
              products={products}
              selectedSku={productSku}
              onSelect={setProductSku}
              lang={lang}
            />
          )}
        </div>

        {/* Operator / Person selecting */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
            <User size={12} className="text-slate-500" />
            <span>{t.personName} *</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={lang === 'fa' ? 'مثال: کوروش شادمان' : 'e.g. Kourosh Shadman'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />
            {/* Quick staff select drops */}
            <select
              onChange={(e) => {
                if (e.target.value) setPersonName(e.target.value);
              }}
              defaultValue=""
              className="bg-slate-50 border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-500 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>{lang === 'fa' ? 'انتخاب کارکنان' : 'Select Employee'}</option>
              {EMPLOYEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity input */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
            {t.quantity} *
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />
            {selectedProduct && (
              <span className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400`}>
                {selectedProduct.unit}
              </span>
            )}
          </div>
        </div>

        {/* Selected Product Context Metadata Tracker */}
        {selectedProduct && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <MapPin size={10} className="text-blue-600" />
                <span>{t.location}</span>
              </span>
              <p className="text-xs font-black font-mono text-slate-800">{selectedProduct.location}</p>
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Clock size={10} className="text-blue-600" />
                <span>{t.dateAndTime}</span>
              </span>
              <p className="text-xs font-bold text-slate-500">
                {new Date().toLocaleTimeString(isRtl ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' })} ({lang === 'fa' ? 'فوری' : 'Auto'})
              </p>
            </div>
          </div>
        )}

        {/* Description / Log notes */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
            <FileText size={12} className="text-slate-500" />
            <span>{t.notes}</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={lang === 'fa' ? 'مثال: بارگیری کانتینر شماره ۹۲، تحویل بابت پیش‌فاکتور ۳۲۲' : 'e.g. Batch code B32-2, customer reference invoice #10292'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs resize-none"
          />
        </div>

        {/* Actions Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full text-white py-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-slate-400 cursor-not-allowed' 
              : type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {isSubmitting ? (
            <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : type === 'IN' ? (
            <ArrowDownLeft size={16} />
          ) : (
            <ArrowUpRight size={16} />
          )}
          <span>{isSubmitting ? (lang === 'fa' ? 'در حال ثبت تراکنش...' : 'Registering...') : t.submit}</span>
        </button>
      </form>
    </div>
  );
}
