import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/evaluations")({ component: Page });

function Page() {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ client_id: "", date: new Date().toISOString().slice(0, 10), weight: "", body_fat: "", muscle_mass: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, user_roles(role)").then(({ data }) => {
      setClients((data ?? []).filter((p: any) => p.user_roles?.some((r: any) => r.role === "client")));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("evaluations").insert({
      client_id: form.client_id, date: form.date,
      weight: form.weight ? Number(form.weight) : null,
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      muscle_mass: form.muscle_mass ? Number(form.muscle_mass) : null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return toast.error("Error al guardar");
    toast.success("Evaluación registrada");
    setForm({ ...form, weight: "", body_fat: "", muscle_mass: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Registrar Evaluación</h1>
      <form onSubmit={submit} className="surface-card grid gap-4 p-6 md:grid-cols-2">
        <select required value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3 md:col-span-2">
          <option value="">Selecciona un cliente</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
        <input type="number" step="0.1" placeholder="Peso (kg)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
        <input type="number" step="0.1" placeholder="% Grasa" value={form.body_fat} onChange={(e) => setForm({ ...form, body_fat: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
        <input type="number" step="0.1" placeholder="Masa muscular (kg)" value={form.muscle_mass} onChange={(e) => setForm({ ...form, muscle_mass: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
        <textarea placeholder="Observaciones" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-md border border-border bg-input/30 p-3 md:col-span-2" />
        <button disabled={saving} className="btn-primary md:col-span-2">{saving ? "Guardando..." : "Guardar evaluación"}</button>
      </form>
    </div>
  );
}
