"use client";
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Download, Sparkles, Flame, MapPin, Radio, Music2 } from 'lucide-react';

const REGION_LANGUAGE_MAP = {
    'Kerala': 'Malayalam',
    'Lakshadweep': 'Malayalam',
    'Tamil Nadu': 'Tamil',
    'Puducherry': 'Tamil',
    'Karnataka': 'Kannada',
    'Maharashtra': 'Hindi',
    'Delhi': 'Hindi',
    'Uttar Pradesh': 'Hindi',
    'Telangana': 'Telugu',
    'Andhra Pradesh': 'Telugu',
    'West Bengal': 'Bengali',
    'Punjab': 'Punjabi',
    'Gujarat': 'Gujarati',
};

const LANGUAGES = [
    { id: 'all', label: '🔥 All Combined', query: 'Trending' },
    { id: 'latest', label: '✨ Latest Releases', query: 'Latest Hits 2026' },
    { id: 'local', label: '📍 Local', isLocal: true },
    { id: 'malayalam', label: 'Malayalam', query: 'Malayalam Hits' },
    { id: 'hindi', label: 'Hindi', query: 'Hindi Hits' },
    { id: 'english', label: 'English', query: 'English Pop Hits' },
    { id: 'tamil', label: 'Tamil', query: 'Tamil Hits' },
    { id: 'telugu', label: 'Telugu', query: 'Telugu Hits' },
];

const decodeHtml = (str) => {
    if (!str) return '';
    return str
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
};

