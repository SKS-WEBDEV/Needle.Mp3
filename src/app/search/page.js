"use client";
import { useState, useEffect } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';

export default function SearchPage() {
    const { playSong } = usePlayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!query.trim()) return;
            setLoading(true);
            try {
                const res = await fetch(`https://zylaes-saavn.vercel.app/api/search/songs?query=${encodeURIComponent(query)}&limit=20`);
                const json = await res.json();
                setResults(json.data?.results || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="search-page">
            <div className="search-bar-container">
                <SearchIcon className="search-icon" size={24} />
                <input
                    type="text"
                    placeholder="What do you want to listen to?"
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Results */}
            {loading ? (
                <div className="loading-state">Searching...</div>
            ) : (
                <div className="search-results">
                    {results.map((song) => (
                        <div
                            key={song.id}
                            onClick={() => playSong(song)}
                            className="result-row"
                        >
                            <div className="result-img-wrapper">
                                <img
                                    src={song.image?.[1]?.url || song.image?.[0]?.url}
                                    alt={song.title}
                                    className="result-img"
                                />
                                <div className="result-play-overlay">
                                    <Play size={16} fill="white" className="text-white" />
                                </div>
                            </div>
                            <div className="result-info">
                                <h4 className="result-title">{song.name}</h4>
                                <p className="result-artist">{song.artists?.primary?.map(a => a.name).join(', ') || song.singers}</p>
                            </div>
                            <div className="result-meta">
                                {song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
