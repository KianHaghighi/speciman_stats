import { GetServerSideProps } from "next";
import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import AppShell from "@/components/layout/AppShell";
import { trpc } from "@/utils/trpc";
import { z } from "zod";
import { motion } from "framer-motion";
import { Search, Video, FileText, TrendingUp, CheckCircle, AlertCircle, X } from "lucide-react";

// Zod schema for metric logging
const metricLogSchema = z.object({
  metricId: z.string().min(1, "Please select a metric"),
  value: z.number().positive("Value must be positive"),
  unit: z.string().min(1, "Unit is required"),
  videoUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(500, "Notes must be under 500 characters").optional(),
});

type MetricLogForm = z.infer<typeof metricLogSchema>;

type Props = { user: { name?: string | null; email?: string | null } };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session) {
    const cb = encodeURIComponent("/metrics/log");
    return { redirect: { destination: `/auth/login?callbackUrl=${cb}`, permanent: false } };
  }
  return { props: { user: { name: session.user?.name ?? null, email: session.user?.email ?? null } } };
};

export default function MetricsLog({ user }: Props) {
  const [formData, setFormData] = useState<MetricLogForm>({
    metricId: "",
    value: 0,
    unit: "",
    videoUrl: "",
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // tRPC queries
  const { data: metrics = [], isLoading: isLoadingMetrics, error: metricsError } = trpc.metrics.all.useQuery();
  const { data: userData } = trpc.user.me.useQuery();
  
  // Debug: Log metrics data
  useEffect(() => {
    if (metrics && metrics.length > 0) {
      console.log('Metrics loaded:', metrics.length, 'metrics');
      console.log('Sample metric:', metrics[0]);
    } else if (!isLoadingMetrics) {
      console.log('No metrics found or metrics array is empty');
    }
    if (metricsError) {
      console.error('Metrics error:', metricsError);
    }
  }, [metrics, isLoadingMetrics, metricsError]);

  // Filter metrics based on search
  const filteredMetrics = useMemo(() => {
    if (!searchQuery || !metrics || metrics.length === 0) {
      return [];
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    if (searchLower.length === 0) {
      return [];
    }
    
    return metrics.filter((metric: any) => {
      if (!metric) return false;
      
      // Check name
      const name = metric.name || '';
      const nameMatch = name.toLowerCase().includes(searchLower);
      
      // Check group if it exists
      const group = metric.group || '';
      const groupMatch = group && group.toLowerCase().includes(searchLower);
      
      // Check slug if it exists
      const slug = metric.slug || '';
      const slugMatch = slug && slug.toLowerCase().includes(searchLower);
      
      return nameMatch || groupMatch || slugMatch;
    });
  }, [searchQuery, metrics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = metricLogSchema.parse(formData);
      setIsSubmitting(true);
      
      console.log('Submitting metric:', {
        metricId: validatedData.metricId,
        value: validatedData.value,
        notes: validatedData.notes,
      });
      
      const response = await fetch('/api/metrics/add-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metricId: validatedData.metricId,
          value: validatedData.value,
          notes: validatedData.notes || undefined,
        }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response body:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to log metric');
      }

      // Show success
      const metricName = metrics.find((m: any) => m.id === formData.metricId)?.name || 'Metric';
      alert(`${metricName} logged successfully!`);
      
      // Show confetti for improvements
      if (result.hasImprovement) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      // Reset form
      setFormData({
        metricId: "",
        value: 0,
        unit: "",
        videoUrl: "",
        notes: "",
      });
      setSearchQuery("");
      
      // Reload the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        alert(`Validation error: ${error.errors[0]?.message || "Please check your input"}`);
      } else {
        alert(error instanceof Error ? error.message : 'Failed to log metric');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetricSelect = (metricId: string) => {
    const metric = metrics.find((m: any) => m.id === metricId);
    if (metric) {
      setFormData(prev => ({
        ...prev,
        metricId,
        unit: metric.unit || "",
      }));
      setSearchQuery(metric.name);
    }
  };

  return (
    <AppShell title="Log Metric">
      <Head>
        <title>Log Metric • SpecimenStats</title>
      </Head>

      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Log Your Metric
          </h1>
          <p className="text-gray-600">
            Record your latest performance and track your progress
          </p>
        </motion.div>

        {/* Confetti Effect */}
        {showConfetti && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 10,
                  rotate: 360,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Metric Logging Form */}
        <motion.div 
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Metric Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Metric *
              </label>
              {isLoadingMetrics && (
                <div className="mb-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  Loading metrics...
                </div>
              )}
              {metricsError && (
                <div className="mb-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-200">
                  <div className="font-semibold mb-1">Error loading metrics</div>
                  <div className="text-xs text-red-600">
                    {metricsError.message || 'Unknown error occurred. Please refresh the page.'}
                  </div>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-red-500">Show error details</summary>
                      <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
                        {JSON.stringify(metricsError, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={isLoadingMetrics ? "Loading metrics..." : "Type to search metrics (e.g., 'bench', 'squat')..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoadingMetrics}
                  className={`w-full pl-10 ${searchQuery ? 'pr-10' : 'pr-4'} py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !formData.metricId && searchQuery === "" ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${isLoadingMetrics ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {searchQuery && !isLoadingMetrics && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setFormData(prev => ({ ...prev, metricId: "" }));
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {!formData.metricId && searchQuery === "" && !isLoadingMetrics && (
                <p className="mt-1 text-sm text-red-600">Please search and select a metric to continue</p>
              )}
              {searchQuery && !isLoadingMetrics && (
                <p className="mt-1 text-sm text-gray-500">
                  {filteredMetrics.length > 0 
                    ? `Found ${filteredMetrics.length} metric${filteredMetrics.length !== 1 ? 's' : ''}` 
                    : searchQuery.length > 0 
                    ? `No metrics found. Try a different search term. (Total metrics: ${metrics.length})` 
                    : 'Start typing to search...'}
                </p>
              )}
              
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && !isLoadingMetrics && (
                <p className="mt-1 text-xs text-gray-400">
                  Debug: {metrics.length} metrics loaded, search: "{searchQuery}", filtered: {filteredMetrics.length}
                </p>
              )}
              
              {/* Metric Options */}
              {searchQuery.trim().length > 0 && !isLoadingMetrics && (
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg shadow-lg bg-white relative z-50">
                  {filteredMetrics.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredMetrics.map((metric: any) => (
                        <button
                          key={metric.id}
                          type="button"
                          onClick={() => handleMetricSelect(metric.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                            formData.metricId === metric.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{metric.name || 'Unnamed Metric'}</div>
                          {metric.group && (
                            <div className="text-sm text-gray-500 mt-1">{metric.group}</div>
                          )}
                          {metric.unit && !metric.group && (
                            <div className="text-sm text-gray-500 mt-1">Unit: {metric.unit}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                      <div className="mb-2">No metrics found matching "{searchQuery}"</div>
                      <div className="text-xs text-gray-400">
                        Try searching for: bench, squat, deadlift, etc.
                      </div>
                      {metrics.length === 0 && (
                        <div className="mt-3 text-xs text-red-500 font-medium">
                          ⚠️ No metrics available in database. Please check your database connection.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {formData.metricId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">Selected:</span> <span className="font-medium">{metrics.find((m: any) => m.id === formData.metricId)?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Value and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="lbs, kg, etc."
                  required
                />
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="inline w-4 h-4 mr-2" />
                Video URL (Optional)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes about this performance..."
                maxLength={500}
              />
              <div className="text-sm text-gray-500 text-right mt-1">
                {formData.notes?.length || 0}/500
              </div>
            </div>

            {/* Predicted Rank */}
            {formData.value > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Predicted Rank</span>
                </div>
                <div className="text-sm text-blue-800">
                  Based on your value of {formData.value} {formData.unit}, this metric would likely place you in the{' '}
                  <span className="font-semibold">
                    {formData.value >= 1000 ? 'Platinum' : formData.value >= 500 ? 'Gold' : formData.value >= 200 ? 'Silver' : 'Bronze'}
                  </span> tier.
                  {formData.value >= 1000 && (
                    <div className="mt-2 flex items-center text-amber-700">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">This will be marked as PENDING for review.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || !formData.metricId || formData.value <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title={
                  !formData.metricId 
                    ? "Please select a metric first" 
                    : formData.value <= 0 
                    ? "Please enter a value greater than 0" 
                    : ""
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Logging Metric...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Log Metric
                  </div>
                )}
              </button>
              {(!formData.metricId || formData.value <= 0) && (
                <p className="mt-2 text-sm text-center text-gray-600">
                  {!formData.metricId && "⚠️ Select a metric to enable logging"}
                  {formData.metricId && formData.value <= 0 && "⚠️ Enter a value greater than 0"}
                </p>
              )}
            </div>
          </form>
        </motion.div>

        {/* Recent Metrics */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Metrics</h2>
          <div className="space-y-3">
            {/* This will be populated by the RecentActivity component */}
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📊</div>
              <p>Your logged metrics will appear here</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
