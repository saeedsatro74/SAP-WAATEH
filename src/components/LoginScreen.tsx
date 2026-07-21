import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { supabase } from '../supabase';

interface LoginScreenProps {
  lang: Language;
  setLang: (l: Language) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  onGoogleLogin?: () => void;
  authLoading?: boolean;
}

const LOCAL_TEXTS = {
  fa: {
    signIn: 'ورود به سیستم',
    signUp: 'ثبت‌نام اپراتور انبار',
    email: 'آدرس ایمیل',
    password: 'رمز عبور',
    fullName: 'نام و نام خانوادگی',
    emailPlaceholder: 'example@company.com',
    passwordPlaceholder: 'حداقل ۶ کاراکتر',
    fullNamePlaceholder: 'نام و نام خانوادگی شما',
    loginBtn: 'ورود به حساب کاربری',
    signupBtn: 'عضویت و ثبت‌نام',
    or: 'یا',
    googleLogin: 'ورود با حساب گوگل',
    noAccount: 'هنوز ثبت‌نام نکرده‌اید؟ ساخت حساب جدید',
    hasAccount: 'قبلاً ثبت‌نام کرده‌اید؟ ورود به سیستم',
    signupSuccess: 'ثبت‌نام با موفقیت انجام شد! در صورت نیاز ایمیل فعال‌سازی را تأیید کنید، سپس وارد شوید.',
    invalidCredentials: 'ایمیل یا رمز عبور اشتباه است.',
    requiredFields: 'لطفاً تمامی فیلدها را به درستی تکمیل نمایید.',
    passwordMinLength: 'رمز عبور باید حداقل ۶ کاراکتر باشد.'
  },
  en: {
    signIn: 'Sign In',
    signUp: 'Operator Registration',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    emailPlaceholder: 'example@company.com',
    passwordPlaceholder: 'Minimum 6 characters',
    fullNamePlaceholder: 'Your full name',
    loginBtn: 'Sign In to Account',
    signupBtn: 'Register & Sign In',
    or: 'OR',
    googleLogin: 'Sign In with Google',
    noAccount: "Don't have an account? Sign up now",
    hasAccount: 'Already registered? Sign in here',
    signupSuccess: 'Registration successful! Confirm activation email if required, then sign in.',
    invalidCredentials: 'Invalid email or password.',
    requiredFields: 'Please fill in all fields correctly.',
    passwordMinLength: 'Password must be at least 6 characters.'
  }
};

