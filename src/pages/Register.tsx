import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Goal, ExperienceLevel } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('hypertrophy');
  const [level, setLevel] = useState<ExperienceLevel>('intermediate');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword || !weight || !height) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    // Actualizar perfil con datos adicionales
    if (data.user) {
      await supabase.from('profiles').update({
        name,
        weight: parseFloat(weight),
        height: parseFloat(height),
        goal,
        level,
      }).eq('id', data.user.id);
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
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
              placeholder="Tony Stark"
              required
            />
          </div>

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

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
                placeholder="80"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-600 transition-colors"
                placeholder="180"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Objetivo</label>
            <select
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value as Goal);
                if (error) setError('');
              }}
              className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-600 transition-colors appearance-none"
            >
              <option value="hypertrophy">Hipertrofia</option>
              <option value="strength">Fuerza</option>
              <option value="fat_loss">Pérdida de Grasa</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nivel</label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as ExperienceLevel);
                if (error) setError('');
              }}
              className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-600 transition-colors appearance-none"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
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
            Crear Protocolo
          </button>
          
          <div className="text-center mt-4">
            <Link to="/login" className="text-zinc-400 hover:text-white text-sm transition-colors">
              ¿Ya tenés cuenta? Iniciar sesión
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
