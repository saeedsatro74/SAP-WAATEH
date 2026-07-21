import React, { useState } from 'react';
import { UserSession, Movement } from '../types';
import { Language, TRANSLATIONS } from '../translations';
import Avatar from './Avatar';
import InfoCard from './InfoCard';
import {
  User,
  Mail,
  Shield,
  Phone,
  FileText,
  Building,
  Check,
  Award,
  Activity,
  Lock,
  Layers,
  Globe
} from 'lucide-react';

interface ProfileTabProps {
  session: UserSession;
  movements: Movement[];
  onUpdateProfile: (updatedSession: UserSession) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function ProfileTab({
  session,
  movements,
  onUpdateProfile,
  lang,
  setLang,
}: ProfileTabProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'fa';

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session.name);
  const [phone, setPhone] = useState(session.phone || '');
  const [bio, setBio] = useState(session.bio || '');
  const [department, setDepartment] = useState(session.department || '');
  const [picture, setPicture] = useState(session.picture || '');
  const [success, setSuccess] = useState('');

  // Count movements performed by this user
  const userMovementsCount = movements.filter(
    (m) => m.personName.toLowerCase() === session.name.toLowerCase()
  ).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    const updated: UserSession = {
      ...session,
      name: name.trim() || session.name,
      phone: phone.trim(),
      bio: bio.trim(),
      department: department.trim(),
      picture,
    };

    onUpdateProfile(updated);
    setSuccess(t.profileUpdateSuccess);
    setIsEditing(false);

    setTimeout(() => setSuccess(''), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <InfoCard
        cardKey="profile"
        englishText="Manage your personal information, contact details, and account settings."
        persianText="مدیریت اطلاعات شخصی، اطلاعات تماس، بیوگرافی و تنظیمات حساب کاربری فعال."
        lang={lang}
      />
      
      {/* Title block */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-sm font-black text-slate-900">{t.profile}</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t.profileSub}</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-600 text-xs font-bold shadow-sm">
          ✓ {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card View / Left Side */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar picture={picture} name={session.name} sizeClass="size-28" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-900">{session.name}</h2>
            <p className="text-xs font-mono text-slate-400">{session.email}</p>
          </div>

          {/* Role badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${
            session.role === 'admin'
              ? 'bg-blue-50 text-blue-600 border border-blue-100'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          }`}>
            <Shield size={12} />
            <span>{session.role === 'admin' ? t.roleAdmin : t.roleUser}</span>
          </span>

          <div className="w-full border-t border-slate-100 my-2 pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {lang === 'fa' ? 'دپارتمان' : 'Department'}
              </span>
              <p className="text-xs font-bold text-slate-700">{session.department || (lang === 'fa' ? 'نامشخص' : 'N/A')}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {lang === 'fa' ? 'ثبت‌های شما' : 'Your Logged Activities'}
              </span>
              <p className="text-xs font-black text-blue-600 flex items-center justify-center gap-1">
                <Activity size={12} />
                <span>{userMovementsCount}</span>
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200/50 cursor-pointer"
            >
              {lang === 'fa' ? 'ویرایش پروفایل' : 'Edit Profile Details'}
            </button>
          )}

          {/* System Language Selector */}
          <div className="w-full border-t border-slate-100 pt-4 space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Globe size={11} className="text-slate-400" />
              <span>{lang === 'fa' ? 'زبان سامانه (فارسی / EN)' : 'System Language'}</span>
            </span>
            <div className="flex bg-slate-50 border border-slate-200 p-0.5 rounded-xl text-[10px] w-full">
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-1.5 rounded-lg text-center font-black transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('fa')}
                className={`flex-1 py-1.5 rounded-lg text-center font-black transition-all cursor-pointer ${
                  lang === 'fa' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                فارسی
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content Details & Editor / Right Side */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 mb-4">
                {lang === 'fa' ? 'بروزرسانی مشخصات کاربری' : 'Edit Personal Settings'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                    {t.department}
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Logistics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+98-912..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs text-left"
                    dir="ltr"
                  />
                </div>

                {/* Whitelisted system notice */}
                <div className="space-y-1 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                    🛡️ {lang === 'fa' ? 'اطلاعات حساب گوگل شما' : 'Google Account Profile'}
                  </span>
                  <p className="text-[10px] text-blue-600 font-medium">
                    {lang === 'fa'
                      ? 'تصویر و ایمیل شما مستقیماً از حساب ایمن گوگل همگام‌سازی می‌شود.'
                      : 'Your avatar picture and email are synced securely from your Google identity.'}
                  </p>
                </div>
              </div>

              {/* Bio notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                  {t.bio}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your role or general details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-xs resize-none"
                />
              </div>

              {/* Actions submit */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setName(session.name);
                    setPhone(session.phone || '');
                    setBio(session.bio || '');
                    setDepartment(session.department || '');
                    setPicture(session.picture || '');
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-colors"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Award size={15} className="text-blue-600" />
                <span>{lang === 'fa' ? 'مشخصات کامل حساب' : 'Full Account Details'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {t.fullName}
                  </span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>{session.name}</span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {t.emailAddress}
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{session.email}</span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {t.role}
                  </span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield size={13} className="text-slate-400" />
                    <span>{session.role === 'admin' ? t.roleAdmin : t.roleUser}</span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {t.phone}
                  </span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    <span>{session.phone || (lang === 'fa' ? 'ثبت نشده' : 'No phone set')}</span>
                  </p>
                </div>

                <div className="space-y-0.5 md:col-span-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    {t.bio}
                  </span>
                  <p className="text-xs font-bold text-slate-600 bg-slate-50/80 border border-slate-100 p-3 rounded-xl flex items-start gap-2 italic">
                    <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{session.bio || (lang === 'fa' ? 'توضیحاتی ثبت نشده است.' : 'No description provided yet.')}</span>
                  </p>
                </div>
              </div>

              {/* Secure Auth Info / Future connection readiness */}
              <div className="border-t border-slate-100 pt-5 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  🛡️ {lang === 'fa' ? 'وضعیت امنیت و احراز هویت' : 'Security & Active Credentials'}
                </span>
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Lock size={12} />
                    <span>{lang === 'fa' ? 'اتصال امن و رمزنگاری‌شده برقرار است' : 'Secure Encrypted Session Active'}</span>
                  </span>
                  <span className="font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {lang === 'fa' ? 'روش: ورود یکپارچه ابری' : 'METHOD: Federated Cloud Identity'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
