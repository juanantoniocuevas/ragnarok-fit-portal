// Configuración central de mediciones antropométricas del sistema.
// Toda la app (formularios, tablas, gráficos) debe usar estas definiciones.

export type MeasurementField =
  | "weight_kg"
  | "height_cm"
  | "arm_relaxed_cm"
  | "arm_flexed_cm"
  | "calf_cm"
  | "mid_thigh_cm"
  | "waist_cm"
  | "hip_cm";

export interface MeasurementFieldConfig {
  key: MeasurementField;
  label: string;
  short: string;
  unit: string;
  min: number;
  color: string;
}

export const MEASUREMENT_FIELDS: MeasurementFieldConfig[] = [
  { key: "weight_kg",      label: "Peso",                       short: "Peso",           unit: "kg", min: 1,  color: "#D4A017" },
  { key: "height_cm",      label: "Estatura",                   short: "Estatura",       unit: "cm", min: 50, color: "#22c55e" },
  { key: "arm_relaxed_cm", label: "Perímetro del brazo relajado",  short: "Brazo relajado", unit: "cm", min: 10, color: "#3b82f6" },
  { key: "arm_flexed_cm",  label: "Perímetro del brazo contraído", short: "Brazo contraído",unit: "cm", min: 10, color: "#a855f7" },
  { key: "calf_cm",        label: "Perímetro de la pantorrilla",   short: "Pantorrilla",    unit: "cm", min: 15, color: "#C67A45" },
  { key: "mid_thigh_cm",   label: "Perímetro del muslo medio",     short: "Muslo medio",    unit: "cm", min: 20, color: "#ef4444" },
  { key: "waist_cm",       label: "Circunferencia de cintura",     short: "Cintura",        unit: "cm", min: 30, color: "#eab308" },
  { key: "hip_cm",         label: "Circunferencia de cadera",      short: "Cadera",         unit: "cm", min: 30, color: "#06b6d4" },
];

export function calcIMC(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  if (h <= 0) return null;
  return Math.round((weightKg / (h * h)) * 100) / 100;
}
