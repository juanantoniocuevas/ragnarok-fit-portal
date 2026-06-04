import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/progress")({ component: Progress });

function Progress() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("evaluations").select("*").eq("client_id", user.id).order("date").then(({ data }) => setRows(data ?? []));
  }, [user]);

  const chartData = rows.map((r) => ({
    date: new Date(r.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
    Peso: Number(r.weight),
    Grasa: Number(r.body_fat),
    Músculo: Number(r.muscle_mass),
  }));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Mi Progreso</h1>

      {chartData.length > 0 && (
        <div className="surface-card p-6">
          <h2 className="mb-4 font-display text-xl">Evolución</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2D3E5F" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip contentStyle={{ background: "#1B2A4A", border: "1px solid #2D3E5F", borderRadius: 8 }} />
                <Line type="monotone" dataKey="Peso" stroke="#D4A017" strokeWidth={2} />
                <Line type="monotone" dataKey="Grasa" stroke="#C67A45" strokeWidth={2} />
                <Line type="monotone" dataKey="Músculo" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Historial de evaluaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr>
                <th className="p-4">Fecha</th><th className="p-4">Peso</th><th className="p-4">% Grasa</th>
                <th className="p-4">Músculo</th><th className="p-4">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice().reverse().map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-4">{new Date(r.date).toLocaleDateString("es-CL")}</td>
                  <td className="p-4">{r.weight} kg</td>
                  <td className="p-4">{r.body_fat}%</td>
                  <td className="p-4">{r.muscle_mass} kg</td>
                  <td className="p-4 text-muted-foreground">{r.notes}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin evaluaciones aún.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
