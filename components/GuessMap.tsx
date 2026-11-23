'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from 'leaflet';
import { Layers, Maximize2, Minimize2, CheckCircle2, MapPin } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { UNS_CAMPUS_BOUNDARIES } from '@/data/unsBoundaries';
import { soundFx } from '@/lib/soundFx';

interface GuessMapProps {
  onGuessSubmit: (guess: { lat: number; lng: number }) => void;
  onPinChange?: (pin: { lat: number; lng: number } | null) => void;
  isResultMode?: boolean;
  isLocked?: boolean;
  lockStatusMessage?: string;
  actualLocation?: UNSLocation;
  userGuess?: { lat: number; lng: number } | null;
  roundNumber: number;
}

export function GuessMap({
  onGuessSubmit,
  onPinChange,
  isResultMode = false,
  isLocked = false,
  lockStatusMessage,
  actualLocation,
  userGuess,
}: GuessMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const guessMarkerRef = useRef<LeafletMarker | null>(null);
  const actualMarkerRef = useRef<LeafletMarker | null>(null);
  const lineRef = useRef<LeafletPolyline | null>(null);

  const [currentGuess, setCurrentGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [tileLayerType, setTileLayerType] = useState<'satellite' | 'street'>('satellite');
  const streetTileRef = useRef<unknown>(null);
  const satelliteTileRef = useRef<unknown>(null);

  const onPinChangeRef = useRef(onPinChange);
  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  const onGuessSubmitRef = useRef(onGuessSubmit);
  useEffect(() => {
    onGuessSubmitRef.current = onGuessSubmit;
  }, [onGuessSubmit]);

  const isResultModeRef = useRef<boolean>(isResultMode);
  useEffect(() => {
    isResultModeRef.current = isResultMode;
  }, [isResultMode]);

  const isLockedRef = useRef<boolean>(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      // @ts-expect-error Leaflet icon prototype fix
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center: [-7.5604, 110.8568],
        zoom: 15,
        minZoom: 11,
        maxZoom: 19,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar',
          maxZoom: 19,
        }
      );

      const streetLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap, &copy; CARTO',
          maxZoom: 19,
        }
      );

      satelliteTileRef.current = satelliteLayer;
      streetTileRef.current = streetLayer;
      satelliteLayer.addTo(map);

      UNS_CAMPUS_BOUNDARIES.forEach((b) => {
        L.polygon(b.polygon, {
          color: '#E2B34B',
          weight: 2,
          opacity: 0.85,
          dashArray: '4, 4',
          fillColor: '#E2B34B',
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(map);
      });

      map.on('click', (e) => {
        if (isResultModeRef.current || isLockedRef.current) return;

        const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCurrentGuess(newPos);
        onPinChangeRef.current?.(newPos);
        soundFx.playPinDrop();

        const guessPinIcon = L.divIcon({
          className: 'unsguessr-pin-marker',
          html: `<div style="position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <svg viewBox="0 0 24 24" width="32" height="42" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.65));">
              <path fill="#E2B34B" stroke="#0C0E11" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="3" fill="#0C0E11"/>
            </svg>
          </div>`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        });

        if (guessMarkerRef.current) {
          guessMarkerRef.current.setLatLng([newPos.lat, newPos.lng]);
        } else {
          guessMarkerRef.current = L.marker([newPos.lat, newPos.lng], { icon: guessPinIcon }).addTo(map);
        }
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 150);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !streetTileRef.current || !satelliteTileRef.current) return;

    // @ts-expect-error Leaflet layer methods
    map.removeLayer(streetTileRef.current);
    // @ts-expect-error Leaflet layer methods
    map.removeLayer(satelliteTileRef.current);

    if (tileLayerType === 'street') {
      // @ts-expect-error Leaflet layer methods
      map.addLayer(streetTileRef.current);
    } else {
      // @ts-expect-error Leaflet layer methods
      map.addLayer(satelliteTileRef.current);
    }
  }, [tileLayerType]);

  useEffect(() => {
    if (!isResultMode || !actualLocation || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    async function showResults() {
      if (!actualLocation) return;
      const L = await import('leaflet');

      const actualPos: [number, number] = [actualLocation.coordinates.lat, actualLocation.coordinates.lng];

      const trueIcon = L.divIcon({
        className: 'true-location-pin',
        html: `<div style="position: relative; width: 38px; height: 48px; display: flex; align-items: center; justify-content: center;">
          <div class="marker-actual-ring" style="position: absolute; left: 5px; top: 10px; width: 28px; height: 28px; pointer-events: none;"></div>
          <svg viewBox="0 0 24 24" width="38" height="48" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6)); position: relative; z-index: 2;">
            <path fill="#ef4444" stroke="#ffffff" stroke-width="1.8" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
            <circle cx="12" cy="8" r="3" fill="#ffffff"/>
          </svg>
        </div>`,
        iconSize: [38, 48],
        iconAnchor: [19, 48],
      });

      if (actualMarkerRef.current) {
        actualMarkerRef.current.remove();
      }
      actualMarkerRef.current = L.marker(actualPos, { icon: trueIcon, interactive: false }).addTo(map);

      if (userGuess) {
        const guessPos: [number, number] = [userGuess.lat, userGuess.lng];

        if (lineRef.current) {
          lineRef.current.remove();
        }

        lineRef.current = L.polyline([guessPos, actualPos], {
          color: '#E2B34B',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '8, 8',
        }).addTo(map);

        const bounds = L.latLngBounds([guessPos, actualPos]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      } else {
        map.setView(actualPos, 17);
      }
    }

    showResults();
  }, [isResultMode, actualLocation, userGuess]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isExpanded, isResultMode]);

  const handleConfirmGuess = () => {
    if (currentGuess && !isLocked) {
      onGuessSubmitRef.current(currentGuess);
    }
  };

  return (
    <div
      className={`transition-[width,height] duration-200 ease-out z-30 ${
        isResultMode
          ? 'relative w-full h-full'
          : isExpanded
          ? 'fixed top-14 bottom-3 left-3 right-3 md:inset-auto md:bottom-4 md:right-4 md:w-[520px] md:h-[420px] rounded-lg'
          : 'fixed bottom-3 right-3 w-52 h-44 sm:w-64 sm:h-56 md:w-72 md:h-60 rounded-lg'
      }`}
    >
      <div className="relative w-full h-full bg-[#0C0E11] border border-[#353942] rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-[#14171C] border-b border-[#262A32] shrink-0">
          <span className="text-xs font-semibold text-[#F2F0EB] truncate">
            {isResultMode ? 'Hasil Lokasi' : 'Peta Kampus UNS'}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTileLayerType(tileLayerType === 'street' ? 'satellite' : 'street')}
              aria-label={`Ganti ke ${tileLayerType === 'street' ? 'satelit' : 'peta jalan'}`}
              title={`Ganti ke ${tileLayerType === 'street' ? 'Satelit' : 'Peta Jalan'}`}
              className="w-7 h-7 flex items-center justify-center rounded bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#C7C4BC] hover:text-[#F2F0EB] transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            {!isResultMode && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Perkecil peta' : 'Perbesar peta'}
                title={isExpanded ? 'Perkecil peta' : 'Perbesar peta'}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#1C2028] hover:bg-[#262B35] border border-[#686A70] text-[#C7C4BC] hover:text-[#F2F0EB] transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div ref={mapContainerRef} className="relative w-full flex-1 z-0" />

        {!isResultMode && (
          <div className="p-2.5 bg-[#14171C] border-t border-[#262A32] flex items-center justify-between gap-2 shrink-0">
            <div className="text-xs text-[#C7C4BC] truncate min-w-0 flex-1">
              {isLocked ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-medium truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lockStatusMessage || 'Tebakan terkunci'}</span>
                </span>
              ) : currentGuess ? (
                <span className="text-[#E2B34B] font-medium flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pin terpasang</span>
                </span>
              ) : (
                <span className="text-[#9B988F] truncate">Klik peta untuk pasang pin</span>
              )}
            </div>

            {isLocked ? (
              <span className="py-1 px-2.5 bg-emerald-950/60 border border-emerald-400/50 text-emerald-300 rounded font-mono font-semibold text-xs shrink-0">
                Terkunci
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConfirmGuess}
                disabled={!currentGuess}
                className={`py-1.5 px-4 rounded-md font-bold text-xs transition-colors shrink-0 ${
                  currentGuess
                    ? 'bg-[#E2B34B] hover:bg-[#EBC263] text-[#0C0E11] cursor-pointer'
                    : 'bg-[#1C2028] text-[#9B988F] border border-[#262A32] cursor-not-allowed'
                }`}
              >
                Tebak
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
