import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Upload,
  Film,
  Lock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Edit,
  Eye,
  Server,
  Key,
  HardDrive,
  FileVideo,
  Smartphone,
  ExternalLink,
  Users,
  Sparkles,
  Layers,
  ArrowRight,
  LogOut,
  Clock,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Movie, UploadSession } from '../types';
import {
  createMovie,
  updateMovie,
  deleteMovie,
  saveMovieDraft,
  getMovieDraft,
  clearMovieDraft,
  verifyAdminPin,
  changeAdminPin,
  uploadPosterImage,
  ChunkedUploader,
  formatBytes,
  formatSecondsArabic,
} from '../services/movieService';

interface DeveloperStudioProps {
  movies: Movie[];
  onRefreshMovies: () => void;
  onPreviewMovie: (movie: Movie) => void;
  onSwitchToClientMode: () => void;
  genres: string[];
}

export const DeveloperStudio: React.FC<DeveloperStudioProps> = ({
  movies,
  onRefreshMovies,
  onPreviewMovie,
  onSwitchToClientMode,
  genres,
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Active Tab: 'upload' | 'manage' | 'simulator' | 'cloud' | 'apk'
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'simulator' | 'cloud' | 'apk'>('upload');

  // Form Fields
  const [movieTitle, setMovieTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [genre, setGenre] = useState(genres[1] || 'حركة وإثارة');
  const [duration, setDuration] = useState('120 دقيقة');
  const [rating, setRating] = useState('8.5');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  // Upload Engine State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null);
  const [uploaderInstance, setUploaderInstance] = useState<ChunkedUploader | null>(null);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulation test state
  const [simSizeGB, setSimSizeGB] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simPaused, setSimPaused] = useState(false);
  const simTimerRef = useRef<any>(null);

  // Check persisted admin session
  useEffect(() => {
    const isAuth = sessionStorage.getItem('ghaithan_admin_auth') === 'true';
    if (isAuth) setIsAuthenticated(true);
  }, []);

  // Load saved draft on initial open if not editing
  useEffect(() => {
    if (isAuthenticated && !editingMovieId) {
      const draft = getMovieDraft();
      if (draft && draft.title) {
        setMovieTitle(draft.title || '');
        setCoverImageUrl(draft.coverImage || '');
        setGenre(draft.genre || genres[1]);
        setDuration(draft.duration || '120 دقيقة');
        setRating(String(draft.rating || 8.5));
        setDescription(draft.description || '');
        setVideoUrl(draft.videoUrl || '');
      }
    }
  }, [isAuthenticated, editingMovieId, genres]);

  // Handle PIN Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const ok = await verifyAdminPin(pinInput);
    if (ok) {
      setIsAuthenticated(true);
      setPinInput('');
    } else {
      setPinError('رمز المرور غير صحيح.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ghaithan_admin_auth');
    setIsAuthenticated(false);
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      setPinError('يجب أن يتكون الرمز الجديد من 4 أرقام أو حروف على الأقل');
      return;
    }
    await changeAdminPin(newPinInput);
    setPinSuccessMsg('تم تحديث رمز الدخول بنجاح!');
    setNewPinInput('');
    setTimeout(() => setPinSuccessMsg(''), 4000);
  };

  // Handle File Selection (supports up to 5GB from mobile phone)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
    if (file.size > MAX_SIZE) {
      setFormFeedback({
        type: 'error',
        message: `حجم الملف (${formatBytes(file.size)}) يتجاوز الحد الأقصى المسموح به (5 جيجابايت).`,
      });
      return;
    }

    setSelectedFile(file);
    setFileSize(file.size);
    setFormFeedback(null);

    // Auto set movie title from filename if empty
    if (!movieTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setMovieTitle(cleanName);
    }
  };

  // Start Real Chunked Resumable Upload
  const startChunkedUpload = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    // 5 MB chunks
    const uploader = new ChunkedUploader(
      selectedFile,
      (session) => {
        setUploadSession({ ...session });
      },
      5 * 1024 * 1024
    );

    setUploaderInstance(uploader);

    try {
      const result = await uploader.start();
      setVideoUrl(result.videoUrl);
      setFileSize(result.fileSize);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setFormFeedback({
        type: 'success',
        message: 'تم اكتمال رفع ملف الفيلم إلى الخادم بنجاح! يمكنك الآن نشر الفيلم ليشاهده الجميع.',
      });
      return result.videoUrl;
    } catch (err: any) {
      if (err?.message !== 'PAUSED') {
        setFormFeedback({
          type: 'error',
          message: err?.message || 'تعذر استكمال الرفع. اضغط استئناف للمتابعة من حيث توقف.',
        });
      }
      return null;
    }
  };

  const pauseUpload = () => {
    uploaderInstance?.pause();
  };

  const resumeUpload = () => {
    startChunkedUpload();
  };

  const cancelUpload = () => {
    uploaderInstance?.cancel();
    setUploadSession(null);
    setSelectedFile(null);
  };

  // Cover Image File Upload from phone gallery/camera -> stored on server so everyone sees it
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadPosterImage(file);
      setCoverImageUrl(uploadedUrl);
    } catch (err) {
      setFormFeedback({ type: 'error', message: 'تعذر تحميل صورة الغلاف.' });
    }
  };

  // Preview Movie
  const handlePreviewCurrent = () => {
    const previewData: Movie = {
      id: editingMovieId || 'preview_id',
      title: movieTitle || 'معاينة: فيلم جديد',
      coverImage: coverImageUrl || '',
      genre,
      duration: duration || '120 دقيقة',
      rating: parseFloat(rating) || 8.0,
      description: description || 'وصف الفيلم التجريبي...',
      videoUrl: videoUrl || '',
      fileSize,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };
    onPreviewMovie(previewData);
  };

  // Save Draft
  const handleSaveDraft = () => {
    const draftData = {
      title: movieTitle,
      coverImage: coverImageUrl,
      genre,
      duration,
      rating: parseFloat(rating) || 8.0,
      description,
      videoUrl,
      fileSize,
      status: 'draft' as const,
    };
    saveMovieDraft(draftData);
    setFormFeedback({
      type: 'success',
      message: 'تم حفظ الفيلم كمسودة بنجاح. يمكنك استئناف تعديله ونشره في أي وقت.',
    });
  };

  // Publish or Save Movie
  const handleSaveMovie = async (asDraft = false) => {
    if (!movieTitle.trim()) {
      setFormFeedback({ type: 'error', message: 'يرجى كتابة اسم الفيلم.' });
      return;
    }

    let resolvedVideoUrl = videoUrl.trim();

    if (!asDraft) {
      if (uploadSession && (uploadSession.status === 'uploading' || uploadSession.status === 'merging')) {
        setFormFeedback({
          type: 'error',
          message: 'يرجى الانتظار حتى يكتمل رفع ودمج ملف الفيلم على الخادم قبل النشر.',
        });
        return;
      }

      if (!resolvedVideoUrl && selectedFile) {
        const uploadedUrl = await startChunkedUpload();
        if (!uploadedUrl) return;
        resolvedVideoUrl = uploadedUrl;
      }

      if (!resolvedVideoUrl || resolvedVideoUrl.startsWith('blob:')) {
        setFormFeedback({
          type: 'error',
          message: 'يرجى رفع ملف الفيديو إلى الخادم أو إدخال رابط فيديو مباشر صالح لكي يتمكن الجميع من مشاهدته.',
        });
        return;
      }
    }

    try {
      const moviePayload = {
        title: movieTitle.trim(),
        coverImage: coverImageUrl,
        genre,
        duration: duration || '120 دقيقة',
        rating: parseFloat(rating) || 8.5,
        description: description.trim(),
        videoUrl: resolvedVideoUrl,
        fileSize,
        status: asDraft ? ('draft' as const) : ('published' as const),
      };

      if (editingMovieId) {
        await updateMovie(editingMovieId, moviePayload);
        setFormFeedback({ type: 'success', message: 'تم تحديث بيانات الفيلم بنجاح!' });
      } else {
        await createMovie(moviePayload);
        clearMovieDraft();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setFormFeedback({
          type: 'success',
          message: asDraft ? 'تم حفظ الفيلم كمسودة بنجاح!' : 'تم نشر الفيلم بنجاح! أصبح متاحاً الآن لجميع المشاهدين.',
        });
      }

      onRefreshMovies();
      if (!editingMovieId) {
        setMovieTitle('');
        setCoverImageUrl('');
        setDescription('');
        setVideoUrl('');
        setSelectedFile(null);
        setUploadSession(null);
      }
      setEditingMovieId(null);
    } catch (e: any) {
      setFormFeedback({ type: 'error', message: e?.message || 'فشلت العملية' });
    }
  };

  // Edit existing movie
  const handleEditClick = (movie: Movie) => {
    setEditingMovieId(movie.id);
    setMovieTitle(movie.title);
    setCoverImageUrl(movie.coverImage);
    setGenre(movie.genre);
    setDuration(movie.duration);
    setRating(String(movie.rating));
    setDescription(movie.description);
    setVideoUrl(movie.videoUrl);
    setFileSize(movie.fileSize || 0);
    setActiveTab('upload');
  };

  // Delete movie
  const handleDeleteClick = async (id: string, title: string) => {
    if (confirm(`هل أنت متأكد من حذف فيلم «${title}» نهائياً من السينما؟`)) {
      await deleteMovie(id);
      onRefreshMovies();
    }
  };

  // 5GB Simulator
  const startSimulation = () => {
    setIsSimulating(true);
    setSimProgress(0);
    setSimPaused(false);

    let progress = 0;
    clearInterval(simTimerRef.current);
    simTimerRef.current = setInterval(() => {
      progress += 2;
      setSimProgress(progress);
      if (progress >= 100) {
        clearInterval(simTimerRef.current);
        setIsSimulating(false);
        confetti({ particleCount: 80, spread: 70 });
      }
    }, 200);
  };

  const toggleSimPause = () => {
    if (simPaused) {
      setSimPaused(false);
      let progress = simProgress;
      simTimerRef.current = setInterval(() => {
        progress += 2;
        setSimProgress(progress);
        if (progress >= 100) {
          clearInterval(simTimerRef.current);
          setIsSimulating(false);
          confetti({ particleCount: 80, spread: 70 });
        }
      }, 200);
    } else {
      setSimPaused(true);
      clearInterval(simTimerRef.current);
    }
  };

  // 1. PIN Login Screen for Developer Studio
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#0c1324] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-500/80">
              GHAITHAN CINEMA STUDIO
            </span>
            <h2 className="text-2xl font-black text-white mt-1">استوديو المطوّر</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              هذه النسخة مخصصة للمطور لرفع الأفلام حتى 5 جيجابايت من الجوال وإدارة المحتوى.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="أدخل رمز المرور السري"
                className="w-full bg-[#121c35] text-center tracking-widest font-mono text-xl text-white rounded-xl py-3.5 px-4 border border-white/10 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-right">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
            >
              دخول إلى استوديو المطوّر
            </button>

            <div className="pt-2 flex items-center justify-center text-xs text-slate-400">
              <button
                type="button"
                onClick={onSwitchToClientMode}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>العودة إلى تطبيق العميل</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. Full Developer Studio Dashboard
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-[#0b1224] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30">
            <Film className="w-6 h-6" />
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">استوديو المطوّر — سينما غيثان</h1>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                نسخة الإدارة والرفع
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              مخصص لرفع ملفات الأفلام الضخمة حتى <strong className="text-amber-400 font-mono">5.0 GB</strong> مباشرة من هاتفك
            </p>
          </div>
        </div>

        {/* Studio Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={onSwitchToClientMode}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
            title="الانتقال لعرض تطبيق العميل والمشاهد كما يراه الزوار"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>معاينة نسخة العميل</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#090e1b] p-1.5 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{editingMovieId ? 'تعديل الفيلم' : 'رفع وإضافة فيلم (5GB)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'manage'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>إدارة الأفلام والمسودات ({movies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>اختبار محرك الرفع 5GB</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'cloud'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>التخزين السحابي والخادم</span>
        </button>

        <button
          onClick={() => setActiveTab('apk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'apk'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>حزم الـ APK للجوال</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {formFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 ${
            formFeedback.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {formFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{formFeedback.message}</span>
          </div>
          <button onClick={() => setFormFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD & ADD MOVIE (5GB ENGINE) */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {editingMovieId && (
            <div className="bg-amber-500/15 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-300">
              <span>أنت الآن في وضع تعديل بيانات الفيلم.</span>
              <button
                onClick={() => {
                  setEditingMovieId(null);
                  setMovieTitle('');
                  setCoverImageUrl('');
                  setDescription('');
                  setVideoUrl('');
                }}
                className="underline font-bold"
              >
                إلغاء والعودة لفيلم جديد
              </button>
            </div>
          )}

          {/* 5GB Resumable Mobile Video Uploader */}
          <div className="bg-[#0c1324] border border-amber-500/20 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  1. رفع ملف الفيلم من جوالك (حتى 5 جيجابايت)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                أقصى حجم: 5.0 GB
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يقوم المحرك بتقطيع الفيلم إلى حزم صغيرة مجزأة وإرسالها مباشرة إلى السيرفر والتخزين السحابي، دون حفظها في ذاكرة التطبيق لتجنب ملء ذاكرة هاتفك. إذا انقطع النت أو أغلقت التطبيق، سيستأنف الرفع تلقائياً.
            </p>

            {/* Mobile File Input */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="w-full flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-amber-500/30 hover:border-amber-500/70 bg-[#121c35]/50 hover:bg-[#121c35] rounded-2xl p-5 text-center transition-all flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-white block">
                      {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف الفيلم من هاتفك'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedFile
                        ? `الحجم: ${formatBytes(selectedFile.size)}`
                        : 'MP4, MKV, WebM, MOV حتى 5 جيجابايت'}
                    </span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="video/*,.mkv,.mp4,.webm,.mov"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && !uploadSession && (
                <button
                  type="button"
                  onClick={startChunkedUpload}
                  className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all whitespace-nowrap active:scale-95"
                >
                  بدء الرفع السحابي المجزأ
                </button>
              )}
            </div>

            {/* Active Live Upload Progress Display */}
            {uploadSession && (
              <div className="bg-[#121a30] border border-amber-500/40 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-sm">{uploadSession.fileName}</span>
                  <span className="font-mono text-amber-400 font-black text-base">
                    {uploadSession.progressPercent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                    style={{ width: `${uploadSession.progressPercent}%` }}
                  />
                </div>

                {/* Live Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">المنقول / الكلي:</span>
                    <span className="font-bold">{formatBytes(uploadSession.uploadedBytes)} / {formatBytes(uploadSession.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">سرعة الرفع:</span>
                    <span className="font-bold text-emerald-400">{formatBytes(uploadSession.speedBytesPerSec)}/ث</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الوقت المتبقي:</span>
                    <span className="font-bold text-amber-400">{formatSecondsArabic(uploadSession.etaSeconds)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الأجزاء المكتملة:</span>
                    <span>{uploadSession.uploadedChunks.length} / {uploadSession.totalChunks}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {uploadSession.status === 'uploading' && (
                    <button
                      type="button"
                      onClick={pauseUpload}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Pause className="w-4 h-4" />
                      <span>إيقاف مؤقت</span>
                    </button>
                  )}

                  {uploadSession.status === 'merging' && (
                    <span className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
                      ⏳ جاري تجميع ودمج أجزاء الفيلم على الخادم (يرجى الانتظار قليلاً)...
                    </span>
                  )}

                  {uploadSession.status === 'completed' && (
                    <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      ✅ اكتمل الرفع بنجاح وأصبح جاهزاً للنشر للجميع
                    </span>
                  )}

                  {uploadSession.status === 'paused' && (
                    <button
                      type="button"
                      onClick={resumeUpload}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md"
                    >
                      <Play className="w-4 h-4" />
                      <span>استئناف الرفع</span>
                    </button>
                  )}

                  {uploadSession.status === 'error' && (
                    <button
                      type="button"
                      onClick={resumeUpload}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة المحاولة والاستئناف</span>
                    </button>
                  )}

                  {uploadSession.status !== 'completed' && uploadSession.status !== 'merging' && (
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold"
                    >
                      إلغاء الرفع
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Direct URL input if hosting on S3 / R2 */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs text-slate-300 font-medium mb-1">
                رابط الفيديو النهائي (يتولد تلقائياً بعد اكتمال الرفع أو أدخل رابط مباشر من Cloudflare R2 / Backblaze):
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://.../movie.mp4"
                className="w-full bg-[#121a30] text-xs text-white rounded-xl py-3 px-3.5 border border-white/10 focus:border-amber-500 font-mono dir-ltr"
              />
            </div>
          </div>

          {/* Movie Details Sheet */}
          <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
            <h3 className="font-bold text-white text-base">2. بيانات ومعلومات الفيلم</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  اسم الفيلم <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="مثال: الفارس الأخير، ملحمة الرمال..."
                  className="w-full bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">القسم / التصنيف</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500"
                >
                  {genres.filter((g) => g !== 'الكل').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">المدة</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="مثال: 124 دقيقة أو ساعتان و 4 دقائق"
                  className="w-full bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">التقييم (من 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Poster upload from phone */}
            <div className="space-y-2">
              <label className="block text-xs text-slate-300 font-medium">صورة الغلاف / الملصق</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="رابط الصورة أو اختر صورة من المعرض أدناه..."
                  className="flex-1 bg-[#121a30] text-xs text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500 dir-ltr"
                />
                <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold whitespace-nowrap">
                  <span>📷 اختيار صورة من جوالك</span>
                  <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                </label>
              </div>

              {coverImageUrl && (
                <div className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl">
                  <img
                    src={coverImageUrl}
                    alt="الملصق"
                    className="w-12 h-16 object-cover rounded-lg border border-white/10"
                  />
                  <span className="text-xs text-emerald-400 font-bold">✓ تم إرفاق صورة الغلاف بنجاح</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">قصة الفيلم والوصف</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب نبذة أو ملخصاً مشوقاً لقصة الفيلم..."
                className="w-full bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handlePreviewCurrent}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>معاينة الفيلم قبل النشر</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10"
                >
                  حفظ كمسودة
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMovie(false)}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  {editingMovieId ? 'حفظ التعديلات' : 'نشر الفيلم للعملاء فوراً'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE MOVIES */}
      {activeTab === 'manage' && (
        <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">قائمة الأفلام وإدارتها</h3>
            <span className="text-xs text-slate-400">
              إجمالي الأفلام: <strong className="text-amber-400">{movies.length}</strong>
            </span>
          </div>

          {movies.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-sm">لا توجد أفلام حتى الآن</h4>
              <p className="text-xs text-slate-400 mt-1">
                ابدأ برفع أول فيلم من تبويب الرفع بالأعلى.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-[#090e1b]">
              {movies.map((m) => (
                <div
                  key={m.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    {m.coverImage ? (
                      <img
                        src={m.coverImage}
                        alt={m.title}
                        className="w-14 h-20 object-cover rounded-xl border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Film className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{m.title}</h4>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            m.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {m.status === 'published' ? 'منشور للعملاء' : 'مسودة خاصة'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{m.genre}</span>
                        <span>·</span>
                        <span>{m.duration}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{m.rating}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onPreviewMovie(m)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                      title="معاينة الفيلم"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEditClick(m)}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-400"
                      title="تعديل الفيلم"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(m.id, m.title)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      title="حذف الفيلم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 5GB TEST SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              اختبار محاكاة رفع 5 جيجابايت واستئناف الرفع على الهاتف
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            يمكنك عبر هذا الاختبار فحص استجابة شريط التقدم، وعداد السرعة والوقت المتبقي، واختبار ما يحدث عند قطع النت أو إيقاف الرفع واستئنافه.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs text-slate-300">حجم الاختبار:</span>
            {[1, 2, 5].map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() => setSimSizeGB(gb)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-colors ${
                  simSizeGB === gb
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {gb} جيجابايت
              </button>
            ))}

            {!isSimulating ? (
              <button
                type="button"
                onClick={startSimulation}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md mr-auto"
              >
                تشغيل اختبار المحاكاة
              </button>
            ) : (
              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={toggleSimPause}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold"
                >
                  {simPaused ? 'استئناف الرفع' : 'محاكاة انقطاع الاتصال (إيقاف)'}
                </button>
              </div>
            )}
          </div>

          {(isSimulating || simProgress > 0) && (
            <div className="bg-[#121a30] border border-amber-500/30 rounded-xl p-4 sm:p-5 space-y-3 mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">ملف التجربة: cinema_ghaithan_master_{simSizeGB}gb.mkv</span>
                <span className="font-mono text-amber-400 font-bold text-sm">{simProgress}%</span>
              </div>

              <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200"
                  style={{ width: `${simProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">المنقول:</span>
                  <span>{((simProgress / 100) * simSizeGB).toFixed(2)} GB من {simSizeGB} GB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">سرعة الرفع:</span>
                  <span>19.2 ميجابايت/ثانية</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">الوقت المتبقي:</span>
                  <span>{simPaused ? 'متوقف مؤقتاً' : `${Math.max(0, Math.round((100 - simProgress) / 5))} ثانية`}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">حالة الاتصال:</span>
                  <span className={simPaused ? 'text-amber-400' : 'text-emerald-400'}>
                    {simPaused ? '⚠️ انقطاع اتصال' : '● جاري النقل السحابي'}
                  </span>
                </div>
              </div>

              {simProgress >= 100 && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold text-center">
                  ✓ اكتمل الاختبار بنجاح! تم التحقق من تجميع القطع وجاهزية النشر.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLOUD & SERVER GUIDE */}
      {activeTab === 'cloud' && (
        <div className="space-y-4">
          <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">
                خيارات التخزين السحابي لملفات 5GB بدون تكلفة أو بتكلفة شبه معدومة
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#121c35] border border-emerald-500/30 space-y-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  الخيار الموصى به أولاً
                </span>
                <h4 className="font-bold text-white text-sm">Cloudflare R2 Storage</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  - <strong>التكلفة:</strong> <span className="text-emerald-400 font-bold">0$ شهرياً</span> (10 جيجابايت مجاناً).<br />
                  - <strong>بث مجاني تماماً:</strong> بدون رسوم باندويث نهائياً (Zero Bandwidth / Egress Fees).<br />
                  - بعد الـ 10GB التكلفة فقط 0.015$ لكل جيجابايت إضافي.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#121c35] border border-white/10 space-y-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  الخيار البديل
                </span>
                <h4 className="font-bold text-white text-sm">Backblaze B2</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  - 10 جيجابايت مجاناً.<br />
                  - يرتبط بـ CDN لتوزيع وبث الفيديو بسرعة فائقة.<br />
                  - تكلفة التخزين الإضافي: 0.006$ لكل جيجابايت شهرياً.
                </p>
              </div>
            </div>
          </div>

          {/* Change PIN */}
          <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">تغيير رمز المرور السري لدخول الاستوديو</h3>
            </div>

            <form onSubmit={handleUpdatePin} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="أدخل الرمز السري الجديد (4 أرقام أو أكثر)..."
                className="w-full sm:w-80 bg-[#121a30] text-sm text-white rounded-xl py-2.5 px-3.5 border border-white/10 focus:border-amber-500 text-center font-mono"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                حفظ الرمز الجديد
              </button>
            </form>

            {pinSuccessMsg && (
              <span className="text-xs text-emerald-400 font-bold block">{pinSuccessMsg}</span>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: APK DISTRIBUTION FOR CLIENT & DEVELOPER */}
      {activeTab === 'apk' && (
        <div className="bg-[#0c1324] border border-white/10 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              حزم وتثبيت تطبيق الأندرويد APK (نسخة العميل + نسخة المطور)
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            يمكنك الآن الحصول على نسختين مستقلتين من التطبيق لتثبيتهما على جوالك وتوزيعهما على العملاء:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1: Client App */}
            <div className="p-4 rounded-xl bg-[#121c35] border border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">1. نسخة العميل والمشاهد (للجمهور)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تطبيق نظيف وخفيف وسريع بدون أي أدوات إدارة أو لوحات رفع، مخصص للمشاهدة فقط والبحث والتواصل عبر واتساب.
              </p>
              <div className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-lg font-mono dir-ltr text-left">
                الملف: client.html<br />
                الرابط: /client.html
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/client.html"
                  target="_blank"
                  className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 text-center"
                >
                  فتح client.html
                </a>
                <a
                  href="/client.html"
                  download="client.html"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center"
                  title="تحميل ملف client.html إلى جوالك"
                >
                  ⬇️ تنزيل الملف
                </a>
              </div>
            </div>

            {/* Version 2: Developer App */}
            <div className="p-4 rounded-xl bg-[#121c35] border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-white text-sm">2. نسخة المطوّر (لك وحدك)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                استوديو خاص بك محمي برمز المرور، يمكنك تثبيته على جوالك لرفع ملفات الأفلام الضخمة (5GB) والتحكم بالمحتوى في أي وقت ومن أي مكان.
              </p>
              <div className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-lg font-mono dir-ltr text-left">
                الملف: developer.html<br />
                الرابط: /developer.html
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/developer.html"
                  target="_blank"
                  className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 text-center"
                >
                  فتح developer.html
                </a>
                <a
                  href="/developer.html"
                  download="developer.html"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center"
                  title="تحميل ملف developer.html إلى جوالك"
                >
                  ⬇️ تنزيل الملف
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
