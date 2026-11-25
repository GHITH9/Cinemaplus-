import React from 'react';
import { Download, Smartphone, Terminal, CheckCircle2, Copy, ExternalLink, X, Cpu, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const capacitorCommands = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "سينما غيثان" com.ghaithan.cinema --web-dir dist
npm run build
npx cap add android
npx cap open android`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-[#0c1222] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080d19] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">دليل تثبيت وتوليد تطبيق APK «سينما غيثان»</h3>
              <p className="text-xs text-amber-400/80">مشروع المصدر كامل وتعليمات البناء للأندرويد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-right">
          {/* Two Distinct Versions Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#090e1b] border border-amber-500/20">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-right">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                1. نسخة العميل والمشاهد
              </span>
              <h5 className="font-bold text-white text-xs mt-1">سينما غيثان (للجمهور)</h5>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                تطبيق نظيف وخفيف للبحث والمشاهدة فقط بدون أي واجهات رفع أو أزرار إدارة.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-right">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                2. نسخة المطوّر (لك وحدك)
              </span>
              <h5 className="font-bold text-white text-xs mt-1">استوديو غيثان (رفع 5GB)</h5>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                تطبيق مثبت على جوالك لرفع ملفات الأفلام الضخمة حتى 5GB وإدارة النشر والمسودات.
              </p>
            </div>
          </div>

          {/* Method 1: Instant PWA Install on Android */}
          <div className="p-4 rounded-xl bg-[#121a30] border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                التثبيت المباشر على الجوال
              </span>
              <h4 className="font-bold text-white text-sm">التثبيت كـ تطبيق فوري (Web APK)</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              يقوم نظام أندرويد عبر Chrome أو Samsung Internet بتحويل التطبيق تلقائياً إلى حزمة APK متكاملة تعمل بدون شريط متصفح وبأيقونة سينما غيثان الخاصة على شاشة هاتفك.
            </p>

            {isInstallable ? (
              <button
                onClick={install}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>اضغط هنا لتثبيت التطبيق على جهازك الآن</span>
              </button>
            ) : (
              <div className="text-xs text-slate-400 bg-black/20 p-2.5 rounded-lg">
                💡 افتح الرابط من متصفح هاتفك المحمول واضغط على «تثبيت التطبيق» أو من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية / تثبيت التطبيق».
              </div>
            )}
          </div>

          {/* Method 2: 1-Click APK via PWABuilder */}
          <div className="p-4 rounded-xl bg-[#121a30] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                توليد ملف APK جاهز بضغطة زر
              </span>
              <h4 className="font-bold text-white text-sm">استخراج ملف APK الجاهز عبر PWABuilder</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              مشروع سينما غيثان يحتوي مسبقاً على الـ Manifest والشعارات المتوافقة 100%. يمكنك إدخال رابط التطبيق في منصة <strong>PWABuilder</strong> الرسمية وتحميل ملف <strong className="text-amber-400">cinema_ghaithan.apk</strong> جاهز للتثبيت المباشر على أي هاتف أندرويد أو رفعه لمتجر Google Play!
            </p>
            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              <span>فتح موقع PWABuilder لتحميل الـ APK</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Method 3: Native Android Studio & Capacitor Build */}
          <div className="p-4 rounded-xl bg-[#121a30] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded">
                للمطورين عبر Android Studio
              </span>
              <h4 className="font-bold text-white text-sm">بناء حزمة APK الأصلية عبر Capacitor</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تم إعداد ملف <code className="text-amber-400 font-mono">capacitor.config.json</code> داخل مجلد المشروع. يمكنك تشغيل الأوامر التالية في مجلد المشروع لبناء ملف الـ APK وتوقيعه:
            </p>

            <div className="relative bg-black/60 rounded-xl p-3 border border-white/10">
              <pre className="text-xs text-amber-300 font-mono dir-ltr overflow-x-auto text-left leading-relaxed">
                {capacitorCommands}
              </pre>
              <button
                onClick={() => copyToClipboard(capacitorCommands, 1)}
                className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-300"
                title="نسخ الأوامر"
              >
                {copiedIndex === 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>ثم من داخل Android Studio:</p>
              <p className="text-slate-300">
                اختر القائمة <strong className="font-mono text-amber-400">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>
              </p>
              <p>وستحصل على ملف <code className="text-emerald-400 font-mono">app-release.apk</code> جاهز للنقل إلى الجوال وتثبيته فوراً!</p>
            </div>
          </div>

          {/* Android Permissions Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-white">الأذونات الضرورية فقط:</strong>
              <p className="leading-relaxed text-slate-300">
                التطبيق يطلب فقط إذن الوصول للإنترنت (<code className="font-mono text-amber-400">INTERNET</code>) وقراءة ملفات الفيديو التي تختارها بنفسك (<code className="font-mono text-amber-400">READ_MEDIA_VIDEO</code>) دون أي وصول لجهات الاتصال أو الكاميرا أو الموقع الجغرافي.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#080d19] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
