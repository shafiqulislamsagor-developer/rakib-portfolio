import type { StrengthIcon } from "@/lib/constants";
import {
  Blocks,
  Cloud,
  Code,
  Database,
  Gauge,
  Globe,
  Layers3,
  LayoutDashboard,
  MessagesSquare,
  Palette,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const CONTENT_ICONS: Record<StrengthIcon, LucideIcon> = {
  layers: Layers3,
  gauge: Gauge,
  blocks: Blocks,
  code: Code,
  server: Server,
  database: Database,
  globe: Globe,
  sparkles: Sparkles,
  shield: ShieldCheck,
  rocket: Rocket,
  "layout-dashboard": LayoutDashboard,
  "shopping-cart": ShoppingCart,
  smartphone: Smartphone,
  palette: Palette,
  workflow: Workflow,
  search: Search,
  cloud: Cloud,
  zap: Zap,
  users: Users,
  message: MessagesSquare,
};

/** Icon picked by the admin for a strength or service card. */
export function ContentIcon({ name, className }: { name: StrengthIcon; className?: string }) {
  const Icon = CONTENT_ICONS[name] ?? Layers3;
  return <Icon className={className} aria-hidden="true" />;
}
