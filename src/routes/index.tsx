import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroBg from "@/assets/hero-warriors.png.asset.json";
import { Activity, Heart, Shield, Sparkles, Users, MessageCircle, ClipboardCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ragnarok Fit — Entrena como un guerrero. Vive más tiempo." },
      { name: "description", content: "Acompañamiento personalizado para mejorar tu salud, movilidad y calidad de vida." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo className="h-16 w-auto md:h-20" />
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="btn-secondary text-sm">Mi Cuenta</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden drip-top">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg.url})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/85" aria-hidden />
        <div className="absolute inset-0 knot-pattern opacity-30 dark:opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--color-gold)_15%,transparent),_transparent_65%)]" aria-hidden />

        {/* Side gold braids — desktop only */}
        <div className="braid-vertical absolute left-0 top-0 hidden h-full w-10 opacity-60 lg:block" aria-hidden />
        <div className="braid-vertical absolute right-0 top-0 hidden h-full w-10 opacity-60 lg:block" aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center md:py-36">
          <Logo className="mx-auto mb-8 h-44 w-auto md:h-60 lg:h-72 drop-shadow-2xl" />
          <p className="eyebrow mb-4">Identidad · Disciplina · Legado</p>
          <h1 className="font-rune text-5xl leading-none text-gold md:text-7xl lg:text-8xl">
            Entrena como un guerrero.
          </h1>
          <h2 className="mt-4 font-display text-2xl uppercase tracking-[0.3em] text-foreground/90 md:text-3xl">
            Vive más tiempo.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl font-body text-lg italic text-foreground/85 md:text-xl">
            Ragnarok Fit — acompañamiento personalizado para mejorar tu salud, movilidad y calidad de vida.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/login" className="btn-primary">Ingresar a Mi Cuenta</Link>
            <a href="#camino" className="btn-secondary">Conocer el Programa</a>
          </div>
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* El Camino */}
      <section id="camino" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">El Camino del Guerrero</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Un proceso claro, guiado paso a paso.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { n: "I", t: "Evaluación inicial", d: "Conocemos tu estado actual, objetivos y limitaciones." },
            { n: "II", t: "Plan personalizado", d: "Diseñamos una ruta a tu medida." },
            { n: "III", t: "Entrenamiento guiado", d: "Sesiones presenciales con supervisión profesional." },
            { n: "IV", t: "Seguimiento continuo", d: "Revisión de progreso en tu portal personal." },
          ].map((s) => (
            <div key={s.n} className="surface-card surface-card-active p-6">
              <div className="font-display text-3xl text-gold">{s.n}</div>
              <h3 className="mt-3 font-display text-xl">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Tu Legado Empieza Aquí</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Más años con energía. Más fuerza para lo que importa.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { i: Activity, t: "Mejor movilidad", d: "Recupera rango y libertad de movimiento." },
            { i: Shield, t: "Fuerza funcional", d: "Aplicada a tu día a día." },
            { i: Heart, t: "Equilibrio", d: "Previene caídas y gana confianza." },
            { i: Sparkles, t: "Independencia", d: "Mantén autonomía toda la vida." },
            { i: TrendingUp, t: "Calidad de vida", d: "Más energía, mejor descanso." },
            { i: Users, t: "Apoyo profesional", d: "Un equipo que te acompaña." },
          ].map((b) => (
            <div key={b.t} className="surface-card p-6">
              <b.i className="h-8 w-8 text-gold" />
              <h3 className="mt-4 font-display text-xl">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* Platform preview */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Tu Portal Personal</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { i: TrendingUp, t: "Tu progreso", d: "Peso, grasa y masa muscular en gráficos claros." },
            { i: ClipboardCheck, t: "Historial completo", d: "Cada evaluación queda registrada." },
            { i: Users, t: "Asistencias", d: "Registro mensual de tus clases." },
            { i: MessageCircle, t: "Recomendaciones", d: "Mensajes directos de tu entrenador." },
          ].map((b) => (
            <div key={b.t} className="surface-card p-6">
              <b.i className="h-7 w-7 text-gold" />
              <h3 className="mt-4 font-display text-lg">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-bold md:text-4xl">Habla con Nosotros</h2>
        <p className="mt-3 text-muted-foreground">¿Listo para comenzar? Escríbenos directamente.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer" className="btn-primary">
            <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
          </a>
          <Link to="/login" className="btn-secondary">Mi Cuenta</Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <Logo className="mx-auto mb-3 h-16 w-auto" />
        © {new Date().getFullYear()} Ragnarok Fit. Todos los derechos reservados.
      </footer>
    </div>
  );
}
