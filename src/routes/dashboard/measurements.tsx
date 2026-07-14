import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MEASUREMENT_FIELDS, calcIMC } from "@/lib/measurements";

export const Route = createFileRoute("/dashboard/measurements")({ component: Measurements });

type FormState = Record<string, string>;

const initialForm = (): FormState =>
  Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, ""])) as FormState;

function Measurements() {
  const { user } = useAuth();
  const [phys, setPhys] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<FormState>(initialForm());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const [p, m] = await Promise.all([
      supabase.from("physical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("measurements").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    setPhys(p.data);
    setRows(m.data ?? []);
    // Precarga estatura desde perfil físico si existe
    setForm((prev) => ({ ...prev, height_cm: prev.height_cm || (p.data?.height_cm?.toString() ?? "") }));
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload: any = { user_id: user.id };
    for (const f of MEASUREMENT_FIELDS) {
      payload[f.key] = form[f.key] ? Number(form[f.key]) : null;
    }
    const { error } = await supabase.from("measurements").insert(payload);
    if (!error && form.height_cm) {
      // Mantiene la estatura actualizada como dato del cliente
      await supabase.from("physical_profiles").upsert(
        { user_id: user.id, height_cm: Number(form.height_cm) },
        { onConflict: "user_id" }
      );
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Evaluación registrada");
    setForm(initialForm());
    load();
  };

  const softDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta evaluación? Se conservará en el historial interno.")) return;
    await supabase.from("measurements").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Evaluación eliminada");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Evaluaciones</h1>
        <p className="text-sm text-muted-foreground">Cada evaluación queda registrada con su fecha y no puede modificarse posteriormente.</p>
      </div>

      {!phys && (
        <div className="surface-card p-6">
          <p>Completa tu <Link to="/dashboard/physical-profile" className="text-gold underline">perfil físico</Link> para contextualizar tus evaluaciones.</p>
        </div>
      )}

      <form onSubmit={submit} className="surface-card grid gap-4 p-6 md:grid-cols-2">
        {MEASUREMENT_FIELDS.map((f) => (
          <Field key={f.key} label={`${f.label} (${f.unit})`}>
            <input
              required
              type="number"
              step="0.1"
              min={f.min}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="input"
            />
          </Field>
        ))}
        <div className="md:col-span-2">
          <button disabled={saving} className="btn-primary w-full">{saving ? "Guardando..." : "Registrar evaluación"}</button>
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Historial</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr>
                <th className="p-3">Fecha</th>
                {MEASUREMENT_FIELDS.map((f) => <th key={f.key} className="p-3">{f.short}</th>)}
                <th className="p-3">IMC</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-3">{new Date(m.created_at).toLocaleString("es-CL")}</td>
                  {MEASUREMENT_FIELDS.map((f) => (
                    <td key={f.key} className="p-3">{m[f.key] ?? "—"}</td>
                  ))}
                  <td className="p-3">{calcIMC(m.weight_kg, m.height_cm) ?? "—"}</td>
                  <td className="p-3">
                    <button onClick={() => softDelete(m.id)} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={MEASUREMENT_FIELDS.length + 3} className="p-8 text-center text-muted-foreground">Sin evaluaciones aún.</td></tr>
              )}
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
