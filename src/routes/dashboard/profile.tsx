import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, email, created_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) toast.error("No se pudo cargar el perfil");
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
          setEmail(data.email ?? user.email ?? "");
          setCreatedAt(data.created_at);
        }
        setLoading(false);
      });
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil actualizado");
  };

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Mi Perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">Administra tu información personal.</p>

      <div className="surface-card mt-6 p-6">
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100}
              className="h-12 w-full rounded-md border border-border bg-input/30 px-3 outline-none focus:border-gold" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Correo</label>
            <input value={email} disabled
              className="h-12 w-full rounded-md border border-border bg-input/10 px-3 text-muted-foreground" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20}
              className="h-12 w-full rounded-md border border-border bg-input/30 px-3 outline-none focus:border-gold" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Rol</label>
              <input value={role === "trainer" ? "Administrador" : "Usuario"} disabled
                className="h-12 w-full rounded-md border border-border bg-input/10 px-3 text-muted-foreground" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Miembro desde</label>
              <input value={createdAt ? new Date(createdAt).toLocaleDateString() : ""} disabled
                className="h-12 w-full rounded-md border border-border bg-input/10 px-3 text-muted-foreground" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
