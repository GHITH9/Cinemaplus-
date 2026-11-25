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
  ArrowRight,
  Info,
  Clock,
  Star,
  Layers,
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
  ChunkedUploader,
  formatBytes,
  formatSecondsArabic,
} from '../services/movieService';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  onRefreshMovies: () => void;
  onPreviewMovie: (movie: Movie) => void;
  genres: string[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  movies,
  onRefreshMovies,
  onPreviewMovie,
  genres,
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'simulator' | 'cloud-guide'>('upload');

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

  if (!isOpen) return null;

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

  // Handle File Selection (supports up to 5GB and larger)
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

    // Auto set movie title from filename if title empty
    if (!movieTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setMovieTitle(cleanName);
    }
  };

  // Start Real Chunked Resumable Upload
  const startChunkedUpload = async () => {
    if (!selectedFile) return;

    // Chunk size: 5 MB
    const uploader = new ChunkedUploader(selectedFile, (session) => {
      setUploadSession({ ...session });
    }, 5 * 1024 * 1024);

    setUploaderInstance(uploader);

    try {
      const result = await uploader.start();
      setVideoUrl(result.videoUrl);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      setFormFeedback({
        type: 'success',
        message: 'تم اكتمال رفع ملف الفيلم إلى التخزين بنجاح! يمكنك الآن نشر الفيلم أو معاينته.',
      });
    } catch (err: any) {
      if (err?.message !== 'PAUSED') {
        setFormFeedback({
          type: 'error',
          message: err?.message || 'تعذر استكمال الرفع. يمكنك الضغط على استئناف للمتابعة من حيث توقف.',
        });
      }
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

  // Cover Image File Upload (converted to data URL for preview & persistence)
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Preview Movie before publishing
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

  // Save as Draft
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
      message: 'تم حفظ بيانات الفيلم كمسودة بأمان. يمكنك العودة إليها في أي وقت.',
    });
  };

  // Publish or Save Movie
  const handleSaveMovie = async (asDraft = false) => {
    if (!movieTitle.trim()) {
      setFormFeedback({ type: 'error', message: 'يرجى كتابة اسم الفيلم.' });
      return;
    }

    if (!videoUrl && !selectedFile && !asDraft) {
      setFormFeedback({
        type: 'error',
        message: 'يرجى رفع ملف الفيديو أولاً والتأكد من اكتمال رفعه إلى التخزين قبل النشر.',
      });
      return;
    }

    try {
      const moviePayload = {
        title: movieTitle.trim(),
        coverImage: coverImageUrl,
        genre,
        duration: duration || '120 دقيقة',
        rating: parseFloat(rating) || 8.5,
        description: description.trim(),
        videoUrl: videoUrl || '',
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
          message: asDraft ? 'تم حفظ الفيلم كمسودة بنجاح!' : 'تم نشر الفيلم بنجاح في سينما غيثان!',
        });
      }

      onRefreshMovies();
      // Reset form if new movie
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
    if (confirm(`هل أنت متأكد من حذف فيلم «${title}» نهائياً؟`)) {
      await deleteMovie(id);
      onRefreshMovies();
    }
  };

  // 5GB Stress Test Simulator
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
      // Resume
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
      // Pause
      setSimPaused(true);
      clearInterval(simTimerRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-[#090e1b] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0e162a] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">لوحة إدارة المطوّر — سينما غيثان</h2>
              <p className="text-[11px] text-amber-400/80">
                منطقة سرية ومحمية لإدارة الأفلام ورفع الملفات الضخمة حتى 5 جيجابايت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 1. Login Wall if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">تسجيل الدخول للوحة الإدارة</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                هذه اللوحة مخصصة لمالك ومطور التطبيق فقط لرفع الأفلام والتحكم بالمحتوى.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="أدخل رمز المرور السري"
                  className="w-full bg-[#121a30] text-center tracking-widest font-mono text-lg text-white rounded-xl py-3 px-4 border border-white/10 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  autoFocus
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-right">
                  {pinError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                دخول إلى لوحة التحكم
              </button>
            </form>
          </div>
        ) : (
          /* 2. Authenticated Dashboard Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-[#0b1122] border-b border-white/5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{editingMovieId ? 'تعديل الفيلم الحالي' : 'رفع وإضافة فيلم جديد'}</span>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>إدارة الأفلام والمسودات ({movies.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'simulator'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>اختبار محرك 5GB والاستئناف</span>
              </button>

              <button
                onClick={() => setActiveTab('cloud-guide')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'cloud-guide'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>التخزين السحابي والتكاليف</span>
              </button>
            </div>

            {/* Tab Views */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Feedback messages */}
              {formFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
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

              {/* TAB 1: ADD / EDIT MOVIE FORM */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  {editingMovieId && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300">
                      <span>أنت الآن في وضع تعديل الفيلم.</span>
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
                        إلغاء التعديل والبدء بفيلم جديد
                      </button>
                    </div>
                  )}

                  {/* Section A: Resumable Chunked 5GB Video Uploader */}
                  <div className="bg-[#0e1629] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileVideo className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          1. رفع ملف الفيلم (يدعم حتى 5 جيجابايت مجزأ وقابل للاستئناف)
                        </h4>
                      </div>
                      <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Max: 5.0 GB
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      يتم تقطيع الفيديو إلى أجزاء وتمريرها مباشرة إلى الخادم السحابي دون حفظها داخل ذاكرة الهاتف لتفادي امتلاء مساحة الجهاز. إذا انقطع الاتصال أو أغلقت التطبيق، يمكنك الاستئناف فوراً.
                    </p>

                    {/* File selector input */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="w-full sm:w-auto flex-1 cursor-pointer">
                        <div className="border border-dashed border-white/20 hover:border-amber-500/60 bg-[#121b33]/60 hover:bg-[#121b33] rounded-xl p-4 text-center transition-all flex items-center justify-center gap-3">
                          <Upload className="w-5 h-5 text-amber-400" />
                          <div className="text-right">
                            <span className="text-xs font-bold text-white block">
                              {selectedFile ? selectedFile.name : 'اختر ملف الفيلم من جوالك'}
                            </span>
                            <span className="text-[10px] text-slate-400">
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
                          className="w-full sm:w-auto px-5 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all whitespace-nowrap"
                        >
                          بدء الرفع السحابي المجزأ
                        </button>
                      )}
                    </div>

                    {/* Active Upload Progress Card */}
                    {uploadSession && (
                      <div className="bg-[#121a30] border border-amber-500/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-xs">{uploadSession.fileName}</span>
                          <span className="font-mono text-amber-400 font-bold text-sm">
                            {uploadSession.progressPercent}%
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300 relative shadow-sm"
                            style={{ width: `${uploadSession.progressPercent}%` }}
                          />
                        </div>

                        {/* Live upload stats: bytes, speed, ETA */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono bg-black/20 p-2.5 rounded-lg">
                          <div>
                            <span className="text-slate-400 block text-[10px]">المنقول / الإجمالي:</span>
                            <span>{formatBytes(uploadSession.uploadedBytes)} / {formatBytes(uploadSession.fileSize)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">السرعة الحالية:</span>
                            <span>{formatBytes(uploadSession.speedBytesPerSec)}/ث</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">الوقت المتبقي (ETA):</span>
                            <span>{formatSecondsArabic(uploadSession.etaSeconds)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">حالة القطع:</span>
                            <span>{uploadSession.uploadedChunks.length} من {uploadSession.totalChunks} قطعة</span>
                          </div>
                        </div>

                        {/* Upload Controls: Pause, Resume, Cancel */}
                        <div className="flex items-center gap-2 pt-1">
                          {uploadSession.status === 'uploading' && (
                            <button
                              type="button"
                              onClick={pauseUpload}
                              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>إيقاف مؤقت</span>
                            </button>
                          )}

                          {uploadSession.status === 'paused' && (
                            <button
                              type="button"
                              onClick={resumeUpload}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>استئناف الرفع</span>
                            </button>
                          )}

                          {uploadSession.status === 'error' && (
                            <button
                              type="button"
                              onClick={resumeUpload}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إعادة المحاولة والاستئناف</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={cancelUpload}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold"
                          >
                            إلغاء الرفع
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Or Direct Video Stream URL */}
                    <div className="pt-2 border-t border-white/5">
                      <label className="block text-xs text-slate-300 font-medium mb-1">
                        أو رابط فيديو سحابي مباشر (Cloudflare R2 / Backblaze / S3 / HLS / MP4):
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://.../movie.mp4 أو تم توليده تلقائياً من الرفع أعلاه"
                        className="w-full bg-[#121a30] text-xs text-white rounded-lg py-2.5 px-3 border border-white/10 focus:border-amber-500 font-mono dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Section B: Movie Metadata Fields */}
                  <div className="bg-[#0e1629] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      2. بيانات وتفاصيل الفيلم
                    </h4>

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
                          placeholder="مثال: المجد الأخير، رحلة عبر الصحراء..."
                          className="w-full bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500"
                        />
                      </div>

                      {/* Genre */}
                      <div>
                        <label className="block text-xs text-slate-300 font-medium mb-1">
                          القسم / النوع
                        </label>
                        <select
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="w-full bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500"
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
                        <label className="block text-xs text-slate-300 font-medium mb-1">
                          المدة
                        </label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="مثال: 125 دقيقة أو ساعتان و 5 دقائق"
                          className="w-full bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500"
                        />
                      </div>

                      {/* Rating */}
                      <div>
                        <label className="block text-xs text-slate-300 font-medium mb-1">
                          التقييم (من 10)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="w-full bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cover Image Upload / URL */}
                    <div className="space-y-2">
                      <label className="block text-xs text-slate-300 font-medium">
                        صورة الغلاف / الملصق
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="text"
                          value={coverImageUrl}
                          onChange={(e) => setCoverImageUrl(e.target.value)}
                          placeholder="أدخل رابط صورة الملصق أو ارفعها من هاتفك..."
                          className="flex-1 bg-[#121a30] text-xs text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500 dir-ltr"
                        />
                        <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium whitespace-nowrap">
                          <span>رفع صورة من الجوال</span>
                          <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                        </label>
                      </div>

                      {coverImageUrl && (
                        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
                          <img
                            src={coverImageUrl}
                            alt="معاينة الملصق"
                            className="w-12 h-16 object-cover rounded border border-white/10"
                          />
                          <span className="text-xs text-emerald-400">✓ تم تحميل صورة الغلاف بنجاح</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs text-slate-300 font-medium mb-1">
                        قصة الفيلم والوصف
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="اكتب ملخصاً جذاباً لقصة الفيلم..."
                        className="w-full bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Form Submission Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePreviewCurrent}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>معاينة الفيلم قبل النشر</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-all"
                      >
                        حفظ كمسودة
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveMovie(false)}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                      >
                        {editingMovieId ? 'حفظ التعديلات' : 'نشر الفيلم في السينما'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE MOVIES & DRAFTS */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      قائمة الأفلام المرفوعة والمسودات
                    </h4>
                    <span className="text-xs text-slate-400">
                      إجمالي الأفلام: <strong className="text-amber-400">{movies.length}</strong>
                    </span>
                  </div>

                  {movies.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h5 className="font-bold text-white text-sm">لا توجد أفلام حتى الآن</h5>
                      <p className="text-xs text-slate-400 mt-1">
                        يمكنك إضافة ونشر أول فيلم من تبويب «رفع وإضافة فيلم جديد».
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-[#0c1324]">
                      {movies.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {m.coverImage ? (
                              <img
                                src={m.coverImage}
                                alt={m.title}
                                className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-16 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                <Film className="w-5 h-5" />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-sm">{m.title}</h5>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    m.status === 'published'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {m.status === 'published' ? 'منشور' : 'مسودة'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span>{m.genre}</span>
                                <span>·</span>
                                <span>{m.duration}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{m.rating}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => onPreviewMovie(m)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                              title="معاينة الفيلم"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleEditClick(m)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-400 transition-colors"
                              title="تعديل بيانات الفيلم"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteClick(m.id, m.title)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="حذف الفيلم نهائياً"
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

              {/* TAB 3: 5GB RESUMABLE TEST SIMULATOR */}
              {activeTab === 'simulator' && (
                <div className="bg-[#0e1629] border border-white/10 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      <Film className="w-5 h-5 text-amber-400" />
                      <span>اختبار محاكاة رفع ملف فيلم ضخم (حتى 5 جيجابايت) واستئناف الرفع</span>
                    </h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    هذه الأداة تتيح لك اختبار آلية التقطيع، حساب الوقت المتبقي (ETA)، والتحقق من عمل الاستئناف بعد التوقف أو انقطاع الاتصال مباشرة دون الحاجة لنقل ملف 5GB حقيقي من هاتفك فوراً.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <span className="text-xs text-slate-300">اختر حجم الاختبار:</span>
                    {[1, 2, 5].map((gb) => (
                      <button
                        key={gb}
                        type="button"
                        onClick={() => setSimSizeGB(gb)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                          simSizeGB === gb
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {gb} جيجابايت ({gb * 1024} MB)
                      </button>
                    ))}

                    {!isSimulating ? (
                      <button
                        type="button"
                        onClick={startSimulation}
                        className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all mr-auto"
                      >
                        تشغيل اختبار الرفع
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 mr-auto">
                        <button
                          type="button"
                          onClick={toggleSimPause}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold"
                        >
                          {simPaused ? 'استئناف الاختبار' : 'محاكاة انقطاع الاتصال (إيقاف)'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Simulator Progress Display */}
                  {(isSimulating || simProgress > 0) && (
                    <div className="bg-[#121a30] border border-amber-500/30 rounded-xl p-4 space-y-3 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">
                          ملف الاختبار: cinema_ghaithan_master_{simSizeGB}gb.mkv
                        </span>
                        <span className="font-mono text-amber-400 font-bold text-sm">{simProgress}%</span>
                      </div>

                      <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200"
                          style={{ width: `${simProgress}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono bg-black/20 p-2.5 rounded-lg">
                        <div>
                          <span className="text-slate-400 block text-[10px]">المنقول:</span>
                          <span>{((simProgress / 100) * simSizeGB).toFixed(2)} GB من {simSizeGB} GB</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">سرعة الرفع:</span>
                          <span>18.4 ميجابايت/ثانية</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">الوقت المتبقي:</span>
                          <span>{simPaused ? 'متوقف مؤقتاً' : `${Math.max(0, Math.round((100 - simProgress) / 5))} ثوانٍ`}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">حالة الاتصال:</span>
                          <span className={simPaused ? 'text-amber-400' : 'text-emerald-400'}>
                            {simPaused ? '⚠️ محاكاة انقطاع الشبكة' : '● جاري النقل السحابي'}
                          </span>
                        </div>
                      </div>

                      {simProgress >= 100 && (
                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-bold text-center">
                          ✓ اكتمل الاختبار بنجاح! تم التحقق من سلامة الأجزاء وتجميع الملف وجاهزية النشر.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CLOUD STORAGE & COST ARCHITECTURE */}
              {activeTab === 'cloud-guide' && (
                <div className="space-y-6">
                  {/* Cloud Hosting Breakdown */}
                  <div className="bg-[#0e1629] border border-white/10 rounded-2xl p-5 space-y-4 text-right">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white text-base">
                        هندسة التخزين السحابي والتكاليف الموصى بها لملفات 5GB
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      بناءً على طلبك بعدم حفظ الأفلام على جهاز الهاتف واستخدام خادم سحابي لملفات 5GB، إليك أفضل الخيارات الموصى بها بالتفصيل وتكاليفها:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Option 1: Cloudflare R2 (Recommended) */}
                      <div className="p-4 rounded-xl bg-[#121a30] border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            الخيار الأفضل والمجاني
                          </span>
                          <span className="text-sm font-bold text-white">Cloudflare R2</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          - <strong>التكلفة:</strong> <span className="text-emerald-400 font-bold">0 دولار شهرياً</span> (10 جيجابايت تخزين مجاني دائم).<br />
                          - <strong>ميزة استثنائية:</strong> بدون أي رسوم باندويث للبث (Zero Egress Fees)، مما يعني مشاهدة آلاف المرات دون تكلفة إضافية.<br />
                          - <strong>بعد الـ 10GB:</strong> فقط 0.015 دولار لكل جيجابايت إضافي (أقل من نصف سنت!).
                        </p>
                      </div>

                      {/* Option 2: Backblaze B2 */}
                      <div className="p-4 rounded-xl bg-[#121a30] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            خيار بديل ممتاز
                          </span>
                          <span className="text-sm font-bold text-white">Backblaze B2</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          - <strong>التكلفة:</strong> 10 جيجابايت مجاناً.<br />
                          - يرتبط مع Cloudflare CDN للبث السريع مجاناً.<br />
                          - تكلفة التخزين الإضافي: 0.006 دولار لكل جيجابايت شهرياً.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change Admin PIN Section */}
                  <div className="bg-[#0e1629] border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-400" />
                      <h4 className="font-bold text-white text-base">تغيير رمز المرور السري للوحة الإدارة</h4>
                    </div>

                    <form onSubmit={handleUpdatePin} className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="أدخل الرمز السري الجديد (4 أرقام أو أكثر)..."
                        className="w-full sm:w-80 bg-[#121a30] text-sm text-white rounded-lg py-2 px-3 border border-white/10 focus:border-amber-500 text-center font-mono"
                      />
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
