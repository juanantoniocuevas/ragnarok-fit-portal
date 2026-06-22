import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ACTIVITY_LABEL } from "@/lib/health-recommendations";

export const Route = createFileRoute("/dashboard/measurements")({ component: Measurements });

function Measurements() {
  const { user } = useAuth();
  const [phys, setPhys] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ weight_kg: "", waist_cm: "", neck_cm: "", hip_cm: "", activity_level: "moderate" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const [p, m] = await Promise.all([
      supabase.from("physical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("measurements").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    setPhys(p.data); setRows(m.data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("measurements").insert({
      user_id: user.id,
      weight_kg: Number(form.weight_kg),
      waist_cm: Number(form.waist_cm),
      neck_cm: Number(form.neck_cm),
      hip_cm: form.hip_cm ? Number(form.hip_cm) : null,
      activity_level: form.activity_level,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Medición registrada. Cálculos actualizados.");
    setForm({ weight_kg: "", waist_cm: "", neck_cm: "", hip_cm: "", activity_level: "moderate" });
    load();
  };

  const softDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta medición? Se conservará en el historial interno.")) return;
    await supabase.from("measurements").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Medición eliminada");
    load();
  };

  if (!phys?.height_cm) {
    return (
      <div className="surface-card p-6">
        <p>Primero completa tu <Link to="/dashboard/physical-profile" className="text-gold underline">perfil físico</Link>. Sin estatura, edad y sexo no se pueden calcular los indicadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Mediciones</h1>

      <form onSubmit={submit} className="surface-card grid gap-4 p-6 md:grid-cols-2">
        <Field label="Peso (kg)"><input required type="number" step="0.1" min={1} value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="input" /></Field>
        <Field label="Circunferencia de cintura (cm)"><input required type="number" step="0.1" min={20} value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} className="input" /></Field>
        <Field label="Circunferencia de cuello (cm)"><input required type="number" step="0.1" min={20} value={form.neck_cm} onChange={(e) => setForm({ ...form, neck_cm: e.target.value })} className="input" /></Field>
        <Field label={`Circunferencia de cadera (cm) ${phys.sex === "female" ? "" : "(opcional)"}`}>
          <input required={phys.sex === "female"} type="number" step="0.1" min={20} value={form.hip_cm} onChange={(e) => setForm({ ...form, hip_cm: e.target.value })} className="input" />
        </Field>
        <Field label="Nivel de actividad física">
          <select required value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })} className="input">
            {Object.entries(ACTIVITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="md:col-span-2"><button disabled={saving} className="btn-primary w-full">{saving ? "Guardando..." : "Registrar medición"}</button></div>
      </form>

      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Historial</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr><th className="p-3">Fecha</th><th className="p-3">Peso</th><th className="p-3">IMC</th><th className="p-3">%Grasa</th><th className="p-3">Músc.</th><th className="p-3">Magra</th><th className="p-3">TMB</th><th className="p-3">Kcal</th><th className="p-3">Visceral</th><th className="p-3">Agua</th><th className="p-3">Cintura</th><th className="p-3">Cuello</th><th className="p-3">Cadera</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-3">{new Date(m.created_at).toLocaleString("es-CL")}</td>
                  <td className="p-3">{m.weight_kg}</td><td className="p-3">{m.imc ?? "—"}</td>
                  <td className="p-3">{m.body_fat_pct ?? "—"}</td><td className="p-3">{m.muscle_mass_kg ?? "—"}</td>
                  <td className="p-3">{m.lean_mass_kg ?? "—"}</td><td className="p-3">{m.bmr ?? "—"}</td>
                  <td className="p-3">{m.daily_calories ? Math.round(m.daily_calories) : "—"}</td>
                  <td className="p-3">{m.visceral_fat ?? "—"}</td><td className="p-3">{m.water_pct ?? "—"}</td>
                  <td className="p-3">{m.waist_cm}</td><td className="p-3">{m.neck_cm}</td><td className="p-3">{m.hip_cm ?? "—"}</td>
                  <td className="p-3"><button onClick={() => softDelete(m.id)} className="text-xs text-destructive hover:underline">Eliminar</button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={14} className="p-8 text-center text-muted-foreground">Sin mediciones aún.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>;
}
