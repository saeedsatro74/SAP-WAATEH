import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { Language } from '../translations';

interface UnauthorizedScreenProps {
  lang: Language;
  onBackToLogin: () => void;
  onGoogleLogin: () => void;
  authLoading?: boolean;
}

export default function UnauthorizedScreen({ lang, onBackToLogin, onGoogleLogin, authLoading = false }: UnauthorizedScreenProps) {
  const isRtl = lang === 'fa';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans select-none" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 relative overflow-hidden text-center"
        >
          {/* Decorative background gradient elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

          {/* Locked/Alert Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-md shadow-rose-500/5">
            <ShieldAlert size={28} className="animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <h1 className="text-xl font-black text-rose-600 tracking-tight">
              {isRtl ? 'ورود ناموفق' : 'Login Failed'}
            </h1>
            <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">
              {isRtl ? 'عدم دسترسی به سامانه' : 'Access Denied'}
            </p>
          </div>

          {/* Professional message block */}
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-3 text-right">
            <p className="text-xs md:text-sm font-black text-slate-800 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
              {isRtl
                ? 'این حساب Google مجاز به ورود نیست.'
                : 'This Google account is not authorized.'}
            </p>
            <p className="text-[11px] md:text-xs font-bold text-slate-500 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
              {isRtl
                ? 'لطفاً با حساب مدیر یا اپراتور مجاز وارد شوید.'
                : 'Please sign in using an authorized administrator or operator account.'}
            </p>
            <p className="text-[11px] md:text-xs font-bold text-slate-400 leading-relaxed" dir={isRtl ? 'rtl' : 'ltr'}>
              {isRtl
                ? 'در صورت نیاز با مدیر سیستم تماس بگیرید.'
                : 'If you believe this is an error, please contact the system administrator.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5">
            {/* Primary Button: Sign in with another account */}
            <button
              onClick={onGoogleLogin}
              disabled={authLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white p-3.5 rounded-2xl font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-slate-800"
            >
              {authLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>
                    {isRtl ? 'ورود با حساب دیگر' : 'Sign in with another account'}
                  </span>
                </>
              )}
            </button>

            {/* Secondary Button: Return to login page */}
            <button
              onClick={onBackToLogin}
              disabled={authLoading}
              className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 p-3.5 rounded-2xl font-black text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
            >
              <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} />
              <span>
                {isRtl ? 'بازگشت' : 'Back to Login'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
