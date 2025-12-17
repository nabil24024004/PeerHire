import { useEffect } from 'react';
import { SpeedInsights as VercelSpeedInsights } from '@vercel/speed-insights/react';

/**
 * SpeedInsights Component
 * 
 * Integrates Vercel Speed Insights to track Web Vitals and performance metrics.
 * This component should be included in your main app to enable performance monitoring.
 * 
 * Data is automatically sent to Vercel's dashboard after deployment.
 * Local development won't show metrics - only deployed versions will collect data.
 */
export function SpeedInsights() {
  useEffect(() => {
    // Speed Insights is automatically initialized when the component mounts
    // No additional setup needed - the tracking script is injected automatically
  }, []);

  return <VercelSpeedInsights />;
}
