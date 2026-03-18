import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, isSameDay } from 'date-fns';

export type Goal = 'hypertrophy' | 'strength' | 'fat_loss' | 'other';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Category = 'push' | 'pull' | 'legs' | 'isolation';

export interface UserProfile {
  name: string;
  email: string;
  password?: string;
  weight: number;
  height: number;
  goal: Goal;
  level: ExperienceLevel;
  avatarUrl?: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string; // ISO string
}

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  instructions: string;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  orderIndex: number;
  setsTarget: number;
  repsMin: number;
  repsMax: number;
  rirTarget: number;
  notes: string;
}

export interface Routine {
  id: string;
  name: string;
  assignedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  exercises: RoutineExercise[];
  is_ai_generated?: boolean;
}

export interface SetLog {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  rir: number;
  setNumber: number;
  isPr: boolean;
}

export interface WorkoutLog {
  id: string;
  routineId: string | null; // null if freestyle
  startedAt: string; // ISO string
  finishedAt: string | null; // ISO string
  totalVolume: number;
}

interface AppState {
  user: UserProfile | null;
  users: UserProfile[];
  weightLogs: WeightLog[];
  exercises: Exercise[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  setLogs: SetLog[];

  // Actions
  login: (user: UserProfile) => void;
  register: (user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  addWeightLog: (weight: number, date?: string) => void;
  addExercise: (exercise: Omit<Exercise, 'id'>) => string;
  
  createRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  
  startWorkout: (routineId: string | null) => string; // Returns workoutLogId
  finishWorkout: (workoutLogId: string) => void;
  
  logSet: (set: Omit<SetLog, 'id' | 'isPr'>) => void;
  updateSet: (setId: string, updates: Partial<SetLog>) => void;
  deleteSet: (setId: string) => void;
}

const INITIAL_EXERCISES: Exercise[] = [
  // Push
  { id: 'e1', name: 'Press de Banca con Barra', category: 'push', instructions: 'Mantén la espalda firme y empuja la barra hacia arriba.' },
  { id: 'e2', name: 'Press Militar', category: 'push', instructions: 'Empuja la barra sobre la cabeza sin usar las piernas.' },
  { id: 'e3', name: 'Fondos', category: 'push', instructions: 'Baja tu cuerpo hasta que tus hombros estén por debajo de tus codos.' },
  { id: 'e4', name: 'Press Inclinado con Mancuernas', category: 'push', instructions: 'Empuja las mancuernas en un banco inclinado a 30-45 grados.' },
  { id: 'e5', name: 'Flexiones', category: 'push', instructions: 'Mantén tu cuerpo en línea recta y baja hasta que tu pecho toque el suelo.' },
  // Pull
  { id: 'e6', name: 'Dominadas', category: 'pull', instructions: 'Tira de tu cuerpo hacia arriba hasta que tu barbilla pase la barra.' },
  { id: 'e7', name: 'Remo con Barra', category: 'pull', instructions: 'Inclínate desde las caderas y tira de la barra hacia tu estómago.' },
  { id: 'e8', name: 'Face Pull', category: 'pull', instructions: 'Tira de la cuerda hacia tu cara, manteniendo los codos altos.' },
  { id: 'e9', name: 'Jalón al Pecho', category: 'pull', instructions: 'Tira de la barra hacia abajo hasta la parte superior de tu pecho.' },
  { id: 'e10', name: 'Remo con Mancuerna', category: 'pull', instructions: 'Apóyate en un banco y tira de la mancuerna hacia arriba.' },
  // Legs
  { id: 'e11', name: 'Sentadilla con Barra', category: 'legs', instructions: 'Baja hasta que tus caderas estén por debajo de tus rodillas.' },
  { id: 'e12', name: 'Peso Muerto', category: 'legs', instructions: 'Levanta la barra del suelo extendiendo caderas y rodillas.' },
  { id: 'e13', name: 'Prensa de Piernas', category: 'legs', instructions: 'Empuja la plataforma alejándola con tus piernas.' },
  { id: 'e14', name: 'Peso Muerto Rumano', category: 'legs', instructions: 'Inclínate desde las caderas manteniendo las rodillas ligeramente flexionadas.' },
  { id: 'e15', name: 'Sentadilla Búlgara', category: 'legs', instructions: 'Haz una sentadilla con una pierna elevada detrás de ti.' },
  // Isolation
  { id: 'e16', name: 'Curl de Bíceps', category: 'isolation', instructions: 'Sube el peso flexionando los brazos, manteniendo los codos fijos.' },
  { id: 'e17', name: 'Extensión de Tríceps', category: 'isolation', instructions: 'Extiende tus brazos para empujar el peso hacia abajo o hacia arriba.' },
  { id: 'e18', name: 'Elevaciones Laterales', category: 'isolation', instructions: 'Levanta las mancuernas hacia los lados hasta que los brazos estén paralelos al suelo.' },
  { id: 'e19', name: 'Elevación de Gemelos', category: 'isolation', instructions: 'Levanta los talones del suelo.' },
  { id: 'e20', name: 'Extensión de Piernas', category: 'isolation', instructions: 'Extiende tus piernas contra la resistencia.' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      weightLogs: [],
      exercises: INITIAL_EXERCISES,
      routines: [],
      workoutLogs: [],
      setLogs: [],

      login: (user) => set({ user }),
      register: (user) => set((state) => ({ users: [...state.users, user], user })),
      logout: () => set({ user: null, weightLogs: [], routines: [], workoutLogs: [], setLogs: [] }),
      
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),

      addWeightLog: (weight, date = new Date().toISOString()) => set((state) => ({
        weightLogs: [...state.weightLogs, { id: uuidv4(), weight, date }]
      })),

      addExercise: (exercise) => {
        const id = uuidv4();
        set((state) => ({
          exercises: [...state.exercises, { ...exercise, id }]
        }));
        return id;
      },

      createRoutine: (routine) => set((state) => ({
        routines: [...state.routines, { ...routine, id: uuidv4() }]
      })),

      updateRoutine: (id, updates) => set((state) => ({
        routines: state.routines.map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      deleteRoutine: (id) => set((state) => ({
        routines: state.routines.filter(r => r.id !== id)
      })),

      startWorkout: (routineId) => {
        const id = uuidv4();
        set((state) => ({
          workoutLogs: [...state.workoutLogs, {
            id,
            routineId,
            startedAt: new Date().toISOString(),
            finishedAt: null,
            totalVolume: 0
          }]
        }));
        return id;
      },

      finishWorkout: (workoutLogId) => set((state) => {
        const sets = state.setLogs.filter(s => s.workoutLogId === workoutLogId);
        const totalVolume = sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
        
        return {
          workoutLogs: state.workoutLogs.map(w => 
            w.id === workoutLogId 
              ? { ...w, finishedAt: new Date().toISOString(), totalVolume } 
              : w
          )
        };
      }),

      logSet: (newSet) => set((state) => {
        // Check for PR
        const previousSets = state.setLogs.filter(s => s.exerciseId === newSet.exerciseId);
        const maxWeight = previousSets.length > 0 ? Math.max(...previousSets.map(s => s.weight)) : 0;
        const isPr = newSet.weight > maxWeight && newSet.weight > 0;

        return {
          setLogs: [...state.setLogs, { ...newSet, id: uuidv4(), isPr }]
        };
      }),

      updateSet: (setId, updates) => set((state) => {
        const updatedSets = state.setLogs.map(s => s.id === setId ? { ...s, ...updates } : s);
        // Re-evaluate PRs for this exercise if weight changed
        const setBeingUpdated = state.setLogs.find(s => s.id === setId);
        if (updates.weight !== undefined && setBeingUpdated) {
           // Simplified PR re-evaluation: just mark this one if it's the new max
           const exerciseSets = updatedSets.filter(s => s.exerciseId === setBeingUpdated.exerciseId);
           const maxWeight = Math.max(...exerciseSets.map(s => s.weight));
           return {
             setLogs: updatedSets.map(s => 
               s.exerciseId === setBeingUpdated.exerciseId 
                 ? { ...s, isPr: s.weight === maxWeight && s.weight > 0 }
                 : s
             )
           };
        }
        return { setLogs: updatedSets };
      }),

      deleteSet: (setId) => set((state) => ({
        setLogs: state.setLogs.filter(s => s.id !== setId)
      })),
    }),
    {
      name: 'iron-jarvis-storage',
    }
  )
);
