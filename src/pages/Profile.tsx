import { useState } from 'react';
import { useStore, Goal, ExperienceLevel } from '../store';
import { LogOut, Save, User, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export function Profile() {
  const user = useStore((state) => state.user);
  const weightLogs = useStore((state) => state.weightLogs);
  const updateUser = useStore((state) => state.updateUser);
  const addWeightLog = useStore((state) => state.addWeightLog);
  const logout = useStore((state) => state.logout);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState<Goal>(user?.goal || 'hypertrophy');
  const [level, setLevel] = useState<ExperienceLevel>(user?.level || 'intermediate');
  const [newWeight, setNewWeight] = useState('');

  const handleSaveProfile = () => {
    updateUser({ name, goal, level });
    setIsEditing(false);
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    addWeightLog(parseFloat(newWeight));
    updateUser({ weight: parseFloat(newWeight) });
    setNewWeight('');
  };

  const chartData = weightLogs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({
      ...log,
      formattedDate: format(parseISO(log.date), 'MMM d'),
    }));

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Perfil</h1>
        <button onClick={logout} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/30 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-zinc-400 text-sm">{user?.email}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Objetivo</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
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
                onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <Save className="w-4 h-4" /> Guardar Cambios
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Objetivo</p>
              <p className="text-white font-medium capitalize">{
                user?.goal === 'hypertrophy' ? 'Hipertrofia' :
                user?.goal === 'strength' ? 'Fuerza' :
                user?.goal === 'fat_loss' ? 'Pérdida de Grasa' : 
                user?.goal === 'other' ? 'Otro' : user?.goal
              }</p>
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nivel</p>
              <p className="text-white font-medium capitalize">{
                user?.level === 'beginner' ? 'Principiante' :
                user?.level === 'intermediate' ? 'Intermedio' :
                user?.level === 'advanced' ? 'Avanzado' : user?.level
              }</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="col-span-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors uppercase tracking-widest text-sm"
            >
              Editar Perfil
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Inteligencia de Peso</h2>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Peso Actual</p>
              <p className="text-3xl font-mono text-white">{user?.weight} kg</p>
            </div>
            <Activity className="w-8 h-8 text-violet-500" />
          </div>

          <form onSubmit={handleAddWeight} className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Registrar nuevo peso..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 rounded-xl transition-colors uppercase tracking-widest text-sm"
            >
              Registrar
            </button>
          </form>

          {chartData.length > 0 && (
            <div className="h-48 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="formattedDate" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
