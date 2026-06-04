import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/attendance")({ component: Page });

function Page() {
  const [clients, setClients] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, user_roles(role)").order("full_name").then(({ data }) => {
      setClients((data ?? []).filter((p: any) => p.user_roles?.some((r: any) => r.role === "client")));
    });
  }, []);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const submit = async () => {
    if (selected.size === 0) return toast.error("Selecciona al menos un cliente");
    setSaving(true);
    const rows = Array.from(selected).map((client_id) => ({ client_id, date }));
    const { error } = await supabase.from("attendance").insert(rows);
    setSaving(false);
    if (error) return toast.error("Error al guardar");
    toast.success(`${rows.length} asistencia(s) registrada(s)`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Registrar Asistencias</h1>
      <div className="surface-card p-6">
        <label className="mb-2 block text-sm font-medium">Fecha de la clase</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 w-full rounded-md border border-border bg-input/30 px-3 md:w-64" />
      </div>
      <div className="surface-card p-6">
        <h2 className="mb-4 font-display text-xl">Marca a los asistentes</h2>
        <ul className="divide-y divide-border">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-3">
              <span>{c.full_name}</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="h-5 w-5 accent-[#D4A017]" />
              </label>
            </li>
          ))}
        </ul>
        <button onClick={submit} disabled={saving} className="btn-primary mt-6 w-full">
          {saving ? "Guardando..." : `Guardar ${selected.size} asistencia(s)`}
        </button>
      </div>
    </div>
  );
}
