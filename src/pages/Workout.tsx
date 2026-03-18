import { useState } from 'react';
import { useStore, Routine, Exercise } from '../store';
import { Play, Plus, Dumbbell, X, Check, Edit2, Trash2, GripVertical, Youtube } from 'lucide-react';
import { Drawer } from 'vaul';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_COLORS = {
  push: 'text-violet-500 bg-violet-500/10 border-violet-500/30',
  pull: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  legs: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  isolation: 'text-zinc-400 bg-zinc-800 border-zinc-700',
};

// --- Sortable Item Component ---
function SortableExerciseItem({
  id,
  exercise,
  routineExercise,
  onEdit,
  onDelete,
}: {
  id: string;
  exercise: Exercise;
  routineExercise: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-white">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", CATEGORY_COLORS[exercise.category])}>
        <Dumbbell className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-white text-sm">{exercise.name}</h4>
        <p className="text-xs text-zinc-500">
          {routineExercise.setsTarget} x {routineExercise.repsMin}-{routineExercise.repsMax} @ RIR {routineExercise.rirTarget}
        </p>
        <a 
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`como hacer ${exercise.name} correctamente técnica gimnasio`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7C3AED] hover:text-violet-400 text-xs mt-1 inline-flex items-center gap-1"
        >
          ▶ Cómo hacer este ejercicio
        </a>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Workout() {
  const [view, setView] = useState<'list' | 'builder' | 'active' | 'summary'>('list');
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [activeWorkoutLogId, setActiveWorkoutLogId] = useState<string | null>(null);

  const routines = useStore((state) => state.routines);
  const exercises = useStore((state) => state.exercises);
  const startWorkout = useStore((state) => state.startWorkout);
  const finishWorkout = useStore((state) => state.finishWorkout);

  // --- Routine Builder State ---
  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [isExerciseDrawerOpen, setIsExerciseDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  const createRoutine = useStore((state) => state.createRoutine);
  const updateRoutine = useStore((state) => state.updateRoutine);
  const deleteRoutine = useStore((state) => state.deleteRoutine);

  // --- Active Session State ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isSetDrawerOpen, setIsSetDrawerOpen] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [currentRir, setCurrentRir] = useState('2');

  const logSet = useStore((state) => state.logSet);
  const setLogs = useStore((state) => state.setLogs);
  const workoutLogs = useStore((state) => state.workoutLogs);

  const [showPrFlash, setShowPrFlash] = useState(false);

  // --- Handlers ---
  const handleStartWorkout = (routineId: string | null) => {
    const logId = startWorkout(routineId);
    setActiveRoutineId(routineId);
    setActiveWorkoutLogId(logId);
    setCurrentExerciseIndex(0);
    setView('active');
  };

  const handleFinishWorkout = () => {
    if (activeWorkoutLogId) {
      finishWorkout(activeWorkoutLogId);
      setView('summary');
    }
  };

  const handleSaveRoutine = () => {
    if (editingRoutine && editingRoutine.name) {
      if (editingRoutine.id) {
        updateRoutine(editingRoutine.id, editingRoutine as Routine);
      } else {
        createRoutine(editingRoutine as Omit<Routine, 'id'>);
      }
      setView('list');
      setEditingRoutine(null);
    }
  };

  const handleAddExerciseToRoutine = (exerciseId: string) => {
    if (!editingRoutine) return;
    const newEx = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId,
      orderIndex: editingRoutine.exercises?.length || 0,
      setsTarget: 4,
      repsMin: 8,
      repsMax: 12,
      rirTarget: 2,
      notes: '',
    };
    setEditingRoutine({
      ...editingRoutine,
      exercises: [...(editingRoutine.exercises || []), newEx],
    });
    setIsExerciseDrawerOpen(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && editingRoutine?.exercises) {
      const oldIndex = editingRoutine.exercises.findIndex((e) => e.id === active.id);
      const newIndex = editingRoutine.exercises.findIndex((e) => e.id === over.id);
      setEditingRoutine({
        ...editingRoutine,
        exercises: arrayMove(editingRoutine.exercises, oldIndex, newIndex).map((e, i) => ({ ...e, orderIndex: i })),
      });
    }
  };

  // --- Renderers ---
  if (view === 'list') {
    return (
      <div className="p-6 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">Rutinas</h1>
          <button
            onClick={() => {
              setEditingRoutine({ name: '', assignedDays: [], exercises: [] });
              setView('builder');
            }}
            className="p-2 bg-violet-600 rounded-full hover:bg-violet-500 transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </header>

        <div className="space-y-4">
          {routines.map((routine) => (
            <div key={routine.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{routine.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingRoutine(routine);
                      setView('builder');
                    }}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-zinc-400 text-sm">{routine.exercises.length} ejercicios</p>
              <div className="flex gap-1">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      routine.assignedDays.includes(i) ? "bg-violet-500 text-white" : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleStartWorkout(routine.id)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar
              </button>
            </div>
          ))}
          {routines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-sm">Aún no has creado rutinas.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'builder' && editingRoutine) {
    const filteredExercises = exercises.filter(
      (e) =>
        (selectedCategory === 'all' || e.category === selectedCategory) &&
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="p-6 space-y-6 pb-32">
        <header className="flex items-center justify-between">
          <button onClick={() => setView('list')} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">
            {editingRoutine.id ? 'Editar Rutina' : 'Nueva Rutina'}
          </h1>
          <button onClick={handleSaveRoutine} className="text-violet-500 font-bold uppercase text-sm tracking-widest">
            Guardar
          </button>
        </header>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nombre de la Rutina</label>
            <input
              type="text"
              value={editingRoutine.name}
              onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="ej. Día de Empuje A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Días Asignados</label>
            <div className="flex gap-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => {
                const isSelected = editingRoutine.assignedDays?.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const days = editingRoutine.assignedDays || [];
                      setEditingRoutine({
                        ...editingRoutine,
                        assignedDays: isSelected ? days.filter((d) => d !== i) : [...days, i],
                      });
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                      isSelected ? "bg-violet-500 text-white" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Ejercicios</h2>
            <Drawer.Root open={isExerciseDrawerOpen} onOpenChange={setIsExerciseDrawerOpen}>
              <Drawer.Trigger asChild>
                <button className="text-violet-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/80 z-50" />
                <Drawer.Content className="bg-zinc-950 flex flex-col rounded-t-3xl h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800">
                  <div className="p-4 bg-zinc-950 rounded-t-3xl flex-1 overflow-y-auto">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-8" />
                    <h2 className="text-xl font-bold text-white mb-4">Biblioteca de Ejercicios</h2>
                    
                    <input
                      type="text"
                      placeholder="Buscar ejercicios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors mb-4"
                    />

                    <div className="flex flex-wrap gap-2 mb-6">
                      {['all', 'push', 'pull', 'legs', 'isolation'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap",
                            selectedCategory === cat ? "bg-violet-500 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {filteredExercises.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => handleAddExerciseToRoutine(ex.id)}
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
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={editingRoutine.exercises?.map((e) => e.id) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {editingRoutine.exercises?.map((routineEx) => {
                  const exercise = exercises.find((e) => e.id === routineEx.exerciseId);
                  if (!exercise) return null;
                  return (
                    <SortableExerciseItem
                      key={routineEx.id}
                      id={routineEx.id}
                      exercise={exercise}
                      routineExercise={routineEx}
                      onEdit={() => {}} // TODO: Edit prescription
                      onDelete={() => {
                        setEditingRoutine({
                          ...editingRoutine,
                          exercises: editingRoutine.exercises?.filter((e) => e.id !== routineEx.id),
                        });
                      }}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    );
  }

  if (view === 'active' && activeWorkoutLogId) {
    const activeRoutine = routines.find((r) => r.id === activeRoutineId);
    const routineExercises = activeRoutine?.exercises || [];
    const currentRoutineEx = routineExercises[currentExerciseIndex];
    const exercise = currentRoutineEx ? exercises.find((e) => e.id === currentRoutineEx.exerciseId) : null;

    const currentSets = setLogs.filter(
      (s) => s.workoutLogId === activeWorkoutLogId && s.exerciseId === exercise?.id
    );

    // Find last time
    const previousSets = setLogs.filter((s) => s.exerciseId === exercise?.id && s.workoutLogId !== activeWorkoutLogId);
    const lastTimeSet = previousSets.length > 0 ? previousSets[previousSets.length - 1] : null;

    const handleSaveSet = () => {
      if (!currentWeight || !currentReps || !exercise) return;
      
      const weightNum = parseFloat(currentWeight);
      const repsNum = parseInt(currentReps, 10);
      const rirNum = parseInt(currentRir, 10);

      logSet({
        workoutLogId: activeWorkoutLogId,
        exerciseId: exercise.id,
        weight: weightNum,
        reps: repsNum,
        rir: rirNum,
        setNumber: currentSets.length + 1,
      });

      // Check PR for animation
      const maxWeight = previousSets.length > 0 ? Math.max(...previousSets.map(s => s.weight)) : 0;
      if (weightNum > maxWeight && weightNum > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#ffffff']
        });
        setShowPrFlash(true);
        setTimeout(() => setShowPrFlash(false), 1000);
      }

      setIsSetDrawerOpen(false);
      setCurrentWeight('');
      setCurrentReps('');
    };

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {showPrFlash && (
          <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_100px_rgba(124,58,237,0.8)] animate-pulse" />
        )}
        <header className="p-6 flex items-center justify-between border-b border-zinc-900">
          <button onClick={() => setView('list')} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-xs font-bold text-violet-500 uppercase tracking-widest">Sesión Activa</h2>
            <p className="text-white text-sm font-medium">{activeRoutine?.name || 'Libre'}</p>
          </div>
          <button onClick={handleFinishWorkout} className="text-emerald-500 font-bold uppercase text-sm tracking-widest">
            Terminar
          </button>
        </header>

        {exercise ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider", CATEGORY_COLORS[exercise.category])}>
                  {exercise.category}
                </div>
                <span className="text-zinc-500 text-xs font-mono">
                  {currentExerciseIndex + 1} / {routineExercises.length}
                </span>
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                {exercise.name}
              </h1>
              <a 
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`como hacer ${exercise.name} correctamente técnica gimnasio`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7C3AED] hover:text-violet-400 text-sm font-medium inline-flex items-center gap-1 mt-1"
              >
                ▶ Ver técnica en YouTube
              </a>
              <p className="text-violet-400 font-mono text-lg">
                {currentRoutineEx.setsTarget} x {currentRoutineEx.repsMin}-{currentRoutineEx.repsMax}
              </p>
            </div>

            {lastTimeSet && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 inline-flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Última Vez</span>
                <span className="text-white font-mono text-sm">{lastTimeSet.weight}kg x {lastTimeSet.reps}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <div>Serie</div>
                <div>kg</div>
                <div>Reps</div>
                <div>RIR</div>
              </div>
              
              {currentSets.map((set, i) => (
                <div key={set.id} className="grid grid-cols-4 gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 items-center">
                  <div className="text-zinc-400 font-mono">{i + 1}</div>
                  <div className="text-white font-mono text-lg">{set.weight}</div>
                  <div className="text-white font-mono text-lg">{set.reps}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 font-mono">{set.rir}</span>
                    <Check className="w-4 h-4 text-violet-500 ml-auto" />
                  </div>
                </div>
              ))}

              <Drawer.Root open={isSetDrawerOpen} onOpenChange={setIsSetDrawerOpen}>
                <Drawer.Trigger asChild>
                  <button 
                    className="w-full bg-zinc-900 border border-dashed border-zinc-700 hover:border-violet-500 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm mt-4"
                    onClick={() => {
                      if (lastTimeSet && !currentWeight) setCurrentWeight(lastTimeSet.weight.toString());
                    }}
                  >
                    <Plus className="w-4 h-4" /> Registrar Serie {currentSets.length + 1}
                  </button>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 bg-black/80 z-50" />
                  <Drawer.Content className="bg-zinc-950 flex flex-col rounded-t-3xl h-auto fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 pb-safe">
                    <div className="p-6 bg-zinc-950 rounded-t-3xl space-y-6">
                      <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-2" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Peso (kg)</label>
                          <input
                            type="number"
                            value={currentWeight}
                            onChange={(e) => setCurrentWeight(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-6 text-center text-3xl font-mono text-white focus:outline-none focus:border-violet-500 transition-colors"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Reps</label>
                          <input
                            type="number"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-6 text-center text-3xl font-mono text-white focus:outline-none focus:border-violet-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">RIR (Reps en Reserva)</label>
                        <div className="flex gap-2">
                          {['0', '1', '2', '3', '4'].map((rir) => (
                            <button
                              key={rir}
                              onClick={() => setCurrentRir(rir)}
                              className={cn(
                                "flex-1 py-3 rounded-xl font-mono text-lg transition-colors border",
                                currentRir === rir 
                                  ? "bg-violet-500 text-white border-violet-500" 
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800"
                              )}
                            >
                              {rir}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSaveSet}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-2xl transition-colors uppercase tracking-widest text-lg"
                      >
                        Guardar Serie
                      </button>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            No se encontraron ejercicios.
          </div>
        )}

        <div className="p-6 border-t border-zinc-900 bg-black">
          <button
            onClick={() => {
              if (currentExerciseIndex < routineExercises.length - 1) {
                setCurrentExerciseIndex(prev => prev + 1);
              } else {
                handleFinishWorkout();
              }
            }}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
          >
            {currentExerciseIndex < routineExercises.length - 1 ? 'Siguiente Ejercicio' : 'Terminar Entrenamiento'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'summary' && activeWorkoutLogId) {
    const log = workoutLogs.find(w => w.id === activeWorkoutLogId);
    const sets = setLogs.filter(s => s.workoutLogId === activeWorkoutLogId);
    const prs = sets.filter(s => s.isPr).length;

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Entrenamiento Completado</h1>
          <p className="text-zinc-400">Protocolo ejecutado con éxito.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
            <p className="text-3xl font-mono text-white mb-1">{log?.totalVolume.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vol Total (kg)</p>
          </div>
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 text-center">
            <p className="text-3xl font-mono text-violet-500 mb-1">{prs}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nuevos PRs</p>
          </div>
        </div>

        <button
          onClick={() => {
            setView('list');
            setActiveWorkoutLogId(null);
            setActiveRoutineId(null);
          }}
          className="w-full max-w-sm bg-white text-black font-black py-4 rounded-xl transition-colors uppercase tracking-widest text-sm"
        >
          Volver a la Base
        </button>
      </div>
    );
  }

  return null;
}
