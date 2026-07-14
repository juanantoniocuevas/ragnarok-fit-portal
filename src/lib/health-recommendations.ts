import { calcIMC } from "./measurements";

export interface MeasurementLite {
  weight_kg: number;
  height_cm: number | null;
  created_at: string;
}

export function autoRecommendations(latest: MeasurementLite, prev?: MeasurementLite | null): string[] {
  const recs: string[] = [];
  const imc = calcIMC(latest.weight_kg, latest.height_cm);
  if (imc !== null) {
    if (imc >= 30) recs.push("IMC en rango de obesidad. Se recomienda iniciar un programa de reducción de grasa corporal con seguimiento profesional.");
    else if (imc >= 25) recs.push("IMC en sobrepeso. Prioriza déficit calórico moderado y actividad cardiovascular regular.");
    else if (imc < 18.5) recs.push("IMC por debajo del rango saludable. Considera aumentar tu ingesta calórica con alimentos nutritivos.");
  }
  if (prev && latest.weight_kg < prev.weight_kg) {
    recs.push("Buen progreso en peso respecto a la evaluación anterior.");
  }
  if (recs.length === 0) recs.push("Mantén tu rutina actual y registra evaluaciones periódicas para seguir tu evolución.");
  return recs;
}

export const GOAL_LABEL: Record<string, string> = {
  lose_fat: "Bajar grasa corporal",
  gain_muscle: "Ganar masa muscular",
  maintain: "Mantención",
  performance: "Mejorar rendimiento deportivo",
  other: "Otro",
};
