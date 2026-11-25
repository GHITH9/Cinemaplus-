import React from 'react';
import { Download, Smartphone, FileCode, ExternalLink, X, Shield, Users, CheckCircle, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCenterModal: React.FC<DownloadCenterModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#0a0f1e] border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0e162d] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg">مركز تحميل الملفات (HTML & APK)</h3>
              <p className="text-xs text-amber-400/80">نسخة العميل + نسخة المطوّر بروابط وملفات مستقلة جاهزة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-right">
          {/* Version 1: Client App (HTML & APK) */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-emerald-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">1. نسخة العميل والمشاهد (سينما غيثان)</h4>
                  <p className="text-[11px] text-slate-400">مخصصة للجمهور والعملاء للبحث ومشاهدة الأفلام بدون أي لوحات إدارة</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                جاهزة للتحميل والاستخدام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Download HTML */}
              <a
                href="/cinema-ghaithan-client.html"
                download="cinema-ghaithan-client.html"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group"
              >
                <FileCode className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">تنزيل ملف HTML</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">cinema-ghaithan-client.html</span>
                <span className="mt-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">⬇️ تحميل كملف HTML</span>
              </a>

              {/* Download APK */}
              <a
                href="/cinema-ghaithan-client.apk"
                download="cinema-ghaithan-client.apk"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group"
              >
                <Smartphone className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">تنزيل ملف APK</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">cinema-ghaithan-client.apk</span>
                <span className="mt-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">⬇️ تحميل كملف APK</span>
              </a>

              {/* Open in Browser */}
              <a
                href="/client.html"
                target="_blank"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition-all text-center group"
              >
                <ExternalLink className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">فتح نسخة العميل</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">/client.html</span>
                <span className="mt-2 text-[10px] text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded">🌐 فتح في المتصفح</span>
              </a>
            </div>
          </div>

          {/* Version 2: Developer App (HTML & APK) */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-amber-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">2. استوديو المطوّر والرفع (استوديو غيثان)</h4>
                  <p className="text-[11px] text-slate-400">مخصصة لك لرفع الأفلام حتى 5GB من الجوال وإدارة النشر والمسودات والمحتوى</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                محمية برمز PIN
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Download HTML */}
              <a
                href="/cinema-ghaithan-developer.html"
                download="cinema-ghaithan-developer.html"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-center group"
              >
                <FileCode className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">تنزيل ملف HTML للمطور</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">cinema-ghaithan-developer.html</span>
                <span className="mt-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">⬇️ تحميل كملف HTML</span>
              </a>

              {/* Download APK */}
              <a
                href="/cinema-ghaithan-developer.apk"
                download="cinema-ghaithan-developer.apk"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-center group"
              >
                <Smartphone className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">تنزيل ملف APK للمطور</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">cinema-ghaithan-developer.apk</span>
                <span className="mt-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">⬇️ تحميل كملف APK</span>
              </a>

              {/* Open in Browser */}
              <a
                href="/developer.html"
                target="_blank"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 transition-all text-center group"
              >
                <ExternalLink className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">فتح استوديو المطور</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">/developer.html</span>
                <span className="mt-2 text-[10px] text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded">🌐 فتح في المتصفح</span>
              </a>
            </div>
          </div>

          {/* Quick Info */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-1">
            <span className="text-amber-400 font-bold block">💡 ملاحظة الاستخدام:</span>
            <p className="leading-relaxed">
              - يمكنك فتح ملفات HTML مباشرة على أي متصفح هاتف أو كمبيوتر بدون الحاجة لأي برامج.<br />
              - ملفات الـ APK يمكنك تثبيتها مباشرة على أي جهاز أندرويد.<br />
              - كما يمكنك تثبيت التطبيق الفوري كـ WebAPK بنقرة واحدة من المتصفح عبر زر «تثبيت كـ APK».
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#080d19] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
