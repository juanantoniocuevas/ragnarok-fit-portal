import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { role, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "trainer" ? "/admin" : "/dashboard" });
    }
  }, [user, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error("Credenciales incorrectas");
      return;
    }
    toast.success("Bienvenido");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo className="h-32 w-auto md:h-40" />
        </Link>
        <div className="surface-card p-8">
          <h1 className="font-display text-2xl font-bold">Ingresar a Mi Cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accede a tu portal personal.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-md border border-border bg-input/30 px-3 text-base outline-none focus:border-gold" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-md border border-border bg-input/30 px-3 text-base outline-none focus:border-gold" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿No tienes cuenta? Habla con tu entrenador.
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-gold">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
