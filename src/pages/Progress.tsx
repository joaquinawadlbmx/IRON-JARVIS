import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Search, Dumbbell, TrendingUp, Youtube } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_COLORS = {
  push: 'text-violet-500 bg-violet-500/10 border-violet-500/30',
  pull: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  legs: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  isolation: 'text-zinc-400 bg-zinc-800 border-zinc-700',
};

export function Progress() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const exercises = useStore((state) => state.exercises);
  const setLogs = useStore((state) => state.setLogs);
  const workoutLogs = useStore((state) => state.workoutLogs);

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];

    const exerciseSets = setLogs.filter((s) => s.exerciseId === selectedExerciseId);
    if (exerciseSets.length === 0) return [];

    // Group by workoutLogId to find max weight per session
    const sessionMaxes = new Map<string, { weight: number; date: string }>();

    exerciseSets.forEach((set) => {
      const workout = workoutLogs.find((w) => w.id === set.workoutLogId);
      if (!workout || !workout.finishedAt) return;

      const currentMax = sessionMaxes.get(workout.id)?.weight || 0;
      if (set.weight > currentMax) {
        sessionMaxes.set(workout.id, {
          weight: set.weight,
          date: format(parseISO(workout.startedAt), 'MMM d'),
        });
      }
    });

    return Array.from(sessionMaxes.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [selectedExerciseId, setLogs, workoutLogs]);

  const historyTableData = useMemo(() => {
    if (!selectedExerciseId) return [];

    const exerciseSets = setLogs.filter((s) => s.exerciseId === selectedExerciseId);
    
    // Group by workout
    const history = new Map<string, any>();
    
    exerciseSets.forEach(set => {
      const workout = workoutLogs.find(w => w.id === set.workoutLogId);
      if (!workout || !workout.finishedAt) return;
      
      if (!history.has(workout.id)) {
        history.set(workout.id, {
          id: workout.id,
          date: workout.startedAt,
          sets: []
        });
      }
      
      history.get(workout.id).sets.push(set);
    });

    return Array.from(history.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedExerciseId, setLogs, workoutLogs]);

  return (
    <div className="p-6 space-y-8 pb-32">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Progreso</h1>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {!selectedExerciseId ? (
        <div className="space-y-2">
          {filteredExercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExerciseId(ex.id)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:border-violet-500 transition-colors text-left"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", CATEGORY_COLORS[ex.category])}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{ex.category}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <button
            onClick={() => setSelectedExerciseId(null)}
            className="text-xs font-bold text-violet-500 uppercase tracking-widest"
          >
            ← Volver a Buscar
          </button>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider", CATEGORY_COLORS[selectedExercise?.category || 'push'])}>
                {selectedExercise?.category}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                {selectedExercise?.name}
              </h2>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`como hacer ${selectedExercise?.name} correctamente técnica gimnasio`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#7C3AED] hover:text-violet-400 text-sm font-medium"
              >
                <Youtube className="w-5 h-5" />
                Ver técnica
              </a>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="space-y-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={30} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                      labelStyle={{ color: '#a1a1aa', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Historial</h3>
                <div className="space-y-4">
                  {historyTableData.map((session) => (
                    <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">
                        {format(parseISO(session.date), 'd MMM, yyyy')}
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <div>Serie</div>
                        <div>kg</div>
                        <div>Reps</div>
                        <div>RIR</div>
                      </div>
                      {session.sets.map((set: any, i: number) => (
                        <div key={set.id} className="grid grid-cols-4 gap-2 items-center">
                          <div className="text-zinc-400 font-mono">{i + 1}</div>
                          <div className="text-white font-mono text-sm">{set.weight}</div>
                          <div className="text-white font-mono text-sm">{set.reps}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 font-mono">{set.rir}</span>
                            {set.isPr && <TrendingUp className="w-3 h-3 text-violet-500 ml-auto" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
              <Dumbbell className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-zinc-500 text-sm">No se encontró historial para este ejercicio.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
