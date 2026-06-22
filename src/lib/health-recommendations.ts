export interface MeasurementLite {
  imc: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  visceral_fat: number | null;
  weight_kg: number;
  created_at: string;
}

export function autoRecommendations(latest: MeasurementLite, prev?: MeasurementLite | null): string[] {
  const recs: string[] = [];
  if (latest.imc !== null) {
    if (latest.imc >= 30) recs.push("IMC en rango de obesidad. Se recomienda iniciar un programa de reducción de grasa corporal con seguimiento profesional.");
    else if (latest.imc >= 25) recs.push("IMC en sobrepeso. Prioriza déficit calórico moderado y actividad cardiovascular regular.");
    else if (latest.imc < 18.5) recs.push("IMC por debajo del rango saludable. Considera aumentar tu ingesta calórica con alimentos nutritivos.");
  }
  if (latest.body_fat_pct !== null && latest.body_fat_pct > 25) {
    recs.push("Porcentaje de grasa corporal elevado. Prioriza déficit calórico y actividad cardiovascular.");
  }
  if (latest.muscle_mass_kg !== null && latest.weight_kg > 0 && latest.muscle_mass_kg / latest.weight_kg < 0.3) {
    recs.push("Masa muscular baja. Incrementa el entrenamiento de fuerza progresivo.");
  }
  if (latest.visceral_fat !== null && latest.visceral_fat > 12) {
    recs.push("Grasa visceral elevada. Reduce azúcares simples y aumenta el ejercicio aeróbico.");
  }
  if (prev && latest.weight_kg < prev.weight_kg) {
    recs.push("Excelente progreso en peso respecto a la medición anterior.");
  }
  if (prev && latest.muscle_mass_kg !== null && prev.muscle_mass_kg !== null && latest.muscle_mass_kg > prev.muscle_mass_kg) {
    recs.push("Buen avance: tu masa muscular aumentó respecto a la medición anterior.");
  }
  if (recs.length === 0) recs.push("Mantén tu rutina actual y registra mediciones periódicas para seguir tu evolución.");
  return recs;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  high: "Alto",
  very_high: "Muy alto",
};

export const GOAL_LABEL: Record<string, string> = {
  lose_fat: "Bajar grasa corporal",
  gain_muscle: "Ganar masa muscular",
  maintain: "Mantención",
  performance: "Mejorar rendimiento deportivo",
  other: "Otro",
};