export default function Home() {
    const { playSong } = usePlayer();
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [locationInfo, setLocationInfo] = useState({
        region: 'Kerala',
        city: 'Local',
        language: 'Malayalam'
    });

    // 1. Detect IP Geolocation on mount
    useEffect(() => {
        const detectLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    const region = data.region || 'Kerala';
                    const detectedLang = REGION_LANGUAGE_MAP[region] || 'Malayalam';
                    setLocationInfo({
                        region: region,
                        city: data.city || 'Your Area',
                        language: detectedLang
                    });
                }
            } catch (e) {
                console.warn("Location detection fallback to default:", e);
            }
        };
        detectLocation();
    }, []);

    // 2. Fetch combined songs based on activeTab & detected location
    useEffect(() => {
        const fetchDashboardSongs = async () => {
            setLoading(true);
            try {
                let primaryQuery = 'Trending';
                let secondaryQuery = 'Latest Hits 2026';

                if (activeTab === 'latest') {
                    primaryQuery = 'Latest Hits 2026';
                    secondaryQuery = 'New Song 2026';
                } else if (activeTab === 'local') {
                    primaryQuery = `${locationInfo.language} Hits`;
                    secondaryQuery = `${locationInfo.language} Trending`;
                } else if (activeTab !== 'all') {
                    const selected = LANGUAGES.find(l => l.id === activeTab);
                    if (selected && selected.query) {
                        primaryQuery = selected.query;
                        secondaryQuery = `${selected.label} Latest`;
                    }
                }

                // Fetch dual queries concurrently
                const [res1, res2] = await Promise.all([
                    fetch(`https://zylaes-saavn.vercel.app/api/search/songs?query=${encodeURIComponent(primaryQuery)}&limit=15`),
                    fetch(`https://zylaes-saavn.vercel.app/api/search/songs?query=${encodeURIComponent(secondaryQuery)}&limit=15`)
                ]);

                const data1 = await res1.json();
                const data2 = await res2.json();

                const list1 = data1.data?.results || [];
                const list2 = data2.data?.results || [];

                // Combine & deduplicate by song ID
                const combined = [];
                const seen = new Set();

                [...list1, ...list2].forEach(song => {
                    if (song && song.id && !seen.has(song.id)) {
                        seen.add(song.id);
                        combined.push(song);
                    }
                });

                setSongs(combined);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardSongs();
    }, [activeTab, locationInfo]);

    // Handle Direct Download trigger
    const handleDownloadClick = (e, song) => {
        e.stopPropagation();
        const url = `/api/download?id=${song.id}`;
        window.location.href = url;
    };

    const heroSong = songs[0];
    const wideSongs = songs.slice(1, 3);
    const gridSongs = songs.slice(3);

    return (
        <div className="bento-dashboard-wrapper">
            
            {/* Header & Location Banner */}
            <div className="dashboard-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        Explore Music <Sparkles className="text-amber-400 fill-amber-400" size={24} />
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Trending, latest hits, and curated tracks for you.
                    </p>
                </div>

                {/* Location Badge */}
                <div className="location-pill flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-full text-xs font-medium text-slate-300 shadow-sm w-fit">
                    <MapPin size={14} className="text-rose-500 animate-pulse" />
                    <span>Location: <strong className="text-white">{locationInfo.region}</strong> ({locationInfo.language})</span>
                </div>
            </div>

            {/* Filter Pills Navigation */}
            <div className="filter-scroll-container flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                {LANGUAGES.map(tab => {
                    const isActive = activeTab === tab.id;
                    const label = tab.isLocal ? `📍 Local (${locationInfo.language})` : tab.label;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`filter-pill text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                                isActive
                                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 scale-105'
                                    : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Loading Skeleton */}
            {loading ? (
                <div className="bento-grid-skeleton grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="h-[340px] lg:col-span-2 lg:row-span-2 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800/50" />
                    <div className="h-[160px] lg:col-span-2 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800/50" />
                    <div className="h-[160px] bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800/50" />
                    <div className="h-[160px] bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800/50" />
                </div>
            ) : songs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <Music2 size={48} className="mx-auto mb-3 text-slate-600" />
                    <p>No songs found for this selection.</p>
                </div>
            ) : (
                /* Bento Grid Layout */
                <div className="bento-grid">

                    {/* HERO TILE (2x2 Grid Span) */}
                    {heroSong && (
                        <div
                            className="bento-tile bento-hero group"
                            onClick={() => playSong(heroSong)}
                        >
                            {/* Ambient Glow Background Image */}
                            <div 
                                className="hero-bg-blur"
                                style={{ backgroundImage: `url(${heroSong.image?.[2]?.url || heroSong.image?.[0]?.url})` }}
                            />
                            
                            <div className="hero-content flex flex-col justify-between h-full relative z-10 p-6">
                                <div className="flex items-center justify-between">
                                    <span className="badge-flame flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 px-3 py-1 rounded-full">
                                        <Flame size={14} className="fill-amber-400" /> #1 TRENDING
                                    </span>
                                    <span className="text-xs text-slate-300 bg-black/40 px-2.5 py-1 rounded-full">
                                        {heroSong.year || '2026'}
                                    </span>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl lg:text-3xl font-extrabold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                                {decodeHtml(heroSong.name)}
                                            </h2>
                                            <p className="text-sm text-slate-300 line-clamp-1 mt-1 font-medium">
                                                {decodeHtml(heroSong.artists?.primary?.map(a => a.name).join(', ') || heroSong.singers)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className="play-icon-circle bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3.5 rounded-full shadow-xl transition transform hover:scale-110"
                                                onClick={(e) => { e.stopPropagation(); playSong(heroSong); }}
                                                title="Play Track"
                                            >
                                                <Play size={24} fill="currentColor" className="ml-0.5" />
                                            </button>
                                            <button
                                                className="dl-icon-circle bg-slate-900/80 hover:bg-slate-800 text-white p-3.5 rounded-full border border-slate-700 backdrop-blur-md transition transform hover:scale-105"
                                                onClick={(e) => handleDownloadClick(e, heroSong)}
                                                title="Download MP3"
                                            >
                                                <Download size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WIDE TILES (2x1 Grid Span) */}
                    {wideSongs.map((song, idx) => (
                        <div
                            key={song.id}
                            className="bento-tile bento-wide group"
                            onClick={() => playSong(song)}
                        >
                            <div className="flex items-center gap-4 p-4 h-full">
                                <div className="relative shrink-0 overflow-hidden rounded-xl w-20 h-20">
                                    <img
                                        src={song.image?.[2]?.url || song.image?.[0]?.url}
                                        alt={song.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Play size={20} className="text-white fill-white" />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 mb-0.5 block">
                                        Top #{idx + 2} Choice
                                    </span>
                                    <h3 className="text-base font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                        {decodeHtml(song.name)}
                                    </h3>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">
                                        {decodeHtml(song.artists?.primary?.map(a => a.name).join(', ') || song.singers)}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => handleDownloadClick(e, song)}
                                    className="p-2.5 rounded-full bg-slate-800/80 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition shrink-0"
                                    title="Download MP3"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* STANDARD BENTO TILES (1x1 Grid Span) */}
                    {gridSongs.map((song) => (
                        <div
                            key={song.id}
                            className="bento-tile bento-card group flex flex-col justify-between p-3.5"
                            onClick={() => playSong(song)}
                        >
                            <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                                <img
                                    src={song.image?.[2]?.url || song.image?.[0]?.url}
                                    alt={song.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                    <button 
                                        className="p-3 bg-emerald-500 text-slate-950 rounded-full shadow-lg hover:scale-110 transition"
                                        onClick={(e) => { e.stopPropagation(); playSong(song); }}
                                    >
                                        <Play size={18} fill="currentColor" className="ml-0.5" />
                                    </button>
                                    <button 
                                        className="p-3 bg-slate-900/90 text-white rounded-full shadow-lg hover:scale-110 transition"
                                        onClick={(e) => handleDownloadClick(e, song)}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                    {decodeHtml(song.name)}
                                </h4>
                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                    {decodeHtml(song.artists?.primary?.map(a => a.name).join(', ') || song.singers)}
                                </p>
                            </div>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
}
