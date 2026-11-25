import React from 'react';
import { Play, Star, Clock, Film, PlusCircle, Sparkles, AlertCircle } from 'lucide-react';
import { Movie } from '../types';
import cinemaAtmosphereImg from '../assets/images/cinema_atmosphere_1791733207541.jpg';

interface MovieGridProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  selectedGenre: string;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  movies,
  onSelectMovie,
  onOpenAdmin,
  searchQuery,
  selectedGenre,
}) => {
  // Filter movies based on search and genre
  const filteredMovies = movies.filter((movie) => {
    // Only show published movies to general audience
    if (movie.status === 'draft') return false;

    const matchesSearch =
      searchQuery.trim() === '' ||
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'الكل' ||
      movie.genre === selectedGenre ||
      movie.genre.includes(selectedGenre);

    return matchesSearch && matchesGenre;
  });

  // If the app is currently empty (as requested by user)
  if (movies.filter((m) => m.status === 'published').length === 0) {
    return (
      <div className="relative min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 text-center overflow-hidden">
        {/* Cinematic Backdrop Image with Dark Gradients */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={cinemaAtmosphereImg}
            alt="أجواء سينما غيثان"
            className="w-full h-full object-cover opacity-25 filter brightness-75 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a12] via-[#070a12]/80 to-[#070a12]/50" />
          <div className="absolute inset-0 cinema-film-pattern opacity-40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Logo Mark badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>منصة سينمائية أصلية وخفيفة</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            مرحباً بك في <span className="text-gold-gradient">سينما غيثان</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
            التطبيق جاهز كلياً وفارغ حالياً كما طلبت بانتظار إضافة أفلامك الخاصة من هاتفك. تم إعداد المنصة بأعلى معايير السرعة، وبنظام رفع متطور يستوعب ملفات ضخمة حتى <strong className="text-amber-400">5 جيجابايت</strong> مع ميزة استئناف الرفع لتظهر مباشرة لجميع الزوار.
          </p>

          {/* Action button */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              نسخة
            </button>
          </div>

          {/* Cinematic Interactive Poster Frames Mockup (Empty State Visual Showcase) */}
          <div className="pt-8">
            <div className="text-xs text-slate-400 font-medium mb-3">
              مخطط عرض الملصقات عند إضافة المحتوى:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto opacity-60">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-xl border border-dashed border-amber-500/30 bg-white/[0.02] flex flex-col items-center justify-center p-3 text-slate-400 hover:border-amber-500/60 transition-colors"
                >
                  <Film className="w-6 h-6 text-amber-400/60 mb-2" />
                  <span className="text-[11px] text-slate-400">ملصق الفيلم {i}</span>
                  <span className="text-[9px] text-slate-400 mt-1">بانتظار الرفع</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user searched or filtered and found no matches
  if (filteredMovies.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500/60 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">لا توجد نتائج مطابقة للبحث</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          لم يتم العثور على أفلام تطابق «{searchQuery || selectedGenre}». جرب كلمة بحث أخرى أو اختر قسماً آخر.
        </p>
      </div>
    );
  }

  // Displaying populated movie posters grid
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {selectedGenre === 'الكل' ? 'أحدث الأفلام المعروضة' : `أفلام ${selectedGenre}`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إجمالي الأفلام المتوفرة: <span className="font-mono text-amber-400 font-bold">{filteredMovies.length}</span> فيلم
          </p>
        </div>
      </div>

      {/* Grid of Posters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {filteredMovies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-[#0e1424] border border-white/5 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          >
            {/* Poster Image Container */}
            <div className="relative aspect-[2/3] w-full bg-[#151c2e] overflow-hidden">
              {movie.coverImage ? (
                <img
                  src={movie.coverImage}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#121828] to-[#0a0f1d] text-center">
                  <Film className="w-10 h-10 text-amber-400/50 mb-2" />
                  <span className="text-xs font-bold text-slate-300 line-clamp-2">{movie.title}</span>
                </div>
              )}

              {/* Top rating badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-amber-400 text-xs font-bold font-mono">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{movie.rating ? Number(movie.rating).toFixed(1) : '8.0'}</span>
              </div>

              {/* Genre badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black">
                {movie.genre}
              </div>

              {/* Hover Overlay with Play Button */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 transform scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 fill-slate-950 translate-x-0.5" />
                </div>
                <span className="text-xs font-bold text-white mt-3">مشاهدة الفيلم</span>
              </div>
            </div>

            {/* Movie Info Details */}
            <div className="p-3 flex flex-col flex-1 justify-between text-right">
              <div>
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                  {movie.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {movie.description || 'لا يوجد وصف متوفر.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{movie.duration || 'غير محدد'}</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {movie.releaseYear || 'جديد'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
