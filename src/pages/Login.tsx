import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from '@google/genai';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [quote, setQuote] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchQuote() {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: 'Genera UNA sola frase motivacional corta (máximo 12 palabras) para alguien que está a punto de ir a entrenar al gimnasio. La frase debe ser poderosa, directa y en español. No uses comillas. No uses emojis. Solo la frase.',
        });
        
        if (isMounted) {
          setQuote(response.text || 'El único mal entrenamiento es el que no hiciste.');
          setLoadingQuote(false);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        if (isMounted) {
          setQuote('El único mal entrenamiento es el que no hiciste.');
          setLoadingQuote(false);
        }
      }
    }

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, []);

  const emojis = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 5 + 5}s`, // 5s to 10s
      animationDelay: `${Math.random() * 5}s`,
      fontSize: `${Math.random() * 1.5 + 2}rem`, // 2rem to 3.5rem
      opacity: Math.random() * 0.4 + 0.2, // 0.2 to 0.6
    }));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) return;

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email o contraseña incorrectos.');
      return;
    }

    setIsFlashing(true);

    // Dumbbell rain animation
    const duration = 3000;
    const end = Date.now() + duration;

    const dumbbell = confetti.shapeFromText({ text: '🏋️', scalar: 3 });

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        shapes: [dumbbell],
        scalar: 2,
        ticks: 200,
        gravity: 1.2,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        shapes: [dumbbell],
        scalar: 2,
        ticks: 200,
        gravity: 1.2,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    setTimeout(() => {
      navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center p-6 relative overflow-hidden">
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-violet-600 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Lluvia de emojis fija (CSS) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {emojis.map((emoji) => (
          <div
            key={emoji.id}
            className="absolute top-[-10%] animate-fall"
            style={{
              left: emoji.left,
              animationDuration: emoji.animationDuration,
              animationDelay: emoji.animationDelay,
              fontSize: emoji.fontSize,
              opacity: emoji.opacity,
            }}
          >
            🏋️
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[90%] max-w-[480px] mx-auto space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-violet-500">IRON JARVIS</h1>
          <p className="text-zinc-400 text-sm tracking-widest uppercase">Arquitecto Fitness con IA</p>
          {loadingQuote ? (
            <p className="text-zinc-500 text-base italic mt-4 text-center">...</p>
          ) : (
            <p className="text-white text-base italic mt-4 text-center">{quote}</p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
              placeholder="tony@stark.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!!error}
            className={`w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-colors mt-8 uppercase tracking-widest text-sm ${
              error ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Iniciar Protocolo
          </button>
          
          <div className="text-center mt-4">
            <Link to="/register" className="text-zinc-400 hover:text-white text-sm transition-colors">
              ¿Primera vez? Crear cuenta
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
