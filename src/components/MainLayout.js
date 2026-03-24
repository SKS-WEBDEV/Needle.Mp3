"use client";
import Sidebar from "./Sidebar";
import PlayerBar from "./PlayerBar";
import FullScreenPlayer from "./FullScreenPlayer";
import { useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { Menu } from "lucide-react";

export default function MainLayout({ children }) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { currentSong } = usePlayer();

    return (
        <div className="app-layout">
            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="main-content">
            {/* Mobile Header */}
                <div className="mobile-header">
                    <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    {/* Replace text with GIF */}
                <img
                src="https://res.cloudinary.com/dgwrti2qs/image/upload/v1774345919/2026-03-24-NEEDLE-MP3_fttq1y.gif"
                alt="Needle Logo"
                className="mobile-brand-logo"
                />
            </div>

    <div className="content-glow" />
    <div className="page-container">
        {children}
    </div>
</main>

            <PlayerBar onExpand={() => setIsFullScreen(true)} />

            <FullScreenPlayer
                isOpen={isFullScreen}
                onClose={() => setIsFullScreen(false)}
            />
        </div>
    );
}
