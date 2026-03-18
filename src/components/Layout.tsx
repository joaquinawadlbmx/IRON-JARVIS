import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, Dumbbell, TrendingUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/calendar', icon: Calendar, label: 'Calendario' },
  { path: '/workout', icon: Dumbbell, label: 'Entrenar' },
  { path: '/progress', icon: TrendingUp, label: 'Progreso' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full bg-zinc-950 border-t border-white/10 px-6 py-3 pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
                  isActive ? "text-violet-500" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
