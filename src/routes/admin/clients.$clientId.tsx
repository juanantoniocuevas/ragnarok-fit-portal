import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { GOAL_LABEL, autoRecommendations } from "@/lib/health-recommendations";
import { MEASUREMENT_FIELDS, calcIMC } from "@/lib/measurements";

export const Route = createFileRoute("/admin/clients/$clientId")({ component: ClientDetail });

function ClientDetail() {
  const { clientId } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [phys, setPhys] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [p, ph, m, r] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", clientId).maybeSingle(),
      supabase.from("physical_profiles").select("*").eq("user_id", clientId).maybeSingle(),
      supabase.from("measurements").select("*").eq("user_id", clientId).is("deleted_at", null).order("created_at"),
      supabase.from("recommendations").select("*").eq("client_id", clientId).is("deleted_at", null).order("created_at", { ascending: false }),
    ]);
    setProfile(p.data); setPhys(ph.data); setMeasurements(m.data ?? []); setRecs(r.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [clientId]);

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];
  const autoRecs = useMemo(() => latest ? autoRecommendations(latest, prev) : [], [latest, prev]);

  const buildSeries = (key: string) =>
    measurements.map((m) => ({
      date: new Date(m.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
      value: m[key] !== null && m[key] !== undefined ? Number(m[key]) : null,
    }));

  const submitRec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("recommendations").update({ content: content.trim() }).eq("id", editingId);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Recomendación actualizada");
    } else {
      const { error } = await supabase.from("recommendations").insert({ client_id: clientId, admin_id: user.id, content: content.trim() });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Recomendación enviada");
    }
    setContent(""); setEditingId(null); load();
  };

  const startEdit = (r: any) => { setContent(r.content); setEditingId(r.id); };
  const deleteRec = async (id: string) => {
    if (!confirm("¿Eliminar esta recomendación?")) return;
    await supabase.from("recommendations").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    toast.success("Recomendación eliminada");
    load();
  };

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (!profile) return <p className="text-muted-foreground">Cliente no encontrado o no asignado a ti.</p>;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/clients" className="text-sm text-muted-foreground hover:text-gold">← Volver</Link>
        <h1 className="mt-2 font-display text-3xl font-bold">{profile.full_name}</h1>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>

      <section className="surface-card p-6">
        <h2 className="mb-4 font-display text-xl">Perfil físico</h2>
        {phys ? (
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <Info label="Edad" value={phys.age ? `${phys.age} años` : "—"} />
            <Info label="Sexo" value={phys.sex === "male" ? "Hombre" : phys.sex === "female" ? "Mujer" : "—"} />
            <Info label="Estatura" value={phys.height_cm ? `${phys.height_cm} cm` : "—"} />
            <Info label="Objetivo" value={GOAL_LABEL[phys.goal] ?? "—"} />
          </dl>
        ) : <p className="text-muted-foreground">El cliente aún no ha completado su perfil físico.</p>}
      </section>

      {latest && (
        <section>
          <h2 className="mb-4 font-display text-xl">Última evaluación</h2>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {MEASUREMENT_FIELDS.map((f) => (
              <Stat key={f.key} label={f.short} value={latest[f.key] != null ? `${latest[f.key]} ${f.unit}` : "—"} />
            ))}
            <Stat label="IMC" value={calcIMC(latest.weight_kg, latest.height_cm) ?? "—"} />
          </div>
        </section>
      )}

      {measurements.length >= 2 ? (
        <section>
          <h2 className="mb-4 font-display text-xl">Evolución</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {MEASUREMENT_FIELDS.map((f) => (
              <div key={f.key} className="surface-card p-6">
                <h3 className="mb-3 font-display text-lg">{f.label} ({f.unit})</h3>
                <div className="h-56">
                  <ResponsiveContainer>
                    <LineChart data={buildSeries(f.key)}>
                      <CartesianGrid stroke="#2D3E5F" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#A0AEC0" />
                      <YAxis stroke="#A0AEC0" domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#1B2A4A", border: "1px solid #2D3E5F", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="value" stroke={f.color} strokeWidth={2} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="surface-card p-6 text-muted-foreground">Se requieren más evaluaciones para visualizar la evolución.</p>
      )}

      <section className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Historial de evaluaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr>
                <th className="p-3">Fecha</th>
                {MEASUREMENT_FIELDS.map((f) => <th key={f.key} className="p-3">{f.short}</th>)}
                <th className="p-3">IMC</th>
              </tr>
            </thead>
            <tbody>
              {measurements.slice().reverse().map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-3">{new Date(m.created_at).toLocaleString("es-CL")}</td>
                  {MEASUREMENT_FIELDS.map((f) => <td key={f.key} className="p-3">{m[f.key] ?? "—"}</td>)}
                  <td className="p-3">{calcIMC(m.weight_kg, m.height_cm) ?? "—"}</td>
                </tr>
              ))}
              {measurements.length === 0 && (
                <tr><td colSpan={MEASUREMENT_FIELDS.length + 2} className="p-8 text-center text-muted-foreground">Sin evaluaciones aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {latest && (
        <section className="surface-card p-6">
          <h2 className="mb-4 font-display text-xl">Recomendaciones automáticas del sistema</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">{autoRecs.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      )}

      <section className="surface-card p-6">
        <h2 className="mb-4 font-display text-xl">{editingId ? "Editar recomendación" : "Nueva recomendación"}</h2>
        <form onSubmit={submitRec} className="space-y-3">
          <textarea required value={content} onChange={(e) => setContent(e.target.value)} rows={3} maxLength={5000}
            placeholder="Escribe una recomendación personalizada..."
            className="w-full rounded-md border border-border bg-input/30 p-3" />
          <div className="flex gap-2">
            <button disabled={saving} className="btn-primary">{saving ? "Guardando..." : editingId ? "Actualizar" : "Enviar"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setContent(""); }} className="btn-secondary">Cancelar</button>}
          </div>
        </form>

        <ul className="mt-6 divide-y divide-border">
          {recs.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                <span>{new Date(r.created_at).toLocaleString("es-CL")}</span>
                {r.admin_id === user?.id && (
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(r)} className="hover:text-gold">Editar</button>
                    <button onClick={() => deleteRec(r.id)} className="hover:text-destructive">Eliminar</button>
                  </div>
                )}
              </div>
              <p className="mt-1">{r.content}</p>
            </li>
          ))}
          {recs.length === 0 && <li className="py-4 text-center text-muted-foreground">Sin recomendaciones.</li>}
        </ul>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
function Stat({ label, value }: { label: string; value: any }) {
  return <div className="surface-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl text-gold">{value}</p></div>;
}
