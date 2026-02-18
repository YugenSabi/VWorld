'use client';

import { useState, useCallback } from 'react';
import { ZONES } from '../zones';

const ZONE_COLORS: Record<string, string> = {
  park:   'rgba(60, 180, 80,  0.13)',
  road:   'rgba(200, 160, 60, 0.13)',
  square: 'rgba(80, 140, 220, 0.13)',
};

const ZONE_BORDER: Record<string, string> = {
  park:   'rgba(60, 180, 80,  0.45)',
  road:   'rgba(200, 160, 60, 0.45)',
  square: 'rgba(80, 140, 220, 0.45)',
};

const DEBUG = false;

export function ZoneOverlay() {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!DEBUG) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursor({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCursor(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!DEBUG) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const point = { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
    setPinned(point);
    console.log(`[ZoneOverlay] click → x: ${point.x}, y: ${point.y}`);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: DEBUG ? 'auto' : 'none',
        zIndex: 1,
        cursor: DEBUG ? 'crosshair' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {DEBUG && ZONES.map((zone) => (
        <div
          key={zone.name}
          style={{
            position: 'absolute',
            left: `${zone.x1}%`,
            top: `${zone.y1}%`,
            width: `${zone.x2 - zone.x1}%`,
            height: `${zone.y2 - zone.y1}%`,
            background: ZONE_COLORS[zone.name] ?? 'rgba(255,255,255,0.05)',
            border: `1px solid ${ZONE_BORDER[zone.name] ?? 'rgba(255,255,255,0.15)'}`,
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: 4,
              fontSize: '0.45rem',
              letterSpacing: '1px',
              color: ZONE_BORDER[zone.name] ?? 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            {zone.label}
            <span style={{ opacity: 0.6, marginLeft: 4 }}>
              [{zone.x1},{zone.y1}→{zone.x2},{zone.y2}]
            </span>
          </span>
        </div>
      ))}

      {DEBUG && cursor && (
        <div
          style={{
            position: 'absolute',
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ff4444',
            border: '1px solid #fff',
          }} />
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.85)',
            color: '#ff4444',
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            padding: '2px 5px',
            whiteSpace: 'nowrap',
            border: '1px solid #ff4444',
          }}>
            x:{cursor.x} y:{cursor.y}
          </div>
        </div>
      )}

      {DEBUG && pinned && (
        <div
          style={{
            position: 'absolute',
            left: `${pinned.x}%`,
            top: `${pinned.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 21,
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ffff00',
            border: '1px solid #fff',
          }} />
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.9)',
            color: '#ffff00',
            fontFamily: 'monospace',
            fontSize: '0.55rem',
            padding: '2px 5px',
            whiteSpace: 'nowrap',
            border: '1px solid #ffff00',
          }}>
            📌 x:{pinned.x} y:{pinned.y}
          </div>
        </div>
      )}

      {DEBUG && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          background: 'rgba(0,0,0,0.75)',
          color: '#aaa',
          fontFamily: 'monospace',
          fontSize: '0.42rem',
          padding: '2px 6px',
          pointerEvents: 'none',
          letterSpacing: '0.5px',
        }}>
          ZONE DEBUG · hover=coords · click=pin
        </div>
      )}
    </div>
  );
}
