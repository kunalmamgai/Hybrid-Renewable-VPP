/**
 * Navigation model — the operations-console sections.
 */
import {
  LayoutDashboard, Boxes, BrainCircuit, Sun, BatteryCharging,
  PlugZap, CalendarClock, BellRing, FileBarChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Match exactly (route root) */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/twin', label: 'Digital Twin', shortLabel: 'Twin', icon: Boxes },
  { to: '/app/optimizer', label: 'AI Optimizer', shortLabel: 'AI', icon: BrainCircuit },
  { to: '/app/renewables', label: 'Renewable Generation', shortLabel: 'Renewables', icon: Sun },
  { to: '/app/battery', label: 'Battery Storage', shortLabel: 'Battery', icon: BatteryCharging },
  { to: '/app/grid', label: 'Grid & Load', shortLabel: 'Grid', icon: PlugZap },
  { to: '/app/scheduler', label: 'Scheduler', shortLabel: 'Schedule', icon: CalendarClock },
  { to: '/app/alerts', label: 'Alerts', shortLabel: 'Alerts', icon: BellRing },
  { to: '/app/reports', label: 'Reports', shortLabel: 'Reports', icon: FileBarChart },
];
