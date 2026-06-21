import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  ssr: false,
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      navigate({ to: role === "trainer" ? "/admin" : "/dashboard" });
    }
  }, [user, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user && !data.session) {
      setSent(true);
      toast.success("Te enviamos un correo de verificación");
    } else {
      toast.success("Cuenta creada");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo className="h-32 w-auto md:h-40" />
        </Link>
        <div className="surface-card p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold">Revisa tu correo</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Te enviamos un enlace de verificación a <strong className="text-foreground">{email}</strong>.
                Confirma tu correo para activar tu cuenta.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-flex">Ir a iniciar sesión</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Crear Cuenta</h1>
              <p className="mt-1 text-sm text-muted-foreground">Únete a la comunidad.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nombre completo</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100}
                    className="h-12 w-full rounded-md border border-border bg-input/30 px-3 text-base outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Correo</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255}
                    className="h-12 w-full rounded-md border border-border bg-input/30 px-3 text-base outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Contraseña</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={72}
                    className="h-12 w-full rounded-md border border-border bg-input/30 px-3 text-base outline-none focus:border-gold" />
                  <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
                  {submitting ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="font-medium text-gold hover:underline">Ingresar</Link>
              </p>
            </>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-gold">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
