'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { soundFx } from '@/lib/soundFx';

interface StreetViewPlayerProps {
  location: UNSLocation;
  randomHeading?: number;
}

export function StreetViewPlayer({ location, randomHeading }: StreetViewPlayerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleReset = () => {
    soundFx.playClick();
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  const initialHeading = randomHeading !== undefined ? randomHeading : location.streetView.heading;
  const roundedHeading = Math.round(((initialHeading % 360) + 360) % 360);
  const streetViewUrl = `https://maps.google.com/maps?layer=c&cbll=${location.streetView.lat},${location.streetView.lng}&cbp=12,${roundedHeading},0,0,0&output=svembed`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0C0E11] overflow-hidden"
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0C0E11]/95 text-[#C7C4BC]">
          <Loader2 className="w-6 h-6 text-[#E2B34B] animate-spin mb-2.5" />
          <div className="text-sm font-medium text-[#F2F0EB]">
            Memuat Street View 360° UNS...
          </div>
        </div>
      )}

      <iframe
        key={`${location.id}-${roundedHeading}-${reloadKey}`}
        src={streetViewUrl}
        onLoad={() => setIsLoading(false)}
        className="absolute -top-28 sm:-top-32 left-0 w-full h-[calc(100%+9.5rem)] sm:h-[calc(100%+10.5rem)] border-0 block pointer-events-auto"
        allow="fullscreen; geolocation; accelerometer; gyroscope"
        loading="eager"
        title="Google Street View 360 UNS"
      />

      <div
        className="absolute top-0 left-0 right-0 h-4 z-20 pointer-events-auto bg-[#0C0E11]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-0 w-80 sm:w-96 h-28 z-20 pointer-events-auto"
        aria-hidden="true"
      />

      <div className="absolute bottom-0 left-0 h-8 z-20 pointer-events-auto bg-[#0C0E11]/95 border-t border-r border-[#262A32] rounded-tr-md flex items-center px-3">
        <span className="text-xs font-mono font-semibold text-[#C7C4BC]">
          UNSGuessr 360°
        </span>
      </div>

      <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset arah pandang ke posisi awal"
          title="Reset posisi awal"
          className="w-9 h-9 bg-[#14171C]/95 hover:bg-[#1C2028] text-[#F2F0EB] rounded-md border border-[#686A70] flex items-center justify-center transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Keluar layar penuh' : 'Masuk layar penuh'}
          title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
          className="w-9 h-9 bg-[#14171C]/95 hover:bg-[#1C2028] text-[#F2F0EB] rounded-md border border-[#686A70] flex items-center justify-center transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
