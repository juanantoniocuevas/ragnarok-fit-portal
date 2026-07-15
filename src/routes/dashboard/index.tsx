import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { autoRecommendations } from "@/lib/health-recommendations";
import { MEASUREMENT_FIELDS, calcIMC } from "@/lib/measurements";

export const Route = createFileRoute("/dashboard/")({ component: DashHome });

function DashHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [phys, setPhys] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [latestRec, setLatestRec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, ph, m, r] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("physical_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("measurements").select("*").eq("user_id", user.id).is("deleted_at", null).order("created_at"),
        supabase.from("recommendations").select("content").eq("client_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(1),
      ]);
      setProfile(p.data); setPhys(ph.data); setMeasurements(m.data ?? []);
      setLatestRec(r.data?.[0]?.content ?? null);
      setLoading(false);
    })();
  }, [user]);

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];
  const auto = useMemo(() => latest ? autoRecommendations(latest, prev) : [], [latest, prev]);
  const delta = latest && prev ? (Number(latest.weight_kg) - Number(prev.weight_kg)).toFixed(1) : null;

  if (loading) return <p className="text-muted-foreground">Cargando tu información...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Hola, {profile?.full_name?.split(" ")[0] ?? ""}</h1>
        <p className="text-muted-foreground">Aquí está tu resumen actual.</p>
      </div>

      {invites.map((inv) => (
        <div key={inv.id} className="surface-card surface-card-active p-6">
          <p className="font-display text-lg">Invitación de preparador</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-foreground">{inv.trainer?.full_name ?? inv.trainer?.email}</strong> te invita a ser su cliente.
          </p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => acceptInvite(inv.id)} className="btn-primary">Aceptar</button>
            <button onClick={() => declineInvite(inv.id)} className="btn-secondary">Rechazar</button>
          </div>
        </div>
      ))}

      {!phys && (
        <div className="surface-card surface-card-active p-6">
          <p>Completa tu <Link to="/dashboard/physical-profile" className="text-gold underline">perfil físico</Link>.</p>
        </div>
      )}
      {phys && measurements.length === 0 && (
        <div className="surface-card surface-card-active p-6">
          <p>Registra tu primera <Link to="/dashboard/measurements" className="text-gold underline">evaluación</Link> para empezar.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MEASUREMENT_FIELDS.map((f) => (
          <Stat key={f.key} label={f.short} value={latest?.[f.key] != null ? `${latest[f.key]} ${f.unit}` : "—"} />
        ))}
        <Stat label="IMC" value={latest ? (calcIMC(latest.weight_kg, latest.height_cm) ?? "—") : "—"} />
        <Stat
          label="Cambio peso (vs anterior)"
          value={delta !== null ? `${delta} kg` : "—"}
          accent={delta !== null && Number(delta) <= 0 ? "vitality" : undefined}
        />
      </div>

      {auto.length > 0 && (
        <div className="surface-card p-6">
          <h2 className="font-display text-xl">Recomendaciones automáticas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{auto.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}

      <div className="surface-card surface-card-active p-6">
        <h2 className="font-display text-xl">Último mensaje de tu preparador</h2>
        <p className="mt-3 text-foreground/90">{latestRec ?? "Sin recomendaciones todavía."}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: any; accent?: "vitality" }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent === "vitality" ? "text-vitality" : "text-gold"}`}>{value}</p>
    </div>
  );
}
