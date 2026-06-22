import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { GOAL_LABEL } from "@/lib/health-recommendations";

export const Route = createFileRoute("/dashboard/physical-profile")({ component: PhysicalProfile });

function PhysicalProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ age: "", sex: "", height_cm: "", goal: "" });
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("physical_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setHasExisting(true);
        setForm({
          age: data.age?.toString() ?? "",
          sex: data.sex ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          goal: data.goal ?? "",
        });
      }
      setLoading(false);
    });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      age: form.age ? Number(form.age) : null,
      sex: form.sex || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      goal: form.goal || null,
    };
    const { error } = hasExisting
      ? await supabase.from("physical_profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("physical_profiles").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil físico guardado");
    setHasExisting(true);
  };

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Perfil Físico</h1>
        <p className="text-sm text-muted-foreground">Estos datos se usan para calcular automáticamente IMC, TMB, calorías y composición corporal.</p>
      </div>

      <form onSubmit={submit} className="surface-card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Edad">
            <input required type="number" min={1} max={130} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input" />
          </Field>
          <Field label="Sexo">
            <select required value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} className="input">
              <option value="">Selecciona</option>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </Field>
          <Field label="Estatura (cm)">
            <input required type="number" step="0.1" min={50} max={250} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="input" />
          </Field>
          <Field label="Objetivo">
            <select required value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} className="input">
              <option value="">Selecciona</option>
              {Object.entries(GOAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <button disabled={saving} className="btn-primary">{saving ? "Guardando..." : "Guardar perfil"}</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>;
}
