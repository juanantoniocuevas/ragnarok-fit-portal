import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Phone, Mail, GraduationCap, Award } from "lucide-react";

export const Route = createFileRoute("/dashboard/contact")({ component: Contact });

const WHATSAPP_URL = "https://wa.me/56965612792";
const PHONE_DISPLAY = "+56 9 6561 2792";
const PHONE_LINK = "tel:+56965612792";
const EMAIL = "e.garrido03@ufromail.cl";
const EMAIL_LINK = "mailto:e.garrido03@ufromail.cl";

function Contact() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <p className="eyebrow">Tu Coach</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wider">
          Contacta a <span className="text-gold">Erner Garrido</span>
        </h1>
        <p className="mt-2 text-muted-foreground italic">Una conversación directa, sin vueltas.</p>
      </div>

      <div className="surface-card surface-card-active p-8 text-center">
        <h2 className="font-display text-xl uppercase tracking-wider text-gold">Erner Garrido Ibarra</h2>
        <p className="mt-1 text-sm text-muted-foreground">Entrenador Principal · Fundador</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 text-left">
          {[
            { i: GraduationCap, t: "Magíster en Educación Física" },
            { i: GraduationCap, t: "Profesor de Educación Física" },
            { i: Award, t: "Kettlebell Fitness Nivel 1" },
            { i: Award, t: "Kettlebell Fitness Nivel 2" },
          ].map((c) => (
            <div key={c.t} className="flex items-center gap-2 rounded border border-border/60 p-2">
              <c.i className="h-4 w-4 text-gold shrink-0" />
              <span className="text-sm">{c.t}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 mb-4 text-sm text-muted-foreground">Disponible de lunes a sábado de 8:00 a 21:00.</p>

        <div className="flex flex-col gap-2">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn-primary">
            <MessageCircle className="mr-2 h-5 w-5" /> Abrir WhatsApp
          </a>
          <a href={PHONE_LINK} className="btn-secondary">
            <Phone className="mr-2 h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <a href={EMAIL_LINK} className="btn-secondary">
            <Mail className="mr-2 h-4 w-4" /> {EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
