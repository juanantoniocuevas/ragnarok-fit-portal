import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { autoRecommendations } from "@/lib/health-recommendations";

export const Route = createFileRoute("/dashboard/recommendations")({ component: Recs });

function Recs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("recommendations").select("*").eq("client_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("measurements").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at"),
    ]).then(([r, m]) => { setRows(r.data ?? []); setMeasurements(m.data ?? []); });
  }, [user]);

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];
  const auto = useMemo(() => latest ? autoRecommendations(latest, prev) : [], [latest, prev]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Recomendaciones</h1>

      <section>
        <h2 className="mb-3 font-display text-xl">Automáticas del sistema</h2>
        {auto.length === 0 ? (
          <p className="surface-card p-6 text-muted-foreground">Registra al menos una medición para ver recomendaciones automáticas.</p>
        ) : (
          <ul className="surface-card list-disc space-y-2 p-6 pl-10 text-sm">{auto.map((r, i) => <li key={i}>{r}</li>)}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl">De tu preparador</h2>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="surface-card surface-card-active p-6">
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("es-CL")}</p>
              <p className="mt-2 text-foreground/90">{r.content}</p>
            </div>
          ))}
          {rows.length === 0 && <p className="surface-card p-8 text-center text-muted-foreground">Sin recomendaciones aún.</p>}
        </div>
      </section>
    </div>
  );
}
