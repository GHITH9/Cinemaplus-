import React, { useState } from 'react';
import { Film, Lock, Search, Download, Shield, MessageCircle, Users, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppMode } from '../types';

interface HeaderProps {
  appMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  onOpenApkGuide: () => void;
  onOpenDownloadCenter: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  genres: string[];
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onSwitchMode,
  onOpenApkGuide,
  onOpenDownloadCenter,
  searchQuery,
  onSearchChange,
  selectedGenre,
  onSelectGenre,
  genres,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070a12]/95 backdrop-blur-md border-b border-white/5 transition-all">
      {/* 1. Mandatory Top Rights & WhatsApp Contact Bar */}
      <div className="bg-[#0b101d] border-b border-white/5 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Copyright notice */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-medium text-amber-400/90 tracking-wide">
              حقوق الطبع والنشر © غيثان باحاج
            </span>
            {appMode === 'developer' && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                وضع المطوّر
              </span>
            )}
          </div>

          {/* WhatsApp Contact Numbers */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="text-[11px] text-slate-400 hidden xs:inline">للتواصل عبر واتساب:</span>
            
            {/* Number 1: Saudi Arabia */}
            <a
              href="https://wa.me/966535187121"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono dir-ltr group"
              title="محادثة واتساب مع غيثان باحاج"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="group-hover:underline">+966 53 518 7121</span>
            </a>

            <span className="text-slate-600">|</span>

            {/* Number 2: Yemen */}
            <a
              href="https://wa.me/967772908480"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-mono dir-ltr group"
              title="محادثة واتساب مع غيثان باحاج"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="group-hover:underline">+967 77 290 8480</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSwitchMode('client');
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
              <Film className="w-5 h-5 text-slate-950 transition-transform group-hover:rotate-12" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                {appMode === 'developer' ? 'استوديو غيثان' : 'سينما غيثان'}
              </span>
              <span className="text-[10px] uppercase font-semibold text-amber-500/80 tracking-widest -mt-1 hidden sm:block">
                {appMode === 'developer' ? 'DEVELOPER STUDIO 5GB' : 'CINEMA GHAITHAN'}
              </span>
            </div>
          </a>
        </div>

        {/* Center / Search zone (Only in client mode or shared) */}
        {appMode === 'client' && (
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن فيلم، تصنيف، أو قصة..."
                className="w-full bg-[#121828]/80 text-sm text-slate-100 placeholder-slate-400 rounded-full py-2 pr-10 pl-4 border border-white/10 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* APK / PWA Install Button */}
          {isInstallable ? (
            <button
              onClick={install}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت كـ APK</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت على iOS</span>
            </button>
          ) : null}

          {/* Download Center Modal Button */}
          <button
            onClick={onOpenDownloadCenter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95"
            title="تحميل ملفات HTML أو APK لكلا النسختين"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل HTML أو APK</span>
          </button>

          {/* Direct HTML links for Client and Developer */}
          <div className="hidden lg:flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5 text-[11px]">
            <a
              href="/client.html"
              target="_blank"
              className="px-2 py-0.5 rounded text-emerald-400 hover:text-emerald-300 hover:bg-white/5 transition-colors font-mono"
              title="فتح ملف client.html"
            >
              client.html
            </a>
            <span className="text-slate-600">|</span>
            <a
              href="/developer.html"
              target="_blank"
              className="px-2 py-0.5 rounded text-amber-400 hover:text-amber-300 hover:bg-white/5 transition-colors font-mono"
              title="فتح ملف developer.html"
            >
              developer.html
            </a>
          </div>

          {/* Mode Switcher Buttons: Simplified to 'نسخة' */}
          {appMode === 'client' ? (
            <button
              onClick={() => onSwitchMode('developer')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all group"
              title="الانتقال إلى النسخة الأخرى"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>نسخة</span>
            </button>
          ) : (
            <button
              onClick={() => onSwitchMode('client')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
              title="الانتقال إلى النسخة الأخرى"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>نسخة</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Horizontal Genre Filter Bar (In Client Mode) */}
      {appMode === 'client' && (
        <div className="bg-[#0a0f1d]/70 px-4 py-2 overflow-x-auto border-t border-white/5 scrollbar-none">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 min-w-max">
            <span className="text-xs text-slate-400 ml-2 font-medium">الأقسام:</span>
            {genres.map((genre) => {
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => onSelectGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-white/10 p-6 text-right">
            <h3 className="text-lg font-bold text-white mb-2">تثبيت تطبيق سينما غيثان على آيفون</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح سفاري.<br />
              2. انزل للأسفل واختر <strong>إضافة إلى الصفحة الرئيسية (Add to Home Screen)</strong>.<br />
              3. اضغط «إضافة» وسيظهر تطبيق سينما غيثان كأيقونة مستقلة على جهازك.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-amber-500 text-slate-950 rounded-xl font-bold text-sm hover:bg-amber-400"
            >
              فهمت ذلك
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

