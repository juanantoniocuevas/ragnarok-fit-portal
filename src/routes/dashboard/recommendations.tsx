import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/recommendations")({ component: Recs });

function Recs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("recommendations").select("*").eq("client_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Recomendaciones</h1>
      <p className="text-muted-foreground">Mensajes y notas de tu entrenador.</p>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.id} className="surface-card surface-card-active p-6">
            <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="mt-2 text-foreground/90">{r.content}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="surface-card p-8 text-center text-muted-foreground">Sin recomendaciones aún.</p>}
      </div>
    </div>
  );
}
