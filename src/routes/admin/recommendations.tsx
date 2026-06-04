import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/recommendations")({ component: Page });

function Page() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState("");
  const [content, setContent] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, user_roles(role)").order("full_name").then(({ data }) => {
      setClients((data ?? []).filter((p: any) => p.user_roles?.some((r: any) => r.role === "client")));
    });
  }, []);

  useEffect(() => {
    if (!clientId) return setHistory([]);
    supabase.from("recommendations").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).then(({ data }) => setHistory(data ?? []));
  }, [clientId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("recommendations").insert({ client_id: clientId, content });
    setSaving(false);
    if (error) return toast.error("Error al guardar");
    toast.success("Recomendación enviada");
    setContent("");
    const { data } = await supabase.from("recommendations").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
    setHistory(data ?? []);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Recomendaciones</h1>
      <form onSubmit={submit} className="surface-card grid gap-4 p-6">
        <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-12 rounded-md border border-border bg-input/30 px-3">
          <option value="">Selecciona un cliente</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </select>
        <textarea required placeholder="Escribe la recomendación..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="rounded-md border border-border bg-input/30 p-3" />
        <button disabled={saving} className="btn-primary">{saving ? "Enviando..." : "Enviar recomendación"}</button>
      </form>

      {clientId && (
        <div className="surface-card overflow-hidden">
          <h2 className="border-b border-border p-6 font-display text-xl">Historial</h2>
          <ul className="divide-y divide-border">
            {history.map((r) => (
              <li key={r.id} className="p-4">
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="mt-1">{r.content}</p>
              </li>
            ))}
            {history.length === 0 && <li className="p-8 text-center text-muted-foreground">Sin recomendaciones aún.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
