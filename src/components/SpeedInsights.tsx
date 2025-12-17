import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/react";

/**
 * Speed Insights Component
 * 
 * This component integrates Vercel Speed Insights into the application to track
 * and monitor Core Web Vitals and other performance metrics.
 * 
 * Learn more: https://vercel.com/docs/speed-insights
 */
export function SpeedInsights() {
  return <VercelSpeedInsights />;
}
