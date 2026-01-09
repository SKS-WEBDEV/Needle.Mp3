"use client";
import Link from 'next/link';
import { Home, Search, Library, Settings, Disc, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function Sidebar({ isOpen, onClose }) {
    const pathname = usePathname();
    const { theme } = useTheme();

    const navItems = [
        { name: 'Home', icon: Home, href: '/' },
        { name: 'Search', icon: Search, href: '/search' },
        { name: 'Library', icon: Library, href: '/library' },
        { name: 'Settings', icon: Settings, href: '/settings' },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="brand">
                    <Disc size={32} className="brand-icon" />
                    <h1 className="brand-text">Needle</h1>
                    <button className="mobile-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="nav-menu">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={onClose} // Close on nav
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <p>Made with music ❤</p>
                </div>
            </aside>
        </>
    );
}
