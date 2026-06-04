import logoGold from "@/assets/logo-gold.png.asset.json";
import logoNavy from "@/assets/logo-navy.png.asset.json";

export function Logo({ variant = "gold", className = "h-12 w-auto" }: { variant?: "gold" | "navy"; className?: string }) {
  const src = variant === "gold" ? logoGold.url : logoNavy.url;
  return <img src={src} alt="Ragnarok Fit" className={className} loading="eager" />;
}
