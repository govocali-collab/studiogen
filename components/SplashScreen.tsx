'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const isStandalone =
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (!isStandalone) return;

    setVisible(true);
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{ transition: 'opacity 0.6s ease' }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-5">
        <Image
          src="/fav.png"
          alt="StudioGen"
          width={88}
          height={88}
          className="rounded-[22px] shadow-lg"
          priority
        />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-gray-900 tracking-tight">StudioGen</div>
          <div className="text-sm text-gray-400 mt-1">Pour les professionnels de la beauté</div>
        </div>
      </div>
      {/* Loading dot */}
      <div className="absolute bottom-16 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
