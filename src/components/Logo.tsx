import { useTheme } from "@/lib/theme-context";

export function Logo({ variant, className = "h-12 w-auto" }: { variant?: "gold" | "navy"; className?: string }) {
  const { theme } = useTheme();
  const resolved = variant ?? (theme === "light" ? "navy" : "gold");
  const src = resolved === "navy" ? "/logo-navy.png" : "/logo-gold.png";
  return <img src={src} alt="Ragnarok Fit" className={className} loading="eager" />;
}
