/**
 * Navigation model — the 12 operations-console sections.
 */
import {
  LayoutDashboard, Boxes, TrendingUp, BrainCircuit, Sun, BatteryCharging,
  PlugZap, CalendarClock, Leaf, GanttChartSquare, BellRing, FileBarChart,
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
  { to: '/app/forecast', label: 'Energy Forecast', shortLabel: 'Forecast', icon: TrendingUp },
  { to: '/app/optimizer', label: 'AI Optimizer', shortLabel: 'AI', icon: BrainCircuit },
  { to: '/app/renewables', label: 'Renewable Generation', shortLabel: 'Renewables', icon: Sun },
  { to: '/app/battery', label: 'Battery Storage', shortLabel: 'Battery', icon: BatteryCharging },
  { to: '/app/grid', label: 'Grid & Load', shortLabel: 'Grid', icon: PlugZap },
  { to: '/app/scheduler', label: 'Scheduler', shortLabel: 'Schedule', icon: CalendarClock },
  { to: '/app/carbon', label: 'Carbon Intelligence', shortLabel: 'Carbon', icon: Leaf },
  { to: '/app/gantt', label: 'Gantt Timeline', shortLabel: 'Gantt', icon: GanttChartSquare },
  { to: '/app/alerts', label: 'Alerts', shortLabel: 'Alerts', icon: BellRing },
  { to: '/app/reports', label: 'Reports', shortLabel: 'Reports', icon: FileBarChart },
];
