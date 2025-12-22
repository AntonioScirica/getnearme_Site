'use client';

import { useEffect, useRef } from 'react';
import {
    Layers,
    Box,
    Building2,
    BedDouble,
    ShoppingCart,
    Armchair,
    Home,
    Map,
    Key,
    Calculator,
    Percent,
    Tag
} from 'lucide-react';

interface IconDef {
    id: number;
    Component: any;
    top: string;
    left?: string;
    right?: string;
    rotate: string;
    color: string;
    hiddenByDefault?: boolean;
    delay?: string;
    speed: number;
}

const ICONS: IconDef[] = [
    // --- Visible Icons (Static opacity 1) ---

    // 1. Top Left
    // BedDouble: Moved further right
    { id: 1, Component: BedDouble, top: '2%', left: '18%', rotate: '-12deg', color: 'text-blue-500', hiddenByDefault: false, speed: 0.15 },

    // 2. Top Right
    // Map: Moved much more to the left (inwards)
    { id: 2, Component: Map, top: '5%', right: '20%', rotate: '12deg', color: 'text-blue-500', hiddenByDefault: false, speed: 0.12 },

    // 3. Bottom Left
    { id: 3, Component: Building2, top: '65%', left: '12%', rotate: '-6deg', color: 'text-blue-500', hiddenByDefault: true, delay: '0.5s', speed: 0.08 },

    // 4. Bottom Right
    { id: 4, Component: ShoppingCart, top: '70%', right: '15%', rotate: '10deg', color: 'text-blue-500', hiddenByDefault: true, delay: '3.5s', speed: 0.1 },

    // 5. Mid Left
    // Armchair: slightly lower
    { id: 10, Component: Armchair, top: '30%', left: '18%', rotate: '8deg', color: 'text-blue-500', hiddenByDefault: false, speed: 0.2 },

    // 6. Mid Right
    // Layers: slightly more internal
    { id: 11, Component: Layers, top: '32%', right: '19%', rotate: '-8deg', color: 'text-blue-500', hiddenByDefault: false, speed: 0.18 },


    // --- Faded Icons (Animated) ---

    // 7. Top Center
    // Home: Moved down to fix cut-off
    { id: 5, Component: Home, top: '-8%', left: '46%', rotate: '0deg', color: 'text-blue-300', hiddenByDefault: true, delay: '0s', speed: 0.11 },

    // 8. Far Left
    // Key
    { id: 6, Component: Key, top: '28%', left: '2%', rotate: '-15deg', color: 'text-blue-300', hiddenByDefault: true, delay: '1.5s', speed: 0.09 },

    // 9. Mid-Right (Floating lower)
    // Calculator
    { id: 7, Component: Calculator, top: '45%', right: '5%', rotate: '15deg', color: 'text-blue-300', hiddenByDefault: true, delay: '3s', speed: 0.13 },

    // 10. Bottom Center
    // Tag
    { id: 8, Component: Tag, top: '85%', left: '40%', rotate: '5deg', color: 'text-blue-300', hiddenByDefault: true, delay: '1s', speed: 0.04 },

    // 11. High Right (Above text)
    // Percent
    { id: 12, Component: Percent, top: '15%', right: '2%', rotate: '-10deg', color: 'text-blue-300', hiddenByDefault: true, delay: '2s', speed: 0.14 },

    // 12. Mid-Low Left
    // Box
    { id: 13, Component: Box, top: '55%', left: '4%', rotate: '15deg', color: 'text-blue-300', hiddenByDefault: true, delay: '2.5s', speed: 0.06 },
];

export default function HeroFloatingIcons() {
    const iconRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        let animationFrameId: number;

        const handleScroll = () => {
            animationFrameId = requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                ICONS.forEach((icon) => {
                    const el = iconRefs.current[icon.id];
                    if (!el) return;

                    // Calculate translation based on scroll and speed (inverted to move up)
                    const yOffset = -scrollY * icon.speed;

                    // Apply simpler transform directly
                    el.style.transform = `rotate(${icon.rotate}) translateY(${yOffset}px)`;
                });
            });
        };

        window.addEventListener('scroll', handleScroll);
        // Initial call
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);


    return (
        // w-screen allows full width positioning
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-full pointer-events-none z-0 overflow-hidden hidden md:block">
            {ICONS.map((icon) => (
                <div
                    key={icon.id}
                    ref={(el) => { iconRefs.current[icon.id] = el }}
                    className={`absolute transition-transform duration-75 ease-out will-change-transform ${icon.hiddenByDefault ? 'animate-fade-sequence' : ''
                        }`}
                    style={{
                        top: icon.top,
                        left: icon.left,
                        right: icon.right,
                        // Initial transform, will be updated by scroll script
                        transform: `rotate(${icon.rotate})`,
                        opacity: icon.hiddenByDefault ? 0 : 1,
                        animationDelay: icon.delay,
                    }}
                >
                    <div className="w-16 h-16 bg-white border border-[#E4E4E4] rounded-2xl flex items-center justify-center">
                        <icon.Component className={`w-8 h-8 ${icon.color}`} strokeWidth={1.5} />
                    </div>
                </div>
            ))}
        </div>
    );
}
