import { useState } from 'react';
import { useStore } from '../store';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Flame, Dumbbell } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const routines = useStore((state) => state.routines);
  const workoutLogs = useStore((state) => state.workoutLogs);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = 'MMMM yyyy';
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Quick Stats
  const startOfCurrentWeek = startOfWeek(new Date());
  const endOfCurrentWeek = endOfWeek(new Date());
  const workoutsThisWeek = workoutLogs.filter((w) => {
    const d = parseISO(w.startedAt);
    return d >= startOfCurrentWeek && d <= endOfCurrentWeek && w.finishedAt;
  });
  const volumeThisWeek = workoutsThisWeek.reduce((acc, w) => acc + w.totalVolume, 0);

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Calendario</h1>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 bg-zinc-900 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest w-32 text-center">
            {format(currentDate, dateFormat)}
          </span>
          <button onClick={nextMonth} className="p-2 bg-zinc-900 rounded-full border border-zinc-800 hover:bg-zinc-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);

            // Check if trained
            const trainedLog = workoutLogs.find((w) => isSameDay(parseISO(w.startedAt), day) && w.finishedAt);
            const isTrained = !!trainedLog;

            // Check if scheduled
            const dayOfWeek = day.getDay();
            const scheduledRoutine = routines.find((r) => r.assignedDays.includes(dayOfWeek));
            const isScheduled = !!scheduledRoutine && day >= new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "bg-zinc-800 border border-zinc-700",
                  isToday && !isSelected && "bg-violet-500/10 border border-violet-500/30 text-violet-400",
                  !isSelected && !isToday && "hover:bg-zinc-800/50"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isToday ? "text-violet-400 font-bold" : "text-zinc-300"
                )}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-1 mt-1 absolute bottom-2">
                  {isTrained && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {!isTrained && isScheduled && <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Dumbbell className="w-6 h-6 text-violet-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">{workoutsThisWeek.length} / 4</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sesiones</p>
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-emerald-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">{volumeThisWeek.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Vol (kg)</p>
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <div className="text-center">
            <p className="text-xl font-bold text-white">12</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Racha</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
          {isSameDay(selectedDate, new Date()) ? "Detalle de Hoy" : format(selectedDate, 'd MMM, yyyy')}
        </h2>
        
        {(() => {
          const trainedLog = workoutLogs.find((w) => isSameDay(parseISO(w.startedAt), selectedDate) && w.finishedAt);
          const dayOfWeek = selectedDate.getDay();
          const scheduledRoutine = routines.find((r) => r.assignedDays.includes(dayOfWeek));

          if (trainedLog) {
            const routine = routines.find(r => r.id === trainedLog.routineId);
            return (
              <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Completado</span>
                </div>
                <h3 className="text-lg font-bold text-white">{routine?.name || 'Sesión Libre'}</h3>
                <p className="text-zinc-400 text-sm">Volumen: {trainedLog.totalVolume} kg</p>
              </div>
            );
          }

          if (scheduledRoutine && selectedDate >= new Date(new Date().setHours(0, 0, 0, 0))) {
            return (
              <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-violet-500 mb-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Programado</span>
                </div>
                <h3 className="text-lg font-bold text-white">{scheduledRoutine.name}</h3>
                <p className="text-zinc-400 text-sm">{scheduledRoutine.exercises.length} ejercicios</p>
              </div>
            );
          }

          return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-zinc-500 text-sm">Sin actividad o rutina programada.</p>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
