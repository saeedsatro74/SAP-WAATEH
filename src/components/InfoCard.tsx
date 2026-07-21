import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, HelpCircle } from 'lucide-react';
import { Language } from '../types';

interface InfoCardProps {
  cardKey: string;
  englishText: string;
  persianText: string;
  lang: Language;
  className?: string;
}

export default function InfoCard({ cardKey, englishText, persianText, lang, className = '' }: InfoCardProps) {
  const isRtl = lang === 'fa';
  const storageKey = `waateh_info_card_dismissed_${cardKey}`;

  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (e) {
      console.warn('Failed to save info card state:', e);
    }
  };

  const handleRestore = () => {
    setIsVisible(true);
    try {
      localStorage.setItem(storageKey, 'false');
    } catch (e) {
      console.warn('Failed to restore info card state:', e);
    }
  };

  return (
    <div className={`mb-5 font-sans ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.div
            key="visible-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative bg-gradient-to-r from-sky-50/70 to-blue-50/50 border border-sky-100/80 p-3 px-4 rounded-2xl flex items-start gap-3 shadow-xs"
          >
            {/* Left Info Icon */}
            <div className="p-1 rounded-lg bg-sky-100/60 text-sky-600 shrink-0 mt-0.5">
              <Info size={14} className="animate-pulse" />
            </div>

            {/* Description Text */}
            <div className="flex-grow pr-6 pl-2 text-slate-700 text-xs font-semibold leading-relaxed">
              {isRtl ? persianText : englishText}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className={`absolute top-2.5 ${isRtl ? 'left-2.5' : 'right-2.5'} p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/40 transition-colors cursor-pointer`}
              title={isRtl ? 'پنهان کردن راهنما' : 'Dismiss guide'}
            >
              <X size={13} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-help-trigger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex ${isRtl ? 'justify-end' : 'justify-end'}`}
          >
            <button
              onClick={handleRestore}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200/40 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
              title={isRtl ? 'نمایش مجدد راهنمای صفحه' : 'Show page guide'}
            >
              <HelpCircle size={11} />
              <span>{isRtl ? 'راهنما' : 'Help'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
