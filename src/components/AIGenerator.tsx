import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

export function AIGenerator() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [goal, setGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const user = useStore(state => state.user);
  const routines = useStore(state => state.routines);
  const createRoutine = useStore(state => state.createRoutine);
  const deleteRoutine = useStore(state => state.deleteRoutine);
  const exercises = useStore(state => state.exercises);
  const addExercise = useStore(state => state.addExercise);
  const navigate = useNavigate();

  const loadingMessages = [
    "Analizando tu objetivo...",
    "Diseñando tu rutina...",
    "Armando el calendario..."
  ];

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
    setError('');
  };

  const validateForm = () => {
    if (!goal.trim()) return "Por favor, describí tu objetivo.";
    if (!daysPerWeek) return "Elegí cuántos días por semana querés entrenar.";
    if (selectedDays.length !== daysPerWeek) {
      return `Seleccionaste ${selectedDays.length} días pero elegiste entrenar ${daysPerWeek} días por semana.`;
    }
    return null;
  };

  const checkExistingRoutines = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const hasConflict = routines.some(r => 
      r.assignedDays.some(d => selectedDays.includes(d))
    );

    if (hasConflict) {
      setShowConfirmModal(true);
    } else {
      generateRoutine();
    }
  };

  const generateRoutine = async () => {
    setShowConfirmModal(false);
    setIsGenerating(true);
    setError('');
    
    // Start loading text animation
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 3;
      setLoadingStep(step);
    }, 2000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const dayNames = selectedDays.map(id => {
        const day = DAYS_OF_WEEK.find(d => d.id === id);
        return day ? day.label : '';
      }).join(', ');

      const prompt = `Eres un entrenador personal experto en hipertrofia y fuerza. Basándote en el siguiente objetivo del usuario, generá una rutina de entrenamiento semanal estructurada.

Objetivo del usuario: ${goal}
Días de entrenamiento por semana: ${daysPerWeek}
Días elegidos: ${dayNames}
Equipamiento disponible: gimnasio completo con barras, mancuernas y máquinas

Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin explicaciones, sin markdown, sin comillas de código. El formato debe ser exactamente este:

{
  "routineName": "nombre de la rutina",
  "days": [
    {
      "dayName": "Lun",
      "focus": "Empuje - Pecho y Tríceps",
      "exercises": [
        {
          "name": "Press de Banca con Barra",
          "category": "push",
          "sets": 4,
          "repsMin": 6,
          "repsMax": 10,
          "rir": 2,
          "notes": "Bajar controlado, 2 segundos de descenso"
        }
      ]
    }
  ]
}

Cada día debe tener entre 4 y 7 ejercicios. Usá nombres de ejercicios en español. Las categorías válidas son: push, pull, legs, isolation. El RIR debe estar entre 1 y 3.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let jsonText = response.text || '';
      // Clean up potential markdown formatting if model didn't follow instructions perfectly
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const data = JSON.parse(jsonText);

      if (!data.routineName || !data.days || !Array.isArray(data.days)) {
        throw new Error("Invalid JSON structure");
      }

      // Delete conflicting routines if we are replacing
      const conflictingRoutines = routines.filter(r => 
        r.assignedDays.some(d => selectedDays.includes(d))
      );
      conflictingRoutines.forEach(r => deleteRoutine(r.id));

      // Process and save the new routines
      data.days.forEach((dayData: any, index: number) => {
        // Map dayName back to ID
        const dayMatch = DAYS_OF_WEEK.find(d => dayData.dayName.includes(d.label) || d.label.includes(dayData.dayName));
        const dayId = dayMatch ? dayMatch.id : selectedDays[index % selectedDays.length];

        const routineExercises = dayData.exercises.map((exData: any, exIndex: number) => {
          // Find or create exercise
          let exercise = exercises.find(e => e.name.toLowerCase() === exData.name.toLowerCase());
          let exerciseId = exercise?.id;
          
          if (!exerciseId) {
            exerciseId = addExercise({
              name: exData.name,
              category: exData.category as any || 'isolation',
              instructions: exData.notes || 'Sigue la técnica correcta.'
            });
          }

          return {
            id: uuidv4(),
            exerciseId,
            orderIndex: exIndex,
            setsTarget: exData.sets || 3,
            repsMin: exData.repsMin || 8,
            repsMax: exData.repsMax || 12,
            rirTarget: exData.rir || 2,
            notes: exData.notes || ''
          };
        });

        createRoutine({
          name: `${data.routineName} - ${dayData.focus || dayData.dayName}`,
          assignedDays: [dayId],
          exercises: routineExercises,
          is_ai_generated: true
        });
      });

      clearInterval(interval);
      setIsGenerating(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate('/calendar');
      }, 2000);

    } catch (err) {
      console.error("Error generating routine:", err);
      clearInterval(interval);
      setIsGenerating(false);
      setError("No pudimos generar tu rutina. Intentá ser más específico en tu descripción.");
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-violet-900/20 z-0 pointer-events-none animate-pulse"
          />
        )}
      </AnimatePresence>

      <div className="bg-zinc-900 border border-violet-500/30 rounded-2xl overflow-hidden relative z-10 transition-all duration-300">
        <div 
          className="p-5 flex items-center justify-between cursor-pointer"
          onClick={() => !isGenerating && !isSuccess && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-500">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-white font-bold flex items-center gap-2">
                Arquitecto IA <Sparkles size={14} className="text-violet-400" />
              </h2>
              <p className="text-zinc-400 text-xs">Describí tu objetivo y armamos tu rutina.</p>
            </div>
          </div>
          {!isGenerating && !isSuccess && (
            <div className="text-zinc-500">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && !isSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 pt-0 space-y-6 border-t border-zinc-800/50 mt-2">
                
                {/* Textarea */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    ¿Cuál es tu objetivo y cómo querés quedar?
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => {
                      setGoal(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Quiero ganar músculo en la parte superior del cuerpo, no tengo mucha experiencia y entreno en un gimnasio con barras y mancuernas..."
                    className="w-full bg-[#111111] border border-violet-600/40 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-600 transition-colors min-h-[100px] resize-y"
                    disabled={isGenerating}
                  />
                </div>

                {/* Days per week */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    ¿Cuántos días por semana querés entrenar?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => {
                          setDaysPerWeek(num);
                          if (error) setError('');
                        }}
                        disabled={isGenerating}
                        className={`w-12 h-12 rounded-xl font-bold transition-colors ${
                          daysPerWeek === num 
                            ? 'bg-violet-600 text-white' 
                            : 'bg-[#111111] border border-zinc-800 text-zinc-400 hover:border-violet-500/50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days of week */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    ¿Qué días querés entrenar?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.id}
                        onClick={() => handleDayToggle(day.id)}
                        disabled={isGenerating}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                          selectedDays.includes(day.id)
                            ? 'bg-violet-600 text-white'
                            : 'bg-[#111111] border border-zinc-800 text-zinc-400 hover:border-violet-500/50'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    {error}
                  </p>
                )}

                <button
                  onClick={checkExistingRoutines}
                  disabled={isGenerating || !goal.trim() || !daysPerWeek || selectedDays.length !== daysPerWeek}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${
                    isGenerating 
                      ? 'bg-violet-800 text-violet-200 cursor-wait' 
                      : (!goal.trim() || !daysPerWeek || selectedDays.length !== daysPerWeek)
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {isGenerating ? loadingMessages[loadingStep] : 'Generar Mi Rutina'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-500 mb-2">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white">¡Tu rutina está lista, {user?.name}!</h3>
              <p className="text-zinc-400">Redirigiendo al calendario...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full relative z-10 space-y-6"
            >
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-white">¿Reemplazar rutinas?</h3>
                <p className="text-zinc-400 text-sm">
                  Ya tenés rutinas asignadas en algunos de estos días. ¿Querés reemplazarlas?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateRoutine}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  Sí, reemplazar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
