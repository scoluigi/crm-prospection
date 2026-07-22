import {
  CalendarClock,
  CheckSquare,
  KanbanSquare,
  LayoutDashboard,
  PhoneCall,
  Settings,
  Upload,
  Users,
  Users2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Clé du compteur affiché en pastille (calculé côté serveur). */
  badge?: "todo" | "relances" | "coldcall";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/aujourdhui", label: "Aujourd'hui", icon: CheckSquare, badge: "todo" },
  { href: "/cold-call", label: "Cold Call", icon: PhoneCall, badge: "coldcall" },
  { href: "/relances", label: "Relances", icon: CalendarClock, badge: "relances" },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/equipe", label: "Équipe", icon: Users2 },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];
