import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product, UnitType, WarehouseConfig } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import LocationSelector from './LocationSelector';
import InfoCard from './InfoCard';
import {
  Boxes,
  ClipboardList,
  AlertTriangle,
  HelpCircle,
  Hash,
  Tag
} from 'lucide-react';

interface AddProductTabProps {
  config: WarehouseConfig;
  onSubmitProduct: (p: Product, isEdit: boolean, correctionReason?: string) => void;
  editProduct: Product | null;
  onCancelEdit: () => void;
  lang: Language;
  role: 'admin' | 'operator';
}

export default function AddProductTab({
  config,
  onSubmitProduct,
  editProduct,
  onCancelEdit,
  lang,
  role,
}: AddProductTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState<UnitType>('count');
  const [location, setLocation] = useState('R1-S1-L1');
  const [minStock, setMinStock] = useState(10);
  const [notes, setNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [error, setError] = useState('');

  // Auto-generate SKU
  const generateRandomSku = () => {
    const categories = ['EL', 'TL', 'CH', 'ME', 'LI'];
    const randCat = categories[Math.floor(Math.random() * categories.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `SKU-${randCat}-${randNum}`;
  };

  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setSku(editProduct.sku);
      setQuantity(editProduct.quantity);
      setUnit(editProduct.unit);
      setLocation(editProduct.location);
      setMinStock(editProduct.minStock);
      setNotes(editProduct.notes || '');
      setCorrectionReason('');
    } else {
      setName('');
      setSku(generateRandomSku());
      setQuantity(0);
      setUnit('count');
      setLocation('R1-S1-L1');
      setMinStock(10);
      setNotes('');
      setCorrectionReason('');
    }
    setError('');
  }, [editProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t.validationError);
      return;
    }

    if (!sku.trim()) {
      setError(t.validationError);
      return;
    }

    if (quantity < 0 || minStock < 0) {
      setError(t.validationError);
      return;
    }

    const qtyChanged = editProduct && editProduct.quantity !== quantity;
    if (qtyChanged && !correctionReason.trim()) {
      setError(lang === 'fa' ? 'وارد کردن دلیل اصلاح موجودی الزامی است.' : 'A correction reason is required.');
      return;
    }

    const payload: Product = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      quantity,
      unit,
      location,
      notes: notes.trim(),
      minStock,
      lastUpdated: new Date().toISOString(),
    };

    onSubmitProduct(payload, !!editProduct, qtyChanged ? correctionReason.trim() : undefined);
  };

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-xs max-w-2xl mx-auto font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey="add-product"
        englishText="Manage all products in the warehouse. Create, edit, organize, and maintain product information."
        persianText="مدیریت تمامی محصولات موجود در انبار. ایجاد، ویرایش، سازمان‌دهی و نگهداری اطلاعات فنی و پایه‌ای محصولات."
        lang={lang}
      />
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Boxes size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              {editProduct ? t.editItem : t.addNewItem}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {editProduct ? t.editProduct : t.addProduct}
            </p>
          </div>
        </div>
        {editProduct && (
          <button
            onClick={onCancelEdit}
            className="text-xs font-bold text-slate-400 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-rose-600 text-xs font-bold mb-4">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
            {t.productName} *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lang === 'fa' ? 'مثال: سنسور مجاورتی فتوالکتریک ۲۴ ولت' : 'e.g. Photoelectric Proximity Sensor 24V'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
          />
        </div>

        {/* SKU Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
              <Hash size={12} className="text-slate-500" />
              <span>{t.editSKU}</span>
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              disabled={role !== 'admin'}
              placeholder="SKU-XXXX-XXXX"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono font-black text-blue-600 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs disabled:opacity-75 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>

          {/* Unit Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
              <Tag size={12} className="text-slate-500" />
              <span>{t.unit}</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs cursor-pointer"
            >
              <option value="count">{lang === 'fa' ? 'عدد (count)' : 'count (pcs)'}</option>
              <option value="kg">{lang === 'fa' ? 'کیلوگرم (kg)' : 'kg'}</option>
              <option value="meter">{lang === 'fa' ? 'متر (meter)' : 'meter'}</option>
              <option value="box">{lang === 'fa' ? 'جعبه (box)' : 'box'}</option>
              <option value="liters">{lang === 'fa' ? 'لیتر (liters)' : 'liters'}</option>
            </select>
          </div>
        </div>

        {/* Quantity and Min Stock Warning Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
              {t.quantity}
            </label>
            <input
              type="number"
              required
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-500 animate-pulse" />
              <span>{t.minStockThreshold}</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Correction Reason (Mandatory when quantity is modified during edit) */}
        {editProduct && editProduct.quantity !== quantity && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-1.5 bg-amber-50 border border-amber-100 p-4 rounded-2xl"
          >
            <label className="text-[10px] font-black text-amber-800 uppercase tracking-wider block px-1">
              {lang === 'fa' ? 'دلیل اصلاح موجودی (اجباری) *' : 'Reason for Stock Correction (Mandatory) *'}
            </label>
            <input
              type="text"
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder={lang === 'fa' ? 'مثال: شمارش انبارگردانی دوره‌ای / اصلاح اشتباه ثبت قبلی' : 'e.g., Annual stock-taking audit / corrected fat-finger mistake'}
              className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-600 transition-all shadow-xs"
            />
            <p className="text-[10px] font-bold text-amber-600 px-1">
              {lang === 'fa' ? 'تغییر مستقیم موجودی کالا نیازمند ثبت سند اصلاح است. این گزارش در بخش پایش و حسابرسی ثبت می‌شود.' : 'Directly changing stock levels generates an audit event. This is logged to the corporate history.'}
            </p>
          </motion.div>
        )}

        {/* Location Selector */}
        <LocationSelector config={config} value={location} onChange={setLocation} lang={lang} />

        {/* Notes Description */}
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
            {t.notes}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={lang === 'fa' ? 'توضیحات و مشخصات کالا...' : 'Write technical specs, distributor name, carrier codes...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="pt-2 flex gap-3">
          {editProduct && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
            >
              {t.cancel}
            </button>
          )}
          <button
            type="submit"
            className="flex-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-center block"
          >
            {editProduct ? t.save : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
