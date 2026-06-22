import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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

  const chart = rows.map((m) => ({
    date: new Date(m.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
    Peso: Number(m.weight_kg),
    IMC: m.imc ? Number(m.imc) : null,
    Grasa: m.body_fat_pct ? Number(m.body_fat_pct) : null,
    Músculo: m.muscle_mass_kg ? Number(m.muscle_mass_kg) : null,
    Magra: m.lean_mass_kg ? Number(m.lean_mass_kg) : null,
    Visceral: m.visceral_fat ? Number(m.visceral_fat) : null,
  }));

  // Timeline merging measurements + recs sorted desc
  const timeline = [
    ...rows.map((m) => ({ kind: "med", at: m.created_at, data: m })),
    ...recs.map((r) => ({ kind: "rec", at: r.created_at, data: r })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Mi Progreso</h1>

      {chart.length >= 2 ? (
        <div className="surface-card p-6">
          <h2 className="mb-4 font-display text-xl">Evolución de tus mediciones</h2>
          <div className="h-80">
            <ResponsiveContainer><LineChart data={chart}>
              <CartesianGrid stroke="#2D3E5F" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" />
              <Tooltip contentStyle={{ background: "#1B2A4A", border: "1px solid #2D3E5F", borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="Peso" stroke="#D4A017" strokeWidth={2} />
              <Line type="monotone" dataKey="IMC" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="Grasa" stroke="#C67A45" strokeWidth={2} />
              <Line type="monotone" dataKey="Músculo" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Magra" stroke="#a855f7" strokeWidth={2} />
              <Line type="monotone" dataKey="Visceral" stroke="#ef4444" strokeWidth={2} />
            </LineChart></ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="surface-card p-6 text-muted-foreground">Se requieren más mediciones para visualizar la evolución.</p>
      )}

      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Línea de tiempo</h2>
        <ol className="divide-y divide-border">
          {timeline.map((t, i) => (
            <li key={i} className="p-4">
              <p className="text-xs text-muted-foreground">{new Date(t.at).toLocaleString("es-CL")}</p>
              {t.kind === "med" ? (
                <p className="mt-1 text-sm">
                  <span className="font-medium">Medición:</span> Peso {t.data.weight_kg} kg · IMC {t.data.imc ?? "—"} · %Grasa {t.data.body_fat_pct ?? "—"} · Músculo {t.data.muscle_mass_kg ?? "—"} kg
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
