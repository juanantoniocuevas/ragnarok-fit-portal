import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MEASUREMENT_FIELDS, calcIMC } from "@/lib/measurements";

export const Route = createFileRoute("/dashboard/progress")({ component: Progress });

function Progress() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("measurements").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at"),
      supabase.from("recommendations").select("*").eq("client_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
    ]).then(([m, r]) => { setRows(m.data ?? []); setRecs(r.data ?? []); });
  }, [user]);

  const timeline = [
    ...rows.map((m) => ({ kind: "med" as const, at: m.created_at, data: m })),
    ...recs.map((r) => ({ kind: "rec" as const, at: r.created_at, data: r })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  const buildSeries = (key: string) =>
    rows.map((m) => ({
      date: new Date(m.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
      value: m[key] !== null && m[key] !== undefined ? Number(m[key]) : null,
    }));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Mi Progreso</h1>

      {rows.length < 2 ? (
        <p className="surface-card p-6 text-muted-foreground">Registra al menos dos evaluaciones para visualizar la evolución.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {MEASUREMENT_FIELDS.map((f) => (
            <ChartCard key={f.key} title={`${f.label} (${f.unit})`} color={f.color} data={buildSeries(f.key)} />
          ))}
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Línea de tiempo</h2>
        <ol className="divide-y divide-border">
          {timeline.map((t, i) => (
            <li key={i} className="p-4">
              <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString("es-CL")}</p>
              {t.kind === "med" ? (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Evaluación:</span> Peso {t.data.weight_kg} kg · Estatura {t.data.height_cm ?? "—"} cm · IMC {calcIMC(t.data.weight_kg, t.data.height_cm) ?? "—"}
                </p>
              ) : (
                <p className="mt-1 text-sm"><span className="font-medium text-gold">Recomendación del preparador:</span> {t.data.content}</p>
              )}
            </li>
          ))}
          {timeline.length === 0 && <li className="p-8 text-center text-muted-foreground">Sin registros aún.</li>}
        </ol>
      </div>
    </div>
  );
}

function ChartCard({ title, color, data }: { title: string; color: string; data: { date: string; value: number | null }[] }) {
  return (
    <div className="surface-card p-6">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="#2D3E5F" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "#1B2A4A", border: "1px solid #2D3E5F", borderRadius: 8 }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
