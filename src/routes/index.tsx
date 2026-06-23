import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroBg from "@/assets/hero-warriors.png.asset.json";
import { Activity, Heart, Shield, Sparkles, Users, MessageCircle, ClipboardCheck, TrendingUp, GraduationCap, Award, Mail, Phone, Footprints, HandHeart, Infinity as InfinityIcon, Compass, Flame, Mountain, Accessibility, Baby } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ragnarok Fit — Entrena como un guerrero. Vive más tiempo." },
      { name: "description", content: "Acompañamiento personalizado para mejorar tu salud, movilidad y calidad de vida. Dirigido por Erner Garrido Ibarra, Magíster en Educación Física." },
    ],
  }),
  component: Landing,
});

const WHATSAPP_URL = "https://wa.me/56965612792";
const PHONE_DISPLAY = "+56 9 6561 2792";
const PHONE_LINK = "tel:+56965612792";
const EMAIL = "e.garrido03@ufromail.cl";
const EMAIL_LINK = "mailto:e.garrido03@ufromail.cl";

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo className="h-16 w-auto md:h-20" />
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="btn-secondary text-sm">Ingresar</Link>
            <Link to="/signup" className="btn-primary text-sm">Crear cuenta</Link>
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
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-secondary">
              <MessageCircle className="mr-2 h-5 w-5" /> Hablar por WhatsApp
            </a>
            <a href="#coach" className="btn-secondary">Conocer al Coach</a>
          </div>
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* El Camino */}
      <section id="camino" className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="absolute inset-0 knot-pattern opacity-25 dark:opacity-30" aria-hidden />
        <div className="relative">
          <p className="eyebrow text-center">Capítulo I</p>
          <h2 className="mt-2 text-center font-display text-4xl uppercase tracking-wide md:text-5xl">
            El Camino del <span className="text-gold">Guerrero</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center font-body text-lg italic text-muted-foreground">
            Un proceso claro, guiado paso a paso.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { n: "I", t: "Evaluación inicial", d: "Conocemos tu estado actual, objetivos y limitaciones." },
              { n: "II", t: "Plan personalizado", d: "Diseñamos una ruta a tu medida." },
              { n: "III", t: "Entrenamiento guiado", d: "Sesiones presenciales con supervisión profesional." },
              { n: "IV", t: "Seguimiento continuo", d: "Revisión de progreso en tu portal personal." },
            ].map((s) => (
              <div key={s.n} className="surface-card surface-card-active p-6">
                <div className="font-display text-4xl font-bold text-gold">{s.n}</div>
                <h3 className="mt-3 font-display text-lg uppercase tracking-wider">{s.t}</h3>
                <p className="mt-2 font-body text-base text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* Coach / Fundador */}
      <section id="coach" className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="absolute inset-0 knot-pattern opacity-20 dark:opacity-30" aria-hidden />
        <div className="relative">
          <p className="eyebrow text-center">Capítulo II · Fundador</p>
          <h2 className="mt-2 text-center font-display text-4xl uppercase tracking-wide md:text-5xl">
            Conoce a tu <span className="text-gold">Coach</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center font-body text-lg italic text-muted-foreground">
            Detrás de cada guerrero hay un guía. Detrás de Ragnarok Fit, hay un profesional dedicado a tu evolución.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-5">
            {/* Portrait / Identity */}
            <div className="surface-card surface-card-active lg:col-span-2 p-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-gold/20 blur-xl" aria-hidden />
                <div className="relative h-40 w-40 rounded-full border-2 border-gold bg-gradient-to-br from-navy to-background flex items-center justify-center font-rune text-6xl text-gold">
                  EG
                </div>
              </div>
              <p className="eyebrow mt-6">Entrenador Principal</p>
              <h3 className="mt-2 font-display text-2xl uppercase tracking-wider text-gold">
                Erner Garrido Ibarra
              </h3>
              <p className="mt-3 font-body text-base italic text-muted-foreground">
                "Tu fuerza no se mide en kilos, se mide en años de vida con energía."
              </p>

              <div className="mt-6 w-full space-y-2 text-left">
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-primary w-full">
                  <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                </a>
                <a href={PHONE_LINK} className="btn-secondary w-full">
                  <Phone className="mr-2 h-4 w-4" /> {PHONE_DISPLAY}
                </a>
                <a href={EMAIL_LINK} className="btn-secondary w-full text-xs">
                  <Mail className="mr-2 h-4 w-4" /> {EMAIL}
                </a>
              </div>
            </div>

            {/* Credentials */}
            <div className="lg:col-span-3 space-y-4">
              <div className="surface-card p-6">
                <p className="font-body text-lg leading-relaxed text-foreground/90">
                  Más de una década formando personas que buscan recuperar movilidad, fuerza y bienestar.
                  Mi enfoque combina <span className="text-gold font-semibold">ciencia del entrenamiento</span>,
                  acompañamiento cercano y hábitos sostenibles para que el progreso sea <em>real y duradero</em>.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: GraduationCap,
                    title: "Magíster en Educación Física",
                    detail: "Mención Condición Física y Vida Saludable",
                  },
                  {
                    icon: GraduationCap,
                    title: "Profesor de Educación Física",
                    detail: "Deportes y Recreación",
                  },
                  {
                    icon: Award,
                    title: "Kettlebell Fitness · Nivel 1",
                    detail: "Instructor certificado",
                  },
                  {
                    icon: Award,
                    title: "Kettlebell Fitness · Nivel 2",
                    detail: "Instructor certificado avanzado",
                  },
                ].map((c) => (
                  <div key={c.title} className="surface-card p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md border border-gold/40 bg-gold/10 p-2">
                        <c.icon className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <h4 className="font-display text-sm uppercase tracking-wider text-foreground">{c.title}</h4>
                        <p className="mt-1 font-body text-sm text-muted-foreground">{c.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <p className="eyebrow text-center">Capítulo III</p>
        <h2 className="mt-2 text-center font-display text-4xl uppercase tracking-wide md:text-5xl">
          Tu Legado <span className="text-gold">Empieza Aquí</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center font-body text-lg italic text-muted-foreground">
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
              <h3 className="mt-4 font-display text-lg uppercase tracking-wider">{b.t}</h3>
              <p className="mt-2 font-body text-base text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="runic-divider mx-auto max-w-3xl" />

      {/* Platform preview */}
      <section className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="absolute inset-0 knot-pattern opacity-20 dark:opacity-25" aria-hidden />
        <div className="relative">
          <p className="eyebrow text-center">Capítulo IV</p>
          <h2 className="mt-2 text-center font-display text-4xl uppercase tracking-wide md:text-5xl">
            Tu <span className="text-gold">Portal Personal</span>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { i: TrendingUp, t: "Tu progreso", d: "Peso, grasa y masa muscular en gráficos claros." },
              { i: ClipboardCheck, t: "Historial completo", d: "Cada medición queda registrada." },
              { i: Users, t: "Perfil físico", d: "Tus datos base y objetivos." },
              { i: MessageCircle, t: "Recomendaciones", d: "Mensajes directos de tu entrenador." },
            ].map((b) => (
              <div key={b.t} className="surface-card p-6">
                <b.i className="h-7 w-7 text-gold" />
                <h3 className="mt-4 font-display text-base uppercase tracking-wider">{b.t}</h3>
                <p className="mt-2 font-body text-base text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="eyebrow">Contacto</p>
        <h2 className="mt-2 font-display text-4xl uppercase tracking-wide md:text-5xl">
          Habla con <span className="text-gold">Erner</span>
        </h2>
        <p className="mt-3 font-body text-lg italic text-muted-foreground">
          ¿Listo para comenzar? Escríbeme directamente y conversemos sobre tu objetivo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-primary">
            <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
          </a>
          <a href={PHONE_LINK} className="btn-secondary">
            <Phone className="mr-2 h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <a href={EMAIL_LINK} className="btn-secondary">
            <Mail className="mr-2 h-4 w-4" /> Correo
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <Logo className="mx-auto mb-3 h-16 w-auto" />
        <p className="font-display uppercase tracking-wider text-foreground">Erner Garrido Ibarra</p>
        <p className="mt-1 text-xs">Magíster en Educación Física · Instructor Kettlebell Nivel 1 y 2</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <span className="opacity-40">·</span>
          <a href={PHONE_LINK} className="inline-flex items-center gap-1 text-gold hover:underline">
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <span className="opacity-40">·</span>
          <a href={EMAIL_LINK} className="inline-flex items-center gap-1 text-gold hover:underline">
            <Mail className="h-4 w-4" /> {EMAIL}
          </a>
        </div>
        <p className="mt-6">© {new Date().getFullYear()} Ragnarok Fit. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
