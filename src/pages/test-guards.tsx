import React from 'react';
import { useToast } from '@/components/ui/Toast';
import { METRIC_GUARDS } from '@/server/guards';

export default function TestGuards() {
  const { addToast } = useToast();

  const testMetricCreationGuard = async () => {
    try {
      const response = await fetch('/api/metrics/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Custom Metric', unit: 'lbs' }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        addToast({
          type: 'error',
          title: 'Metric Creation Blocked',
          message: result.error
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to test metric creation guard'
      });
    }
  };

  const testAllowedMetric = () => {
    const isValid = METRIC_GUARDS.isAllowedMetric('bench_press');
    addToast({
      type: isValid ? 'success' : 'error',
      title: 'Metric Validation',
      message: isValid ? 'bench_press is an allowed metric' : 'bench_press is not allowed'
    });
  };

  const testInvalidMetric = () => {
    const isValid = METRIC_GUARDS.isAllowedMetric('custom_metric');
    addToast({
      type: isValid ? 'success' : 'error',
      title: 'Metric Validation',
      message: isValid ? 'custom_metric is allowed' : 'custom_metric is not allowed'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Metric Creation Guards Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Server-Side Guards
            </h2>
            <p className="text-gray-600 mb-4">
              These tests demonstrate that user-created metrics are completely blocked.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={testMetricCreationGuard}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Metric Creation Guard (Should Fail)
              </button>
              
              <button
                onClick={testAllowedMetric}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Valid Metric (bench_press)
              </button>
              
              <button
                onClick={testInvalidMetric}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Invalid Metric (custom_metric)
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Allowed Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { class: 'The Titan', metrics: ['bench_press', 'squat', 'deadlift', 'bicep_curl', 'shoulder_press'] },
                { class: 'The Beast', metrics: ['power_clean', 'snatch', 'clean_jerk', 'farmers_walk', 'atlas_stone'] },
                { class: 'The Body Weight Master', metrics: ['pull_ups', 'push_ups', 'handstand_hold', 'muscle_ups', 'l_sit_hold'] },
                { class: 'The Hunter Gatherer', metrics: ['5k_time', '10k_time', 'half_marathon_time', 'marathon_time', 'vertical_jump'] },
                { class: 'The Super Athlete', metrics: ['100m_sprint', '400m_sprint', 'mile_time', 'broad_jump', 'box_jump'] }
              ].map((classData) => (
                <div key={classData.class} className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-800 mb-2">{classData.class}</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {classData.metrics.map((metric) => (
                      <li key={metric} className="flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Guard Implementation
            </h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-md text-sm font-mono overflow-x-auto">
              <pre>{`// Server-side guard
export const METRIC_GUARDS = {
  preventUserMetricCreation: () => ({
    ok: false,
    error: "User metrics are disabled. Only predefined metrics are available."
  }),
  
  isAllowedMetric: (slug: string): boolean => {
    const allowedSlugs = [
      'bench_press', 'squat', 'deadlift', 'bicep_curl', 'shoulder_press',
      'power_clean', 'snatch', 'clean_jerk', 'farmers_walk', 'atlas_stone',
      'pull_ups', 'push_ups', 'handstand_hold', 'muscle_ups', 'l_sit_hold',
      '5k_time', '10k_time', 'half_marathon_time', 'marathon_time', 'vertical_jump',
      '100m_sprint', '400m_sprint', 'mile_time', 'broad_jump', 'box_jump'
    ];
    
    return allowedSlugs.includes(slug);
  }
};`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
