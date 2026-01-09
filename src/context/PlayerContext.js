"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const audioRef = useRef(null);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [volume, setVolume] = useState(1); // 0-1
    const [bitrate, setBitrate] = useState('320kbps');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Stats for "Anti-Repeat" logic
    const [playedIds, setPlayedIds] = useState(new Set());

    // Keep latest nextSong reference to avoid stale closures in event listener
    const nextSongRef = useRef(null);


    // Init Audio Element
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;

        const audio = audioRef.current;

        const handleEnded = () => {
            // Use ref to call the latest version of nextSong
            if (nextSongRef.current) {
                nextSongRef.current();
            }
        };

        const handleTimeUpdate = () => {
            setProgress(audio.currentTime);
            setDuration(audio.duration || 0);

            // Update MediaSession position
            if ('mediaSession' in navigator && !isNaN(audio.duration)) {
                try {
                    navigator.mediaSession.setPositionState({
                        duration: audio.duration,
                        playbackRate: audio.playbackRate,
                        position: audio.currentTime
                    });
                } catch (e) { /* ignore */ }
            }
        };

        const handleCanPlay = () => {
            setIsLoading(false);
            // We rely on the isPlaying effect to trigger play, but this helps if stuck
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('waiting', () => setIsLoading(true));

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('waiting', () => setIsLoading(true));
            audio.pause();
        };
    }, []); // Run once on mount

    // Sync volume
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Sync play/pause
    useEffect(() => {
        if (!audioRef.current || !currentSong) return;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Play error", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentSong]);

    // Media Session API Support
    useEffect(() => {
        if (!currentSong || !('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.name,
            artist: currentSong.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist',
            album: currentSong.album?.name || 'Unknown Album',
            artwork: currentSong.image?.map(img => ({ src: img.url, sizes: img.quality, type: 'image/jpeg' })) || []
        });

        navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
        navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);

        return () => {
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
        }
    }, [currentSong]);

    // --- API ---
    const fetchSuggestions = async (id) => {
        try {
            const res = await fetch(`https://zylaes-saavn.vercel.app/api/songs/${id}/suggestions?limit=10`);
            const json = await res.json();
            return json.data || [];
        } catch (e) {
            console.error("Failed to fetch suggestions", e);
            return [];
        }
    };

    const fetchSongDetails = async (id) => {
        try {
            const res = await fetch(`https://zylaes-saavn.vercel.app/api/songs/${id}`);
            const json = await res.json();
            return json.data?.[0];
        } catch (e) {
            console.error("Fetch details failed", e);
            return null;
        }
    }

    // --- Logic ---
    const playSong = useCallback(async (song, fromQueue = false) => {
        if (!song) return;

        // If full details missing (e.g. from search result), fetch them
        if (!song.downloadUrl) {
            const details = await fetchSongDetails(song.id);
            if (details) song = details;
        }

        setCurrentSong(song);
        setIsPlaying(true);
        setHistory(prev => [...prev, song]);
        setPlayedIds(prev => new Set(prev).add(song.id));

        // Find correct quality URL
        const qualityMap = { '12kbps': '12kbps', '48kbps': '48kbps', '96kbps': '96kbps', '160kbps': '160kbps', '320kbps': '320kbps' };
        const targetQuality = qualityMap[bitrate] || '320kbps';

        // Fallback logic for quality
        let playUrl = song.downloadUrl?.find(d => d.quality === targetQuality)?.url;
        if (!playUrl) playUrl = song.downloadUrl?.at(-1)?.url; // Highest available

        if (audioRef.current && playUrl) {
            audioRef.current.src = playUrl;
            // Audio plays via effect dependency on isPlaying/currentSong
        }

        // Prefetch suggestions if queue is empty or low
        if (!fromQueue) {
            // New context, clear old queue logic usually, but here we append suggestions
            const suggestions = await fetchSuggestions(song.id);
            const uniqueSuggestions = suggestions.filter(s => !playedIds.has(s.id));
            setQueue(uniqueSuggestions);
        }
    }, [bitrate, playedIds]);

    const nextSong = useCallback(async () => {
        if (queue.length > 0) {
            const next = queue[0];
            setQueue(q => q.slice(1));
            await playSong(next, true);
        } else if (currentSong) {
            // Queue empty? fetch more based on current
            const suggestions = await fetchSuggestions(currentSong.id);
            const uniqueSuggestions = suggestions.filter(s => !playedIds.has(s.id));

            if (uniqueSuggestions.length > 0) {
                setQueue(uniqueSuggestions.slice(1)); // Queue rest
                await playSong(uniqueSuggestions[0], true); // Play first
            } else {
                // Deep fallback (popular)? For now just stop or replay
                console.log("No more suggestions found. Stopping.");
                setIsPlaying(false);
            }
        }
    }, [queue, currentSong, playedIds, playSong]);

    const prevSong = useCallback(() => {
        if (history.length > 1) {
            const prev = history[history.length - 2];
            setHistory(h => h.slice(0, -1)); // Remove current from history to avoid loop duplications if we re-add
            playSong(prev, true); // Treat as queue play to avoid overwriting queue completely? 
            // Actually simple prev just plays it. 
            // NOTE: History handling in simple players is tricky. 
            // For now, simple implementation:
            // Pop current, Play prev.
        }
    }, [history, playSong]);

    const seek = (time) => {
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    // Keep nextSongRef updated (Moved here to avoid ReferenceError)
    useEffect(() => {
        nextSongRef.current = nextSong;
    }, [nextSong]);

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            setIsPlaying,
            queue,
            addToQueue: (songs) => setQueue(q => [...q, ...songs]),
            playSong,
            nextSong,
            prevSong,
            volume,
            setVolume,
            bitrate,
            setBitrate,
            isLoading,
            progress,
            duration,
            seek
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
