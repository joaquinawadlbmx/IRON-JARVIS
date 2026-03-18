import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Play, Activity, Flame, Trophy } from 'lucide-react';
import { AIGenerator } from '../components/AIGenerator';

export function Home() {
  const user = useStore((state) => state.user);
  const routines = useStore((state) => state.routines);
  const workoutLogs = useStore((state) => state.workoutLogs);
  const navigate = useNavigate();

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const todayRoutine = routines.find((r) => r.assignedDays.includes(currentDayOfWeek));

  const recentWorkouts = workoutLogs
    .filter((w) => w.finishedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3);

  const currentStreak = workoutLogs.length > 0 ? 12 : 0; // Mock streak for MVP

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bienvenido, <span className="text-violet-500">{user?.name}</span>
          </h1>
          <p className="text-zinc-400 text-sm">Protocolo listo para ejecución.</p>
        </div>
        <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
          <span className="text-lg font-bold text-white">
            {user?.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </header>

      <AIGenerator />

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">{currentStreak}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Racha (Días)</p>
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-violet-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">{workoutLogs.length}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Entrenamientos</p>
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">
              {Math.round(workoutLogs.reduce((acc, w) => acc + w.totalVolume, 0) / 1000)}k
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Vol (kg)</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Protocolo de Hoy</h2>
        {todayRoutine ? (
          <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white">{todayRoutine.name}</h3>
              <p className="text-zinc-400 text-sm">{todayRoutine.exercises.length} ejercicios programados</p>
            </div>
            <button
              onClick={() => navigate('/workout')}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm relative z-10"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Entrenamiento
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center space-y-4">
            <p className="text-zinc-400">Día de descanso o sesión libre.</p>
            <button
              onClick={() => navigate('/workout')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-widest text-sm"
            >
              Iniciar Sesión Libre
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Actividad Reciente</h2>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout) => {
              const routine = routines.find((r) => r.id === workout.routineId);
              return (
                <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{routine?.name || 'Entrenamiento Libre'}</h4>
                    <p className="text-xs text-zinc-500">{format(parseISO(workout.startedAt), 'd MMM, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-violet-400">{workout.totalVolume} kg</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Volumen</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm text-center py-8">No se encontró actividad reciente.</p>
        )}
      </section>
    </div>
  );
}
