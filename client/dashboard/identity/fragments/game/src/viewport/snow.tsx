'use client';

import { useRef, useEffect } from 'react';

interface SnowFlake {
  x: number;
  y: number;
  speedY: number;
  speedX: number;
  radius: number;
  opacity: number;
}

export const SnowOverlay = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<SnowFlake[]>([]);
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

    const createFlake = (): SnowFlake => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      speedY: 0.8 + Math.random() * 1.8,
      speedX: -0.5 + Math.random(),
      radius: 1 + Math.random() * 2.8,
      opacity: 0.4 + Math.random() * 0.6,
    });

    flakesRef.current = Array.from({ length: 260 }, createFlake);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const flake of flakesRef.current) {
        ctx.globalAlpha = flake.opacity;
        ctx.fillStyle = '#f4f8ff';
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.speedY;
        flake.x += flake.speedX;

        if (flake.y > canvas.height + 5 || flake.x < -5 || flake.x > canvas.width + 5) {
          flake.y = -5;
          flake.x = Math.random() * canvas.width;
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
