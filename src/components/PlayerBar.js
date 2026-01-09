"use client";
import { usePlayer } from '@/context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Download } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useState } from 'react';

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlayerBar({ onExpand }) {
    const { currentSong, isPlaying, setIsPlaying, nextSong, prevSong, volume, setVolume, progress, duration, seek } = usePlayer();
    const [localSeek, setLocalSeek] = useState(null);

    if (!currentSong) return null;

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

    const decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div className="player-bar glass">

            {/* Track Info */}
            <div className="track-info" onClick={onExpand}>
                <div className="track-art-wrapper">
                    <img
                        src={currentSong.image?.[2]?.url || currentSong.image?.[0]?.url}
                        alt={currentSong.name}
                        className="track-art"
                    />
                    <div className="track-expand-overlay">
                        <Maximize2 size={20} />
                    </div>
                </div>
                <div className="track-details">
                    <h4>{decodeHtml(currentSong.name)}</h4>
                    <p>{decodeHtml(currentSong.artists?.primary?.map(a => a.name).join(', '))}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="player-controls">
                <div className="control-buttons">
                    <button className="icon-btn desktop-only" onClick={prevSong}>
                        <SkipBack size={24} fill="currentColor" />
                    </button>

                    <button
                        className="play-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <button className="icon-btn desktop-only" onClick={nextSong}>
                        <SkipForward size={24} fill="currentColor" />
                    </button>
                </div>

                <div className="progress-bar-container desktop-only">
                    <span className="time">{formatTime(localSeek !== null ? localSeek : progress)}</span>

                    <Slider.Root
                        className="slider-root"
                        value={[localSeek !== null ? localSeek : progress]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        onValueCommit={handleSeekCommit}
                    >
                        <Slider.Track className="slider-track">
                            <Slider.Range className="slider-range" />
                        </Slider.Track>
                        <Slider.Thumb className="slider-thumb" />
                    </Slider.Root>

                    <span className="time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Extras */}
            <div className="player-extras desktop-only">
                <button
                    onClick={handleDownload}
                    title="Download MP3"
                    className="icon-btn"
                >
                    <Download size={20} />
                </button>

                <div className="volume-control">
                    <Volume2 size={20} className="text-muted" />
                    <Slider.Root
                        className="slider-root volume-slider"
                        value={[volume * 100]}
                        max={100}
                        onValueChange={(val) => setVolume(val[0] / 100)}
                    >
                        <Slider.Track className="slider-track">
                            <Slider.Range className="slider-range" />
                        </Slider.Track>
                        <Slider.Thumb className="slider-thumb" />
                    </Slider.Root>
                </div>
            </div>

        </div>
    );
}
