import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, UserSession, InventoryAudit } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import ExcelJS from 'exceljs';
import InfoCard from './InfoCard';
import {
  Search,
  Download,
  AlertTriangle,
  Edit2,
  Trash2,
  Info,
  MapPin,
  Calendar,
  X,
  Plus,
  Tag,
  FileText,
  Shield,
  RotateCcw,
  RefreshCw,
  Clock,
  Settings,
  Sliders,
  History,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface InventoryTabProps {
  products: Product[];
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (sku: string) => void;
  onRestoreProduct: (sku: string) => void;
  onNavigateToTab: (tab: 'add-product' | 'add-movement') => void;
  lang: Language;
  role: 'admin' | 'operator';
  session: UserSession;
  auditLogs?: InventoryAudit[];
  onManualCorrection?: (sku: string, qty: number, reason: string, notes?: string) => Promise<void>;
  onResetInventory?: (sku: string, qty: number, reason: string) => Promise<void>;
  onRestorePreviousQty?: (sku: string) => Promise<void>;
}

export default function InventoryTab({
  products,
  onEditProduct,
  onDeleteProduct,
  onRestoreProduct,
  onNavigateToTab,
  lang,
  role,
  session,
  auditLogs = [],
  onManualCorrection,
  onResetInventory,
  onRestorePreviousQty,
}: InventoryTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Filter products based on inputs and soft-delete status
  const filteredProducts = products.filter((p) => {
    // Soft delete filtering logic
    if (role === 'admin') {
      if (showDeletedOnly) {
        if (!p.deleted) return false;
      } else {
        if (p.deleted) return false;
      }
    } else {
      // Operators must never see soft-deleted records
      if (p.deleted) return false;
    }

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUnit = selectedUnitFilter === 'ALL' || p.unit === selectedUnitFilter;
    const matchesLowStock = !lowStockOnly || p.quantity <= p.minStock;

    return matchesSearch && matchesUnit && matchesLowStock;
  });

  // Professional ERP Excel Report Generator using ExcelJS
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SAP Waateh';
      workbook.lastModifiedBy = session.name || 'SAP Waateh User';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Create Worksheet with a meaningful sheet name
      const sheetName = lang === 'fa' ? 'موجودی انبار' : 'Inventory';
      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 8 }] // Freezes first 8 rows (Branding, Title, Metadata & Table Headers)
      });

      // Enable grid lines explicitly
      worksheet.views[0].showGridLines = true;

      // RTL layout support for Persian
      if (isRtl) {
        worksheet.properties.tabColor = { argb: 'FF1E293B' }; // Slate-800 tab color
      }

      // Print Ready options setup
      worksheet.pageSetup = {
        orientation: 'landscape',
        paperSize: 9, // A4
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0, // Auto flow rows vertically
        horizontalCentered: true
      };

      // 1. REPORT HEADER & BRANDING
      worksheet.addRow([]); // Row 1 spacer
      
      const brandRow = worksheet.addRow([
        lang === 'fa' ? 'سامانه مدیریت انبار واته (SAP Waateh)' : 'SAP Waateh - Warehouse Management System'
      ]);
      brandRow.getCell(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
      
      const titleRow = worksheet.addRow([
        lang === 'fa' ? 'گزارش ارزیابی جامع دپوی فیزیکی کالاها و انبارگردانی' : 'Comprehensive Physical Inventory Audit Report'
      ]);
      titleRow.getCell(1).font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF475569' } };

      worksheet.addRow([]); // Row 4 spacer

      // 2. REPORT METADATA SECTION
      const metaTime = lang === 'fa' ? `زمان گزارش‌گیری: ${new Date().toLocaleString('fa-IR')}` : `Exported: ${new Date().toLocaleString()}`;
      const metaUser = lang === 'fa' ? `کاربر صادرکننده: ${session.name} (${session.email})` : `Issued By: ${session.name} (${session.email})`;
      const metaRole = lang === 'fa' ? `سطح دسترسی کاربر: ${role === 'admin' ? 'مدیر ارشد انبار' : 'اپراتور انبار'}` : `Permission Level: ${role === 'admin' ? 'Administrator' : 'Operator'}`;
      const metaMode = lang === 'fa' ? `وضعیت ذخیره‌سازی داده: برخط ابری (Supabase)` : `Storage Provider: Remote Cloud Server (Supabase)`;

      worksheet.addRow([metaTime]);
      worksheet.addRow([metaUser]);
      worksheet.addRow([metaRole]);
      worksheet.addRow([metaMode]);

      worksheet.addRow([]); // Row 8 spacer

      // Set metadata styling
      for (let r = 5; r <= 8; r++) {
        worksheet.getRow(r).getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } };
      }

      // Merge branding and metadata rows for clean appearance
      worksheet.mergeCells('A2:F2');
      worksheet.mergeCells('A3:F3');

      // 3. TABLE COLUMN DEFINITIONS & SIZES
      const headers = [
        lang === 'fa' ? 'شناسه یکتا (SKU)' : 'Product SKU',
        lang === 'fa' ? 'عنوان کالا' : 'Product Name',
        lang === 'fa' ? 'موجودی انبار' : 'In-Stock Qty',
        lang === 'fa' ? 'واحد سنجش' : 'Unit',
        lang === 'fa' ? 'محل ذخیره‌سازی' : 'Storage Location',
        lang === 'fa' ? 'حداقل هشدار' : 'Min Safety level'
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.height = 28;

      // Style Table Headers
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' } // Slate 800
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0F172A' } },
          bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
          left: { style: 'thin', color: { argb: 'FF475569' } },
          right: { style: 'thin', color: { argb: 'FF475569' } }
        };
      });

      // 4. POPULATE DATA ROWS
      filteredProducts.forEach((p) => {
        const row = worksheet.addRow([
          p.sku,
          p.name,
          p.quantity,
          lang === 'fa' ? (p.unit === 'count' ? 'عدد' : p.unit === 'kg' ? 'کیلوگرم' : p.unit === 'meter' ? 'متر' : p.unit === 'box' ? 'جعبه' : 'لیتر') : p.unit,
          p.location,
          p.minStock
        ]);
        row.height = 22;

        const isLow = p.quantity <= p.minStock;

        // Apply beautiful cell-by-cell alignment and styling
        row.eachCell((cell, colIndex) => {
          cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };

          // Center-align columns except product name
          if (colIndex !== 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: isRtl ? 'right' : 'left' };
          }

          // Highlight low stock quantities in soft red
          if (isLow) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEE2E2' } // soft rose-100
            };
            if (colIndex === 3) {
              cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF991B1B' } }; // dark red text
            }
          } else {
            // Zebra striping for active products
            if (row.number % 2 === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' } // Slate 50
              };
            }
          }
        });
      });

      // Column widths setup
      worksheet.getColumn(1).width = 16; // SKU
      worksheet.getColumn(2).width = 35; // Product Name
      worksheet.getColumn(3).width = 15; // Qty
      worksheet.getColumn(4).width = 12; // Unit
      worksheet.getColumn(5).width = 20; // Location
      worksheet.getColumn(6).width = 16; // Safety Alert

      // 5. WRITE & DOWNLOAD BUFFER
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Waateh_Inventory_Report_${new Date().toISOString().substring(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert(lang === 'fa' ? 'خطا در تولید گزارش اکسل.' : 'Could not generate professional Excel sheet.');
    }
  };



  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey="inventory"
        englishText="The inventory catalog lists active warehouse stock. Admins can adjust safety levels, log reasons for physical corrections, and restore deleted products."
        persianText="فهرست کالاها و دپوی فیزیکی انبار. مدیران ارشد می‌توانند حداقل موجودی هشدار را تنظیم کنند، دلایل اصلاحات انبارگردانی را ثبت و کالاهای حذف شده را بازیابی کنند."
        lang={lang}
      />

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">{isRtl ? 'مدیریت موجودی انبار' : 'Inventory Management'}</h2>
          <p className="text-[11px] font-black text-slate-400 mt-1">
            {filteredProducts.length} {lang === 'fa' ? 'کالا یافت شد' : 'items filtered'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* CSV Export Button */}
          {role === 'admin' && (
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>{t.exportExcel}</span>
            </button>
          )}
          
          {/* Add Product Shortcut */}
          <button
            onClick={() => onNavigateToTab('add-product')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>{lang === 'fa' ? 'کالای جدید' : 'New Item'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <div className={`${role === 'admin' ? 'md:col-span-4' : 'md:col-span-6'} relative`}>
            <div className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center pointer-events-none text-slate-400`}>
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 ${
                isRtl ? 'pr-9.5 pl-4' : 'pl-9.5 pr-4'
              } text-xs font-bold focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400`}
            />
          </div>

          {/* Unit Filter */}
          <div className={role === 'admin' ? 'md:col-span-2' : 'md:col-span-3'}>
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-xs"
            >
              <option value="ALL">{t.all}</option>
              <option value="count">{lang === 'fa' ? 'عدد' : 'count (pcs)'}</option>
              <option value="kg">{lang === 'fa' ? 'کیلوگرم' : 'kg'}</option>
              <option value="meter">{lang === 'fa' ? 'متر' : 'meter'}</option>
              <option value="box">{lang === 'fa' ? 'جعبه' : 'box'}</option>
              <option value="liters">{lang === 'fa' ? 'لیتر' : 'liters'}</option>
            </select>
          </div>

          {/* Low Stock Filter Switch */}
          <div className={`${role === 'admin' ? 'md:col-span-3' : 'md:col-span-3'} flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl`}>
            <span className="text-[10px] font-extrabold text-slate-600">{t.lowStockFilter}</span>
            <button
              type="button"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                lowStockOnly ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isRtl 
                    ? (lowStockOnly ? '-translate-x-5' : 'translate-x-0') 
                    : (lowStockOnly ? 'translate-x-5' : 'translate-x-0')
                }`}
              />
            </button>
          </div>

          {/* Deleted Products index - Admin Only! */}
          {role === 'admin' && (
            <div className="md:col-span-3 flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-white">
              <span className="text-[10px] font-black text-slate-200 flex items-center gap-1">
                <Trash2 size={12} className="text-red-400" />
                {isRtl ? 'کالاهای حذف‌شده' : 'Deleted Archive'}
              </span>
              <button
                type="button"
                onClick={() => setShowDeletedOnly(!showDeletedOnly)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showDeletedOnly ? 'bg-red-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isRtl 
                      ? (showDeletedOnly ? '-translate-x-5' : 'translate-x-0') 
                      : (showDeletedOnly ? 'translate-x-5' : 'translate-x-0')
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Card Layout */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-bold space-y-2">
            <p className="text-sm">🔍</p>
            <p className="text-xs">{t.emptyInventory}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="p-4 text-center">{t.sku}</th>
                  <th className="p-4">{t.productName}</th>
                  <th className="p-4 text-center">{t.quantity}</th>
                  <th className="p-4 text-center">{t.unit}</th>
                  <th className="p-4 text-center">{t.location}</th>
                  <th className="p-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((p) => {
                    const isLow = p.quantity <= p.minStock;
                    return (
                      <motion.tr
                        key={p.sku}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`text-xs transition-colors hover:bg-slate-50/70 ${
                          isLow ? 'bg-rose-50/20' : ''
                        } ${p.deleted ? 'bg-red-50/10' : ''}`}
                      >
                        {/* SKU */}
                        <td className="p-3 text-center font-mono font-black text-blue-600 bg-blue-50/20 rounded-md">
                          {p.sku}
                        </td>
                        
                        {/* Name */}
                        <td className="p-3 font-black text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]">{p.name}</span>
                            {isLow && !p.deleted && (
                              <span className="text-rose-500 shrink-0" title={t.lowStockAlerts}>
                                <AlertTriangle size={13} />
                              </span>
                            )}
                            {p.deleted && (
                              <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                                {isRtl ? 'حذف منطقی' : 'Soft Deleted'}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Quantity */}
                        <td className={`p-3 text-center font-bold font-mono text-sm ${
                          isLow && !p.deleted ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {p.quantity}
                        </td>
                        
                        {/* Unit */}
                        <td className="p-3 text-center text-slate-500 font-bold">
                          {lang === 'fa' 
                            ? (p.unit === 'count' ? 'عدد' : p.unit === 'kg' ? 'کیلوگرم' : p.unit === 'meter' ? 'متر' : p.unit === 'box' ? 'جعبه' : 'لیتر')
                            : p.unit}
                        </td>
                        
                        {/* Location */}
                        <td className="p-3 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg font-mono font-bold text-[10px]">
                            {p.location}
                          </span>
                        </td>
                        
                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View info button */}
                            <button
                              onClick={() => {
                                setSelectedProduct(p);
                              }}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title={t.productDetails}
                            >
                              <Info size={14} />
                            </button>
                            
                            {/* Edit button */}
                            {role === 'admin' && !p.deleted && (
                              <button
                                onClick={() => onEditProduct(p)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title={t.editProduct}
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            
                            {/* Restore soft-deleted product button */}
                            {role === 'admin' && p.deleted && (
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      lang === 'fa'
                                        ? `آیا از بازیابی کالای "${p.name}" به چرخه فعال مطمئن هستید؟`
                                        : `Are you sure you want to restore "${p.name}" back to the active catalog?`
                                    )
                                  ) {
                                    onRestoreProduct(p.sku);
                                  }
                                }}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title={isRtl ? 'بازیابی کالا' : 'Restore Product'}
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}

                            {/* Delete button (Soft-delete) */}
                            {role === 'admin' && !p.deleted && (
                              <button
                                onClick={() => {
                                  if (role !== 'admin') {
                                    alert(lang === 'fa' ? 'شما دسترسی کافی برای حذف کالا را ندارید.' : 'You do not have permission to delete products.');
                                    return;
                                  }
                                  setProductToDelete(p);
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                title={t.deleteProduct}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Info Drawer/Modal Overlay */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setSelectedProduct(null)}></div>
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative bg-white w-full max-w-2xl rounded-t-[28px] sm:rounded-3xl border-t sm:border border-slate-100 shadow-2xl p-6 space-y-5 z-10 my-auto overflow-y-auto max-h-[90vh]"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Grabber Notch */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-3"></div>

              {/* Title Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                    selectedProduct.quantity <= selectedProduct.minStock && !selectedProduct.deleted
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {selectedProduct.quantity <= selectedProduct.minStock && !selectedProduct.deleted ? <AlertTriangle size={10} /> : '✓'}
                    {selectedProduct.deleted 
                      ? (isRtl ? 'آرشیو شده' : 'Archived') 
                      : (selectedProduct.quantity <= selectedProduct.minStock ? t.lowStockAlerts : 'In Stock')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Product Header Title */}
              <div className="text-center space-y-1.5 py-1">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t.productName}</p>
                <h3 className="text-base font-black text-slate-800">{selectedProduct.name}</h3>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md">
                  SKU: {selectedProduct.sku}
                </span>
              </div>

              {/* PRODUCT DETAILS INFO */}
              <div className="space-y-4">
                {/* Stock Quantity Meter */}
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase block">{t.quantity}</span>
                    <span className="text-xs font-medium text-slate-500">
                      {lang === 'fa' ? 'کل تعداد دپوی فیزیکی موجود' : 'Total physical quantity available'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${
                      selectedProduct.quantity <= selectedProduct.minStock && !selectedProduct.deleted ? 'text-rose-600' : 'text-slate-800'
                    }`}>
                      {selectedProduct.quantity}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">{selectedProduct.unit}</span>
                  </div>
                </div>

                  {/* Metadata Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Location */}
                    <div className="bg-white border border-slate-100 p-3 rounded-xl space-y-1 shadow-xs">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={10} className="text-blue-600" />
                        {t.location}
                      </span>
                      <p className="font-bold text-slate-800 truncate font-mono">{selectedProduct.location}</p>
                    </div>

                    {/* Min Level Threshold */}
                    <div className="bg-white border border-slate-100 p-3 rounded-xl space-y-1 shadow-xs">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle size={10} className="text-amber-500" />
                        {t.minStockThreshold}
                      </span>
                      <p className="font-bold text-slate-800 truncate font-mono">{selectedProduct.minStock} {selectedProduct.unit}</p>
                    </div>

                    {/* Last Updated */}
                    <div className="bg-white border border-slate-100 p-3 rounded-xl space-y-1 shadow-xs col-span-2">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={10} className="text-blue-600" />
                        {t.lastUpdated}
                      </span>
                      <p className="font-bold text-slate-700 text-[10px]">
                        {new Date(selectedProduct.lastUpdated).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                      </p>
                    </div>
                  </div>

                  {/* Notes Panel */}
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl space-y-1.5 shadow-xs">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <FileText size={11} className="text-blue-600" />
                      {t.notes}
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[50px] whitespace-pre-wrap">
                      {selectedProduct.notes || (lang === 'fa' ? 'هیچ یادداشتی برای این کالا ثبت نشده است.' : 'No descriptive notes logged for this product.')}
                    </p>
                  </div>

                  {/* Action Shortcuts */}
                  {!selectedProduct.deleted && (
                    <div className="flex gap-2">
                      {role === 'admin' && (
                        <button
                          onClick={() => {
                            onEditProduct(selectedProduct);
                            setSelectedProduct(null);
                          }}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                        >
                          {t.editProduct}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          onNavigateToTab('add-movement');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] text-center"
                      >
                        {lang === 'fa' ? 'افزودن برگه جابجایی' : 'Add Stock Movement'}
                      </button>
                    </div>
                  )}
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={() => setProductToDelete(null)}></div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 space-y-4 z-10 my-auto text-center"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="mx-auto size-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                <Trash2 size={24} />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800">
                  {isRtl ? 'حذف کالا' : 'Delete Product'}
                </h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  {isRtl
                    ? `آیا مطمئن هستید که می‌خواهید کالای "${productToDelete.name}" را حذف کنید؟`
                    : 'Are you sure you want to delete this product?'}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (role !== 'admin') {
                      alert(lang === 'fa' ? 'شما دسترسی کافی برای حذف کالا را ندارید.' : 'You do not have permission to delete products.');
                      return;
                    }
                    onDeleteProduct(productToDelete.sku);
                    setProductToDelete(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] text-center"
                >
                  {isRtl ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
