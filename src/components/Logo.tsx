import logoGold from "@/assets/logo-gold-transparent.png.asset.json";
import logoNavy from "@/assets/logo-navy-transparent.png.asset.json";
import { useTheme } from "@/lib/theme-context";

export function Logo({ variant, className = "h-12 w-auto" }: { variant?: "gold" | "navy"; className?: string }) {
  const { theme } = useTheme();
  const resolved = variant ?? (theme === "light" ? "navy" : "gold");
  const src = resolved === "navy" ? logoNavy.url : logoGold.url;
  return <img src={src} alt="Ragnarok Fit" className={className} loading="eager" />;
}
