"use client";
import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { usePlayer } from '@/context/PlayerContext';
import { Moon, Sun, Wifi, Mic } from 'lucide-react';

export default function Settings() {
    const { theme, toggleTheme } = useTheme();
    const { bitrate, setBitrate } = usePlayer();

    const qualities = ['12kbps', '48kbps', '96kbps', '160kbps', '320kbps'];

    return (
        <div className="settings-page">
            <h1 className="page-title">Settings</h1>

            <section className="settings-section">
                <h2 className="section-header">
                    <Moon size={20} /> Appearance
                </h2>
                <div className="settings-card glass">
                    <div>
                        <h3 className="card-header-text">Theme Mode</h3>
                        <p className="card-sub-text">Select your preferred interface theme.</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                    >
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        <span className="capitalize">{theme}</span>
                    </button>
                </div>
            </section>

            <section className="settings-section">
                <h2 className="section-header">
                    <Wifi size={20} /> Audio Quality
                </h2>
                <div className="settings-card glass quality-card">
                    <div className="quality-row">
                        <div>
                            <h3 className="card-header-text">Streaming Quality</h3>
                            <p className="card-sub-text">Higher quality uses more data.</p>
                        </div>
                        <div className="quality-selector">
                            {qualities.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setBitrate(q)}
                                    className={`quality-btn ${bitrate === q ? 'active' : ''}`}
                                >
                                    {q.replace('kbps', '')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="note-text">
                        Note: Changes will apply to the next song played. 320kbps is recommended for best experience.
                    </p>
                </div>
            </section>

            <KaraokeSettings />
        </div>
    );
}

function KaraokeSettings() {
    const [gap, setGap] = useState(7);
    const [color, setColor] = useState('#1db954');

    useEffect(() => {
        const savedGap = localStorage.getItem('karaoke-gap');
        if (savedGap) setGap(Number(savedGap));

        const savedColor = localStorage.getItem('karaoke-color');
        if (savedColor) setColor(savedColor);
    }, []);

    const handleSave = () => {
        localStorage.setItem('karaoke-gap', gap);
        localStorage.setItem('karaoke-color', color);
        if (window.confirm("Settings saved! Reload the app now to apply changes?")) {
            window.location.reload();
        }
    };

    return (
        <section className="settings-section">
            <h2 className="section-header">
                <Mic size={20} /> Karaoke Mode
            </h2>
            <div className="settings-card glass" style={{ display: 'block' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 className="card-header-text">Countdown Trigger</h3>
                        <p className="card-sub-text">Minimum gap duration (seconds) to show countdown.</p>
                    </div>
                    <input
                        type="number"
                        value={gap}
                        onChange={(e) => setGap(e.target.value)}
                        className="search-input"
                        style={{ height: '40px', padding: '0 1rem', width: '100px' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 className="card-header-text">Countdown Color</h3>
                        <p className="card-sub-text">Custom color for the countdown numbers.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            style={{
                                width: '50px',
                                height: '50px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{ fontFamily: 'monospace' }}>{color}</span>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="theme-toggle-btn"
                    style={{ width: '100%', justifyContent: 'center', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                >
                    Save & Reload
                </button>
            </div>
        </section>
    );
}
