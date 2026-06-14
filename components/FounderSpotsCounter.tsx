'use client';

import { useEffect, useState } from 'react';

export default function FounderSpotsCounter() {
  const [spots, setSpots] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/founder-spots')
      .then(r => r.json())
      .then(d => { if (typeof d.spots === 'number') setSpots(d.spots); })
      .catch(() => {});
  }, []);

  if (spots === null) return <span className="animate-pulse">—</span>;
  return <span>{spots}</span>;
}
