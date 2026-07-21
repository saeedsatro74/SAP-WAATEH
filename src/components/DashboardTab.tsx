import { motion } from 'motion/react';
import { Product, Movement, InventoryAudit } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import InfoCard from './InfoCard';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  History,
  PlusCircle,
  FileText,
  User,
  Activity,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardTabProps {
  products: Product[];
  movements: Movement[];
  auditLogs?: InventoryAudit[];
  role?: 'admin' | 'operator';
  onNavigateToTab: (tab: 'inventory' | 'movements' | 'add-product' | 'add-movement') => void;
  lang: Language;
}

export default function DashboardTab({ 
  products, 
  movements, 
  auditLogs = [], 
  role = 'operator', 
  onNavigateToTab, 
  lang 
}: DashboardTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  // Statistics calculations (Active/Non-deleted products)
  const activeProducts = products.filter((p) => !p.deleted);
  const totalItemsCount = activeProducts.length;
  const totalStockQuantity = activeProducts.reduce((acc, p) => acc + p.quantity, 0);
  const lowStockProducts = activeProducts.filter((p) => p.quantity <= p.minStock);
  const lowStockCount = lowStockProducts.length;
  const totalMovementsCount = movements.length;

  // Admin-only metrics
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaysMovements = movements.filter((m) => {
    const movementDate = new Date(m.date);
    return movementDate >= startOfToday;
  });

  const todaysStockIn = todaysMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  const todaysStockOut = todaysMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity, 0);

  const recentCorrectionsCount = auditLogs.filter((a) => a.actionType === 'Admin Correction').length;
  const recentResetsCount = auditLogs.filter((a) => a.actionType === 'Reset').length;
  const deletedProductsCount = products.filter((p) => p.deleted).length;

  // Prepare chart data 1: Inventory Distribution (Top products by stock)
  const inventoryChartData = activeProducts
    .map((p) => ({
      name: p.name.length > 18 ? p.name.substring(0, 16) + '...' : p.name,
      stock: p.quantity,
    }))
    .slice(0, 6);

  // Prepare chart data 2: Movement Trends (IN vs OUT over latest records)
  const chartMovements = [...movements].reverse().slice(0, 6);
  const movementTrendData = chartMovements.map((m) => {
    const formattedDate = new Date(m.date).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
    return {
      name: formattedDate,
      IN: m.type === 'IN' ? m.quantity : 0,
      OUT: m.type === 'OUT' ? m.quantity : 0,
    };
  });

  const COLORS = ['#2563eb', '#4f46e5', '#0d9488', '#e11d48', '#d97706', '#7c3aed'];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey="dashboard"
        englishText="This dashboard provides an overview of warehouse activity, inventory levels, recent operations, and important alerts."
        persianText="این داشبورد نمای کلی از فعالیت‌های انبار، سطوح موجودی کالاها، عملیات‌های اخیر و هشدارهای مهم سیستم را ارائه می‌دهد."
        lang={lang}
      />
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">{t.welcomeBack}</h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">{t.appSlogan}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToTab('add-product')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>{t.addProduct}</span>
          </button>
          <button
            onClick={() => onNavigateToTab('add-movement')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Activity size={14} />
            <span>{t.addMovement}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-xs flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full blur-lg"></div>
          <div className="size-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Boxes size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.totalItems}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{totalItemsCount}</span>
          </div>
        </motion.div>

        {/* Total Stock */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-xs flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full blur-lg"></div>
          <div className="size-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingUp size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.totalStock}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{totalStockQuantity}</span>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          whileHover={{ y: -2 }}
          className={`bg-white border p-4.5 rounded-3xl shadow-xs flex items-center gap-4 relative overflow-hidden transition-colors ${
            lowStockCount > 0 ? 'border-rose-100' : 'border-slate-100'
          }`}
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rounded-full blur-lg"></div>
          <div className={`size-11 rounded-2xl flex items-center justify-center ${
            lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.lowStockAlerts}</span>
            <span className={`text-lg font-black font-mono ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockCount}</span>
          </div>
        </motion.div>

        {/* Total Movements */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-xs flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/5 rounded-full blur-lg"></div>
          <div className="size-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <History size={22} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.activeMovements}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{totalMovementsCount}</span>
          </div>
        </motion.div>
      </div>

      {/* Enterprise Admin Overview Control Panel */}
      {role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
          
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-800/60 pb-4">
            <div className="size-8.5 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight flex items-center gap-2">
                {isRtl ? '🛡️ پنل کنترل و نظارت ارشد انبار' : '🛡️ Enterprise Admin Control Center'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {isRtl ? 'گزارش رهگیری دقیق، بازیابی داده‌ها و آمار اصلاحی انبار' : 'Audit logs, secure quantity overrides, and soft-delete index status'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Today's In */}
            <div 
              onClick={() => onNavigateToTab('movements')}
              className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'ورودی امروز' : "Today's Inflow"}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-emerald-400 font-mono">{todaysStockIn}</span>
                <span className="text-[9px] text-slate-400 font-bold">{isRtl ? 'واحد' : 'units'}</span>
              </div>
            </div>

            {/* Today's Out */}
            <div 
              onClick={() => onNavigateToTab('movements')}
              className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'خروجی امروز' : "Today's Outflow"}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-rose-400 font-mono">{todaysStockOut}</span>
                <span className="text-[9px] text-slate-400 font-bold">{isRtl ? 'واحد' : 'units'}</span>
              </div>
            </div>

            {/* Corrections */}
            <div 
              onClick={() => onNavigateToTab('movements')}
              className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'اصلاحات دستی' : 'Recent Corrections'}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-amber-400 font-mono">{recentCorrectionsCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">{isRtl ? 'عملیات' : 'actions'}</span>
              </div>
            </div>

            {/* Resets */}
            <div 
              onClick={() => onNavigateToTab('movements')}
              className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'بازنشانی موجودی' : 'Inventory Resets'}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-blue-400 font-mono">{recentResetsCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">{isRtl ? 'مورد' : 'events'}</span>
              </div>
            </div>

            {/* Deleted Products */}
            <div 
              onClick={() => onNavigateToTab('inventory')}
              className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1 cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98]"
            >
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isRtl ? 'کالاهای حذف‌شده' : 'Deleted Products'}
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-slate-400 font-mono">{deletedProductsCount}</span>
                <span className="text-[9px] text-slate-400 font-bold">{isRtl ? 'کالا' : 'items'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Visual Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Inventory Distribution Chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Boxes size={14} className="text-blue-600" />
            {t.inventoryDistribution}
          </h3>
          <div className="h-64 w-full text-[10px]">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                {t.emptyInventory}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="stock" fill="#2563eb" radius={[6, 6, 0, 0]}>
                    {inventoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Movements Trend Chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-600" />
            {t.movementTrends}
          </h3>
          <div className="h-64 w-full text-[10px]">
            {movements.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-bold">
                {t.emptyMovements}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementTrendData}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="IN" name={lang === 'fa' ? 'ورودی' : 'Inflow (IN)'} stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="OUT" name={lang === 'fa' ? 'خروجی' : 'Outflow (OUT)'} stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Warning & Recent Action Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Low Stock Alerts Panel (5 cols) */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-500" />
              <span>{t.lowStockAlerts}</span>
            </h3>
            <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full font-bold">
              {lowStockCount}
            </span>
          </div>

          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                ✅ {lang === 'fa' ? 'موجودی تمام کالاها در وضعیت مطلوب است.' : 'All items are safely above minimum levels.'}
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.sku} className="flex items-center justify-between p-3 bg-rose-50/40 rounded-2xl border border-rose-100/50">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">{p.sku}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-md font-bold">{p.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-600">
                      {p.quantity} {p.unit}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold">{lang === 'fa' ? 'حد هشدار:' : 'min:'} {p.minStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities list (7 cols) */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-slate-800" />
              <span>{t.recentActivity}</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('movements')}
              className="text-[11px] font-extrabold text-blue-600 hover:underline cursor-pointer"
            >
              {lang === 'fa' ? 'مشاهده همه لیست' : 'View Logs'}
            </button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {movements.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                {t.emptyMovements}
              </div>
            ) : (
              [...movements]
                .reverse()
                .slice(0, 4)
                .map((m) => {
                  const isIN = m.type === 'IN';
                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8.5 rounded-xl flex items-center justify-center shrink-0 ${
                          isIN ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isIN ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div className="space-y-0.5 truncate max-w-[180px] sm:max-w-xs">
                          <p className="text-xs font-black text-slate-800 truncate">{m.productName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-400 font-bold">{m.productSku}</span>
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 truncate">
                              <User size={10} />
                              {m.personName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black ${isIN ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIN ? '+' : '-'}{m.quantity}
                        </span>
                        <p className="text-[8px] text-slate-400 font-mono font-semibold mt-0.5">
                          {new Date(m.date).toLocaleDateString(isRtl ? 'fa-IR' : 'en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
