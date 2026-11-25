import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Copy,
  ExternalLink,
  FilePlay,
  Film,
  Globe,
  History,
  House,
  Image as ImageIcon,
  Info,
  KeyRound,
  Link2,
  LockOpen,
  Lock,
  Menu,
  MessageCircle,
  Play,
  Plus,
  Scale,
  Search,
  Server,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Tv,
  Upload,
  User,
  X,
} from 'lucide-react';

interface CatalogItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  genre: string;
  year: string;
  quality: string;
  rating: string;
  duration: string;
  synopsis: string;
  poster: string;
  backdrop?: string;
  videoUrl: string;
  fileSize?: number;
  createdAt?: string;
}

type NavTab = 'home' | 'movies' | 'series' | 'search' | 'account' | 'rights';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks
const GENRES = ['الكل', 'أكشن', 'دراما', 'خيال علمي', 'تشويق', 'مغامرة', 'وثائقي'];
const QUALITIES = ['الكل', '4K UHD', '1080p BluRay', '720p'];

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'الرئيسية', icon: House },
  { id: 'movies', label: 'أفلام', icon: Film },
  { id: 'series', label: 'مسلسلات', icon: Tv },
  { id: 'search', label: 'بحث', icon: Search },
  { id: 'account', label: 'حسابي', icon: User },
  { id: 'rights', label: 'الحقوق', icon: Scale },
];

const INTRO_CHANNELS = [
  {
    channel: 'CH-01',
    tag: 'ACTION · HIGH VOLTAGE',
    url: '/src/assets/images/intro_action_pursuit_1795507956584.jpg',
    fallback:
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22a1%22%20cx%3D%2265%25%22%20cy%3D%2240%25%22%20r%3D%2270%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230284c7%22%20stop-opacity%3D%220.65%22%2F%3E%3Cstop%20offset%3D%2245%25%22%20stop-color%3D%22%23091b36%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2302060e%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23a1)%22%2F%3E%3C%2Fsvg%3E',
  },
  {
    channel: 'CH-02',
    tag: 'NIGHT PURSUIT · 4K HDR',
    url: '/src/assets/images/intro_tactical_skyline_1795507956359.jpg',
    fallback:
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22a2%22%20cx%3D%2230%25%22%20cy%3D%2250%25%22%20r%3D%2275%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230ea5e9%22%20stop-opacity%3D%220.6%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%2307152b%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2302050c%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23a2)%22%2F%3E%3C%2Fsvg%3E',
  },
  {
    channel: 'CH-03',
    tag: 'TACTICAL STRIKE · CINEMA',
    url: '/src/assets/images/intro_cinema_studio_1795507956135.jpg',
    fallback:
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22a3%22%20cx%3D%2250%25%22%20cy%3D%2235%25%22%20r%3D%2272%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2338bdf8%22%20stop-opacity%3D%220.52%22%2F%3E%3Cstop%20offset%3D%2255%25%22%20stop-color%3D%22%23081830%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2302050b%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23a3)%22%2F%3E%3C%2Fsvg%3E',
  },
  {
    channel: 'CH-04',
    tag: 'ADRENALINE REEL · LIVE',
    url: '/src/assets/images/intro_adrenaline_ocean_1795507957014.jpg',
    fallback:
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22a4%22%20cx%3D%2270%25%22%20cy%3D%2255%25%22%20r%3D%2275%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230284c7%22%20stop-opacity%3D%220.65%22%2F%3E%3Cstop%20offset%3D%2250%25%22%20stop-color%3D%22%2307172e%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2302050c%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23a4)%22%2F%3E%3C%2Fsvg%3E',
  },
];

const FALLBACK_POSTER =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22900%22%20viewBox%3D%220%200%20600%20900%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230f1d36%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23060b14%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22sky%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2338bdf8%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230284c7%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22600%22%20height%3D%22900%22%20fill%3D%22url(%23bg)%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22390%22%20r%3D%2295%22%20fill%3D%22url(%23sky)%22%20opacity%3D%220.18%22%2F%3E%3Cpolygon%20points%3D%22275%2C345%20275%2C435%20350%2C390%22%20fill%3D%22%2338bdf8%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22545%22%20font-family%3D%22sans-serif%22%20font-size%3D%2234%22%20font-weight%3D%22bold%22%20fill%3D%22%23f1f5f9%22%20text-anchor%3D%22middle%22%3E%D8%B3%D9%8A%D9%86%D9%85%D8%A7%20%D8%A8%D9%84%D8%B3%3C%2Ftext%3E%3Ctext%20x%3D%22300%22%20y%3D%22590%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%3E%D8%BA%D9%8A%D8%AB%D8%A7%D9%86%20%D8%A8%D8%A7%D8%AD%D8%A7%D8%AC%3C%2Ftext%3E%3C%2Fsvg%3E';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** idx).toFixed(idx === 3 ? 2 : 1)} ${units[idx]}`;
}

