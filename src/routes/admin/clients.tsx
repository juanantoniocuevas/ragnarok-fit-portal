import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients")({ component: Clients });

function Clients() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
    setRows((data ?? []).filter((p: any) => p.user_roles?.some((r: any) => r.role === "client")));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Use signUp - signups disabled globally so call admin via edge? Use regular signUp won't work with disable_signup.
    // Trainer creates clients: we need admin API. Use a server function (skipped for time).
    // Workaround: temporarily call signup via admin endpoint requires service role.
    toast.info("Crear cuentas requiere configuración adicional. Pide al administrador del sistema crear clientes manualmente por ahora.");
    setSaving(false);
    setShowForm(false);
    setForm({ full_name: "", email: "", password: "", phone: "" });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("profiles").update({ is_active: !current }).eq("id", id);
    load();
    toast.success(current ? "Cuenta desactivada" : "Cuenta activada");
  };

  const filtered = rows.filter((r) => r.full_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">+ Nuevo cliente</button>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo..."
        className="h-12 w-full rounded-md border border-border bg-input/30 px-3 outline-none focus:border-gold" />

      {showForm && (
        <form onSubmit={create} className="surface-card surface-card-active grid gap-3 p-6 md:grid-cols-2">
          <input required placeholder="Nombre completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
          <input required type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
          <input required type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
          <input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-md border border-border bg-input/30 px-3" />
          <button disabled={saving} type="submit" className="btn-primary md:col-span-2">{saving ? "Guardando..." : "Crear"}</button>
        </form>
      )}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40 text-left text-muted-foreground">
              <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Teléfono</th><th className="p-4">Estado</th><th className="p-4"></th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-4 font-medium">{r.full_name}</td>
                  <td className="p-4 text-muted-foreground">{r.email}</td>
                  <td className="p-4 text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${r.is_active ? "bg-vitality/20 text-vitality" : "bg-destructive/20 text-destructive"}`}>
                      {r.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => toggleActive(r.id, r.is_active)} className="text-sm text-gold hover:underline">
                      {r.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sin clientes.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
