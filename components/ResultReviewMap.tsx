'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { UNSLocation } from '@/data/unsLocations';
import { UNS_CAMPUS_BOUNDARIES } from '@/data/unsBoundaries';

interface MultiplayerPinData {
  name: string;
  avatar: string;
  color: string;
  guess: { lat: number; lng: number } | null;
  distance: number;
  score: number;
}

interface ResultReviewMapProps {
  actualLocation: UNSLocation;
  userGuess: { lat: number; lng: number } | null;
  distanceMeters: number;
  opponentGuess?: { lat: number; lng: number } | null;
  multiplayerGuesses?: MultiplayerPinData[];
}

export function ResultReviewMap({
  actualLocation,
  userGuess,
  distanceMeters,
  opponentGuess,
  multiplayerGuesses,
}: ResultReviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [tileLayerType, setTileLayerType] = useState<'satellite' | 'street'>('satellite');
  const streetTileRef = useRef<unknown>(null);
  const satelliteTileRef = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    async function initResultMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');
      if (!isMounted || !mapContainerRef.current) return;

      // @ts-expect-error Leaflet icon prototype
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const actualPos: [number, number] = [
        actualLocation.coordinates.lat,
        actualLocation.coordinates.lng,
      ];

      const map = L.map(mapContainerRef.current, {
        center: actualPos,
        zoom: 16,
        minZoom: 11,
        maxZoom: 19,
        zoomControl: false,
      });

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      });

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        }
      );

      streetTileRef.current = streetLayer;
      satelliteTileRef.current = satelliteLayer;
      satelliteLayer.addTo(map);

      UNS_CAMPUS_BOUNDARIES.forEach((boundary) => {
        L.polygon(boundary.polygon, {
          color: '#E2B34B',
          weight: 2,
          opacity: 0.78,
          dashArray: '5, 5',
          fillColor: '#E2B34B',
          fillOpacity: 0.08,
          interactive: false,
        }).addTo(map);
      });

      const trueIcon = L.divIcon({
        className: 'true-location-pin',
        html: `<div style="position: relative; width: 40px; height: 50px; display: flex; align-items: center; justify-content: center;">
          <div class="marker-actual-ring" style="position: absolute; left: 5px; top: 10px; width: 30px; height: 30px; pointer-events: none;"></div>
          <svg viewBox="0 0 24 24" width="40" height="50" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.6)); position: relative; z-index: 2;">
            <path fill="#ef4444" stroke="#ffffff" stroke-width="1.8" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
            <circle cx="12" cy="8" r="3" fill="#ffffff"/>
          </svg>
        </div>`,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });

      L.marker(actualPos, { icon: trueIcon, interactive: false }).addTo(map);

      if (userGuess) {
        const guessPos: [number, number] = [userGuess.lat, userGuess.lng];

        const guessIcon = L.divIcon({
          className: 'guess-location-pin',
          html: `<div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="34" height="44" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.65));">
              <path fill="#E2B34B" stroke="#0C0E11" stroke-width="1.8" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
              <circle cx="12" cy="8" r="2.8" fill="#0C0E11"/>
            </svg>
          </div>`,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
        });

        L.marker(guessPos, { icon: guessIcon, interactive: false }).addTo(map);

        L.polyline([guessPos, actualPos], {
          color: '#E2B34B',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '8, 8',
        }).addTo(map);
      }

      if (opponentGuess) {
        const oppPos: [number, number] = [opponentGuess.lat, opponentGuess.lng];
        const oppIcon = L.divIcon({
          className: 'opponent-location-pin',
          html: `<div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 24 24" width="34" height="44" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.65));">
              <path fill="#38bdf8" stroke="#0C0E11" stroke-width="1.8" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
              <circle cx="12" cy="8" r="2.8" fill="#0C0E11"/>
            </svg>
          </div>`,
          iconSize: [34, 44],
          iconAnchor: [17, 44],
        });

        L.marker(oppPos, { icon: oppIcon, interactive: false }).addTo(map);

        L.polyline([oppPos, actualPos], {
          color: '#38bdf8',
          weight: 2.8,
          opacity: 0.85,
          dashArray: '6, 6',
        }).addTo(map);
      }

      if (multiplayerGuesses && multiplayerGuesses.length > 0) {
        multiplayerGuesses.forEach((p) => {
          if (!p.guess) return;
          const pos: [number, number] = [p.guess.lat, p.guess.lng];
          const pinColor = p.color || '#E2B34B';
          const code = (p.avatar || 'UN').slice(0, 2);
          const pIcon = L.divIcon({
            className: 'player-8-pin',
            html: `<div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 24 24" width="34" height="44" style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.65));">
                <path fill="${pinColor}" stroke="#0C0E11" stroke-width="1.8" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
                <circle cx="12" cy="8.5" r="4.8" fill="#0C0E11"/>
              </svg>
              <span style="position: absolute; top: 9px; left: 0; right: 0; text-align: center; font-size: 8px; font-weight: 800; color: #F2F0EB; font-family: monospace; line-height: 1;">${code}</span>
            </div>`,
            iconSize: [34, 44],
            iconAnchor: [17, 44],
          });

          L.marker(pos, { icon: pIcon, interactive: false }).addTo(map);

          L.polyline([pos, actualPos], {
            color: pinColor,
            weight: 2.5,
            opacity: 0.9,
            dashArray: '5, 5',
          }).addTo(map);
        });
      }

      const pointsToFit: [number, number][] = [actualPos];
      if (userGuess) pointsToFit.push([userGuess.lat, userGuess.lng]);
      if (opponentGuess) pointsToFit.push([opponentGuess.lat, opponentGuess.lng]);
      if (multiplayerGuesses) {
        multiplayerGuesses.forEach((p) => {
          if (p.guess) pointsToFit.push([p.guess.lat, p.guess.lng]);
        });
      }

      if (pointsToFit.length > 1) {
        const bounds = L.latLngBounds(pointsToFit);
        map.fitBounds(bounds, {
          paddingTopLeft: [60, 80],
          paddingBottomRight: [60, 220],
          maxZoom: 18,
          animate: true,
          duration: 0.6,
        });
      } else {
        map.setView(actualPos, 17, { animate: true });
      }

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 150);
    }

    initResultMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualLocation.id, userGuess?.lat, userGuess?.lng, distanceMeters, opponentGuess?.lat, opponentGuess?.lng]);

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

    const street = streetTileRef.current as L.TileLayer;
    const satellite = satelliteTileRef.current as L.TileLayer;

    if (tileLayerType === 'street') {
      map.removeLayer(satellite);
      street.addTo(map);
    } else {
      map.removeLayer(street);
      satellite.addTo(map);
    }
  }, [tileLayerType]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      if (delta > 0) mapInstanceRef.current.zoomIn();
      else mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetBounds = async () => {
    if (!mapInstanceRef.current) return;
    if (userGuess) {
      const L = await import('leaflet');
      const bounds = L.latLngBounds([
        [userGuess.lat, userGuess.lng],
        [actualLocation.coordinates.lat, actualLocation.coordinates.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, {
        paddingTopLeft: [60, 80],
        paddingBottomRight: [60, 220],
        maxZoom: 18,
        animate: true,
      });
    } else {
      mapInstanceRef.current.setView(
        [actualLocation.coordinates.lat, actualLocation.coordinates.lng],
        17,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0C0E11] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setTileLayerType(tileLayerType === 'satellite' ? 'street' : 'satellite')}
          aria-label={`Ganti ke ${tileLayerType === 'satellite' ? 'peta jalan' : 'satelit'}`}
          title={`Ganti ke ${tileLayerType === 'satellite' ? 'Peta Jalan' : 'Satelit'}`}
          className="w-10 h-10 bg-[#14171C] hover:bg-[#1C2028] text-[#F2F0EB] rounded-md border border-[#686A70] hover:border-[#F2F0EB] flex items-center justify-center transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1)}
          aria-label="Perbesar peta"
          title="Perbesar Peta"
          className="w-10 h-10 bg-[#14171C] hover:bg-[#1C2028] text-[#F2F0EB] rounded-md border border-[#686A70] hover:border-[#F2F0EB] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          aria-label="Perkecil peta"
          title="Perkecil Peta"
          className="w-10 h-10 bg-[#14171C] hover:bg-[#1C2028] text-[#F2F0EB] rounded-md border border-[#686A70] hover:border-[#F2F0EB] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetBounds}
          aria-label="Pusatkan ulang tampilan peta"
          title="Pusatkan Ulang Pin"
          className="w-10 h-10 bg-[#14171C] hover:bg-[#1C2028] text-[#E2B34B] rounded-md border border-[#686A70] hover:border-[#F2F0EB] flex items-center justify-center transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