function normalizeExternalVideoUrl(raw: string): string {
  let trimmed = raw.trim();
  if (!trimmed) return '';
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    trimmed = iframeSrcMatch[1].trim();
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'lulustream.com' ||
      host.endsWith('.lulustream.com') ||
      host === 'luluvdo.com' ||
      host.endsWith('.luluvdo.com') ||
      host === 'lulucdn.com' ||
      host.endsWith('.lulucdn.com')
    ) {
      const match = parsed.pathname.match(/^\/(?:(?:d|f)\/)?([a-zA-Z0-9_-]{6,})\/?$/);
      if (match && !/\.(mp4|webm|m3u8|mkv|mov)$/i.test(parsed.pathname)) {
        parsed.pathname = `/e/${match[1]}`;
      }
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function isDirectVideoSource(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/api/video/')) return true;
  return /\.(mp4|webm|mov|m4v|mkv|ogg)(\?.*)?$/i.test(url);
}

export default function App() {
  const defaultDomain = 'https://cinemaplus.lat';

  const watchParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('watch') || '';
    } catch {
      return '';
    }
  }, []);

  const queryParam = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  }, []);

  // Broadcast intro overlay state
  const [showIntro, setShowIntro] = useState(!watchParam && !queryParam);
  const [introExiting, setIntroExiting] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [introReady, setIntroReady] = useState(false);
  const [channelIndex, setChannelIndex] = useState(0);
  const [channelFlash, setChannelFlash] = useState(false);

  // Catalog & local user lists
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>(() => readStorage('cinemaplus_cloud_watchlist', []));
  const [history, setHistory] = useState<string[]>(() => readStorage('cinemaplus_cloud_history', []));

  // Navigation & filter state
  const [activeTab, setActiveTab] = useState<NavTab>(queryParam ? 'search' : 'home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('الكل');
  const [selectedQuality, setSelectedQuality] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [searchFocused, setSearchFocused] = useState(false);

  // Modals (Details & Player)
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [playerItem, setPlayerItem] = useState<CatalogItem | null>(null);
  const [playerSrc, setPlayerSrc] = useState('');
  const [playerError, setPlayerError] = useState(false);
  const [playerQuality, setPlayerQuality] = useState('4K UHD');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoOpenedWatchRef = useRef(false);

  // Developer Auth State
  const [devToken, setDevToken] = useState('');
  const [hasConfiguredPin, setHasConfiguredPin] = useState(true);
  const [managedByEnv, setManagedByEnv] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinDigits, setPinDigits] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const isDevUnlocked = Boolean(devToken);

  // Change PIN State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Upload Form & 5GB Chunked Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<'movie' | 'series'>('movie');
  const [uploadGenre, setUploadGenre] = useState('أكشن');
  const [uploadYear, setUploadYear] = useState('2026');
  const [uploadQuality, setUploadQuality] = useState('4K UHD');
  const [uploadRating, setUploadRating] = useState('9.3');
  const [uploadSynopsis, setUploadSynopsis] = useState('');
  const [videoSourceMode, setVideoSourceMode] = useState<'file' | 'url'>('file');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [externalPosterUrl, setExternalPosterUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState('');
  const [uploadError, setUploadError] = useState('');
  const abortUploadRef = useRef<AbortController | null>(null);

  // Toast & Site Config & Domain helper state
  const [toast, setToast] = useState('');
  const [publicSiteUrl, setPublicSiteUrl] = useState('');
  const [currentHost, setCurrentHost] = useState('');
  const [isCustomDomainActive, setIsCustomDomainActive] = useState(false);
  const [domainSectionOpen, setDomainSectionOpen] = useState(false);
  const [domainTab, setDomainTab] = useState<'worker' | 'mapping'>('worker');
  const [cloudRunHost, setCloudRunHost] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [hapticKey, setHapticKey] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 3400);
  }, []);

  const triggerHaptic = useCallback((key?: string) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(18);
      }
    } catch {}
    if (key) {
      setHapticKey(key);
      setTimeout(() => {
        setHapticKey((prev) => (prev === key ? '' : prev));
      }, 300);
    }
  }, []);

  const fallbackOrigin = useMemo(() => {
    if (typeof window !== 'undefined') {
      const { origin, hostname } = window.location;
      return hostname.startsWith('ais-dev-') ? origin.replace('ais-dev-', 'ais-pre-') : origin;
    }
    return defaultDomain;
  }, []);

  const siteUrl = useMemo(() => {
    if (publicSiteUrl) return publicSiteUrl;
    if (typeof window !== 'undefined') {
      const { origin, hostname } = window.location;
      if (
        hostname &&
        !hostname.startsWith('ais-dev-') &&
        !hostname.startsWith('ais-pre-') &&
        hostname !== 'localhost' &&
        hostname !== '127.0.0.1'
      ) {
        return origin;
      }
    }
    return defaultDomain;
  }, [publicSiteUrl]);

  const copyText = useCallback(
    async (value: string, toastMsg: string) => {
      triggerHaptic();
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(value);
          showToast(toastMsg);
          return;
        }
      } catch {}
      try {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(toastMsg);
      } catch {
        showToast(value);
      }
    },
    [showToast, triggerHaptic]
  );

  const shareOrCopy = useCallback(
    async (url: string, title: string, fallbackToast: string) => {
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch {}
      }
      await copyText(url, fallbackToast);
    },
    [copyText]
  );

  const whatsappLink = 'https://wa.me/967772908480';
  const copyWhatsapp = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await copyText('+967772908480', 'تم نسخ رقم الواتساب: +967772908480');
  };

  // Intro Broadcast Timer
  useEffect(() => {
    if (!showIntro) return;
    const switchCh = (idx: number) => {
      setChannelFlash(true);
      setChannelIndex(idx);
      setTimeout(() => setChannelFlash(false), 160);
    };
    const interval = setInterval(() => {
      setChannelIndex((prev) => {
        const next = (prev + 1) % INTRO_CHANNELS.length;
        setChannelFlash(true);
        setTimeout(() => setChannelFlash(false), 160);
        return next;
      });
    }, 900);
    const t1 = setTimeout(() => {
      setCountdown(3);
      switchCh(1);
    }, 900);
    const t2 = setTimeout(() => {
      setCountdown(2);
      switchCh(2);
    }, 1800);
    const t3 = setTimeout(() => {
      setCountdown(1);
      switchCh(3);
    }, 2700);
    const t4 = setTimeout(() => {
      setIntroReady(true);
    }, 3600);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [showIntro]);

  const enterCinema = () => {
    setIntroExiting(true);
    setTimeout(() => {
      setShowIntro(false);
      setIntroExiting(false);
    }, 550);
  };

  // Server Data Fetching & Real-time Sync
  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCatalog(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const fetchDevStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setHasConfiguredPin(Boolean(data.hasConfiguredPin));
        setManagedByEnv(Boolean(data.managedByEnv));
      }
    } catch {}
  }, []);

  const fetchSiteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.publicSiteUrl) setPublicSiteUrl(data.publicSiteUrl);
        if (data.currentHost) {
          setCurrentHost(data.currentHost);
          setCloudRunHost((prev) => prev || data.currentHost || '');
        }
        setIsCustomDomainActive(Boolean(data.isCustomDomainActive));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCatalog();
    fetchDevStatus();
    fetchSiteConfig();

    const onFocus = () => fetchCatalog();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCatalog();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') fetchCatalog();
    }, 20000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(poll);
    };
  }, [fetchCatalog, fetchDevStatus, fetchSiteConfig]);

  // Open ?watch= item automatically once catalog loads
  useEffect(() => {
    if (autoOpenedWatchRef.current || !watchParam || loadingCatalog) return;
    const match = catalog.find((item) => item.id === watchParam);
    if (match) {
      autoOpenedWatchRef.current = true;
      setDetailItem(match);
    }
  }, [watchParam, catalog, loadingCatalog]);

  useEffect(() => {
    writeStorage('cinemaplus_cloud_watchlist', watchlist);
  }, [watchlist]);

  useEffect(() => {
    writeStorage('cinemaplus_cloud_history', history);
  }, [history]);

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedGenre('الكل');
    setSelectedQuality('الكل');
    setDrawerOpen(false);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const toggleWatchlist = (id: string, title: string) => {
    setWatchlist((prev) => {
      if (prev.includes(id)) {
        showToast(`تمت إزالة "${title}" من قائمتي`);
        return prev.filter((item) => item !== id);
      }
      showToast(`تمت إضافة "${title}" إلى قائمتي`);
      return [id, ...prev];
    });
  };

  const playItem = (item: CatalogItem) => {
    setDetailItem(null);
    setPlayerError(false);
    setPlayerItem(item);
    setPlayerQuality(item.quality || '4K UHD');
    setHistory((prev) => [item.id, ...prev.filter((id) => id !== item.id)].slice(0, 15));
    if (item.videoUrl) {
      setPlayerSrc(item.videoUrl);
    } else {
      setPlayerSrc('');
      setPlayerError(true);
    }
  };

  // Developer PIN Auth Flow
  const openPinModal = async () => {
    if (isDevUnlocked) return;
    await fetchDevStatus();
    setPinDigits('');
    setPinError('');
    setPinModalOpen(true);
  };

  const submitPin = async (pin: string) => {
    setPinSubmitting(true);
    setPinError('');
    try {
      const endpoint = hasConfiguredPin ? '/api/dev/login' : '/api/dev/claim';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setPinError(data.error || 'رمز المطور غير صحيح، حاول مرة أخرى');
        setPinDigits('');
        return;
      }
      if (data.claimed) setHasConfiguredPin(true);
      setDevToken(data.token);
      setPinModalOpen(false);
      setPinDigits('');
      showToast(data.claimed ? 'تم تعيين رمز المطور (8 أرقام) وفتح الوضع' : 'تم فتح وضع المطور');
    } catch {
      setPinError('تعذر الاتصال بالخادم، حاول مرة أخرى');
      setPinDigits('');
    } finally {
      setPinSubmitting(false);
    }
  };

  const handlePinFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinSubmitting) return;
    if (!/^\d{8}$/.test(pinDigits)) {
      setPinError('يجب إدخال 8 أرقام كاملة');
      return;
    }
    submitPin(pinDigits);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);
    if (!/^\d{8}$/.test(oldPin)) {
      setPinFeedback({ type: 'error', text: 'يجب أن يتكون الرمز الحالي من 8 أرقام' });
      return;
    }
    if (!/^\d{8}$/.test(newPin)) {
      setPinFeedback({ type: 'error', text: 'يجب أن يتكون الرمز الجديد من 8 أرقام' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinFeedback({ type: 'error', text: 'تأكيد الرمز غير متطابق' });
      return;
    }
    try {
      const res = await fetch('/api/dev/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({ oldPin, newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinFeedback({ type: 'error', text: data.error || 'تعذر تحديث الرمز' });
        return;
      }
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinFeedback({ type: 'success', text: 'تم تحديث رمز المطور المكون من 8 أرقام بنجاح' });
      showToast('تم حفظ رمز PIN الجديد');
    } catch {
      setPinFeedback({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('حجم الملف يتجاوز الحد الأقصى المسموح به (5 جيجابايت).');
      showToast('الحد الأقصى لحجم الفيلم هو 5 جيجابايت');
      e.target.value = '';
      return;
    }
    setUploadError('');
    setVideoFile(file);
  };

  const handlePosterPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPosterPreview(reader.result);
    };
    reader.onerror = () => {
      try {
        setPosterPreview(URL.createObjectURL(file));
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  // Upload helper: upload chunk with retries
  const uploadSingleChunk = async (
    uploadId: string,
    chunkIndex: number,
    totalChunks: number,
    file: File,
    signal: AbortSignal
  ) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const blob = file.slice(start, end);

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (signal.aborted) throw new Error('تم إلغاء الرفع');
      try {
        const res = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: {
            'x-upload-id': uploadId,
            'x-chunk-index': String(chunkIndex),
            'x-total-chunks': String(totalChunks),
            'x-file-name': encodeURIComponent(file.name),
            'x-total-size': String(file.size),
          },
          body: blob,
          signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `فشل رفع الجزء ${chunkIndex + 1}`);
        }
        return blob.size;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error('فشل الاتصال أثناء الرفع');
        if (signal.aborted) throw lastErr;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    throw lastErr || new Error('تعذر رفع جزء من الفيديو');
  };

  // 5GB Chunked Upload OR External Streaming Host Link (e.g., LuluStream) & Global Publish
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('account-publish');
    setUploadError('');

    if (!devToken) {
      showToast('يرجى فتح وضع المطور أولاً');
      return;
    }
    if (!uploadTitle.trim()) {
      showToast('يرجى إدخال عنوان الفيلم أو المسلسل');
      return;
    }

    let normalizedExternalUrl = '';
    if (videoSourceMode === 'url') {
      normalizedExternalUrl = normalizeExternalVideoUrl(externalVideoUrl);
      if (!normalizedExternalUrl) {
        const msg = 'يرجى إدخال رابط تشغيل صحيح يبدأ بـ https:// (مثل رابط لولو ستريم أو رابط مباشر)';
        setUploadError(msg);
        showToast(msg);
        return;
      }
    } else {
      if (!videoFile) {
        showToast('يرجى اختيار ملف الفيديو من جوالك أو جهازك');
        return;
      }
      if (videoFile.size > MAX_UPLOAD_BYTES) {
        setUploadError('حجم الفيلم يتجاوز الحد الأقصى المسموح به (5 جيجابايت).');
        showToast('الحد الأقصى لحجم الفيلم هو 5 جيجابايت');
        return;
      }
    }

    const controller = new AbortController();
    abortUploadRef.current = controller;
    setIsUploading(true);
    setUploadProgress(videoSourceMode === 'url' ? 50 : 1);
    setUploadStats(
      videoSourceMode === 'url'
        ? 'جاري ربط ونشر الرابط...'
        : `جاري تهيئة رفع ${formatBytes(videoFile!.size)}...`
    );

    try {
      // 1. Upload Poster Image first if present, or use external poster URL
      let uploadedPosterUrl = externalPosterUrl.trim();
      if (posterFile) {
        const extMatch = posterFile.name.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        const imgExt = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
        try {
          const imgRes = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'x-image-ext': imgExt },
            body: posterFile,
            signal: controller.signal,
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData.imageUrl) uploadedPosterUrl = imgData.imageUrl;
          }
        } catch {
          if (posterPreview && posterPreview.startsWith('data:')) {
            uploadedPosterUrl = posterPreview;
          }
        }
      }

      let finalVideoUrl = normalizedExternalUrl;
      let finalFileSize = 0;

      if (videoSourceMode === 'file' && videoFile) {
        // 2. Initialize 5GB chunked session
        const totalChunks = Math.max(1, Math.ceil(videoFile.size / CHUNK_SIZE));
        const initRes = await fetch('/api/upload/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: videoFile.name,
            fileSize: videoFile.size,
            totalChunks,
            chunkSize: CHUNK_SIZE,
          }),
          signal: controller.signal,
        });
        const initData = await initRes.json();
        if (!initRes.ok || !initData.uploadId) {
          throw new Error(initData.error || 'تعذر بدء جلسة رفع الفيلم');
        }

        const uploadId = initData.uploadId as string;
        const startTime = Date.now();
        let uploadedBytes = 0;
        let nextChunk = 0;

        // Upload chunks with concurrency = 2
        const concurrency = Math.min(2, totalChunks);
        const worker = async () => {
          while (nextChunk < totalChunks) {
            const idx = nextChunk++;
            const chunkBytes = await uploadSingleChunk(
              uploadId,
              idx,
              totalChunks,
              videoFile,
              controller.signal
            );
            uploadedBytes += chunkBytes;
            const pct = Math.min(95, Math.max(2, Math.round((uploadedBytes / videoFile.size) * 95)));
            const elapsedSec = Math.max(0.5, (Date.now() - startTime) / 1000);
            const speedMb = uploadedBytes / (1024 * 1024) / elapsedSec;
            setUploadProgress(pct);
            setUploadStats(
              `${formatBytes(uploadedBytes)} / ${formatBytes(videoFile.size)} · ${speedMb.toFixed(1)} MB/s`
            );
          }
        };

        await Promise.all(Array.from({ length: concurrency }, () => worker()));

        // 3. Merge chunks on server
        setUploadProgress(96);
        setUploadStats('جاري تجميع وتجهيز الفيلم للبث المباشر...');
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadId,
            totalChunks,
            fileName: videoFile.name,
          }),
          signal: controller.signal,
        });
        const completeData = await completeRes.json();
        if (!completeRes.ok || !completeData.videoUrl) {
          throw new Error(completeData.error || 'فشل تجهيز ملف الفيديو على الخادم');
        }

        finalVideoUrl = completeData.videoUrl;
        finalFileSize = completeData.fileSize || videoFile.size;
      }

      // 4. Publish to shared global catalog (/api/media)
      setUploadProgress(99);
      const mediaRes = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${devToken}`,
        },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          type: uploadType,
          genre: uploadGenre,
          year: uploadYear,
          quality: uploadQuality,
          rating: uploadRating,
          synopsis: uploadSynopsis.trim(),
          poster: uploadedPosterUrl,
          videoUrl: finalVideoUrl,
          fileSize: finalFileSize,
        }),
        signal: controller.signal,
      });
      const mediaData = await mediaRes.json();
      if (!mediaRes.ok || !mediaData.item) {
        throw new Error(mediaData.error || 'فشل حفظ العمل في المنصة');
      }

      setUploadProgress(100);
      setCatalog((prev) => [mediaData.item, ...prev.filter((i) => i.id !== mediaData.item.id)]);
      setUploadTitle('');
      setUploadSynopsis('');
      setExternalVideoUrl('');
      setExternalPosterUrl('');
      setVideoFile(null);
      setPosterFile(null);
      setPosterPreview('');
      setUploadStats('');
      showToast('تم نشر الفيلم بنجاح وأصبح متاحاً للمشاهدة في جميع أنحاء العالم');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذّر إتمام الرفع، حاول مرة أخرى';
      setUploadError(msg);
      showToast(msg);
    } finally {
      abortUploadRef.current = null;
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStats('');
      }, 450);
    }
  };

  const handleDeleteItem = async (item: CatalogItem) => {
    if (!devToken) {
      showToast('يرجى فتح وضع المطور أولاً');
      return;
    }
    try {
      const res = await fetch(`/api/media/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${devToken}` },
      });
      if (!res.ok) {
        showToast('تعذّر حذف العمل');
        return;
      }
      setCatalog((prev) => prev.filter((i) => i.id !== item.id));
      setWatchlist((prev) => prev.filter((id) => id !== item.id));
      setHistory((prev) => prev.filter((id) => id !== item.id));
      showToast(`تم حذف "${item.title}"`);
    } catch {
      showToast('تعذّر الاتصال بالخادم');
    }
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (activeTab === 'movies' && item.type !== 'movie') return false;
      if (activeTab === 'series' && item.type !== 'series') return false;
      if (selectedGenre !== 'الكل' && item.genre !== selectedGenre) return false;
      if (selectedQuality !== 'الكل' && item.quality !== selectedQuality) return false;
      if (activeTab === 'search' && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.genre && item.genre.toLowerCase().includes(q)) ||
          String(item.year || '').includes(q) ||
          (item.synopsis && item.synopsis.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [catalog, activeTab, selectedGenre, selectedQuality, searchQuery]);

  const watchlistItems = useMemo(
    () => catalog.filter((item) => watchlist.includes(item.id)),
    [catalog, watchlist]
  );

  const historyItems = useMemo(() => {
    const map = new Map(catalog.map((item) => [item.id, item]));
    return history.map((id) => map.get(id)).filter((item): item is CatalogItem => Boolean(item));
  }, [catalog, history]);

  const featured = catalog[0] || null;
  const baseUrlForLinks = (publicSiteUrl || siteUrl || fallbackOrigin).replace(/\/+$/, '');
  const getWatchUrl = (id: string) => `${baseUrlForLinks}/?watch=${encodeURIComponent(id)}`;
  const getSearchUrl = (q: string) => `${baseUrlForLinks}/?q=${encodeURIComponent(q.trim())}`;

  const quickResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (item) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.genre && item.genre.toLowerCase().includes(q)) ||
          String(item.year || '').includes(q) ||
          (item.synopsis && item.synopsis.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [catalog, searchQuery]);

  const workerSnippet = `export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "${(
      cloudRunHost ||
      currentHost ||
      (typeof window !== 'undefined' ? window.location.hostname : '') ||
      'ais-pre-irxl6twctoidmgeesvnlww-217004151415.europe-west1.run.app'
    ).replace('ais-dev-', 'ais-pre-')}";
    const headers = new Headers(request.headers);
    headers.set("x-cinemaplus-proxy", "1");
    return fetch(new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual"
    }));
  }
};`;

  const renderPosterCard = (item: CatalogItem, keyPrefix = '') => {
    const inWatchlist = watchlist.includes(item.id);
    return (
      <article
        key={`${keyPrefix}${item.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#1e3252] bg-[#0c1526] transition-all duration-200 hover:-translate-y-1 hover:border-[#38bdf8]/60 hover:shadow-2xl hover:shadow-[#0284c7]/15"
      >
        <div
          onClick={() => setDetailItem(item)}
          className="relative aspect-[2/3] w-full cursor-pointer overflow-hidden bg-[#111d35]"
        >
          <img
            src={item.poster || FALLBACK_POSTER}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_POSTER;
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1526] via-transparent to-[#060b14]/50" />
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 rounded-lg bg-[#060b14]/85 px-2 py-1 text-[#fbbf24] tabular-nums backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-[#fbbf24]" />
              {item.rating}
            </span>
            <span className="rounded-lg bg-[#060b14]/85 px-2 py-1 text-[11px] text-[#7dd3fc] backdrop-blur-md">
              {item.quality}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-[#060b14]/55 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playItem(item);
              }}
              className="play-btn-pulse relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] text-[#060b14] shadow-xl shadow-[#0ea5e9]/40 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7dd3fc]"
              aria-label="مشاهدة الآن"
            >
              <span
                aria-hidden="true"
                className="play-ring-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-[#38bdf8]"
              />
              <Play className="relative z-10 h-6 w-6 fill-[#060b14]" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8]">
              <span className="text-[#38bdf8]">{item.genre}</span>
              <span aria-hidden="true">·</span>
              <span>{item.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{item.year}</span>
            </div>
            <h3
              onClick={() => setDetailItem(item)}
              className="cursor-pointer text-base font-extrabold text-[#f1f5f9] line-clamp-1 transition-colors group-hover:text-[#38bdf8]"
            >
              {item.title}
            </h3>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-[#1e3252]/70 pt-3">
            <button
              type="button"
              onClick={() => playItem(item)}
              className="play-cta-btn flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#38bdf8]/35 bg-[#38bdf8]/15 px-3 py-2 text-xs font-extrabold text-[#38bdf8] transition-all duration-200 hover:bg-[#38bdf8] hover:text-[#060b14] hover:shadow-lg hover:shadow-[#38bdf8]/25 whitespace-nowrap"
            >
              <Play className="play-icon-pulse h-3.5 w-3.5 rounded-full fill-current" />
              <span>مشاهدة الآن</span>
            </button>
            <button
              type="button"
              onClick={() =>
                shareOrCopy(getWatchUrl(item.id), item.title, `تم نسخ رابط "${item.title}" للمشاركة`)
              }
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#1e3252] bg-[#111d35]/60 text-[#cbd5e1] transition-colors hover:text-[#38bdf8]"
              title="نسخ رابط الفيلم"
              aria-label="نسخ رابط الفيلم"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleWatchlist(item.id, item.title)}
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border transition-colors ${
                inWatchlist
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-[#1e3252] bg-[#111d35]/60 text-[#cbd5e1] hover:text-[#f1f5f9]'
              }`}
              title={inWatchlist ? 'في قائمتي' : 'إضافة لقائمتي'}
              aria-label={inWatchlist ? 'إزالة من قائمتي' : 'إضافة لقائمتي'}
            >
              {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderFilterBar = () => (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#1e3252] bg-[#0c1526]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#38bdf8]" />
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => setSelectedGenre(genre)}
            className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
              selectedGenre === genre
                ? 'bg-[#38bdf8] text-[#060b14]'
                : 'bg-[#111d35] text-[#cbd5e1] hover:bg-[#1a2b4c] hover:text-[#f1f5f9]'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUALITIES.map((quality) => (
          <button
            key={quality}
            type="button"
            onClick={() => setSelectedQuality(quality)}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-lg border px-3 py-1 text-xs font-bold transition-colors ${
              selectedQuality === quality
                ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#38bdf8]'
                : 'border-[#1e3252] bg-[#060b14]/60 text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            {quality}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      dir="rtl"
      className="relative flex min-h-screen flex-col bg-[#060b14] text-[#f1f5f9] selection:bg-[#38bdf8] selection:text-[#060b14] overflow-x-hidden pb-20 lg:pb-0"
    >
      {/* Atmosphere overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] midnight-grain opacity-[0.025] mix-blend-overlay"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[59] midnight-vignette" />

      {/* Broadcast Intro Overlay */}
      {showIntro && (
        <div
          className={`fixed inset-0 z-[55] flex flex-col items-center justify-center overflow-hidden bg-[#030711] transition-all duration-500 ${
            introExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          {INTRO_CHANNELS.map((ch, idx) => (
            <div
              key={ch.channel}
              className={`absolute inset-0 transition-opacity duration-200 ${
                idx === channelIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={ch.url}
                alt={`مشهد سينمائي ${ch.channel}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = ch.fallback;
                }}
                className={`h-full w-full object-cover object-center contrast-125 saturate-125 ${
                  idx === channelIndex ? 'animate-ken-burns' : ''
                }`}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-[#050e1d]/50 to-[#030711]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.24)_0%,rgba(2,132,199,0.08)_45%,rgba(2,5,11,0.75)_100%)]" />
          <div className="pointer-events-none absolute inset-0 broadcast-scanlines opacity-75" />
          <div className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#38bdf8]/12 to-transparent broadcast-scanbar" />
          <div
            className={`pointer-events-none absolute inset-0 bg-[#38bdf8]/25 transition-opacity duration-150 ${
              channelFlash ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Top Broadcast HUD */}
          <div className="pointer-events-none absolute top-6 sm:top-10 inset-x-4 sm:inset-x-8 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-[#38bdf8]/50 bg-[#040a14]/85 px-3.5 py-1.5 backdrop-blur-md shadow-lg shadow-[#0284c7]/20">
              <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8] animate-ping" />
              <span className="text-xs sm:text-sm font-black tracking-wider text-[#38bdf8]" dir="ltr">
                {INTRO_CHANNELS[channelIndex].channel}
              </span>
              <span className="hidden sm:inline text-xs font-extrabold text-[#f1f5f9]" dir="ltr">
                · {INTRO_CHANNELS[channelIndex].tag}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-[#1e3252] bg-[#040a14]/85 px-3 py-1.5 backdrop-blur-md">
              {INTRO_CHANNELS.map((ch, idx) => (
                <span
                  key={ch.channel}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    idx === channelIndex ? 'w-6 bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]' : 'w-2 bg-[#334155]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 inset-x-0 h-5 sm:h-7 bg-[#02050b]/95 border-b border-[#38bdf8]/20" />
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-5 sm:h-7 bg-[#02050b]/95 border-t border-[#38bdf8]/20" />

          {/* Center Cinema Plus Brand & Countdown */}
          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <div className="mb-7 flex items-center gap-3 rounded-2xl border border-[#38bdf8]/30 bg-[#040a14]/80 px-5 py-3 backdrop-blur-md shadow-2xl">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] shadow-2xl shadow-[#0ea5e9]/45">
                <Clapperboard className="h-6 w-6 sm:h-7 sm:w-7 text-[#060b14] stroke-[2.4]" />
              </div>
              <div className="text-right">
                <span className="block text-2xl sm:text-3xl font-black tracking-tight text-[#f1f5f9]">
                  سينما بلس
                </span>
                <p className="text-xs font-bold text-[#7dd3fc]">بث سينمائي عالي الدقة</p>
              </div>
            </div>

            {introReady ? (
              <div className="animate-cta-reveal flex flex-col items-center space-y-5">
                <button
                  type="button"
                  onClick={enterCinema}
                  className="group relative flex items-center gap-3.5 rounded-full bg-gradient-to-l from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] px-10 py-4 sm:px-12 sm:py-5 text-lg sm:text-xl font-black text-[#060b14] shadow-[0_0_45px_rgba(56,189,248,0.55)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_65px_rgba(56,189,248,0.85)] active:scale-95"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#060b14]/15 transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-5 w-5 fill-[#060b14]" />
                  </span>
                  <span>ابدأ المشاهدة</span>
                </button>
              </div>
            ) : (
              <div className="relative flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center">
                <div className="pointer-events-none absolute inset-x-0 h-[1.5px] bg-[#38bdf8]/40" />
                <div className="pointer-events-none absolute inset-y-0 w-[1.5px] bg-[#38bdf8]/40" />
                <div className="absolute inset-0 rounded-full border-2 border-[#38bdf8]/55 shadow-[0_0_55px_rgba(56,189,248,0.35)]" />
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#38bdf8]/60" />
                <div className="absolute inset-8 rounded-full border border-[#7dd3fc]/30 bg-[#040b17]/75 backdrop-blur-md" />
                <div className="absolute inset-1 rounded-full animate-reel-sweep">
                  <div className="mx-auto h-1/2 w-[3px] bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-transparent shadow-[0_0_16px_#38bdf8]" />
                </div>
                <span
                  key={countdown}
                  className="relative z-10 animate-count-pulse text-7xl sm:text-8xl font-black text-[#f1f5f9] tabular-nums drop-shadow-[0_0_30px_rgba(56,189,248,0.85)]"
                >
                  {countdown}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 lg:bottom-6 left-1/2 z-[70] -translate-x-1/2 flex items-center gap-2.5 rounded-2xl border border-[#38bdf8]/45 bg-[#0c1526]/95 px-5 py-3 text-sm font-bold text-[#f1f5f9] shadow-2xl shadow-[#0284c7]/25 backdrop-blur-md"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#38bdf8]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[#1e3252]/80 bg-[#060b14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          <a
            href={siteUrl}
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="flex items-center gap-2.5 text-xl font-black tracking-tight text-[#f1f5f9] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] rounded-lg"
          >
            <Clapperboard className="h-6 w-6 text-[#38bdf8]" />
            <span>سينما بلس</span>
          </a>

          <nav className="hidden lg:flex items-center gap-7" aria-label="التنقل الرئيسي">
            {NAV_ITEMS.slice(0, 5).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative py-1 text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
                    active ? 'text-[#38bdf8]' : 'text-[#cbd5e1] hover:text-[#f1f5f9]'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#38bdf8]" />}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#1e3252] bg-[#0c1526] text-[#f1f5f9] transition-colors hover:border-[#38bdf8] hover:text-[#38bdf8]"
              aria-label="فتح القائمة"
              title="القائمة والتواصل"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation & Contact Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <aside className="relative mr-auto flex h-full w-80 max-w-[85vw] flex-col justify-between overflow-y-auto border-r border-[#1e3252] bg-[#0c1526] p-6 shadow-2xl">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-[#1e3252] pb-4">
                <div className="flex items-center gap-2.5 text-lg font-black text-[#f1f5f9]">
                  <Clapperboard className="h-5 w-5 text-[#38bdf8]" />
                  <span>سينما بلس</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#1e3252] text-[#cbd5e1] hover:text-[#f1f5f9]"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                        active
                          ? 'border border-[#38bdf8]/35 bg-[#38bdf8]/15 text-[#38bdf8]'
                          : 'text-[#cbd5e1] hover:bg-[#111d35] hover:text-[#f1f5f9]'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 rounded-2xl border border-[#1e3252] bg-[#060b14]/80 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>التواصل عبر واتساب</span>
                </div>
                <p className="text-sm font-black text-[#f1f5f9] tabular-nums" dir="ltr">
                  +967772908480
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDrawerOpen(false)}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-[#060b14] transition-colors hover:bg-emerald-400"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>مراسلة واتساب</span>
                  </a>
                  <button
                    type="button"
                    onClick={copyWhatsapp}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#1e3252] bg-[#111d35] text-[#cbd5e1] hover:text-[#f1f5f9]"
                    title="نسخ الرقم"
                    aria-label="نسخ رقم الواتساب"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-6 border-t border-[#1e3252] pt-4 text-center text-xs font-bold text-[#94a3b8]">
              سينما بلس تابعة لـ غيثان باحاج
            </p>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Quick Search Bar */}
        <section className="mb-8" aria-label="البحث السريع في سينما بلس">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchFocused(false);
              navigateTo('search');
            }}
            className="relative"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-[#1e3252] bg-[#0c1526]/95 p-1.5 shadow-lg shadow-[#0284c7]/5 focus-within:border-[#38bdf8]">
              <Search className="mr-3 h-5 w-5 shrink-0 text-[#38bdf8]" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setSearchFocused(false), 180);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="ابحث فوراً عن فيلم، مسلسل، تصنيف أو سنة..."
                className="w-full bg-transparent py-2.5 px-2 text-sm font-medium text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#94a3b8] hover:bg-[#111d35] hover:text-[#f1f5f9]"
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl bg-[#38bdf8] px-4 py-2 text-xs font-black text-[#060b14] transition-colors hover:bg-[#7dd3fc]"
              >
                <Search className="h-3.5 w-3.5" />
                <span>بحث</span>
              </button>
            </div>

            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 left-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[#1e3252] bg-[#0c1526] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#1e3252] bg-[#060b14]/70 px-4 py-2.5 text-xs">
                  <span className="font-bold text-[#cbd5e1]">
                    نتائج البحث الفوري عن «{searchQuery.trim()}»
                  </span>
                  <a
                    href={getSearchUrl(searchQuery)}
                    onClick={(e) => {
                      e.preventDefault();
                      setSearchFocused(false);
                      navigateTo('search');
                    }}
                    className="font-bold text-[#38bdf8] hover:underline"
                    dir="ltr"
                  >
                    {getSearchUrl(searchQuery)}
                  </a>
                </div>
                {quickResults.length > 0 ? (
                  <div className="divide-y divide-[#1e3252]/70">
                    {quickResults.map((item) => {
                      const url = getWatchUrl(item.id);
                      return (
                        <div
                          key={`qs-${item.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#111d35]/60"
                        >
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchFocused(false);
                              setDetailItem(item);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-3 text-right"
                          >
                            <img
                              src={item.poster || FALLBACK_POSTER}
                              alt={item.title}
                              className="h-12 w-9 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-[#f1f5f9]">{item.title}</p>
                              <p className="truncate text-[11px] text-[#94a3b8]">
                                {item.type === 'movie' ? 'فيلم' : 'مسلسل'} · {item.genre} · {item.year} ·{' '}
                                {item.quality}
                              </p>
                              <p className="truncate text-[11px] text-[#38bdf8]" dir="ltr">
                                {url}
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                copyText(url, `تم النسخ: ${url}`);
                              }}
                              className="flex min-h-[36px] items-center gap-1 rounded-xl border border-[#1e3252] bg-[#060b14] px-3 py-1.5 text-xs font-bold text-[#cbd5e1] hover:border-[#38bdf8] hover:text-[#38bdf8]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>نسخ</span>
                            </button>
                            <a
                              href={url}
                              onClick={(e) => {
                                e.preventDefault();
                                setSearchFocused(false);
                                playItem(item);
                              }}
                              className="flex min-h-[36px] items-center gap-1 rounded-xl bg-[#38bdf8] px-3 py-1.5 text-xs font-black text-[#060b14] hover:bg-[#7dd3fc]"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>تشغيل</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 p-4 text-center">
                    <p className="text-xs font-semibold text-[#94a3b8]">
                      لا توجد أعمال مطابقة حالياً في المكتبة لـ «{searchQuery.trim()}».
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {NAV_ITEMS.slice(0, 5).map((nav) => (
                        <a
                          key={`qnav-${nav.id}`}
                          href={siteUrl}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchFocused(false);
                            navigateTo(nav.id);
                          }}
                          className="rounded-xl border border-[#1e3252] bg-[#111d35] px-3 py-1.5 text-xs font-bold text-[#cbd5e1] hover:border-[#38bdf8] hover:text-[#38bdf8]"
                        >
                          {nav.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {featured && (
              <section className="relative overflow-hidden rounded-3xl border border-[#1e3252] bg-[#0c1526]">
                <div className="grid items-stretch lg:grid-cols-12">
                  <div className="relative z-10 flex flex-col justify-center p-6 sm:p-10 lg:col-span-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#94a3b8]">
                      <span className="text-[#38bdf8]">العمل المميز</span>
                      <span aria-hidden="true">·</span>
                      <span>{featured.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{featured.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{featured.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{featured.quality}</span>
                    </div>
                    <h1 className="mb-4 text-3xl font-black leading-tight text-[#f1f5f9] sm:text-4xl lg:text-5xl [text-wrap:balance]">
                      {featured.title}
                    </h1>
                    <p className="mb-6 max-w-xl text-sm leading-relaxed text-[#cbd5e1] sm:text-base line-clamp-3">
                      {featured.synopsis}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => playItem(featured)}
                        className="flex min-h-[46px] items-center gap-2 rounded-xl bg-[#38bdf8] px-6 py-3 text-sm font-black text-[#060b14] transition-colors hover:bg-[#7dd3fc] whitespace-nowrap"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>مشاهدة الآن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailItem(featured)}
                        className="flex min-h-[46px] items-center gap-2 rounded-xl border border-[#1e3252] bg-[#111d35] px-5 py-3 text-sm font-bold text-[#f1f5f9] transition-colors hover:border-[#38bdf8]/50 whitespace-nowrap"
                      >
                        <Info className="h-4 w-4 text-[#38bdf8]" />
                        <span>التفاصيل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          shareOrCopy(
                            getWatchUrl(featured.id),
                            featured.title,
                            `تم نسخ رابط "${featured.title}"`
                          )
                        }
                        className="flex min-h-[46px] items-center gap-2 rounded-xl border border-[#1e3252] bg-[#060b14]/60 px-4 py-3 text-sm font-bold text-[#cbd5e1] transition-colors hover:text-[#f1f5f9] whitespace-nowrap"
                      >
                        <Share2 className="h-4 w-4 text-[#38bdf8]" />
                        <span>مشاركة الرابط</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative min-h-[260px] lg:col-span-6 lg:min-h-[420px]">
                    <img
                      src={featured.backdrop || featured.poster || FALLBACK_POSTER}
                      alt={featured.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_POSTER;
                      }}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1526] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0c1526]" />
                  </div>
                </div>
              </section>
            )}

            {historyItems.length > 0 && (
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-black text-[#f1f5f9]">
                    <History className="h-5 w-5 text-[#38bdf8]" />
                    <span>استكمال المشاهدة</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {historyItems.slice(0, 5).map((item) => renderPosterCard(item, 'hist-'))}
                </div>
              </section>
            )}

            {catalog.length > 0 && (
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xl font-black text-[#f1f5f9]">
                    <Sparkles className="h-5 w-5 text-[#38bdf8]" />
                    <span>أحدث الإضافات</span>
                  </h2>
                  <span className="text-xs font-bold text-[#94a3b8] tabular-nums">
                    {filteredCatalog.length} عمل
                  </span>
                </div>
                {renderFilterBar()}
                {filteredCatalog.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredCatalog.map((item) => renderPosterCard(item))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#1e3252] bg-[#0c1526] p-8 text-center text-sm text-[#94a3b8]">
                    لا توجد أعمال مطابقة للفلاتر المحددة حالياً.
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* Movies / Series Tabs */}
        {(activeTab === 'movies' || activeTab === 'series') && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTab === 'movies' ? (
                  <Film className="h-6 w-6 text-[#38bdf8]" />
                ) : (
                  <Tv className="h-6 w-6 text-[#38bdf8]" />
                )}
                <h1 className="text-2xl font-black text-[#f1f5f9]">
                  {activeTab === 'movies' ? 'مكتبة الأفلام' : 'مكتبة المسلسلات'}
                </h1>
              </div>
              <span className="text-xs font-bold text-[#94a3b8] tabular-nums">
                {filteredCatalog.length} عمل
              </span>
            </div>
            {renderFilterBar()}
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredCatalog.map((item) => renderPosterCard(item))}
              </div>
            ) : (
              <div className="rounded-3xl border border-[#1e3252] bg-[#0c1526] p-10 text-center">
                <p className="text-base font-bold text-[#cbd5e1]">
                  لا توجد {activeTab === 'movies' ? 'أفلام' : 'مسلسلات'} مضافة حتى الآن.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <section className="space-y-6">
            <div>
              <h1 className="mb-4 text-2xl font-black text-[#f1f5f9]">البحث في المكتبة</h1>
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالعنوان أو التصنيف أو سنة الإنتاج..."
                  className="w-full rounded-2xl border border-[#1e3252] bg-[#0c1526] py-3.5 pr-12 pl-4 text-sm font-medium text-[#f1f5f9] placeholder:text-[#64748b] focus:border-[#38bdf8] focus:outline-none"
                />
              </div>
            </div>
            {renderFilterBar()}
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredCatalog.map((item) => renderPosterCard(item))}
              </div>
            ) : (
              <div className="rounded-3xl border border-[#1e3252] bg-[#0c1526] p-10 text-center text-sm text-[#94a3b8]">
                لا توجد نتائج مطابقة لبحثك. جرّب كلمات مفتاحية أخرى أو أضف أعمالاً جديدة.
              </div>
            )}
          </section>
        )}

        {/* Account & Developer Studio Tab */}
        {activeTab === 'account' && (
          <div className="space-y-10">
            {/* Watchlist */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#f1f5f9]">
                <Bookmark className="h-5 w-5 text-[#38bdf8]" />
                <span>قائمتي المفضلة</span>
              </h2>
              {watchlistItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {watchlistItems.map((item) => renderPosterCard(item, 'wl-'))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1e3252] bg-[#0c1526] p-6 text-sm text-[#94a3b8]">
                  قائمتك المفضلة فارغة حالياً. اضغط على علامة (+) في أي عمل لحفظه هنا.
                </div>
              )}
            </section>

            {/* Developer Mode & 5GB Global Upload */}
            <section className="rounded-3xl border border-[#1e3252] bg-[#0c1526] p-6 sm:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e3252] pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111d35] text-[#38bdf8]">
                    {isDevUnlocked ? <LockOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#f1f5f9]">وضع المطور والنشر العالمي</h2>
                    <p className="text-xs text-[#94a3b8]">
                      ارفع الأفلام والمسلسلات مباشرة من جوالك بحد أقصى 5 جيجابايت (5GB) برمز حماية مكون من 8 أرقام
                    </p>
                  </div>
                </div>
                {isDevUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('account-dev-lock');
                      setDevToken('');
                      showToast('تم قفل وضع المطور');
                    }}
                    className={`haptic-btn flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#1e3252] bg-[#111d35] px-5 py-2.5 text-xs font-bold text-[#cbd5e1] hover:text-[#f1f5f9] ${
                      hapticKey === 'account-dev-lock' ? 'haptic-tap-active' : ''
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>قفل الوضع</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('account-dev-gate');
                      openPinModal();
                    }}
                    className={`haptic-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-5 py-3 text-xs font-black text-[#060b14] hover:bg-[#7dd3fc] sm:w-auto ${
                      hapticKey === 'account-dev-gate' ? 'haptic-tap-active' : ''
                    }`}
                  >
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span>
                      {hasConfiguredPin ? 'إدخال رمز المطور (8 أرقام)' : 'تعيين رمز المطور (8 أرقام)'}
                    </span>
                  </button>
                )}
              </div>

              {isDevUnlocked && (
                <div className="space-y-10">
                  <form onSubmit={handlePublish} className="space-y-5">
                    <h3 className="text-base font-extrabold text-[#f1f5f9]">
                      رفع فيلم أو مسلسل من الجوال لجميع الزوار (حتى 5GB)
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">العنوان</label>
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="مثال: عاصفة منتصف الليل"
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">النوع</label>
                        <select
                          value={uploadType}
                          onChange={(e) => setUploadType(e.target.value as 'movie' | 'series')}
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        >
                          <option value="movie">فيلم</option>
                          <option value="series">مسلسل</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">التصنيف</label>
                        <select
                          value={uploadGenre}
                          onChange={(e) => setUploadGenre(e.target.value)}
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        >
                          {GENRES.filter((g) => g !== 'الكل').map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">سنة الإنتاج</label>
                        <input
                          type="number"
                          value={uploadYear}
                          onChange={(e) => setUploadYear(e.target.value)}
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] tabular-nums focus:border-[#38bdf8] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">الجودة</label>
                        <select
                          value={uploadQuality}
                          onChange={(e) => setUploadQuality(e.target.value)}
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        >
                          {QUALITIES.filter((q) => q !== 'الكل').map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">التقييم (من 10)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          value={uploadRating}
                          onChange={(e) => setUploadRating(e.target.value)}
                          className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] tabular-nums focus:border-[#38bdf8] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">القصة / النبذة</label>
                      <textarea
                        rows={3}
                        value={uploadSynopsis}
                        onChange={(e) => setUploadSynopsis(e.target.value)}
                        placeholder="أدخل وصفاً مختصراً للعمل..."
                        className="w-full rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceMode('file');
                            setUploadError('');
                          }}
                          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors ${
                            videoSourceMode === 'file'
                              ? 'bg-[#38bdf8] text-[#060b14]'
                              : 'border border-[#1e3252] bg-[#060b14] text-[#cbd5e1] hover:border-[#38bdf8]'
                          }`}
                        >
                          <FilePlay className="h-4 w-4 shrink-0" />
                          <span>رفع ملف من الجهاز (حتى 5GB)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceMode('url');
                            setUploadError('');
                          }}
                          className={`flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors ${
                            videoSourceMode === 'url'
                              ? 'bg-[#38bdf8] text-[#060b14]'
                              : 'border border-[#1e3252] bg-[#060b14] text-[#cbd5e1] hover:border-[#38bdf8]'
                          }`}
                        >
                          <Link2 className="h-4 w-4 shrink-0" />
                          <span>إضافة رابط خارجي (لولو ستريم / رابط مباشر)</span>
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {videoSourceMode === 'file' ? (
                          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#1e3252] bg-[#060b14]/70 p-5 text-center transition-colors hover:border-[#38bdf8]/60">
                            <FilePlay className="mb-2 h-7 w-7 text-[#38bdf8]" />
                            <span className="text-xs font-extrabold text-[#f1f5f9]">
                              {videoFile
                                ? videoFile.name
                                : 'اختر ملف الفيديو من جوالك (MP4 / WebM / MOV / MKV — حتى 5GB)'}
                            </span>
                            {videoFile && (
                              <span className="mt-1 text-[11px] text-[#94a3b8] tabular-nums">
                                {formatBytes(videoFile.size)}
                              </span>
                            )}
                            <input
                              type="file"
                              accept="video/*,.mp4,.mov,.webm,.mkv,.m4v"
                              onChange={handleVideoPick}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="flex flex-col justify-center rounded-2xl border border-[#1e3252] bg-[#060b14]/70 p-4 space-y-2.5">
                            <label className="flex items-center gap-2 text-xs font-extrabold text-[#f1f5f9]">
                              <Link2 className="h-4 w-4 text-[#38bdf8]" />
                              <span>رابط الفيلم الخارجي (LuluStream أو رابط فيديو مباشر / كود iframe)</span>
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              value={externalVideoUrl}
                              onChange={(e) => {
                                setExternalVideoUrl(e.target.value);
                                setUploadError('');
                              }}
                              placeholder="https://lulustream.com/e/... أو https://.../movie.mp4"
                              className="w-full rounded-xl border border-[#1e3252] bg-[#0c1526] px-3.5 py-2.5 text-xs font-bold text-[#f1f5f9] placeholder:text-[#64748b] focus:border-[#38bdf8] focus:outline-none"
                            />
                            <p className="text-[11px] text-[#94a3b8]">
                              يدعم روابط سيرفر لولو ستريم (LuluStream) وروابط البث والتضمين المباشرة.
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-dashed border-[#1e3252] bg-[#060b14]/70 p-4">
                          <label className="flex flex-1 cursor-pointer flex-col items-center justify-center text-center transition-colors hover:text-[#38bdf8]">
                            {posterPreview || externalPosterUrl.trim() ? (
                              <img
                                src={posterPreview || externalPosterUrl.trim()}
                                alt="معاينة البوستر"
                                className="mb-2 h-20 w-14 rounded-lg object-cover"
                              />
                            ) : (
                              <ImageIcon className="mb-2 h-7 w-7 text-[#38bdf8]" />
                            )}
                            <span className="text-xs font-extrabold text-[#f1f5f9]">
                              {posterFile ? posterFile.name : 'اختر صورة البوستر من جوالك (اختياري)'}
                            </span>
                            <input type="file" accept="image/*" onChange={handlePosterPick} className="hidden" />
                          </label>
                          <input
                            type="url"
                            dir="ltr"
                            value={externalPosterUrl}
                            onChange={(e) => setExternalPosterUrl(e.target.value)}
                            placeholder="أو ضع رابط صورة البوستر (اختياري)"
                            className="w-full rounded-xl border border-[#1e3252] bg-[#0c1526] px-3 py-2 text-xs text-[#f1f5f9] placeholder:text-[#64748b] focus:border-[#38bdf8] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {uploadError && (
                      <p className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </p>
                    )}

                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap justify-between gap-2 text-xs font-bold text-[#7dd3fc] tabular-nums">
                          <span>{uploadStats || 'جاري الرفع والنشر العالمي...'}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#111d35]">
                          <div
                            className="h-full bg-[#38bdf8] transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={isUploading}
                        className={`haptic-btn flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-7 py-3.5 text-sm font-black text-[#060b14] hover:bg-[#7dd3fc] disabled:opacity-50 sm:w-auto ${
                          hapticKey === 'account-publish' ? 'haptic-tap-active' : ''
                        }`}
                      >
                        <Upload className="h-4 w-4 shrink-0" />
                        <span>{isUploading ? 'جاري الرفع...' : 'نشر العمل للعالم أجمع'}</span>
                      </button>

                      {isUploading && (
                        <button
                          type="button"
                          onClick={() => abortUploadRef.current?.abort()}
                          className="min-h-[50px] rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-xs font-extrabold text-rose-300 hover:bg-rose-500/20"
                        >
                          إلغاء الرفع
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Published Works List */}
                  {catalog.length > 0 && (
                    <div className="border-t border-[#1e3252] pt-8">
                      <h3 className="mb-4 text-base font-extrabold text-[#f1f5f9]">
                        الأعمال المنشورة ({catalog.length})
                      </h3>
                      <div className="divide-y divide-[#1e3252] rounded-2xl border border-[#1e3252] bg-[#060b14]/60">
                        {catalog.map((item) => (
                          <div
                            key={`manage-${item.id}`}
                            className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:flex-nowrap"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img
                                src={item.poster || FALLBACK_POSTER}
                                alt={item.title}
                                className="h-14 w-10 shrink-0 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-[#f1f5f9]">{item.title}</p>
                                <p className="text-xs text-[#94a3b8]">
                                  {item.type === 'movie' ? 'فيلم' : 'مسلسل'} · {item.genre} · {item.duration}
                                  {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(`copy-item-${item.id}`);
                                  shareOrCopy(
                                    getWatchUrl(item.id),
                                    item.title,
                                    `تم نسخ رابط "${item.title}"`
                                  );
                                }}
                                className={`haptic-btn flex min-h-[46px] min-w-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#1e3252] bg-[#111d35] px-3.5 text-xs font-bold text-[#38bdf8] hover:border-[#38bdf8] ${
                                  hapticKey === `copy-item-${item.id}` ? 'haptic-tap-active' : ''
                                }`}
                                title="نسخ رابط الفيلم"
                                aria-label={`نسخ رابط ${item.title}`}
                              >
                                <Link2 className="h-4 w-4 shrink-0" />
                                <span className="sm:hidden">نسخ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(`delete-item-${item.id}`);
                                  handleDeleteItem(item);
                                }}
                                className={`haptic-btn flex min-h-[46px] min-w-[48px] items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 text-rose-400 hover:bg-rose-500/20 ${
                                  hapticKey === `delete-item-${item.id}` ? 'haptic-tap-active' : ''
                                }`}
                                aria-label={`حذف ${item.title}`}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Change 8-digit Developer PIN */}
                  {!managedByEnv && (
                    <form onSubmit={handleChangePin} className="space-y-4 border-t border-[#1e3252] pt-8">
                      <h3 className="text-base font-extrabold text-[#f1f5f9]">
                        تحديث رمز المطور (8 أرقام)
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          value={oldPin}
                          onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          placeholder="الرمز الحالي (8 أرقام)"
                          className="rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          placeholder="الرمز الجديد (8 أرقام)"
                          className="rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          placeholder="تأكيد الرمز الجديد (8 أرقام)"
                          className="rounded-xl border border-[#1e3252] bg-[#060b14] px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                        />
                      </div>
                      {pinFeedback && (
                        <p
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            pinFeedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {pinFeedback.type === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <span>{pinFeedback.text}</span>
                        </p>
                      )}
                      <button
                        type="submit"
                        onClick={() => triggerHaptic('account-save-pin')}
                        className={`haptic-btn min-h-[48px] w-full rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-6 py-3 text-xs font-extrabold text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#060b14] sm:w-auto ${
                          hapticKey === 'account-save-pin' ? 'haptic-tap-active' : ''
                        }`}
                      >
                        حفظ الرمز الجديد
                      </button>
                    </form>
                  )}

                  {/* Custom Domain Setup Collapsible */}
                  <div className="border-t border-[#1e3252] pt-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-[#f1f5f9]">
                          ربط الدومين الحقيقي ({defaultDomain.replace('https://', '')})
                        </h3>
                        <p className="text-xs text-[#94a3b8]">
                          {isCustomDomainActive
                            ? `الموقع يعمل حالياً عبر النطاق المخصص (${currentHost || 'cinemaplus.lat'})`
                            : `المضيف الحالي: ${
                                currentHost ||
                                (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
                              } — جاهز للربط`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('account-domain-toggle');
                          setDomainSectionOpen((prev) => !prev);
                        }}
                        className={`haptic-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-5 py-3 text-xs font-extrabold text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#060b14] whitespace-nowrap sm:w-auto ${
                          hapticKey === 'account-domain-toggle' ? 'haptic-tap-active' : ''
                        }`}
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        <span>
                          {domainSectionOpen ? 'إخفاء خطوات الربط' : 'عرض خطوات وإعدادات الربط'}
                        </span>
                      </button>
                    </div>

                    {domainSectionOpen && (
                      <div className="mt-5 space-y-5 rounded-2xl border border-[#1e3252] bg-[#060b14]/75 p-4 sm:p-6">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('tab-worker');
                              setDomainTab('worker');
                            }}
                            className={`haptic-btn min-h-[46px] flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold whitespace-nowrap sm:flex-initial ${
                              domainTab === 'worker'
                                ? 'bg-[#38bdf8] text-[#060b14]'
                                : 'border border-[#1e3252] bg-[#0c1526] text-[#cbd5e1] hover:text-[#f1f5f9]'
                            }`}
                          >
                            الربط الفوري عبر Cloudflare Worker
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('tab-mapping');
                              setDomainTab('mapping');
                            }}
                            className={`haptic-btn min-h-[46px] flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold whitespace-nowrap sm:flex-initial ${
                              domainTab === 'mapping'
                                ? 'bg-[#38bdf8] text-[#060b14]'
                                : 'border border-[#1e3252] bg-[#0c1526] text-[#cbd5e1] hover:text-[#f1f5f9]'
                            }`}
                          >
                            سجلات DNS الرسمية (Cloud Run)
                          </button>
                        </div>

                        {domainTab === 'worker' ? (
                          <div className="space-y-4">
                            <p className="text-xs leading-relaxed text-[#cbd5e1]">
                              1. اضغط <strong>Deploy to Cloud Run</strong> في الأعلى (مع السماح بالوصول
                              العام)، ثم احذف ربط الدومين من مشروع الصفحات الثابتة في Cloudflare.
                              <br />
                              2. أدخل رابط مضيف Cloud Run المنشور أدناه ثم انسخ كود Worker وأضفه في
                              Cloudflare على المسار{' '}
                              <span dir="ltr" className="text-[#38bdf8]">
                                cinemaplus.lat/*
                              </span>
                              .
                            </p>
                            <div>
                              <label className="mb-1.5 block text-xs font-bold text-[#cbd5e1]">
                                مضيف خدمة Cloud Run (Host)
                              </label>
                              <input
                                type="text"
                                dir="ltr"
                                value={cloudRunHost}
                                onChange={(e) =>
                                  setCloudRunHost(
                                    e.target.value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim()
                                  )
                                }
                                placeholder="your-service-europe-west1.run.app"
                                className="w-full rounded-xl border border-[#1e3252] bg-[#0c1526] px-3.5 py-3 text-xs font-bold text-[#f1f5f9] focus:border-[#38bdf8] focus:outline-none"
                              />
                            </div>
                            <div className="space-y-3">
                              <pre
                                dir="ltr"
                                className="overflow-x-auto rounded-xl border border-[#1e3252] bg-[#0c1526] p-3.5 text-[11px] leading-relaxed text-[#7dd3fc]"
                              >
                                <code>{workerSnippet}</code>
                              </pre>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('account-copy-worker');
                                  copyText(workerSnippet, 'تم نسخ كود Cloudflare Worker بنجاح');
                                  setCopiedKey('worker');
                                  setTimeout(() => setCopiedKey(''), 2000);
                                }}
                                className={`haptic-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-6 py-3 text-xs font-black text-[#060b14] hover:bg-[#7dd3fc] sm:w-auto ${
                                  hapticKey === 'account-copy-worker' ? 'haptic-tap-active' : ''
                                }`}
                              >
                                {copiedKey === 'worker' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                <span>{copiedKey === 'worker' ? 'تم النسخ' : 'نسخ كود Worker'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs leading-relaxed text-[#cbd5e1]">
                              عند استخدام <strong>Cloud Run Domain Mapping</strong> مباشرة، أضف هذه السجلات
                              في Cloudflare DNS مع إطفاء السحابة البرتقالية (<strong>DNS only</strong>) حتى
                              تكتمل شهادة SSL:
                            </p>
                            <div className="divide-y divide-[#1e3252] rounded-xl border border-[#1e3252] bg-[#0c1526]">
                              {[
                                { key: 'cname-web', label: 'CNAME (web)', value: 'ghs.googlehosted.com' },
                                { key: 'cname-www', label: 'CNAME (www)', value: 'ghs.googlehosted.com' },
                                { key: 'a-1', label: 'A (@)', value: '216.239.32.21' },
                                { key: 'a-2', label: 'A (@)', value: '216.239.34.21' },
                                { key: 'a-3', label: 'A (@)', value: '216.239.36.21' },
                                { key: 'a-4', label: 'A (@)', value: '216.239.38.21' },
                              ].map((rec) => (
                                <div
                                  key={rec.key}
                                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                                >
                                  <div className="min-w-0">
                                    <span className="font-bold text-[#94a3b8]">{rec.label}</span>
                                    <span className="mx-2 text-[#475569]">·</span>
                                    <span className="font-bold text-[#7dd3fc] tabular-nums" dir="ltr">
                                      {rec.value}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(`account-copy-${rec.key}`);
                                      copyText(rec.value, `تم نسخ: ${rec.value}`);
                                      setCopiedKey(rec.key);
                                      setTimeout(() => setCopiedKey(''), 1800);
                                    }}
                                    className={`haptic-btn flex min-h-[46px] min-w-[72px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#1e3252] bg-[#111d35] px-4 text-xs font-bold text-[#cbd5e1] hover:border-[#38bdf8] hover:text-[#38bdf8] ${
                                      hapticKey === `account-copy-${rec.key}` ? 'haptic-tap-active' : ''
                                    }`}
                                  >
                                    {copiedKey === rec.key ? (
                                      <Check className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                    <span>{copiedKey === rec.key ? 'تم' : 'نسخ'}</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Rights Tab */}
        {activeTab === 'rights' && (
          <section className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-3xl border border-[#1e3252] bg-[#0c1526] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-7 w-7 text-[#38bdf8]" />
                <h1 className="text-2xl font-black text-[#f1f5f9]">الحقوق وسياسة الاستخدام</h1>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-[#cbd5e1]">
                <p>
                  منصة <strong className="text-[#f1f5f9]">سينما بلس تابعة لـ غيثان باحاج</strong> ومخصصة
                  لبث ومشاهدة الأعمال المرئية المرفوعة مباشرة عبر الخادم للجمهور في جميع أنحاء العالم.
                </p>
                <p>
                  نحترم حقوق الملكية الفكرية وحقوق النشر بشكل كامل. للتواصل مع الإدارة أو الاستفسارات، يرجى
                  فتح قائمة الثلاث شرطات في الأعلى أو استخدام رابط الواتساب المباشر أدناه.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#1e3252] pt-6">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[46px] items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-[#060b14] transition-colors hover:bg-emerald-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>التواصل عبر واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={copyWhatsapp}
                  className="flex min-h-[46px] items-center gap-2 rounded-xl border border-[#1e3252] bg-[#111d35] px-5 py-3 text-sm font-bold text-[#f1f5f9] transition-colors hover:border-[#38bdf8]"
                  dir="ltr"
                >
                  <Copy className="h-4 w-4 text-[#38bdf8]" />
                  <span className="tabular-nums">+967772908480</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Footer with Official Domain strictly at bottom of screen */}
      <footer className="mt-auto border-t border-[#1e3252]/80 bg-[#060b14] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-[#94a3b8] sm:flex-row">
            <p className="font-bold text-[#cbd5e1]">
              © {new Date().getFullYear()} سينما بلس تابعة لـ غيثان باحاج — جميع الحقوق محفوظة
            </p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <button type="button" onClick={() => navigateTo('home')} className="hover:text-[#f1f5f9]">
                الرئيسية
              </button>
              <button type="button" onClick={() => navigateTo('rights')} className="hover:text-[#f1f5f9]">
                الحقوق
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Nav */}
      <nav
        aria-label="التنقل السريع"
        className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t border-[#1e3252] bg-[#060b14]/95 backdrop-blur-md lg:hidden"
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={`mob-${item.id}`}
              type="button"
              onClick={() => navigateTo(item.id)}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                active ? 'text-[#38bdf8]' : 'text-[#94a3b8]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Details Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#1e3252] bg-[#0c1526] shadow-2xl">
            <button
              type="button"
              onClick={() => setDetailItem(null)}
              className="absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#060b14]/80 text-[#f1f5f9] backdrop-blur-md hover:bg-[#38bdf8] hover:text-[#060b14]"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative h-56 w-full sm:h-72">
              <img
                src={detailItem.backdrop || detailItem.poster || FALLBACK_POSTER}
                alt={detailItem.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_POSTER;
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1526] via-[#0c1526]/40 to-transparent" />
            </div>
            <div className="relative -mt-14 space-y-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#94a3b8]">
                <span className="flex items-center gap-1 text-[#fbbf24] tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-[#fbbf24]" />
                  {detailItem.rating}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#38bdf8]">{detailItem.genre}</span>
                <span aria-hidden="true">·</span>
                <span>{detailItem.type === 'movie' ? 'فيلم' : 'مسلسل'}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{detailItem.year}</span>
                <span aria-hidden="true">·</span>
                <span>{detailItem.quality}</span>
                <span aria-hidden="true">·</span>
                <span>{detailItem.duration}</span>
              </div>
              <h2 className="text-2xl font-black text-[#f1f5f9] sm:text-3xl">{detailItem.title}</h2>
              <p className="text-sm leading-relaxed text-[#cbd5e1] sm:text-base">{detailItem.synopsis}</p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => playItem(detailItem)}
                  className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-6 py-3 text-sm font-black text-[#060b14] transition-colors hover:bg-[#7dd3fc]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>مشاهدة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    shareOrCopy(
                      getWatchUrl(detailItem.id),
                      detailItem.title,
                      `تم نسخ رابط "${detailItem.title}"`
                    )
                  }
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#1e3252] bg-[#111d35] px-4 py-3 text-sm font-bold text-[#f1f5f9] hover:border-[#38bdf8]"
                >
                  <Share2 className="h-4 w-4 text-[#38bdf8]" />
                  <span>مشاركة الرابط</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleWatchlist(detailItem.id, detailItem.title)}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#1e3252] bg-[#111d35] px-4 py-3 text-sm font-bold text-[#f1f5f9] hover:border-[#38bdf8]"
                >
                  {watchlist.includes(detailItem.id) ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>في قائمتي</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-[#38bdf8]" />
                      <span>لقائمتي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playerItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#030711]/95 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#1e3252] bg-[#060b14] px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-[#f1f5f9] sm:text-lg">{playerItem.title}</h2>
              <p className="flex items-center gap-2 text-xs text-[#94a3b8]">
                <Server className="h-3.5 w-3.5 text-[#38bdf8]" />
                <span>سيرفر سينما بلس العالمي</span>
                <span aria-hidden="true">·</span>
                <span>{playerQuality}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {playerSrc && !isDirectVideoSource(playerSrc) && (
                <a
                  href={playerSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#1e3252] bg-[#0c1526] px-3 py-1.5 text-xs font-bold text-[#38bdf8] hover:border-[#38bdf8]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">فتح الرابط</span>
                </a>
              )}
              <select
                value={playerQuality}
                onChange={(e) => setPlayerQuality(e.target.value)}
                aria-label="جودة العرض"
                className="rounded-lg border border-[#1e3252] bg-[#0c1526] px-2.5 py-1.5 text-xs font-bold text-[#cbd5e1] focus:border-[#38bdf8] focus:outline-none"
              >
                {QUALITIES.filter((q) => q !== 'الكل').map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setPlayerItem(null);
                  setPlayerSrc('');
                }}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#1e3252] bg-[#0c1526] text-[#f1f5f9] hover:border-[#38bdf8]"
                aria-label="إغلاق المشغل"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
            {playerSrc && !playerError ? (
              isDirectVideoSource(playerSrc) ? (
                <video
                  ref={videoRef}
                  src={playerSrc}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setPlayerError(true)}
                  className="max-h-[80vh] w-full max-w-5xl rounded-2xl border border-[#1e3252] bg-black shadow-2xl"
                />
              ) : (
                <iframe
                  src={playerSrc}
                  title={playerItem.title}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="aspect-video w-full max-w-5xl rounded-2xl border border-[#1e3252] bg-black shadow-2xl"
                />
              )
            ) : (
              <div className="max-w-md rounded-3xl border border-[#1e3252] bg-[#0c1526] p-8 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-400" />
                <h3 className="mb-2 text-lg font-black text-[#f1f5f9]">تعذّر تشغيل ملف الفيديو</h3>
                <p className="mb-5 text-xs leading-relaxed text-[#94a3b8]">
                  يبدو أن ملف الفيديو غير متاح حالياً. تأكد من اتصالك بالإنترنت أو أعد رفعه من وضع المطور.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPlayerItem(null);
                    setPlayerSrc('');
                  }}
                  className="rounded-xl bg-[#38bdf8] px-6 py-2.5 text-xs font-black text-[#060b14]"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8-digit Developer PIN Input Modal (direct keyboard entry, no keypad & no hints) */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-[#1e3252] bg-[#0c1526] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-[#38bdf8]" />
                <h2 className="text-base font-black text-[#f1f5f9]">
                  {hasConfiguredPin ? 'رمز المطور (8 أرقام)' : 'تعيين رمز المطور لأول مرة (8 أرقام)'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e3252] text-[#cbd5e1] hover:text-[#f1f5f9]"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!hasConfiguredPin && (
              <p className="mb-4 text-xs leading-relaxed text-[#94a3b8]">
                أدخل 8 أرقام من اختيارك لحفظها كرمز دخول خاص بك لرفع وإدارة الأفلام.
              </p>
            )}

            <form onSubmit={handlePinFormSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                maxLength={8}
                dir="ltr"
                value={pinDigits}
                onChange={(e) => {
                  setPinDigits(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setPinError('');
                }}
                placeholder="••••••••"
                aria-label="رمز المطور المكون من 8 أرقام"
                className={`w-full rounded-xl border bg-[#060b14] px-4 py-3.5 text-center text-lg font-black tracking-[0.45em] text-[#f1f5f9] placeholder:text-[#475569] focus:outline-none ${
                  pinError ? 'border-rose-500 focus:border-rose-500' : 'border-[#1e3252] focus:border-[#38bdf8]'
                }`}
              />

              {pinError && <p className="text-center text-xs font-bold text-rose-400">{pinError}</p>}

              <button
                type="submit"
                disabled={pinSubmitting}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#38bdf8] px-5 py-3 text-sm font-black text-[#060b14] transition-colors hover:bg-[#7dd3fc] disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>
                  {pinSubmitting
                    ? 'جاري التحقق...'
                    : hasConfiguredPin
                    ? 'فتح وضع المطور'
                    : 'حفظ الرمز وفتح الوضع'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
