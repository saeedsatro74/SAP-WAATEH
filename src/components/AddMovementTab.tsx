import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  UserPlus,
  Users,
  Search
} from 'lucide-react';

interface AddMovementTabProps {
  products: Product[];
  onSubmitMovement: (movement: Movement) => void | Promise<void>;
  lang: Language;
  session: UserSession;
  usersList: UserSession[];
  employees?: string[];
  onAddEmployee?: (name: string) => void | Promise<void>;
  onDeleteEmployee?: (name: string) => void | Promise<void>;
}

const DEFAULT_EMPLOYEES_LIST = [
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
  "خانم خمسه",
  "مهدی نوروزی",
  "محمد خرقانی",
  "امید صفوی",
  "محمد"
];

export default function AddMovementTab({
  products,
  onSubmitMovement,
  lang,
  session,
  usersList,
  employees,
  onAddEmployee,
  onDeleteEmployee
}: AddMovementTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [internalEmployees, setInternalEmployees] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('waateh_employees');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_EMPLOYEES_LIST;
  });

  // Synchronize internal state when parent employees prop updates
  useEffect(() => {
    if (employees && employees.length > 0) {
      setInternalEmployees(employees);
    }
  }, [employees]);

  // Combine both so newly added staff are immediately visible without any race condition
  const activeEmployees = useMemo(() => {
    const base = employees && employees.length > 0 ? employees : internalEmployees;
    const combined = Array.from(new Set([...base, ...internalEmployees]));
    return combined;
  }, [employees, internalEmployees]);

  const [personName, setPersonName] = useState(session.name);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [showAddInline, setShowAddInline] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [staffInputError, setStaffInputError] = useState('');
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [manageNewStaffName, setManageNewStaffName] = useState('');

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

  // Handle adding employee (available to both Admin and Operator)
  const handleAddStaff = async (customName?: string) => {
    const target = (customName !== undefined ? customName : newStaffName).trim();
    if (!target) {
      setStaffInputError(lang === 'fa' ? 'لطفاً نام کارمند را وارد کنید.' : 'Please enter the employee name.');
      return;
    }
    if (activeEmployees.some((e) => e.trim().toLowerCase() === target.toLowerCase())) {
      setStaffInputError(lang === 'fa' ? 'این کارمند قبلاً در لیست وجود دارد.' : 'This employee already exists in the list.');
      return;
    }

    // Always update internal state and localStorage immediately
    setInternalEmployees((prev) => {
      if (prev.some((e) => e.trim().toLowerCase() === target.toLowerCase())) return prev;
      const updated = [...prev, target];
      try {
        localStorage.setItem('waateh_employees', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (onAddEmployee) {
      await onAddEmployee(target);
    }

    setPersonName(target);
    setSelectedStaff(target);
    setNewStaffName('');
    setManageNewStaffName('');
    setStaffInputError('');
    setShowAddInline(false);
  };

  // Handle deleting employee (available to both Admin and Operator)
  const handleDeleteStaff = async (targetToDelete: string) => {
    setInternalEmployees((prev) => {
      const updated = prev.filter((e) => e.trim().toLowerCase() !== targetToDelete.trim().toLowerCase());
      try {
        localStorage.setItem('waateh_employees', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    if (onDeleteEmployee) {
      await onDeleteEmployee(targetToDelete);
    }

    if (selectedStaff === targetToDelete) {
      setSelectedStaff('');
    }
    if (personName === targetToDelete) {
      setPersonName('');
    }
    setStaffToDelete(null);
  };

  // Filtered employees for manage modal
  const filteredEmployees = activeEmployees.filter((name) =>
    name.toLowerCase().includes(manageSearchQuery.toLowerCase().trim())
  );

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
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1 flex items-center gap-1">
            <User size={12} className="text-slate-500" />
            <span>{t.personName} *</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => {
                setPersonName(e.target.value);
                if (selectedStaff && e.target.value !== selectedStaff) {
                  setSelectedStaff('');
                }
              }}
              placeholder={lang === 'fa' ? 'مثال: کوروش شادمان' : 'e.g. Kourosh Shadman'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
            />

            {/* Quick staff select dropdown with Add and Delete buttons */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-xs shrink-0 self-stretch sm:self-auto">
              <select
                value={selectedStaff}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStaff(val);
                  if (val) {
                    setPersonName(val);
                    setStaffToDelete(null);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-700 cursor-pointer focus:outline-none max-w-[130px] sm:max-w-[160px] truncate px-1 py-1"
              >
                <option value="" disabled>
                  {lang === 'fa' ? 'انتخاب کارکنان' : 'Select Employee'}
                </option>
                {activeEmployees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              <div className="h-4 w-px bg-slate-200 mx-0.5" />

              {/* Quick Add Button (+) */}
              <button
                type="button"
                onClick={() => {
                  setShowAddInline(!showAddInline);
                  setStaffToDelete(null);
                  setStaffInputError('');
                }}
                title={lang === 'fa' ? 'افزودن کارمند جدید به لیست' : 'Add new employee to list'}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  showAddInline
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <Plus size={14} />
              </button>

              {/* Quick Delete / Manage Button (🗑️) */}
              <button
                type="button"
                onClick={() => {
                  if (selectedStaff) {
                    setStaffToDelete(selectedStaff);
                    setShowAddInline(false);
                  } else {
                    setShowManageModal(true);
                  }
                }}
                title={
                  selectedStaff
                    ? (lang === 'fa' ? `حذف «${selectedStaff}» از لیست کارکنان` : `Delete "${selectedStaff}" from list`)
                    : (lang === 'fa' ? 'مدیریت و حذف کارکنان' : 'Manage & Delete employees')
                }
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  selectedStaff
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Quick Add Inline Bar */}
          {showAddInline && (
            <div
              className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 space-y-1.5 animate-fade-in text-right"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-2">
                <UserPlus size={15} className="text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => {
                    setNewStaffName(e.target.value);
                    setStaffInputError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStaff();
                    } else if (e.key === 'Escape') {
                      setShowAddInline(false);
                      setNewStaffName('');
                      setStaffInputError('');
                    }
                  }}
                  placeholder={lang === 'fa' ? 'نام و نام خانوادگی کارمند جدید...' : 'New employee name...'}
                  className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleAddStaff()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Check size={13} />
                  <span>{lang === 'fa' ? 'افزودن' : 'Add'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInline(false);
                    setNewStaffName('');
                    setStaffInputError('');
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <X size={13} />
                  <span>{lang === 'fa' ? 'لغو' : 'Cancel'}</span>
                </button>
              </div>
              {staffInputError && (
                <p className="text-[11px] text-rose-600 font-bold px-1">{staffInputError}</p>
              )}
            </div>
          )}

          {/* Quick Delete Confirmation Bar */}
          {staffToDelete && (
            <div
              className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 animate-fade-in text-right"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center gap-2">
                <Trash2 size={15} className="text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-rose-950">
                  {lang === 'fa'
                    ? `آیا از حذف «${staffToDelete}» از لیست کارکنان اطمینان دارید؟`
                    : `Are you sure you want to delete "${staffToDelete}" from employee list?`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(staffToDelete)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>{lang === 'fa' ? 'بله، حذف شود' : 'Yes, Delete'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStaffToDelete(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <span>{lang === 'fa' ? 'انصراف' : 'Cancel'}</span>
                </button>
              </div>
            </div>
          )}
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

      {/* Manage Employees Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] flex flex-col text-right"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {lang === 'fa' ? 'مدیریت و حذف کارکنان' : 'Manage & Delete Employees'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'fa' ? `${activeEmployees.length} کارمند ثبت‌شده در سیستم` : `${activeEmployees.length} registered employees`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManageModal(false);
                  setManageSearchQuery('');
                  setManageNewStaffName('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Quick Add Inside Modal */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manageNewStaffName}
                onChange={(e) => setManageNewStaffName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStaff(manageNewStaffName);
                  }
                }}
                placeholder={lang === 'fa' ? 'نام کارمند جدید برای افزودن...' : 'New employee name...'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddStaff(manageNewStaffName)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus size={14} />
                <span>{lang === 'fa' ? 'افزودن' : 'Add'}</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <input
                type="text"
                value={manageSearchQuery}
                onChange={(e) => setManageSearchQuery(e.target.value)}
                placeholder={lang === 'fa' ? 'جستجو در بین کارکنان...' : 'Search employees...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* List of employees */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1 max-h-[300px]">
              {filteredEmployees.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 font-bold">
                  {lang === 'fa' ? 'کارمندی یافت نشد.' : 'No employee found.'}
                </p>
              ) : (
                filteredEmployees.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                        {name[0] || '؟'}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(name)}
                      title={lang === 'fa' ? `حذف ${name}` : `Delete ${name}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowManageModal(false);
                  setManageSearchQuery('');
                  setManageNewStaffName('');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === 'fa' ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
