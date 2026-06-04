import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/")({ component: DashHome });

function DashHome() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profile, evals, atts, recs] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("evaluations").select("*").eq("client_id", user.id).order("date", { ascending: false }),
        supabase.from("attendance").select("*").eq("client_id", user.id),
        supabase.from("recommendations").select("*").eq("client_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      const evalRows = evals.data ?? [];
      const last = evalRows[0];
      const first = evalRows[evalRows.length - 1];
      const monthStart = new Date(); monthStart.setDate(1);
      const monthlyAtts = (atts.data ?? []).filter((a: any) => new Date(a.date) >= monthStart).length;
      setData({
        profile: profile.data,
        currentWeight: last?.weight,
        delta: last && first ? (Number(last.weight) - Number(first.weight)).toFixed(1) : null,
        monthlyAtts,
        lastEval: last?.date,
        latestRec: recs.data?.[0]?.content,
      });
    })();
  }, [user]);

  if (!data) return <p className="text-muted-foreground">Cargando tu información...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Hola, {data.profile?.full_name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground">¿Cómo vas? Aquí está tu resumen.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Peso actual" value={data.currentWeight ? `${data.currentWeight} kg` : "—"} />
        <Stat label="Cambio desde el inicio"
          value={data.delta !== null ? `${data.delta} kg` : "—"}
          accent={data.delta !== null && Number(data.delta) <= 0 ? "vitality" : undefined} />
        <Stat label="Asistencias este mes" value={String(data.monthlyAtts)} />
        <Stat label="Última evaluación" value={data.lastEval ? new Date(data.lastEval).toLocaleDateString("es-CL") : "—"} />
      </div>
      <div className="surface-card surface-card-active p-6">
        <h2 className="font-display text-xl">Último mensaje de tu entrenador</h2>
        <p className="mt-3 text-foreground/90">{data.latestRec ?? "Sin recomendaciones todavía."}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "vitality" }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent === "vitality" ? "text-vitality" : "text-gold"}`}>{value}</p>
    </div>
  );
}
