/**
 * Media catalog — single source of truth for imagery used across the app.
 * All files live in public/assets/. Reference by key so assets can be
 * swapped/optimized without touching component code.
 */
export interface MediaAsset {
  src: string;
  alt: string;
}

const asset = (file: string, alt: string): MediaAsset => ({
  src: `${import.meta.env.BASE_URL}assets/${file}`,
  alt,
});

export const MEDIA = {
  solarFarmAerial: asset('solar-farm-aerial.jpg', 'Aerial view of a utility-scale solar farm'),
  solarCloseup: asset('solar-closeup.jpg', 'Close-up of photovoltaic solar panels'),
  solarRooftop: asset('solar-rooftop.jpg', 'Rooftop solar panel installation'),
  windTurbinesDusk: asset('wind-turbines-dusk.jpg', 'Wind turbines against a dusk sky'),
  windFarm: asset('wind-farm.jpg', 'Wind farm on open terrain'),
  windSingle: asset('wind-single.jpg', 'Single wind turbine at sunset'),
  gridPowerlines: asset('grid-powerlines.jpg', 'High-voltage transmission lines at dusk'),
  dataCenter: asset('data-center.jpg', 'Data center server corridor'),
  controlAnalytics: asset('control-analytics.jpg', 'Energy analytics dashboards in an operations room'),
  engineerField: asset('engineer-field.jpg', 'Engineer inspecting renewable energy equipment'),
  operatorDark: asset('operator-dark.jpg', 'Operators working in a dark control room'),
  energyIndustrial: asset('energy-industrial.jpg', 'Industrial energy infrastructure'),
  batteryStorage: asset('battery-storage.webp', 'Grid-scale battery storage containers'),
  solarSunset: asset('solar-sunset.webp', 'Solar array at sunset'),
  windSunset: asset('wind-sunset.webp', 'Wind turbines at golden hour'),
} as const;

export type MediaKey = keyof typeof MEDIA;
