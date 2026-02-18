'use client';

import { useRef, useEffect } from 'react';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

export const RainOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<RainDrop[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const createDrop = (): RainDrop => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      speed: 4 + Math.random() * 8,
      length: 10 + Math.random() * 20,
      opacity: 0.3 + Math.random() * 0.5,
    });

    dropsRef.current = Array.from({ length: 500 }, createDrop);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#aaccff';
      ctx.lineWidth = 1.5;

      for (const drop of dropsRef.current) {
        ctx.globalAlpha = drop.opacity;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 1, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = Math.random() * -100;
          drop.x = Math.random() * canvas.width;
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};
