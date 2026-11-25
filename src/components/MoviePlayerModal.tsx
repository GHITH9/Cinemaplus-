import React, { useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Star, Clock, Film, Share2, MessageCircle } from 'lucide-react';
import { Movie } from '../types';

interface MoviePlayerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const MoviePlayerModal: React.FC<MoviePlayerModalProps> = ({ movie, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lightsOff, setLightsOff] = useState(false);

  if (!movie) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `شاهد فيلم «${movie.title}» الآن على سينما غيثان!\n${movie.description}\nhttps://remix-cinema-plus-5101.ai.studio`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-colors duration-500 ${
        lightsOff ? 'bg-black/98' : 'bg-black/85 backdrop-blur-md'
      }`}
    >
      <div className="relative w-full max-w-4xl bg-[#0c1220] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#080d18] border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1">{movie.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-medium hidden sm:inline">
              {movie.genre}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLightsOff(!lightsOff)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                lightsOff
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              {lightsOff ? 'تشغيل الإضاءة' : 'إطفاء الإضاءة'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {movie.videoUrl ? (
            <video
              ref={videoRef}
              src={movie.videoUrl}
              poster={movie.coverImage}
              controls
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Film className="w-16 h-16 text-amber-500/40 mb-3" />
              <p className="text-sm font-medium text-slate-300">
                لم يتم إرفاق ملف فيديو لهذا الفيلم بعد
              </p>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك رفع ملف الفيلم من لوحة تحكم المطور.
              </p>
            </div>
          )}
        </div>

        {/* Movie Details Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-right">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{movie.rating ? Number(movie.rating).toFixed(1) : '8.0'} / 10</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{movie.duration || 'غير محدد'}</span>
              </span>
              <span className="text-xs text-slate-400">
                القسم: <strong className="text-slate-200">{movie.genre}</strong>
              </span>
            </div>

            <button
              onClick={shareOnWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>مشاركة عبر واتساب</span>
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">قصة الفيلم والوصف</h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {movie.description || 'لا يوجد وصف تفصيلي متوفر لهذا الفيلم.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
