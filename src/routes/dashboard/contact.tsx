import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/contact")({ component: Contact });

function Contact() {
  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <h1 className="font-display text-3xl font-bold">Contactar a tu Entrenador</h1>
      <p className="text-muted-foreground">Una conversación directa, sin vueltas.</p>
      <div className="surface-card surface-card-active p-8">
        <p className="mb-6 text-muted-foreground">Disponible de lunes a sábado de 8:00 a 21:00.</p>
        <a href="https://wa.me/56912345678" target="_blank" rel="noreferrer" className="btn-primary mx-auto">
          <MessageCircle className="mr-2 h-5 w-5" /> Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}
