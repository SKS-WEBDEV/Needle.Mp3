"use client";
import { usePlayer } from '@/context/PlayerContext';
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Download, AlignLeft, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

export default function FullScreenPlayer({ isOpen, onClose }) {
    const { currentSong, isPlaying, setIsPlaying, nextSong, prevSong, progress, duration, seek } = usePlayer();
    const [lyrics, setLyrics] = useState([]);
    const [loadingLyrics, setLoadingLyrics] = useState(false);
    const [localSeek, setLocalSeek] = useState(null);
    const activeLineRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [karaokeGap, setKaraokeGap] = useState(7);
    const [showMobileLyrics, setShowMobileLyrics] = useState(false);

    useEffect(() => {
        const savedGap = localStorage.getItem('karaoke-gap');
        if (savedGap) setKaraokeGap(Number(savedGap));
    }, []);

    // --- Controls Logic ---
    const handleSeek = (val) => {
        setLocalSeek(val[0]);
    };
    const handleSeekCommit = (val) => {
        seek(val[0]);
        setLocalSeek(null);
    };
    const handleDownload = (e) => {
        e.stopPropagation();
        if (!currentSong) return;
        const url = `/api/download?id=${currentSong.id}`;
        window.location.href = url;
    };

    // --- Lyrics Logic ---
    const parseLrc = (lrcString) => {
        if (!lrcString) return [];
        const lines = lrcString.split('\n');
        const result = [];
        const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        lines.forEach(line => {
            const match = timeReg.exec(line);
            if (match) {
                const min = parseInt(match[1]);
                const sec = parseInt(match[2]);
                const ms = parseInt(match[3].length === 2 ? match[3] + '0' : match[3]);
                const time = min * 60 + sec + ms / 1000;
                const text = line.replace(timeReg, '').trim();
                if (text) result.push({ time, text });
            }
        });
        return result;
    };

    useEffect(() => {
        if (!currentSong) return;

        const fetchLyrics = async () => {
            setLoadingLyrics(true);
            setLyrics([]);
            try {
                const trackName = currentSong.name;
                const artistName = currentSong.artists?.primary?.[0]?.name || '';
                const albumName = currentSong.album?.name || '';
                const durationSeconds = currentSong.duration || duration || 0;

                const query = new URLSearchParams({
                    artist_name: artistName,
                    track_name: trackName,
                    album_name: albumName,
                    duration: durationSeconds
                });

                // 1. Try strict match
                let data = null;
                try {
                    const res = await fetch(`https://lrclib.net/api/get?${query}`);
                    if (res.ok) {
                        data = await res.json();
                    }
                } catch (e) { /* ignore strict fail */ }

                // 2. Fallback: Search
                if (!data) {
                    // console.log("Strict lyrics failed, trying search...");
                    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(trackName + " " + artistName)}`);
                    const searchJson = await searchRes.json();

                    if (Array.isArray(searchJson) && searchJson.length > 0) {
                        // Find best match by duration (within 5s tolerance)
                        const bestMatch = searchJson.find(item => {
                            if (!item.syncedLyrics) return false;
                            return Math.abs(item.duration - durationSeconds) < 10;
                        });

                        data = bestMatch || searchJson[0];
                    }
                }

                if (!data) throw new Error('Lyrics not found');

                if (data.syncedLyrics) {
                    setLyrics(parseLrc(data.syncedLyrics));
                } else if (data.plainLyrics) {
                    setLyrics([{ time: 0, text: data.plainLyrics }]);
                }
            } catch (e) {
                console.warn('Lyrics not found:', e);
            } finally {
                setLoadingLyrics(false);
            }
        };

        fetchLyrics();
    }, [currentSong]);

    const activeIndex = lyrics.findIndex((line, i) => {
        const nextLine = lyrics[i + 1];
        return progress >= line.time && (!nextLine || progress < nextLine.time);
    });

    useEffect(() => {
        if (activeLineRef.current && isOpen) {
            // Check if on mobile
            const isMobile = window.innerWidth < 768;

            // On mobile, only scroll if lyrics are explicitly open
            if (isMobile && !showMobileLyrics) return;

            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeIndex, isOpen, showMobileLyrics]);


    if (!currentSong) return null;
    const coverUrl = currentSong.image?.at(-1)?.url || currentSong.image?.[0]?.url;

    return (
        <div className={`fullscreen-player ${isOpen ? 'open' : ''}`}>
            {/* Background */}
            <div
                className="fs-background"
                style={{ backgroundImage: `url(${coverUrl})` }}
            />

            {/* Header */}
            <div className="fs-header">
                <button onClick={onClose} className="fs-btn">
                    <ChevronDown size={32} />
                </button>
                <span className="fs-title">Now Playing</span>
                <button onClick={handleDownload} className="fs-btn" title="Download">
                    <Download size={24} />
                </button>
            </div>

            <div className="fs-content">
                {/* Left: Art & Controls */}
                <div className={`fs-info ${isOpen ? 'animate-in' : ''}`}>
                    <div className="fs-art-wrapper">
                        <img src={coverUrl} alt="Album Art" className="fs-art" />
                    </div>

                    <div className="fs-text">
                        <h2 className="fs-song-name">{decodeHtml(currentSong.name)}</h2>
                        <p className="fs-artist-name">
                            {decodeHtml(currentSong.artists?.primary?.map(a => a.name).join(', '))}
                        </p>
                    </div>

                    {/* New Controls Section */}
                    <div className="fs-controls-container">
                        {/* Slider */}
                        <div className="fs-progress-container">
                            <span className="fs-time">{formatTime(localSeek !== null ? localSeek : progress)}</span>
                            <Slider.Root
                                className="slider-root fs-slider"
                                value={[localSeek !== null ? localSeek : progress]}
                                max={duration || 100}
                                step={1}
                                onValueChange={handleSeek}
                                onValueCommit={handleSeekCommit}
                            >
                                <Slider.Track className="slider-track fs-track">
                                    <Slider.Range className="slider-range fs-range" />
                                </Slider.Track>
                                <Slider.Thumb className="slider-thumb fs-thumb" />
                            </Slider.Root>
                            <span className="fs-time">{formatTime(duration)}</span>
                        </div>

                        {/* Buttons */}
                        <div className="fs-buttons">
                            <button className="fs-ctrl-btn" onClick={prevSong}>
                                <SkipBack size={32} fill="currentColor" />
                            </button>
                            <button className="fs-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                            </button>
                            <button className="fs-ctrl-btn" onClick={nextSong}>
                                <SkipForward size={32} fill="currentColor" />
                            </button>
                        </div>

                        {/* Mobile Lyrics Toggle */}
                        <button
                            className="mobile-lyrics-toggle"
                            onClick={() => setShowMobileLyrics(true)}
                        >
                            <AlignLeft size={20} />
                            <span>Lyrics</span>
                        </button>
                    </div>
                </div>

                {/* Right: Lyrics */}
                <div className={`fs-lyrics-container ${showMobileLyrics ? 'mobile-open' : ''}`}>
                    <button
                        className="mobile-lyrics-close"
                        onClick={() => setShowMobileLyrics(false)}
                    >
                        <X size={24} />
                    </button>

                    <div ref={scrollContainerRef} className="lyrics-scroller scrollbar-hide">
                        {loadingLyrics ? (
                            <div className="lyrics-placeholder">
                                Searching lyrics...
                            </div>
                        ) : lyrics.length > 0 ? (
                            <>
                                {lyrics.map((line, i) => {
                                    const isActive = i === activeIndex;
                                    const isPast = i < activeIndex;
                                    return (
                                        <p
                                            key={i}
                                            ref={isActive ? activeLineRef : null}
                                            className={`lyric-line ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                                        >
                                            {line.text}
                                        </p>
                                    );
                                })}

                                {/* Countdown Overlay */}
                                {(() => {
                                    const currentLine = lyrics[activeIndex];
                                    const nextLine = lyrics[activeIndex + 1];
                                    if (currentLine && nextLine) {
                                        const gap = nextLine.time - currentLine.time;
                                        const timeToNext = nextLine.time - progress;

                                        if (gap > karaokeGap && timeToNext <= 5 && timeToNext > 0) {
                                            return (
                                                <div className="lyrics-countdown">
                                                    <span key={Math.ceil(timeToNext)} className="countdown-number">
                                                        {Math.ceil(timeToNext)}
                                                    </span>
                                                    /*<span className="countdown-label">Next Line...</span>*/
                                                </div>
                                            );
                                        }
                                    }
                                    return null;
                                })()}
                            </>
                        ) : (
                            <div className="lyrics-placeholder">
                                <p>Lyrics not available or instrumental.</p>
                            </div>
                        )}
                        <div className="lyrics-spacer" />
                    </div>
                </div>
            </div>
        </div>
    );
}