export default function LoginScreen({ lang, setLang, authError, setAuthError, onGoogleLogin, authLoading = false }: LoginScreenProps) {
  const tGlobal = TRANSLATIONS[lang];
  const tLocal = LOCAL_TEXTS[lang];

  // Tabs: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isRtl = lang === 'fa';
  const loading = authLoading || actionLoading;

  // Trigger Google Sign In using Supabase OAuth with popup support
  const handleGoogleLogin = async () => {
    if (onGoogleLogin) {
      onGoogleLogin();
      return;
    }
    setActionLoading(true);
    setAuthError(null);
    setSuccessMsg(null);

    const redirectToVal = window.location.origin;

    // Detect if we are loaded inside an iframe (e.g. AI Studio preview) or as a top-level window
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch (e) {
        return true;
      }
    })();

    // Detect mobile devices, tablets, or webviews (popups are blocked/broken on mobile or social webviews)
    const isMobileOrWebview = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|FB_IAB|FBAV|Instagram|Telegram/i.test(navigator.userAgent);

    // If running in standalone tab (not in iframe) OR on mobile/webview, use standard direct redirect (100% reliable)
    if (!isInIframe || isMobileOrWebview) {
      console.log("[Auth Action] Standalone tab or mobile device detected inside LoginScreen fallback. Triggering direct redirect flow...");
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectToVal,
            skipBrowserRedirect: false,
            queryParams: {
              prompt: 'select_account'
            }
          },
        });
        if (error) throw error;
      } catch (err: any) {
        console.error('Google Auth Error (Redirect Flow):', err);
        setAuthError(err.message || 'Could not connect with Google Auth');
        setActionLoading(false);
      }
      return;
    }

    try {
      console.log("[Auth Action] Desktop iframe browser detected. Triggering popup window flow...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToVal,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const authWindow = window.open(data.url, 'google_oauth_popup', 'width=600,height=700');
        if (!authWindow) {
          throw new Error(
            lang === 'fa'
              ? 'پنجره ورود مسدود شده است. لطفاً نمایش پاپ‌آپ‌ها را برای این سایت فعال کنید.'
              : 'Popup was blocked by your browser. Please allow popups for this site to log in.'
          );
        }

        const monitorInterval = setInterval(() => {
          if (!authWindow || authWindow.closed) {
            clearInterval(monitorInterval);
            setActionLoading(false);
          }
        }, 1000);
      } else {
        throw new Error('Could not retrieve Google sign-in URL from Supabase.');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setAuthError(err.message || 'Could not connect with Google Auth');
      setActionLoading(false);
    }
  };

  // Trigger Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError(tLocal.requiredFields);
      return;
    }

    setActionLoading(true);
    setAuthError(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        // Humanize common Supabase errors
        if (error.message?.includes('Invalid login credentials')) {
          const detailMsg = lang === 'fa'
            ? 'ایمیل یا رمز عبور اشتباه است.\n\n💡 راهنمایی بسیار مهم:\n۱. مطمئن شوید که قبلاً از تب «ثبت‌نام اپراتور انبار» ثبت‌نام کرده باشید!\n۲. اگر این ایمیل را تازه ثبت‌نام کرده‌اید، به احتمال زیاد باید روی لینک تأیید ارسال‌شده به صندوق ورودی ایمیل خود کلیک کنید.\n۳. چون گزینه "Confirm email" را غیرفعال کرده‌اید، برای کاربرانی که قبلاً (زمانی که گزینه فعال بود) ثبت‌نام کرده بودند، همچنان تأییدیه نیاز است. پیشنهاد می‌شود کاربر قبلی را از بخش Authentication -> Users در پنل سوپابیس خود حذف کنید و دوباره ثبت‌نام کنید تا فوراً وارد شوید!'
            : 'Invalid email or password.\n\n💡 Important Tip:\n1. Make sure you registered under the "Operator Registration" tab first!\n2. If you just registered this email, you likely need to click the activation link sent to your inbox.\n3. Since you disabled "Confirm email", users created before this change still require confirmation. We highly recommend deleting that user from the Authentication -> Users section in your Supabase dashboard and registering them again to log in instantly!';
          throw new Error(detailMsg);
        }
        if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('not confirmed')) {
          const confirmMsg = lang === 'fa'
            ? 'ایمیل شما هنوز تأیید نشده است.\n\n📧 این کاربر قبل از غیرفعال کردن تاییدیه ثبت‌نام شده است و هنوز تایید نشده است.\n\n💡 راه حل فوری و ۳ ثانیه‌ای:\n۱. وارد پنل سوپابیس خود شوید.\n۲. به بخش Authentication -> Users بروید.\n۳. این ایمیل را پیدا کرده و از دکمه سه نقطه (...) گزینه Delete User را بزنید.\n۴. حالا به برنامه برگردید و دوباره همین ایمیل را ثبت‌نام کنید! این بار بدون نیاز به تایید ایمیل، فوراً وارد خواهید شد!'
            : 'Your email has not been confirmed yet.\n\n📧 This user was registered before you disabled email confirmation, so they are still marked as unconfirmed.\n\n💡 Quick 3-Second Solution:\n1. Go to your Supabase Dashboard.\n2. Navigate to Authentication -> Users.\n3. Find this email, click the three dots (...) and select "Delete User".\n4. Now, return here and register this email again! This time, you will log in instantly without any confirmation!';
          throw new Error(confirmMsg);
        }
        throw error;
      }

      console.log("[Auth Success] Signed in with email successfully:", data.session?.user?.email);
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      setAuthError(err.message || 'Authentication failed.');
      setActionLoading(false);
    }
  };

  // Trigger Email & Password Sign Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setAuthError(tLocal.requiredFields);
      return;
    }
    if (password.length < 6) {
      setAuthError(tLocal.passwordMinLength);
      return;
    }

    setActionLoading(true);
    setAuthError(null);
    setSuccessMsg(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // 1. Verify if the email is inside the allowed_users table first
      const { data: allowedData, error: allowedErr } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (allowedErr) {
        console.warn("Could not check whitelist before signup:", allowedErr.message);
      }

      if (!allowedData) {
        const notWhitelistedError = lang === 'fa'
          ? '❌ این ایمیل در لیست کاربران مجاز سیستم ثبت نشده است.\n\nلطفاً ابتدا از مدیر سیستم بخواهید ایمیل شما را در بخش «کاربران مجاز» پنل مدیریت اضافه کند.'
          : '❌ This email is not registered in the system\'s allowed list.\n\nPlease ask the system administrator to add your email in the "Allowed Users" section of the Admin Panel first.';
        throw new Error(notWhitelistedError);
      }

      // 2. If whitelisted, proceed with Supabase auth signUp
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log("[Auth Success] Signed up successfully:", data.user?.email);
      setSuccessMsg(tLocal.signupSuccess);
      
      // Auto toggle to signin tab after registration and fill email
      setActiveTab('signin');
      setPassword('');
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      let errMsg = err.message || 'Registration failed.';
      if (errMsg.includes('Signups not allowed for this instance') || errMsg.includes('signup_disabled')) {
        errMsg = lang === 'fa'
          ? '❌ ثبت‌نام مستقیم با ایمیل در پنل سوپابیس شما غیرفعال (Disable) است.\n\nبرای رفع این مشکل:\n۱. یا در پنل سوپابیس خود از بخش Authentication -> Providers -> Email گزینه "Allow new users to sign up" را فعال کنید.\n۲. یا اپراتورها نیز از دکمه «ورود با حساب گوگل» استفاده کنند، چون سیستم ما کاربران جدید گوگل را به طور خودکار به عنوان اپراتور انبار ثبت‌نام و فعال می‌کند!'
          : '❌ Signups with email/password are disabled in your Supabase project dashboard.\n\nTo resolve this:\n1. In your Supabase dashboard, go to Authentication -> Providers -> Email and enable "Allow new users to sign up".\n2. Alternatively, operators can click "Sign In with Google", which will automatically register them as an operator!';
      }
      setAuthError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 md:p-6 font-sans select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-6 relative overflow-hidden"
        >
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

          {/* SAP Waateh logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/10">
            <span className="text-2xl font-black tracking-tight">SW</span>
          </div>

          {/* Application title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{tGlobal.appName}</h1>
            <h2 className="text-xs font-black text-slate-500">
              {lang === 'fa' ? 'سامانه هوشمند مدیریت انبارداری' : 'Smart Warehouse Management System'}
            </h2>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('signin');
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tLocal.signIn}
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tLocal.signUp}
            </button>
          </div>

          {/* Notification Messages */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-start gap-2.5 text-rose-600 text-xs font-bold leading-relaxed text-right whitespace-pre-line"
            >
              <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span>
                {authError === 'ACCESS_DENIED' ? tGlobal.loginError : authError}
              </span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-start gap-2.5 text-emerald-700 text-xs font-bold leading-relaxed text-right"
            >
              <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Quick Guidance Box for saeedsatro74@gmail.com and other operators */}
          <div className="bg-blue-50/70 border border-blue-100/50 p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-700 leading-relaxed">
            <p className="font-extrabold text-blue-900 flex items-center gap-1.5">
              <span>💡</span>
              <span>
                {lang === 'fa' 
                  ? 'راهنمای ورود مستقیم اپراتور (حساب دمو/تست):' 
                  : 'Quick Operator Access Guide:'}
              </span>
            </p>
            <p className="text-[11px] font-bold">
              {lang === 'fa' ? (
                <>
                  ایمیل <code className="font-mono bg-blue-100 text-blue-900 px-1 py-0.5 rounded">saeedsatro74@gmail.com</code> از قبل به عنوان <strong>اپراتور انبار</strong> در سیستم تعریف شده است. کافیست روی دکمه مشکی‌رنگ <strong>«ورود با حساب گوگل»</strong> کلیک کنید تا بدون نیاز به رمز عبور، فوراً با این نقش وارد سامانه شوید!
                </>
              ) : (
                <>
                  The email <code className="font-mono bg-blue-100 text-blue-900 px-1 py-0.5 rounded">saeedsatro74@gmail.com</code> is pre-registered as a <strong>Warehouse Operator</strong>. Just click <strong>"Sign In with Google"</strong> below to instantly log in without a password!
                </>
              )}
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase block px-1">
                  {tLocal.fullName}
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center text-slate-400`}>
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={tLocal.fullNamePlaceholder}
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl py-3 ${
                      isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                    } text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase block px-1">
                {tLocal.email}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center text-slate-400`}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tLocal.emailPlaceholder}
                  className={`w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl py-3 ${
                    isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
                  } text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 ltr-input`}
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase block px-1">
                {tLocal.password}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${isRtl ? 'right-3' : 'left-3'} flex items-center text-slate-400`}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tLocal.passwordPlaceholder}
                  className={`w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl py-3 ${
                    isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  } text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 ltr-input`}
                  style={{ direction: 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-3' : 'right-3'} flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3.5 rounded-2xl font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{activeTab === 'signin' ? tLocal.loginBtn : tLocal.signupBtn}</span>
              )}
            </button>
          </form>

          {/* Divider Line */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{tLocal.or}</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white p-3.5 rounded-2xl font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 border border-slate-800"
          >
            {loading ? (
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{tLocal.googleLogin}</span>
              </>
            )}
          </button>

          {/* Quick Tab Change Link below form */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setActiveTab(activeTab === 'signin' ? 'signup' : 'signin');
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className="text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              {activeTab === 'signin' ? tLocal.noAccount : tLocal.hasAccount}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="pt-4 border-t border-slate-50 text-center">
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors"
            >
              {lang === 'fa' ? 'Switch to English 🇺🇸' : 'تغییر به زبان فارسی 🇮🇷'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
