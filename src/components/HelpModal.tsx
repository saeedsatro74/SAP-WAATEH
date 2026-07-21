import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  LayoutDashboard, 
  Boxes, 
  History, 
  PlusCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  User, 
  BookOpen, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
}

type HelpSectionKey = 'dashboard' | 'inventory' | 'movements' | 'add-product' | 'add-movement-in' | 'add-movement-out' | 'settings' | 'profile';

export default function HelpModal({ isOpen, onClose, activeTab }: HelpModalProps) {
  // Map the application's active tab to initial help section
  const getInitialSection = (): HelpSectionKey => {
    if (activeTab === 'add-movement') {
      return 'add-movement-in'; // Default to Stock In
    }
    return activeTab as HelpSectionKey;
  };

  const [selectedSection, setSelectedSection] = useState<HelpSectionKey>(getInitialSection);

  const sections: { key: HelpSectionKey; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
    { key: 'inventory', label: 'محصولات و موجودی', icon: Boxes },
    { key: 'movements', label: 'ثبت تراکنش‌ها (لیست)', icon: History },
    { key: 'add-product', label: 'تعریف محصول جدید', icon: PlusCircle },
    { key: 'add-movement-in', label: 'ورود کالا به انبار', icon: ArrowDownLeft },
    { key: 'add-movement-out', label: 'خروج کالا از انبار', icon: ArrowUpRight },
    { key: 'settings', label: 'تنظیمات انبار', icon: Settings },
    { key: 'profile', label: 'پروفایل کاربری', icon: User },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'dashboard':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: داشبورد مدیریتی انبار</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">پایش لحظه‌ای، آمار کلیدی و هشدارهای اتوماتیک سیستم مدیریت انبار واته</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed pr-5">
                داشبورد مدیریتی به عنوان مغز متفکر و مرکز مانیتورینگ سیستم طراحی شده است. هدف اصلی این صفحه ارائه یک دید ۳۶۰ درجه و آنی از وضعیت کل دارایی‌ها، حجم انبار، نقاط بحرانی کالاها و آخرین تحرکات انبار است. مدیران و اپراتورها با نگاه به این صفحه می‌توانند بدون درگیر شدن در جزئیات پیچیده، سلامت کلی گردش کالا را ارزیابی کنند.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>در شروع هر شیفت کاری جهت بررسی وضعیت عمومی انبار و هشدارهای کمبود کالا.</li>
                <li>هنگام نیاز به مشاهده نمودارها و آمار توزیع قفسه‌ها و روندهای ورود و خروج هفتگی یا ماهانه.</li>
                <li>جهت چک کردن سریع تراکنش‌های بسیار اخیر که در چند ساعت گذشته ثبت شده‌اند.</li>
                <li>برای شناسایی فوری محصولاتی که موجودی آن‌ها به زیر آستانه امن (نقطه سفارش مجدد) رسیده است.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگامی که می‌خواهید اطلاعات شناسنامه یک کالا (مانند نام، SKU یا موقعیت دقیق فیزیکی آن در قفسه) را ویرایش کنید.</li>
                <li>هنگامی که نیاز به ثبت تراکنش‌های جدید (ورود فیزیکی کالا یا تحویل آن به خط تولید) دارید.</li>
                <li>هنگام نیاز به دانلود گزارش اکسل/CSV کامل کالاها؛ برای این کار باید مستقیماً به صفحه موجودی مراجعه کنید.</li>
              </ul>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                مدیر زنجیره تامین شرکت Waateh صبح دوشنبه وارد سیستم می‌شود. او ابتدا داشبورد را باز کرده و با بخش <strong className="text-rose-600">هشدارهای موجودی بحرانی</strong> مواجه می‌شود که عدد ۳ را نشان می‌دهد. با کلیک روی جزئیات متوجه می‌شود موجودی "روغن کمپرسور چیلر" به ۵ لیتر کاهش یافته در حالی که حداقل موجودی امن ۱۵ لیتر است. او بلافاصله به تیم خرید دستور سفارش مجدد می‌دهد تا از خوابیدن خطوط تولید جلوگیری شود.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل استفاده و تحلیل اطلاعات صفحه</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>بررسی چهار کارت آمار بالا (کل اقلام، مجموع فیزیکی دپو، موارد بحرانی و کل تراکنش‌ها).</li>
                <li>بررسی نمودار پای (Pie Chart) جهت مشاهده پراکندگی توزیع کالاها بر اساس واحد (لیتر، عدد، متر و...).</li>
                <li>تحلیل نمودار میله‌ای روندها جهت مقایسه میزان ورود کالا در برابر خروج کالا در طول زمان.</li>
                <li>مشاهده بخش "تراکنش‌های اخیر" در پایین صفحه برای ردیابی آخرین تحرکات اپراتورها در انبار.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم امنیتی و کاربردی</h4>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800 font-bold leading-relaxed">
                شاخص‌های داشبورد به صورت زنده (Real-time) با دیتابیس همگام هستند. اگر اپراتوری در انبار تراکنشی ثبت کند، بلافاصله نمودارها و آمار داشبورد شما آپدیت می‌شود و نیازی به رفرش کل مرورگر نیست.
              </div>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                اشتباه متداول این است که برخی کاربران تصور می‌کنند اطلاعات دکمه "بازنشانی دمو" در داشبورد، دیتابیس واقعی شرکت را پاک می‌کند. این دکمه صرفاً برای بازنشانی سناریوهای تستی در حالت محلی طراحی شده و در شرایط اتصال ابری امن، به دیتابیس ابری آسیب نمی‌رساند.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                تحلیل داشبورد منجر به تصمیم‌گیری‌های استراتژیک در خصوص خرید به موقع کالا، توزیع بهینه فضا در قفسه‌ها و نظارت دقیق بر کارایی پرسنل انبار می‌شود.
              </p>
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Boxes className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: محصولات و موجودی انبار</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">بانک اطلاعاتی متمرکز، مدیریت کاردکس کالاها، ویرایش شناسنامه و کنترل موقعیت‌های فیزیکی انبار</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این صفحه به عنوان شناسنامه جامع و زنده انبار عمل می‌کند. هدف آن نمایش فهرست کاملی از تمام کالاهای تعریف شده در کل سیستم به همراه جزئیات دقیق مانند کد کالا (SKU)، موجودی فعلی، واحد سنجش، موقعیت فیزیکی دقیق (قفسه/ردیف) و سطح آستانه هشدار است.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگام جستجوی سریع موقعیت فیزیکی یک کالا برای پرسنل جهت تحویل کالا.</li>
                <li>برای گرفتن خروجی اکسل یا CSV از لیست کل دارایی‌های انبار جهت فرستادن به حسابداری یا مدیریت.</li>
                <li>هنگامی که می‌خواهید حداقل موجودی امن (نقطه سفارش مجدد) را برای یک کالای خاص تغییر دهید.</li>
                <li>به منظور فیلتر کردن و بررسی سریع محصولاتی که دپوی آن‌ها رو به اتمام است.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این صفحه منحصراً برای <strong className="text-slate-900">مشاهده و مدیریت مشخصات</strong> است. به هیچ وجه نباید از این صفحه برای ثبت ورود بار جدید یا تحویل بار استفاده کرد. هرگونه تغییر در موجودی عددی کالاها باید به صورت رسمی از طریق ثبت تراکنش (ورود/خروج) انجام شود تا زنجیره رهگیری کالا حفظ شود.
              </p>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                یک تکنسین فنی به انبار مراجعه کرده و درخواست "شیر تخلیه برنجی ۱ اینچ" دارد. انباردار نام کالا را در باکس جستجوی این صفحه تایپ می‌کند. سیستم کالا را پیدا کرده و موقعیت فیزیکی آن را به صورت <code className="bg-slate-200 text-blue-600 px-1 py-0.5 rounded">قفسه R2 - طبقه S3 - موقعیت L1</code> نمایش می‌دهد. انباردار بدون معطلی به همان موقعیت فیزیکی رفته و کالا را برداشته و تحویل می‌دهد.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل کار با صفحه موجودی</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>وارد کردن نام کالا یا SKU در کادر جستجو جهت فیلتر آنی.</li>
                <li>استفاده از دکمه سوئیچ "فقط کالاهای رو به اتمام" برای پایش هشدارهای اضطراری.</li>
                <li>کلیک روی آیکون مداد (ویرایش) در ستون عملیات جهت تغییر نام، موقعیت، حداقل موجودی یا ثبت توضیحات (مخصوص مدیر).</li>
                <li>فشردن دکمه "خروجی اکسل (CSV)" در بالای جدول برای دانلود فایل گزارش انبارگردانی.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم</h4>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800 font-bold leading-relaxed">
                عملیات ویرایش مستقیم مشخصات یا حذف کامل یک کالا، از حساسیت بسیار بالایی برخوردار است و تنها برای سطح دسترسی <strong className="text-blue-900">مدیر سیستم (Admin)</strong> فعال است. اپراتورها فقط دسترسی مشاهده جدول را دارند.
              </div>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                برخی کاربران وقتی بار جدیدی وارد انبار می‌شود، به جای ثبت تراکنش ورود، سعی می‌کنند از طریق دکمه ویرایش کالا، تعداد موجودی را به صورت دستی تغییر دهند. این کار اشتباه است زیرا هیچ سند و تراکنشی برای رهگیریِ ورود آن بار در سیستم ثبت نمی‌شود و حسابداری دچار مغایرت خواهد شد.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                تمامی اصلاحات اعمال شده بر روی موقعیت یا مشخصات کالاها فوراً در کل بخش‌های برنامه بازتاب می‌یابد و گزارش‌های دوره‌ای همواره بر پایه داده‌های تمیز و ساختاریافته این صفحه صادر می‌گردد.
              </p>
            </div>
          </div>
        );

      case 'movements':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: تاریخچه تراکنش‌ها و جابجایی کالا</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">لاگ سیستم، حسابرسی فیزیکی، ردیابی پرسنل ثبت‌کننده و کنترل کامل تاریخچه ورود و خروج‌ها</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این صفحه، دفتر روزنامه و تاریخچه رسمی تمام تراکنش‌های انبار است. هر زمانی که کالایی به انبار وارد یا از آن خارج می‌شود، یک ردیف تراکنش غیرقابل‌تغییر همراه با نام پرسنل، زمان دقیق، نوع عملیات، تعداد و دلیل جابجایی ثبت می‌گردد. هدف این صفحه شفاف‌سازی کامل و رفع هرگونه مغایرت موجودی است.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگامی که مغایرتی در موجودی یک کالا بین سیستم و انبار فیزیکی رخ داده و می‌خواهید تمام ورود و خروج‌های اخیر آن را بررسی کنید.</li>
                <li>جهت ردیابی و نظارت بر کارهایی که هر یک از اپراتورهای انبار در طول روز ثبت کرده‌اند.</li>
                <li>برای بررسی یادداشت‌ها و دلایل ثبت شده برای خروج کالاها (مثلاً خروج به علت خرابی یا تحویل به پروژه الف).</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این صفحه یک بخش کاملاً <strong className="text-slate-900">خواندنی (Read-Only)</strong> و نظارتی است. شما نمی‌توانید در این صفحه کالا یا تراکنش جدیدی ثبت کنید یا تراکنش‌های گذشته را حذف و ویرایش کنید (چرا که بر اساس اصول حسابرسی انبار، سوابق به هیچ وجه نباید مخدوش یا دستکاری شوند).
              </p>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                در جریان انبارگردانی فصلی، موجودی سیستم برای "پمپ آب نیم اسب" ۴ عدد است اما در انبار واقعی فقط ۲ عدد وجود دارد. سرپرست انبار به صفحه <strong className="text-slate-900">تراکنش‌های کالا</strong> مراجعه کرده و فیلتر را روی پمپ آب می‌گذارد. او متوجه می‌شود روز گذشته اپراتوری به نام "علی" تراکنش خروج ۳ عددی بدون ثبت دلیل کافی انجام داده است. با پیگیری موضوع مشخص می‌شود کالاها روی پروژه تهویه مطبوع ساختمان نصب شده‌اند و مغایرت به سرعت کشف و برطرف می‌شود.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل پیگیری تراکنش‌ها در سیستم</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>ورود به صفحه تراکنش‌ها و استفاده از فیلترهای بالا (تفکیک بر اساس تراکنش‌های ورود IN یا خروج OUT).</li>
                <li>استفاده از نوار جستجو برای فیلتر کردن سوابق بر اساس شناسه SKU، نام محصول یا نام پرسنل ثبت‌کننده.</li>
                <li>بررسی تاریخ و ساعت دقیق ثبت هر ردیف و بررسی بخش توضیحات برای فهمیدن علت دقیق جابجایی.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم</h4>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-800 font-bold leading-relaxed">
                در این بخش علاوه بر تراکنش‌های عادی ورود و خروج، جدول مجزایی برای <strong className="text-rose-900">"اصلاحات موجودی انبارگردانی"</strong> تعبیه شده است. این جدول تغییراتی را نشان می‌دهد که مدیران به صورت استثنایی و دستی در موجودی کالاها برای اصلاح مغایرت‌ها ثبت کرده‌اند.
              </div>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                اشتباه رایج این است که پرسنل فراموش می‌کنند در حین ثبت خروج کالا، فیلد توضیحات و نام تحویل‌گیرنده را پر کنند. این کار باعث می‌شود بعدها هنگام بازبینی تراکنش‌ها در این صفحه، دلیل خروج بار مبهم بماند. همواره پرسنل را به ثبت توضیحات کامل ترغیب کنید.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                با ثبت اتوماتیک و دائم تحرکات، انبار شرکت Waateh همواره برای ممیزی‌های مالی و زنجیره تامین شفاف بوده و ریسک مفقود شدن کالاها به صفر متمایل می‌شود.
              </p>
            </div>
          </div>
        );

      case 'add-product':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <PlusCircle className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: تعریف کالا و محصول جدید</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">ایجاد پرونده هویت کالا، تخصیص کدهای SKU استاندارد، تنظیم آستانه سفارش مجدد و انتخاب مختصات فیزیکی انبار</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                هدف این صفحه صرفاً <strong className="text-slate-900">تعریف اولیه یا ویرایش پرونده هویت کالا</strong> در سیستم انبار است. در واقع برای اینکه بتوانید تراکنش ورود یا خروج برای یک کالا ثبت کنید، آن کالا باید ابتدا شناسنامه و کدی در دیتابیس داشته باشد. این صفحه مشخصات پایه مانند نام کالا، کد SKU منحصر‌به‌فرد، واحد، آدرس محل فیزیکی انبار و آستانه هشدار بحرانی کالا را ثبت می‌کند.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگامی که یک کالای کاملاً جدید خریداری شده که سابقه ورود به انبار شرکت Waateh را نداشته است.</li>
                <li>زمانی که برند یا مشخصات فیزیکی کالا متمایز بوده و نیاز به ایجاد یک SKU مجزا و غیرتکراری دارد.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-800 font-bold leading-relaxed">
                اگر محصول قبلاً در سیستم انبار تعریف شده و دارای کد SKU است، <strong>به هیچ وجه نباید مجدداً از این صفحه استفاده کنید!</strong> برای افزایش موجودی آن کالا باید به صفحه "ورود کالا" رفته و تراکنش ثبت کنید. ثبت مجدد محصولِ موجود، سبب ایجاد کالاهای هم‌نام، تکراری و مخدوش شدن دیتابیس می‌شود.
              </div>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                امروز شرکت Waateh یک مدل چیلر جدید تحت عنوان "چیلر تراکمی اسکرال ۵۰ تن مدل CH-50S" خریداری کرده که اولین بار است وارد انبار می‌شود و سابقه ثبت ندارد. ابتدا سرپرست انبار به این صفحه آمده، نام، واحد (دستگاه)، حداقل دپوی امن (۲ عدد) و آدرس فیزیکی آن را انتخاب می‌کند. پس از ثبت نهایی، پرونده چیلر ایجاد شده و اکنون آماده ثبت تراکنش‌های ورود است.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل گام‌به‌گام ثبت کالا</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>وارد کردن نام دقیق کالا با ذکر مشخصات فنی و برند.</li>
                <li>تولید یا وارد کردن کد SKU (کد اختصاصی و غیرتکراری برای محصول).</li>
                <li>وارد کردن مقدار اولیه موجودی انبار (در صورت وجود دپوی اولیه).</li>
                <li>انتخاب واحد سنجش کالا (عدد، متر، لیتر، کیلوگرم، دستگاه و غیره).</li>
                <li>تعیین آدرس فیزیکی بر اساس قفسه (Rack)، طبقه (Shelf) و موقعیت (Position) که به صورت پویا با توجه به تنظیمات کارخانه معتبرسازی می‌شود.</li>
                <li>تنظیم حداقل آستانه هشدار (تعداد بحرانی که اگر موجودی به آن یا کمتر از آن رسید سیستم هشدار قرمز بدهد).</li>
                <li>ثبت یادداشت و فشردن دکمه ثبت کالا.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                فیلد موقعیت فیزیکی کالا هوشمند است. شما نمی‌توانید موقعیتی را انتخاب کنید که خارج از محدوده ابعاد تعریف‌شده کارخانه در بخش تنظیمات باشد. این کار از نامنظم شدن چیدمان فیزیکی قطعات جلوگیری می‌کند.
              </p>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>تعریف دوباره کالای موجود با یک SKU جدید به دلیل تنبلی در جستجوی کد قبلی.</li>
                <li>وارد کردن دستی کدهای نامفهوم برای SKU؛ همواره از یک ساختار استاندارد (مانند PUMP-001) استفاده کنید.</li>
              </ul>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                پس از ذخیره، رکورد جدیدی در جدول کالاها ایجاد شده و در کل سیستم (از جمله در فیلد جستجوی پیشرفته ورود/خروج کالا) در دسترس عموم اپراتورها قرار می‌گیرد.
              </p>
            </div>
          </div>
        );

      case 'add-movement-in':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ArrowDownLeft className="text-emerald-600 size-5" />
                <span>راهنمای جامع بخش: ورود کالا به انبار (افزایش موجودی)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">افزایش رسمی موجودی سیستم، ثبت رسید انبار، تعیین پرسنل مسئول و بروزرسانی لحظه‌ای کاردکس</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این صفحه برای ثبت ورود فیزیکی اقلام و افزایش عدد موجودی آن‌ها در دیتابیس ساخته شده است. هدف آن تضمین این است که هر کالایی که به صورت فیزیکی از درب انبار عبور کرده و در قفسه جایگذاری می‌شود، بلافاصله در سیستم ثبت شده تا موجودی زنده انبار همواره با واقعیت منطبق باشد.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگام خرید مجدد کالاهای قبلی و ورود محموله جدید به کارخانه.</li>
                <li>مرجوع شدن قطعات و تجهیزات از پروژه‌های شرکت به انبار مرکزی.</li>
                <li>یافتن کالای ثبت نشده در جریان انبارگردانی فیزیکی که باید موجودی آن رسماً تصحیح و زیاد شود.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم flip</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                اگر کالا هنوز در سیستم تعریف اولیه نشده است (یعنی در لیست کشویی با استفاده از قابلیت جستجو نام آن را پیدا نمی‌کنید)، ابتدا باید به صفحه <strong>"افزودن کالا"</strong> رفته و پرونده هویت کالا را ثبت کنید. شما نمی‌توانید برای کالایی که تعریف نشده، تراکنش ورود ثبت نمایید.
              </p>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                شرکت قبلاً ۵۰ عدد "پمپ سیرکولاتور ۱ اینچ داب" در انبار خود داشته است. امروز واحد تدارکات تعداد ۲۰ عدد پمپ داب دیگر خریداری کرده و کامیون حامل بار آن‌ها را تخلیه می‌کند. انباردار ابتدا در کادر فیلد جستجوی هوشمند "پمپ" یا کد SKU را تایپ می‌کند، محصول را انتخاب نموده، نام اپراتور و تعداد ۲۰ را وارد کرده و ثبت می‌کند. موجودی پمپ فوراً به ۷۰ عدد افزایش می‌یابد.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل کار</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>انتخاب نوع تراکنش روی حالت <span className="text-emerald-600">ورود (IN)</span>.</li>
                <li>کلیک روی فیلد جستجوی کالا و شروع به تایپ کلمات کلیدی (مثلا: پمپ) یا کد SKU؛ پس از پیدا شدن کالا، روی آن کلیک کنید تا فیلد بسته شده و کالا انتخاب شود.</li>
                <li>وارد کردن تعداد دقیق بار تخلیه شده.</li>
                <li>وارد کردن نام تحویل‌گیرنده یا اپراتور ثبت‌کننده.</li>
                <li>تایید موقعیت فیزیکی (سیستم موقعیت پیش‌فرض ثبت شده برای کالا را نمایش می‌دهد).</li>
                <li>نوشتن توضیحات اختیاری (مانند شماره بارنامه یا فاکتور خرید) و فشردن دکمه ثبت نهایی تراکنش.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                با استفاده از قابلیت جدید جستجوی هوشمند (Searchable Select)، نیازی به اسکرول در لیست‌های طولانی نیست. کافیست چند حرف از نام محصول یا کد SKU آن را تایپ کنید تا لیست کالاها به طور همزمان فیلتر شود.
              </p>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                اشتباه رایج اشتباه گرفتن واحدها است؛ مثلاً اگر کالا بر اساس "بسته ۱۰ عددی" تعریف شده، ورود ۲ بسته را نباید ۲۰ ثبت کرد بلکه باید ۲ ثبت نمود. حتما به واحد نشان‌داده شده در کنار فیلد کالا دقت کنید.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                تعداد دپوی کالا در جدول موجودی افزایش یافته، آمار داشبورد بروز شده و یک سند ثبت تراکنش غیرقابل‌حذف در بخش تاریخچه تراکنش‌ها ثبت می‌گردد.
              </p>
            </div>
          </div>
        );

      case 'add-movement-out':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ArrowUpRight className="text-rose-600 size-5" />
                <span>راهنمای جامع بخش: خروج کالا از انبار (کاهش موجودی / حواله انبار)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">کاهش دپوی سیستم، صدور حواله مصرف پرسنل، کنترل و پیشگیری از منفی شدن کسر کاردکس</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                هدف این صفحه کنترل و ثبت رسمی خروج هرگونه قطعه، تجهیزات یا مواد اولیه از فضای فیزیکی انبار شرکت Waateh است. این بخش تضمین می‌کند کالاها بدون تاییدیه و سند خروج مصارف شخصی یا کارگاهی نداشته باشند و موجودی همواره به اندازه برداشته شده کاهش یابد.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگام تحویل دادن قطعات یدکی به تکنسین‌ها جهت نگهداری و تعمیرات دوره‌ای دستگاه‌ها.</li>
                <li>هنگام ارسال کالاها به خارج از کارخانه به عنوان فروش یا ارسال به انبار شعب دیگر.</li>
                <li>مرخص کردن مواد اولیه مصرفی روزانه خط تولید کارخانه.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                نباید از این صفحه برای اصلاحات حسابداری به علت خطا در شمارش دوره‌ای استفاده کرد. برای آن منظور، مدیران سیستم باید از بخش انبارگردانی اختصاصی (تعدیل موجودی) استفاده کنند تا دلیل سیستمی آن کاملاً شفاف بماند.
              </p>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                انباردار ۵ عدد کالا (مثلاً شیر برنجی) به واحد تولید تحویل می‌دهد. او به این صفحه مراجعه کرده، نوع تراکنش را بر روی خروج (OUT) تنظیم می‌کند. نام شیر را در کادر کالا جستجو کرده و انتخاب می‌نماید، مقدار ۵ و نام تکنسین تحویل‌گیرنده را ثبت می‌کند. سیستم فوراً ۵ عدد از موجودی انبار کم می‌کند.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل کار</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>تنظیم نوع تراکنش روی حالت <span className="text-rose-600">خروج (OUT)</span>.</li>
                <li>کلیک روی فیلد کالا و تایپ نام یا SKU کالا و انتخاب آن از لیست فیلتر شده.</li>
                <li>وارد کردن تعداد اقلام تحویلی.</li>
                <li>وارد کردن نام دقیق پرسنل تحویل‌گیرنده کالا.</li>
                <li>نوشتن علت خروج در کادر توضیحات (بسیار مهم در ممیزی‌ها).</li>
                <li>فشردن دکمه ثبت تراکنش.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم (مکانیزم محافظت در برابر خروج غیرمجاز)</h4>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-800 font-bold leading-relaxed">
                سیستم دارای <strong>قفل پیشگیری از موجودی منفی</strong> است. اگر موجودی واقعی کالایی ۱۰ عدد باشد و شما سعی کنید مقدار ۱۲ عدد را خارج کنید، سیستم بلافاصله با خطای قرمز رنگ جلوی ثبت تراکنش را می‌گیرد. موجودی انبار هرگز نمی‌تواند در سیستم منفی شود.
              </div>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                ثبت خروج کالا پس از تحویل فیزیکی در روزهای بعد؛ همواره تراکنش خروج را <strong>همزمان با تحویل فیزیکی</strong> قطعه انجام دهید. به تعویق انداختن ثبت، منجربه تداخل گزارش موجودی در طول شیفت‌ها خواهد شد.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                موجودی دپو بلافاصله کاهش می‌یابد. اگر تعداد به زیر آستانه هشدار تعریف‌شده برسد، سیستم فوراً در داشبورد زنگ خطر قرمز کمبود کالا را برای مدیران به صدا درمی‌آورد.
              </p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Settings className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: تنظیمات انبار و ساختار کارخانه</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">پیکربندی هندسه فیزیکی انبار، تعریف ظرفیت‌ها، مدیریت دسترسی کاربران و اعمال هشدارهای سراسری</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                این بخش به عنوان پانل کنترل پیکربندی ساختار فیزیکی و منطقی انبار عمل می‌کند. هدف آن تعیین مرزهای فیزیکی انبار (تعداد قفسه‌ها، طبقات و پوزیشن‌ها)، مدیریت دسترسی‌ها (افزودن و حذف اپراتورها)، و تنظیم پارامترهای پایه‌ای مانند آستانه پیش‌فرض هشدار کسر موجودی است.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگام راه‌اندازی اولیه نرم‌افزار برای انبار شرکت Waateh.</li>
                <li>در صورت افزودن فیزیکی قفسه‌های جدید به ساختار انبار کارخانه.</li>
                <li>هنگام استخدام پرسنل جدید انباردار (جهت ایجاد حساب اپراتور عادی) یا قطع همکاری با پرسنل گذشته.</li>
                <li>جهت تغییر سطح هشدار کسر موجودی به صورت سراسری برای تمامی اقلام فاقد آستانه سفارشی.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-xs text-rose-800 font-bold leading-relaxed">
                این صفحه صرفاً برای کارهای زیرساختی طراحی شده است. <strong>اپراتورها و پرسنل عادی به هیچ وجه نباید تغییراتی در این بخش انجام دهند.</strong> هرگونه دستکاری نابجا در ابعاد قفسه‌ها می‌تواند آدرس‌دهی فیزیکی کالاهای موجود را با تداخل جدی مواجه کند.
              </div>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                یک اپراتور جدید به نام "رضا کریمی" به تیم انبارداری ملحق شده است. مدیر سیستم به صفحه تنظیمات مراجعه کرده، در بخش مدیریت کاربران روی دکمه <strong className="text-blue-700">"افزودن کاربر جدید"</strong> کلیک کرده، ایمیل و نام او را ثبت نموده و نقش او را "اپراتور انبار (فقط ثبت تراکنش)" قرار می‌دهد. رضا با اولین ورود خود مجاز به ثبت رسیدها خواهد بود اما حق دسترسی به تنظیمات ساختاری را نخواهد داشت.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل کار با پیکربندی ساختار انبار</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>تغییر تعداد قفسه‌ها (Racks)، تعداد طبقات در هر قفسه (Shelves) و تعداد موقعیت‌ها در هر طبقه (Positions).</li>
                <li>کلیک روی "اعمال ساختار انبار" جهت ذخیره پیکربندی قفسه‌بندی فیزیکی.</li>
                <li>تغییر مقدار عددی حداقل موجودی پیش‌فرض سراسری و ذخیره آن.</li>
                <li>ثبت یا حذف ایمیل‌های مجاز در بخش مدیریت پرسنل جهت تغییر مجوزهای دسترسی.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم امنیتی</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                اگر تعداد قفسه‌ها را کاهش دهید (مثلاً از ۱۰ قفسه به ۵ قفسه)، کالاها یا تراکنش‌هایی که از قبل در قفسه‌های ۶ تا ۱۰ آدرس‌دهی شده بودند ممکن است دچار خطای عدم تطبیق ساختاری شوند. همواره قبل از کوچک کردن ابعاد انبار، از جابجایی قطعات به بخش‌های مجاز مطمئن شوید.
              </p>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                باقی گذاشتن حساب کارمندان سابق فعال در سیستم؛ برای جلوگیری از نشت اطلاعات یا ثبت تراکنش‌های غیرواقعی، بلافاصله پس از تغییر پرسنل، حساب کاربری آن‌ها را از بخش مدیریت کاربران حذف کنید.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                تغییرات به صورت آنی در قوانین اعتبارسنجی فرم‌ها، سیستم احراز هویت مرکزی و داشبوردها اعمال شده و انبار طبق سیاست‌های جدید شرکت Waateh فعالیت می‌کند.
              </p>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6 text-right font-sans leading-relaxed" dir="rtl">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <User className="text-blue-600 size-5" />
                <span>راهنمای جامع بخش: پروفایل شخصی کاربری</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">مشاهده اطلاعات هویتی، آمار انفرادی ثبت اسناد، تنظیمات بیوگرافی و تصویر پرسنلی</p>
            </div>

            {/* 1. Goal */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-blue-500" />
                <span>۱- هدف این صفحه</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                هدف این صفحه مدیریت مشخصات هویتی و پرسنلی خود شما به عنوان کاربر جاری سیستم است. این بخش اطلاعاتی چون نقش شما در سازمان، ایمیل فعال، دپارتمان کاری، بیوگرافی کوتاه و تصویر پرسنلی را نگه می‌دارد و همچنین کارنامه کارکرد شخصی شما (تعداد کل اسناد و رسیدهای ثبت شده توسط خودتان) را نشان می‌دهد.
              </p>
            </div>

            {/* 2. When to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>۲- چه زمانی باید از این صفحه استفاده کنیم؟</span>
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>هنگام تغییر شماره تلفن همراه یا ایمیل تماس جهت ارتباط پرسنلی کارخانه.</li>
                <li>برای بروزرسانی تصویر پروفایل یا تصحیح نام نمایشی.</li>
                <li>جهت ارزیابی و مشاهده تعداد تراکنش‌های انبارداری که خودتان در شیفت جاری ثبت کرده‌اید.</li>
              </ul>
            </div>

            {/* 3. When NOT to use */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>۳- چه زمانی نباید از این صفحه استفاده کنیم؟</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                شما نمی‌توانید از این صفحه نقش کاربری خودتان را از "اپراتور" به "مدیر" تغییر دهید. تغییر سطوح دسترسی پرسنل تنها با هماهنگی مدیریت و از داخل پانل اختصاصی "تنظیمات انبار" امکان‌پذیر است.
              </p>
            </div>

            {/* 4. Real Example */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                <span>۴- مثال واقعی (سناریوی شرکت Waateh)</span>
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                انباردار ارشد شرکت تصمیم می‌گیرد اطلاعات ارتباطی خود را بروز کند تا در صورت بروز هشدارهای شبانه سیستم، نگهبانی کارخانه بتواند سریعاً با او تماس بگیرد. او به این صفحه مراجعه کرده، فیلد تلفن همراه را آپدیت نموده و یادداشتی مبنی بر "مسئول شیفت صبح انبار مرکزی" ثبت می‌کند و تغییرات را ذخیره می‌نماید.
              </p>
            </div>

            {/* 5. Steps */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۵- مراحل کار</h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 font-bold space-y-1 pr-5">
                <li>کلیک روی دکمه "تنظیمات پروفایل" جهت فعال شدن فیلدهای فرم ویرایش.</li>
                <li>اصلاح نام، شماره تلفن، دپارتمان کاری، بیوگرافی و آدرس تصویر پروفایل.</li>
                <li>کلیک روی "ذخیره تغییرات" برای اعمال نهایی اطلاعات در دیتابیس مرکزی.</li>
              </ol>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۶- نکات مهم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                تمام تراکنش‌هایی که ثبت می‌کنید به صورت دائم با آدرس ایمیل و مشخصات شما مهر و امضا می‌شوند. در بخش "کارنامه فعالیت شما" می‌توانید تعداد کل ورودها و خروج‌های ثبت‌شده توسط خودتان را به عنوان آمار راندمان کاری مشاهده نمایید.
              </p>
            </div>

            {/* 7. Common mistakes */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-900">۷- اشتباهات رایج کاربران</h4>
              <p className="text-xs text-slate-600 font-bold pr-5 leading-relaxed">
                استفاده از تصاویر غیررسمی یا بزرگ؛ تصاویر بزرگ ممکن است سرعت لود صفحه شما را کاهش دهند. ترجیحاً از آدرس تصاویر استاندارد و سبک پرسنلی استفاده کنید.
              </p>
            </div>

            {/* 8. Final Outcome */}
            <div className="space-y-1.5 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-black text-slate-900 text-blue-600">۸- نتیجه نهایی در سیستم</h4>
              <p className="text-xs text-slate-600 font-bold pr-5">
                اطلاعات بروزرسانی‌شده، بلافاصله در کارت‌های پرسنلی سوابق تراکنش‌ها و هدر سیستم منعکس شده و هویت دیجیتالی شما را در سازمان تثبیت می‌کند.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100"
          >
            {/* Left Sidebar Navigation (Help tabs) */}
            <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-100 p-4 shrink-0 flex flex-col justify-between" dir="rtl">
              <div>
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200/60 mb-4 px-1">
                  <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 leading-none">مرکز راهنمای هوشمند</h3>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1">SAP WAATEH MANUAL</span>
                  </div>
                </div>

                <nav className="space-y-1 max-h-[25vh] md:max-h-none overflow-y-auto pr-0.5">
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = selectedSection === sec.key;
                    return (
                      <button
                        key={sec.key}
                        onClick={() => setSelectedSection(sec.key)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black transition-all text-right cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                            : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span>{sec.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Decorative Footer */}
              <div className="hidden md:block pt-4 border-t border-slate-200/60 text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-relaxed">
                  طراحی شده برای پرسنل انبار
                </span>
                <span className="text-[8px] font-extrabold text-slate-300 block mt-0.5">
                  نسخه آموزش جامع v3.4.1
                </span>
              </div>
            </div>

            {/* Right Scrollable Content Pane */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Header inside Modal */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50" dir="rtl">
                <div className="flex items-center gap-2 text-slate-500">
                  <HelpCircle size={16} className="text-blue-500" />
                  <span className="text-xs font-black text-slate-700">راهنما و مستندات سیستم هوشمند</span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Real Content Body */}
              <div className="flex-grow overflow-y-auto p-6 md:p-8">
                {renderContent()}
              </div>

              {/* Bottom Quick Help Info Box */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold text-slate-500" dir="rtl">
                <div className="flex items-center gap-1.5">
                  <Info size={14} className="text-blue-500" />
                  <span>آیا هنوز سوالی دارید؟ با پشتیبانی فنی تماس بگیرید.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[10px]">
                    Internal Ext: 404
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md text-[10px]">
                    saeedsatro7@gmail.com
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
