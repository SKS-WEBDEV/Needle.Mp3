"use client";
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Download, Sparkles, Flame, MapPin, Music2 } from 'lucide-react';

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
        language: 'Malayalam'
    });

    useEffect(() => {
        const detectLocation = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            try {
                const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    const region = data.region || 'Kerala';
                    const detectedLang = REGION_LANGUAGE_MAP[region] || 'Malayalam';
                    setLocationInfo({
                        region: region,
                        language: detectedLang
                    });
                }
            } catch (e) {
                setLocationInfo({ region: 'Kerala', language: 'Malayalam' });
            }
        };
        detectLocation();
    }, []);

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

                const [res1, res2] = await Promise.all([
                    fetch(`https://zylaes-saavn.vercel.app/api/search/songs?query=${encodeURIComponent(primaryQuery)}&limit=15`),
                    fetch(`https://zylaes-saavn.vercel.app/api/search/songs?query=${encodeURIComponent(secondaryQuery)}&limit=15`)
                ]);

                const data1 = await res1.json();
                const data2 = await res2.json();

                const list1 = data1.data?.results || [];
                const list2 = data2.data?.results || [];

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
            <div className="bento-header">
                <div className="bento-title-box">
                    <h1 className="bento-title">
                        Explore Music <Sparkles className="icon-sparkle" size={24} />
                    </h1>
                    <p className="bento-subtitle">
                        Trending, latest hits, and curated tracks for you.
                    </p>
                </div>

                <div className="location-pill">
                    <MapPin size={14} className="location-icon" />
                    <span>Location: <strong>{locationInfo.region}</strong> ({locationInfo.language})</span>
                </div>
            </div>

            <div className="filter-scroll-container scrollbar-hide">
                {LANGUAGES.map(tab => {
                    const isActive = activeTab === tab.id;
                    const label = tab.isLocal ? `📍 Local (${locationInfo.language})` : tab.label;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`filter-pill ${isActive ? 'active' : ''}`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="bento-grid">
                    <div className="bento-tile bento-hero skeleton-box" />
                    <div className="bento-tile bento-wide skeleton-box" />
                    <div className="bento-tile bento-wide skeleton-box" />
                    <div className="bento-tile bento-card skeleton-box" />
                    <div className="bento-tile bento-card skeleton-box" />
                </div>
            ) : songs.length === 0 ? (
                <div className="empty-state">
                    <Music2 size={48} className="empty-icon" />
                    <p>No songs found for this selection.</p>
                </div>
            ) : (
                <div className="bento-grid">
                    {heroSong && (
                        <div className="bento-tile bento-hero" onClick={() => playSong(heroSong)}>
                            <div 
                                className="hero-bg-blur"
                                style={{ backgroundImage: `url(${heroSong.image?.[2]?.url || heroSong.image?.[0]?.url})` }}
                            />
                            
                            <div className="hero-content">
                                <div className="hero-top-row">
                                    <span className="badge-flame">
                                        <Flame size={14} /> #1 TRENDING
                                    </span>
                                    <span className="hero-year-badge">
                                        {heroSong.year || '2026'}
                                    </span>
                                </div>

                                <div className="hero-bottom-row">
                                    <div className="hero-meta">
                                        <h2 className="hero-song-title">{decodeHtml(heroSong.name)}</h2>
                                        <p className="hero-song-artist">
                                            {decodeHtml(heroSong.artists?.primary?.map(a => a.name).join(', ') || heroSong.singers)}
                                        </p>
                                    </div>

                                    <div className="hero-actions">
                                        <button
                                            className="hero-play-btn"
                                            onClick={(e) => { e.stopPropagation(); playSong(heroSong); }}
                                            title="Play Track"
                                        >
                                            <Play size={24} fill="currentColor" />
                                        </button>
                                        <button
                                            className="hero-download-btn"
                                            onClick={(e) => handleDownloadClick(e, heroSong)}
                                            title="Download MP3"
                                        >
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {wideSongs.map((song, idx) => (
                        <div key={song.id} className="bento-tile bento-wide" onClick={() => playSong(song)}>
                            <div className="bento-wide-inner">
                                <div className="bento-wide-art">
                                    <img src={song.image?.[2]?.url || song.image?.[0]?.url} alt={song.name} />
                                    <div className="bento-wide-play-overlay">
                                        <Play size={20} fill="currentColor" />
                                    </div>
                                </div>

                                <div className="bento-wide-meta">
                                    <span className="bento-wide-tag">Top #{idx + 2} Choice</span>
                                    <h3 className="bento-wide-title">{decodeHtml(song.name)}</h3>
                                    <p className="bento-wide-artist">
                                        {decodeHtml(song.artists?.primary?.map(a => a.name).join(', ') || song.singers)}
                                    </p>
                                </div>

                                <button
                                    onClick={(e) => handleDownloadClick(e, song)}
                                    className="bento-action-btn"
                                    title="Download MP3"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {gridSongs.map((song) => (
                        <div key={song.id} className="bento-tile bento-card" onClick={() => playSong(song)}>
                            <div className="bento-card-art">
                                <img src={song.image?.[2]?.url || song.image?.[0]?.url} alt={song.name} />
                                <div className="bento-card-overlay">
                                    <button 
                                        className="bento-overlay-play"
                                        onClick={(e) => { e.stopPropagation(); playSong(song); }}
                                    >
                                        <Play size={18} fill="currentColor" />
                                    </button>
                                    <button 
                                        className="bento-overlay-download"
                                        onClick={(e) => handleDownloadClick(e, song)}
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="bento-card-meta">
                                <h4 className="bento-card-title">{decodeHtml(song.name)}</h4>
                                <p className="bento-card-artist">
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
