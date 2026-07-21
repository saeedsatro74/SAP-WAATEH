import React, { useState } from 'react';
import { WarehouseConfig, UserSession, Product } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import Avatar from './Avatar';
import InfoCard from './InfoCard';
import { SUPABASE_SQL_SETUP } from '../supabase';
import {
  Settings,
  Grid,
  MapPin,
  RefreshCw,
  Globe,
  User,
  Users,
  BellRing,
  Shield,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Mail,
  Building,
  KeyRound,
  Copy,
  Terminal
} from 'lucide-react';

interface SettingsTabProps {
  config: WarehouseConfig;
  onSaveConfig: (newConfig: WarehouseConfig) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onResetData: () => void;
  session: UserSession;
  onUpdateProfile: (updatedSession: UserSession) => void;
  usersList: UserSession[];
  onUpdateUsersList: (updatedUsers: UserSession[]) => void;
  globalMinStock: number;
  onSaveGlobalMinStock: (val: number) => void;
  products: Product[];
}

export default function SettingsTab({
  config,
  onSaveConfig,
  lang,
  setLang,
  onResetData,
  session,
  onUpdateProfile,
  usersList,
  onUpdateUsersList,
  globalMinStock,
  onSaveGlobalMinStock,
  products,
}: SettingsTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  // State for sub-tabs inside Settings
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'users' | 'warehouse' | 'alerts' | 'purge'>('profile');

  const [copiedResetSql, setCopiedResetSql] = useState(false);
  const [showResetInstructions, setShowResetInstructions] = useState(false);

  // Sub-tab 1: Profile Settings state
  const [profileName, setProfileName] = useState(session.name);
  const [profilePhone, setProfilePhone] = useState(session.phone || '');
  const [profileBio, setProfileBio] = useState(session.bio || '');
  const [profileDept, setProfileDept] = useState(session.department || '');
  const [profilePic, setProfilePic] = useState(session.picture || '');

  // Sub-tab 2: User management state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');
  const [newUserDept, setNewUserDept] = useState('');

  // Sub-tab 3: Physical Structure state
  const [racks, setRacks] = useState(config.racksCount);
  const [shelves, setShelves] = useState(config.shelvesCount);
  const [positions, setPositions] = useState(config.positionsCount);

  // Sub-tab 4: Alerts state
  const [minStock, setMinStock] = useState(globalMinStock);

  // Success messages
  const [successMsg, setSuccessMsg] = useState('');

  // User deletion modal and progress states
  const [userToDelete, setUserToDelete] = useState<UserSession | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false);

  // Purge Confirmation States
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeInputText, setPurgeInputText] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // 1. Save Profile Settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSession = {
      ...session,
      name: profileName.trim() || session.name,
      phone: profilePhone.trim(),
      bio: profileBio.trim(),
      department: profileDept.trim(),
      picture: profilePic,
    };
    onUpdateProfile(updated);
    triggerSuccess(t.profileUpdateSuccess);
  };

  // 2. Add system user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    // Check if email already exists
    if (usersList.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      alert(lang === 'fa' ? 'این ایمیل قبلاً ثبت شده است!' : 'This email is already registered!');
      return;
    }

    const newUser: UserSession = {
      isLoggedIn: false,
      email: newUserEmail.trim().toLowerCase(),
      name: newUserName.trim(),
      role: newUserRole,
      department: newUserDept.trim(),
      picture: '',
    };

    setIsAddingUser(true);
    try {
      await onUpdateUsersList([...usersList, newUser]);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserDept('');
      setNewUserRole('operator');
      triggerSuccess(t.userAddedSuccess);
    } catch (err: any) {
      console.error("Add user error:", err);
      alert(lang === 'fa' ? `خطا در افزودن کاربر: ${err.message || err}` : `Error adding user: ${err.message || err}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (email: string) => {
    if (session.role !== 'admin') {
      alert(lang === 'fa' ? 'خطای عدم دسترسی: فقط مدیران سیستم مجاز به حذف کاربر هستند.' : 'Permission Denied: Only administrators are authorized to delete users.');
      return;
    }
    if (email.toLowerCase() === session.email.toLowerCase()) {
      alert(lang === 'fa' ? 'شما نمی‌توانید حساب مدیریت خود را حذف کنید!' : 'You cannot delete your own administrator account.');
      return;
    }
    const filtered = usersList.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    setIsDeletingUser(true);
    try {
      await onUpdateUsersList(filtered);
      triggerSuccess(lang === 'fa' ? 'کاربر با موفقیت حذف شد.' : 'User deleted successfully.');
    } catch (err: any) {
      console.error("Delete user error:", err);
      alert(lang === 'fa' ? `خطا در حذف کاربر: ${err.message || err}` : `Failed to delete user: ${err.message || err}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Change user role
  const handleToggleUserRole = async (email: string) => {
    if (session.role !== 'admin') {
      alert(lang === 'fa' ? 'خطای عدم دسترسی: فقط مدیران سیستم مجاز به تغییر نقش کاربران هستند.' : 'Permission Denied: Only administrators are authorized to manage user roles.');
      return;
    }
    if (email.toLowerCase() === session.email.toLowerCase()) {
      alert(lang === 'fa' ? 'شما نمی‌توانید نقش حساب فعال خود را تغییر دهید!' : 'You cannot change your own active account role!');
      return;
    }
    const updated = usersList.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const nextRole: 'admin' | 'operator' = u.role === 'admin' ? 'operator' : 'admin';
        return { ...u, role: nextRole };
      }
      return u;
    });
    setIsUpdatingUserRole(true);
    try {
      await onUpdateUsersList(updated);
      triggerSuccess(lang === 'fa' ? 'نقش کاربر با موفقیت تغییر یافت.' : 'User role updated successfully.');
    } catch (err: any) {
      console.error("Toggle user role error:", err);
      alert(lang === 'fa' ? `خطا در تغییر نقش کاربر: ${err.message || err}` : `Error changing user role: ${err.message || err}`);
    } finally {
      setIsUpdatingUserRole(false);
    }
  };

  // 3. Save Warehouse physical structure config
  const handleApplyWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRacks = Math.max(1, Math.min(20, racks));
    const cleanShelves = Math.max(1, Math.min(10, shelves));
    const cleanPositions = Math.max(1, Math.min(10, positions));

    setRacks(cleanRacks);
    setShelves(cleanShelves);
    setPositions(cleanPositions);

    onSaveConfig({
      racksCount: cleanRacks,
      shelvesCount: cleanShelves,
      positionsCount: cleanPositions,
    });
    triggerSuccess(t.configSuccess);
  };

  // 4. Save Alerts Stock Settings
  const handleSaveAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGlobalMinStock(minStock);
    triggerSuccess(t.alertSettingsSuccess);
  };

  // Products under warning (specific warning + global fallback if none)
  const lowStockProducts = products.filter(p => {
    const threshold = p.minStock !== undefined ? p.minStock : globalMinStock;
    return p.quantity <= threshold;
  });

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-xs max-w-4xl mx-auto font-sans text-slate-800 flex flex-col md:flex-row overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Settings Navigation Sidebar */}
      <div className={`w-full md:w-64 bg-slate-50/70 border-b md:border-b-0 ${isRtl ? 'md:border-l' : 'md:border-r'} border-slate-100 p-5 flex flex-col gap-1 shrink-0`}>
        <div className="flex items-center gap-2 mb-6 px-1">
          <Settings className="text-blue-600 animate-spin-slow" size={20} />
          <div>
            <h2 className="text-sm font-black text-slate-900">{t.settings}</h2>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{lang === 'fa' ? 'تنظیمات سامانه واته' : 'System Configuration'}</p>
          </div>
        </div>

        {/* Sub-tab buttons */}
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-right w-full ${
            activeSubTab === 'profile'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User size={15} />
          <span>{t.profileSettings}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-right w-full ${
            activeSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users size={15} />
            <span>{t.userManagement}</span>
          </div>
          {session.role !== 'admin' && (
            <KeyRound size={12} className={activeSubTab === 'users' ? 'text-white' : 'text-slate-400'} />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('warehouse')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-right w-full ${
            activeSubTab === 'warehouse'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Grid size={15} />
          <span>{t.warehouseSettings}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-right w-full ${
            activeSubTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BellRing size={15} />
            <span>{t.stockAlertSettings}</span>
          </div>
          {lowStockProducts.length > 0 && (
            <span className={`size-4 rounded-full flex items-center justify-center text-[8px] font-black ${
              activeSubTab === 'alerts' ? 'bg-white text-blue-600' : 'bg-amber-500 text-white'
            }`}>
              {lowStockProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('purge')}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-right w-full ${
            activeSubTab === 'purge'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/15'
              : 'text-rose-600 hover:bg-rose-50/60'
          }`}
        >
          <Trash2 size={15} />
          <span>{lang === 'fa' ? 'حذف و پاک‌سازی کل انبار' : 'Purge Warehouse Data'}</span>
        </button>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
          {/* Language selector built-in */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
              <Globe size={10} className="inline mr-1" />
              {lang === 'fa' ? 'زبان سامانه' : 'Language'}
            </span>
            <div className="flex bg-white border border-slate-200 p-0.5 rounded-lg text-[10px]">
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-1 rounded-md text-center font-black transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('fa')}
                className={`flex-1 py-1 rounded-md text-center font-black transition-all cursor-pointer ${
                  lang === 'fa' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                فارسی
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Content Area */}
      <div className="flex-grow p-6 md:p-8 space-y-6">
        <InfoCard
          cardKey={`settings-${activeSubTab}`}
          englishText={
            activeSubTab === 'warehouse'
              ? 'Manage warehouse structure, storage locations, racks, and organization.'
              : 'Configure system preferences, warehouse settings, and application options.'
          }
          persianText={
            activeSubTab === 'warehouse'
              ? 'مدیریت ساختار فیزیکی انبار، مکان‌های ذخیره‌سازی، قفسه‌ها و آرایش سازمان‌دهی کالاها.'
              : 'پیکربندی تنظیمات کلی سامانه، پارامترهای پیش‌فرض انبار و گزینه‌های سفارشی‌سازی برنامه.'
          }
          lang={lang}
        />
        
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-emerald-600 text-xs font-bold shadow-sm">
            ✓ {successMsg}
          </div>
        )}

        {/* 1. PROFILE SETTINGS PANEL */}
        {activeSubTab === 'profile' && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">{t.profileSettings}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lang === 'fa' ? 'اطلاعات کاربری خود را بروزرسانی کنید' : 'Manage your default display identity and contact info'}</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <Avatar picture={profilePic} name={profileName} sizeClass="size-16" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                    🛡️ {lang === 'fa' ? 'همگام‌سازی با گوگل' : 'Synced with Google'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'fa'
                      ? 'تصویر پروفایل شما به صورت خودکار از حساب گوگل دریافت می‌شود.'
                      : 'Your avatar is loaded securely from Google Single Sign-On.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.department}
                  </label>
                  <input
                    type="text"
                    value={profileDept}
                    onChange={(e) => setProfileDept(e.target.value)}
                    placeholder="e.g. Storage Division"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+98-912..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.emailAddress} (read-only)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={session.email}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-500 cursor-not-allowed text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                  {t.bio}
                </label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Short bio about warehouse roles..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 shadow-xs resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. USER MANAGEMENT PANEL (Admin Only validation) */}
        {activeSubTab === 'users' && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">{t.userManagement}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.userManagementSub}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                session.role === 'admin' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {session.role === 'admin' ? 'ADMIN ACTIVE' : 'LOCKED'}
              </span>
            </div>

            {session.role !== 'admin' ? (
              <div className="bg-slate-50 border border-slate-200/50 p-6 rounded-3xl text-center space-y-3">
                <div className="size-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <KeyRound size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-800">
                    {lang === 'fa' ? 'عدم دسترسی به بخش مدیریت کاربران' : 'Access Restricted to Administrator Role'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {lang === 'fa' 
                      ? 'تنها حساب‌های کاربری با سطح دسترسی مدیر کل قادر به مدیریت کاربران، تغییر نقش‌ها و اضافه کردن اپراتورهای جدید هستند.'
                      : 'You are currently logged in as a Warehouse User. This module is read-only or restricted.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Add new user inline form */}
                <form onSubmit={handleAddUser} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-700 flex items-center gap-1">
                    <Plus size={14} className="text-blue-600" />
                    <span>{t.addUser}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      placeholder={lang === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="email"
                      required
                      placeholder={lang === 'fa' ? 'آدرس ایمیل' : 'Email Address'}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 text-left"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'fa' ? 'بخش / دپارتمان' : 'Department'}
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'operator')}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      <option value="operator">{lang === 'fa' ? 'کاربر انبار' : 'Warehouse Operator'}</option>
                      <option value="admin">{lang === 'fa' ? 'مدیر ارشد' : 'Admin'}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                  >
                    {lang === 'fa' ? 'ثبت و فعال‌سازی کاربر در سیستم' : 'Register Operator'}
                  </button>
                </form>

                {/* User lists */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    {lang === 'fa' ? 'اپراتورهای فعال سیستم' : 'Registered System Operators'} ({usersList.length})
                  </h4>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {usersList.map((user) => {
                      const isActiveMe = user.email.toLowerCase() === session.email.toLowerCase();
                      return (
                        <div key={user.email} className={`flex items-center justify-between p-3.5 bg-white transition-all hover:bg-slate-50/50 ${
                          isActiveMe ? 'bg-blue-50/30' : ''
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar picture={user.picture} name={user.name} sizeClass="size-9" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800 truncate">{user.name}</span>
                                {isActiveMe && (
                                  <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                    {lang === 'fa' ? 'شما' : 'You'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Department display */}
                            {user.department && (
                              <span className="hidden sm:inline bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded-lg">
                                {user.department}
                              </span>
                            )}

                            {/* Role toggler */}
                            <button
                              onClick={() => handleToggleUserRole(user.email)}
                              disabled={isActiveMe}
                              className={`px-2.5 py-1 rounded-xl text-[9px] font-black border transition-all ${
                                user.role === 'admin'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              } ${isActiveMe ? 'cursor-not-allowed hover:bg-blue-50' : 'cursor-pointer'}`}
                              title={lang === 'fa' ? 'تغییر نقش کاربری' : 'Change User Role'}
                            >
                              {user.role === 'admin' ? t.roleAdmin : t.roleUser}
                            </button>

                            {/* Delete button */}
                            {session.role === 'admin' && (
                              <button
                                onClick={() => {
                                  if (session.role !== 'admin') {
                                    alert(lang === 'fa' ? 'خطای عدم دسترسی: شما دسترسی کافی برای حذف کاربر را ندارید.' : 'Permission Denied: Only administrators are authorized to delete users.');
                                    return;
                                  }
                                  if (user.email.toLowerCase() === session.email.toLowerCase()) {
                                    alert(lang === 'fa' ? 'شما نمی‌توانید حساب مدیریت خود را حذف کنید!' : 'You cannot delete your own administrator account.');
                                    return;
                                  }
                                  setUserToDelete(user);
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'fa' ? 'حذف کاربر' : 'Remove Operator'}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 3. WAREHOUSE STRUCTURE CONFIG */}
        {activeSubTab === 'warehouse' && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">{t.warehouseSettings}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lang === 'fa' ? 'تعریف ظرفیت و بخش‌بندی فیزیکی انبار' : 'Define racks, shelves, and positions layout'}</p>
              </div>
            </div>

            <form onSubmit={handleApplyWarehouse} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Racks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.racksCount}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={racks}
                    onChange={(e) => setRacks(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 text-center shadow-xs"
                  />
                </div>

                {/* Shelves */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.shelvesCount}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={shelves}
                    onChange={(e) => setShelves(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 text-center shadow-xs"
                  />
                </div>

                {/* Positions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 block px-1">
                    {t.positionsCount}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={positions}
                    onChange={(e) => setPositions(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black text-slate-800 focus:outline-none focus:border-blue-600 text-center shadow-xs"
                  />
                </div>
              </div>

              {/* Format Preview */}
              <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <MapPin size={13} className="text-blue-600" />
                  <span>{t.locationFormat}</span>
                </span>
                <span className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  R{racks}-S{shelves}-L{positions}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                {t.saveConfig}
              </button>
            </form>
          </div>
        )}

        {/* 5. DATA PURGE & RESET CONTROL PANEL */}
        {activeSubTab === 'purge' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                <Trash2 size={16} />
                <span>{lang === 'fa' ? 'پاک‌سازی و حذف دائم کل اطلاعات انبار' : 'Purge All Warehouse Data'}</span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {lang === 'fa'
                  ? 'کنترل پنل مخصوص مدیریت جهت صفر کردن موجودی کالاها و پاک‌سازی سوابق انبار'
                  : 'Administrator dashboard to purge inventory, reset stocks, and delete transaction history'}
              </p>
            </div>

            <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-rose-800">
                    {lang === 'fa' ? 'توجه: این اقدام غیرقابل بازگشت است!' : 'Warning: This action is permanent!'}
                  </h4>
                  <p className="text-[10px] font-bold text-rose-600/80 leading-relaxed">
                    {lang === 'fa'
                      ? 'با فشردن دکمه پاک‌سازی زیر، تمامی اطلاعات کالاها، مقادیر موجودی، گزارش‌های ورود و خروج، و اصلاحات ثبتی به صورت دائم حذف و صفر خواهند شد.'
                      : 'Running this action will permanently wipe out all inventory products, quantities, transaction records, and adjustment history.'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-rose-100/50 p-4 rounded-xl space-y-2.5 text-xs">
                <span className="font-extrabold text-slate-500 block">
                  {lang === 'fa' ? '📊 مواردی که کاملاً پاک خواهند شد:' : '📊 Items to be completely deleted:'}
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-bold text-slate-600 pr-2">
                  <li>{lang === 'fa' ? 'تمامی کالاهای ثبت شده در انبار (محصولات)' : 'All registered products in the system'}</li>
                  <li>{lang === 'fa' ? 'سوابق تمامی تراکنش‌های ورودی و خروجی (Movements)' : 'All check-in and check-out transaction logs'}</li>
                  <li>{lang === 'fa' ? 'گزارش‌های حسابرسی و اصلاحات فیزیکی موجودی' : 'All manual inventory corrections and audit logs'}</li>
                </ul>
                <div className="border-t border-dashed border-slate-100 my-2.5 pt-2 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                  <Check size={12} />
                  <span>
                    {lang === 'fa'
                      ? 'کاربران تعریف‌شده در سیستم و دسترسی‌ها هیچ تغییری نخواهند کرد.'
                      : 'Registered system users and their login rights will remain untouched.'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                {!showPurgeConfirm ? (
                  <button
                    onClick={() => setShowPurgeConfirm(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 px-5 py-3 rounded-xl text-xs font-black transition-all shadow-md shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <RefreshCw size={14} />
                    <span>{lang === 'fa' ? 'تایید و پاک‌سازی کل اطلاعات انبار' : 'Confirm & Purge All Data'}</span>
                  </button>
                ) : (
                  <div className="bg-rose-100/40 border border-rose-200/60 p-4 rounded-xl space-y-4 animate-fade-in text-right" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                    <p className="text-[11px] font-bold text-rose-950 leading-relaxed">
                      {lang === 'fa'
                        ? '⚠️ هشدار جدی: آیا از حذف کامل تمامی کالاها، تراکنش‌ها و سوابق اطمینان دارید؟ این عمل غیرقابل بازگشت است. برای تایید نهایی، لطفاً کلمه "DELETE" را در کادر زیر بنویسید:'
                        : '⚠️ CRITICAL WARNING: Are you sure you want to delete all products, movements, and audits? This cannot be undone. To confirm, please type "DELETE" below:'}
                    </p>
                    <input
                      type="text"
                      value={purgeInputText}
                      onChange={(e) => setPurgeInputText(e.target.value)}
                      placeholder={lang === 'fa' ? 'عبارت DELETE را تایپ کنید' : 'Type DELETE to confirm'}
                      className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-center focus:outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                    />
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => {
                          if (purgeInputText.trim() === 'DELETE') {
                            onResetData();
                            setShowPurgeConfirm(false);
                            setPurgeInputText('');
                          }
                        }}
                        disabled={purgeInputText.trim() !== 'DELETE'}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        <span>{lang === 'fa' ? 'بله، حذف نهایی کل انبار' : 'Yes, Delete All Data'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPurgeConfirm(false);
                          setPurgeInputText('');
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer"
                      >
                        <span>{lang === 'fa' ? 'انصراف' : 'Cancel'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Database Reset Instructions Toggle */}
            <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-2xl space-y-2">
              <button
                type="button"
                onClick={() => setShowResetInstructions(!showResetInstructions)}
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 underline cursor-pointer flex items-center gap-1.5"
              >
                <Terminal size={12} />
                <span>
                  {lang === 'fa' 
                    ? 'اگر دکمه بالا با خطا مواجه شد (راهنمای کدهای SQL پایگاه داده)' 
                    : 'If the reset button fails (SQL Setup Guide)'}
                </span>
              </button>

              {showResetInstructions && (
                <div className="mt-3 bg-slate-900 rounded-2xl p-4 text-left border border-slate-800 space-y-3 animate-fade-in" dir="ltr">
                  <p className="text-[10px] font-bold text-slate-300 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
                    {lang === 'fa'
                      ? 'به دلیل فعال بودن سیستم امنیت RLS در Supabase، مرورگر ممکن است دسترسی لازم برای حذف کامل را نداشته باشد. لطفا دکمه «کپی کد SQL» در زیر را بزنید، سپس آن را در بخش SQL Editor در داشبورد کاربری Supabase خود جای‌گذاری (Paste) و اجرا (Run) کنید تا پایگاه داده مجدداً راه‌اندازی و دکمه حذف فعال شود:'
                      : 'Due to active Row Level Security (RLS) policies in your Supabase database, direct browser delete actions might be blocked. Click "Copy SQL Code" below, open the SQL Editor in your Supabase dashboard, paste, and click RUN to safely authorize database resets:'}
                  </p>
                  
                  <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-t-xl border-b border-slate-800 text-[9px] font-mono font-bold text-slate-500">
                    <span className="text-blue-400 flex items-center gap-1">
                      <Terminal size={10} />
                      <span>enable_purge_function.sql</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                        setCopiedResetSql(true);
                        setTimeout(() => setCopiedResetSql(false), 2000);
                      }}
                      className="hover:text-white text-slate-400 transition-colors cursor-pointer flex items-center gap-1 font-sans text-[10px]"
                    >
                      {copiedResetSql ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy SQL Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-b-xl text-[9px] font-mono text-slate-300 max-h-40 overflow-y-auto leading-normal whitespace-pre-wrap select-all">
                    {SUPABASE_SQL_SETUP}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. STOCK ALERT SETTINGS PANEL */}
        {activeSubTab === 'alerts' && (
          <div className="space-y-5 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">{t.stockAlertSettings}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.stockAlertSettingsSub}</p>
            </div>

            <form onSubmit={handleSaveAlerts} className="space-y-4">
              <div className="bg-slate-50/70 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <BellRing size={14} className="text-blue-600" />
                    <span>{t.globalMinStock}</span>
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400">{t.globalMinStockSub}</p>
                </div>

                <div className="flex gap-4 items-center">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={minStock}
                    onChange={(e) => setMinStock(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-800 text-center w-28 shadow-xs focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-[10px] font-bold text-slate-400">
                    {lang === 'fa' ? 'واحد کالا در دپو' : 'units in inventory'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.saveChanges}
              </button>
            </form>

            {/* List of active low stock alerts */}
            <div className="space-y-2 pt-4">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                <span>{lang === 'fa' ? 'کالاهای زیر حد بحرانی در حال حاضر' : 'Currently Active Warnings'} ({lowStockProducts.length})</span>
              </h4>

              {lowStockProducts.length === 0 ? (
                <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-center text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  <span>{lang === 'fa' ? 'تمام اقلام دارای موجودی کافی و بالاتر از حد مجاز هستند.' : 'All items are healthy and above threshold limits.'}</span>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {lowStockProducts.map(p => {
                    const threshold = p.minStock !== undefined ? p.minStock : minStock;
                    return (
                      <div key={p.sku} className="p-3 bg-amber-50/15 hover:bg-amber-50/30 flex justify-between items-center text-xs transition-colors">
                        <div>
                          <p className="font-black text-slate-800">{p.name}</p>
                          <p className="text-[9px] font-mono text-slate-400">SKU: {p.sku} • Location: {p.location}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg">
                            {p.quantity} / {threshold} {p.unit}
                          </span>
                          <p className="text-[9px] font-bold text-rose-400 mt-0.5">{lang === 'fa' ? 'موجودی رو به اتمام' : 'Low Stock Warning'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Custom User Delete Confirmation Modal Overlay */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="delete-user-modal">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUserToDelete(null)}></div>
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-100 space-y-4 font-sans">
            <h3 className="text-lg font-black text-slate-900" id="delete-user-modal-title">
              {lang === 'fa' ? 'حذف کاربر' : 'Delete User'}
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed" id="delete-user-modal-message">
              {lang === 'fa' 
                ? 'آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟'
                : 'Are you sure you want to delete this user?'}
            </p>
            <div className="flex gap-3 pt-2 justify-end">
              <button 
                type="button" 
                id="delete-user-cancel-btn"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button 
                type="button" 
                id="delete-user-confirm-btn"
                disabled={isDeletingUser}
                onClick={async () => {
                  if (session.role !== 'admin') {
                    alert(lang === 'fa' ? 'خطای عدم دسترسی: شما دسترسی کافی برای حذف کاربر را ندارید.' : 'Permission Denied: Only administrators are authorized to delete users.');
                    return;
                  }
                  if (userToDelete.email.toLowerCase() === session.email.toLowerCase()) {
                    alert(lang === 'fa' ? 'شما نمی‌توانید حساب مدیریت خود را حذف کنید!' : 'You cannot delete your own administrator account.');
                    return;
                  }
                  setIsDeletingUser(true);
                  try {
                    // Filter and request delete through onUpdateUsersList
                    const filtered = usersList.filter(u => u.email.toLowerCase() !== userToDelete.email.toLowerCase());
                    await onUpdateUsersList(filtered);
                    triggerSuccess(lang === 'fa' ? 'کاربر با موفقیت حذف شد.' : 'User deleted successfully.');
                    setUserToDelete(null);
                  } catch (err: any) {
                    console.error("Failed to delete user:", err);
                    alert(lang === 'fa' ? `خطا در حذف کاربر: ${err.message || err}` : `Failed to delete user: ${err.message || err}`);
                  } finally {
                    setIsDeletingUser(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingUser ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {lang === 'fa' ? 'در حال حذف...' : 'Deleting...'}
                  </>
                ) : (
                  lang === 'fa' ? 'حذف' : 'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
