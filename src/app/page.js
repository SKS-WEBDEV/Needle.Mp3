"use client";
import { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play } from 'lucide-react';

export default function Home() {
  const { playSong } = usePlayer();
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('https://zylaes-saavn.vercel.app/api/search/songs?query=Malayalam%20Hits&limit=20');
        const json = await res.json();
        setTrending(json.data?.results || []);
      } catch (e) { console.error(e); }
    };
    fetchTrending();
  }, []);

  return (
    <div className="home-page">
      <section className="discover-section">
        <h2 className="section-title">Discover</h2>
        <div className="song-grid">
          {trending.map((song) => (
            <div
              key={song.id}
              className="song-card"
              onClick={() => playSong(song)}
            >
              <div className="card-image-wrapper">
                <img
                  src={song.image?.[2]?.url || song.image?.[0]?.url}
                  alt={song.title}
                  className="card-image"
                />
                <button className="card-play-btn">
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
              <h3 className="card-title">{song.name}</h3>
              <p className="card-artist">
                {song.artists?.primary?.map(a => a.name).join(', ') || song.singers}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
