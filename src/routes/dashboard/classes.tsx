import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/dashboard/classes")({ component: Classes });

function Classes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("attendance").select("*").eq("client_id", user.id).order("date", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, [user]);

  const monthStart = new Date(); monthStart.setDate(1);
  const monthly = rows.filter((r) => new Date(r.date) >= monthStart).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Mis Clases</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="surface-card surface-card-active p-6">
          <p className="text-sm text-muted-foreground">Total de clases</p>
          <p className="mt-2 font-display text-3xl font-bold text-gold">{rows.length}</p>
        </div>
        <div className="surface-card surface-card-active p-6">
          <p className="text-sm text-muted-foreground">Este mes</p>
          <p className="mt-2 font-display text-3xl font-bold text-vitality">{monthly}</p>
        </div>
      </div>
      <div className="surface-card overflow-hidden">
        <h2 className="border-b border-border p-6 font-display text-xl">Historial</h2>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between p-4">
              <span>{new Date(r.date).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="rounded-full bg-vitality/20 px-3 py-1 text-xs text-vitality">Asistió</span>
            </li>
          ))}
          {rows.length === 0 && <li className="p-8 text-center text-muted-foreground">Sin registros aún.</li>}
        </ul>
      </div>
    </div>
  );
}
