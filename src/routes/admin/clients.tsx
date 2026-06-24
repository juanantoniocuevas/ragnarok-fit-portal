import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients")({ component: Clients });

function Clients() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [emailToAssign, setEmailToAssign] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from("trainer_clients")
      .select("client_id, created_at, accepted_at")
      .eq("trainer_id", user.id);
    const ids = (links ?? []).map((l: any) => l.client_id);
    if (ids.length === 0) return setRows([]);
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setRows((links ?? []).map((l: any) => ({ ...byId.get(l.client_id), accepted_at: l.accepted_at })));
  };
  useEffect(() => { load(); }, [user]);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAssigning(true);
    const email = emailToAssign.trim().toLowerCase();
    const { data: prof } = await supabase.from("profiles").select("id, full_name").eq("email", email).maybeSingle();
    if (!prof) {
      setAssigning(false);
      return toast.error("No existe un usuario con ese correo. Pídele registrarse primero.");
    }
    const { error } = await supabase
      .from("trainer_clients")
      .insert({ trainer_id: user.id, client_id: prof.id, requested_by: user.id });
    setAssigning(false);
    if (error) {
      if (error.code === "23505") return toast.error("Ya enviaste una invitación a este cliente.");
      return toast.error(error.message);
    }
    toast.success(`Invitación enviada a ${prof.full_name}. Debe aceptarla desde su panel.`);
    setEmailToAssign("");
    load();
  };

  const unassign = async (clientId: string) => {
    if (!user) return;
    if (!confirm("¿Quitar este cliente de tu lista?")) return;
    await supabase.from("trainer_clients").delete().eq("trainer_id", user.id).eq("client_id", clientId);
    toast.success("Cliente removido");
    load();
  };

  const filtered = rows.filter((r) => r.full_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Mis Clientes</h1>

      <form onSubmit={assign} className="surface-card flex flex-col gap-3 p-6 sm:flex-row">
        <input required type="email" placeholder="Correo del cliente a invitar" value={emailToAssign}
          onChange={(e) => setEmailToAssign(e.target.value)}
          className="h-12 flex-1 rounded-md border border-border bg-input/30 px-3 outline-none focus:border-gold" />
        <button disabled={assigning} className="btn-primary">{assigning ? "Enviando..." : "Enviar invitación"}</button>
      </form>
      <p className="text-xs text-muted-foreground -mt-3">El cliente debe aceptar la invitación desde su panel antes de que puedas ver sus datos.</p>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en mis clientes..."
        className="h-12 w-full rounded-md border border-border bg-input/30 px-3 outline-none focus:border-gold" />

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Estado</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-4 font-medium">
                    {r.accepted_at ? (
                      <Link to="/admin/clients/$clientId" params={{ clientId: r.id }} className="text-gold hover:underline">
                        {r.full_name}
                      </Link>
                    ) : (
                      <span>{r.full_name}</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{r.email}</td>
                  <td className="p-4">
                    {r.accepted_at
                      ? <span className="text-vitality">Aceptado</span>
                      : <span className="text-muted-foreground italic">Pendiente</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => unassign(r.id)} className="text-sm text-destructive hover:underline">Quitar</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aún no tienes clientes asignados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
