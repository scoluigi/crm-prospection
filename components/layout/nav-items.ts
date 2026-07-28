import { BookOpen, Rocket, Settings, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Leads", icon: Users },
  { href: "/classement", label: "Classement", icon: Trophy },
  { href: "/process", label: "Process", icon: Rocket },
  { href: "/guide", label: "Guide", icon: BookOpen },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];
