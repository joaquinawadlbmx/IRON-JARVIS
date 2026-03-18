import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const playGymSound = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Golpe de bajo (impacto)
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.4);

  // Hit de impacto agudo encima
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
  gain2.gain.setValueAtTime(0.6, audioCtx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
  osc2.start(audioCtx.currentTime);
  osc2.stop(audioCtx.currentTime + 0.25);
};

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [flash, setFlash] = useState(true);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Fase 1: Entrada (0ms)
    const t0 = setTimeout(() => {
      setPhase(1);
      playGymSound();
      setFlash(false);
    }, 10);

    // Fase 2: Hold (500ms)
    const t1 = setTimeout(() => {
      setPhase(2);
    }, 500);

    // Fase 3: Explosión (2500ms)
    const t2 = setTimeout(() => {
      triggerExplosion();
    }, 2500);

    timersRef.current = [t0, t1, t2];

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const triggerExplosion = () => {
    setPhase(3);
    confetti({
      particleCount: 120,
      spread: 360,
      startVelocity: 45,
      colors: ['#ffffff', '#7C3AED', '#5B21B6'],
      origin: { x: 0.5, y: 0.5 },
      scalar: 0.6,
      ticks: 60
    });

    // Fade out a negro en 400ms (2800ms)
    const t3 = setTimeout(() => {
      setPhase(4);
    }, 300);

    // Navegar al Home (3200ms)
    const t4 = setTimeout(() => {
      onComplete();
    }, 700);

    timersRef.current.push(t3, t4);
  };

  const handleSkip = () => {
    if (phase >= 2 && phase < 3) {
      timersRef.current.forEach(clearTimeout);
      triggerExplosion();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onClick={handleSkip}
    >
      {/* Flash violeta de fondo */}
      <div 
        className={cn(
          "absolute inset-0 bg-[#7C3AED] transition-opacity duration-300 ease-out",
          flash ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Imagen de Arnold */}
      <img 
        src="/images/arnold_app.webp" 
        alt="Arnold"
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all",
          phase === 0 ? "scale-[0.8] opacity-0" :
          phase === 1 ? "scale-100 opacity-100 duration-500 ease-out" :
          phase === 2 ? "scale-100 opacity-100" :
          "scale-[1.15] opacity-100 duration-200 ease-out"
        )}
      />

      {/* Overlay degradado */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent transition-opacity duration-300",
          phase >= 2 ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Textos */}
      <div 
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-300",
          phase >= 2 ? "opacity-100" : "opacity-0"
        )}
      >
        <h1 className="text-4xl font-bold text-white tracking-[0.2em] leading-tight">
          VAS CON TODA
        </h1>
        <h2 className="text-xl font-bold text-[#7C3AED] tracking-[0.15em] mt-2">
          TU SESIÓN DE ENTRENAMIENTO
        </h2>
      </div>

      {/* Fade out a negro */}
      <div 
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-400 pointer-events-none",
          phase === 4 ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
