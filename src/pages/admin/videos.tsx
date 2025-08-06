import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { trpc } from '@/utils/trpc';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiEye, FiClock } from 'react-icons/fi';
import { toast } from 'sonner';

export default function AdminVideosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: pendingVideos, isLoading, refetch } = trpc.user.getPendingVideos.useQuery();
  const approveVideo = trpc.user.approveVideo.useMutation({
    onSuccess: () => {
      toast.success('Video approved successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve video: ${error.message}`);
    },
  });

  const rejectVideo = trpc.user.rejectVideo.useMutation({
    onSuccess: () => {
      toast.success('Video rejected successfully');
      setRejectReason('');
      setSelectedVideo(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject video: ${error.message}`);
    },
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    router.replace('/dashboard');
    return null;
  }

  const handleApprove = (videoId: string) => {
    approveVideo.mutate({ videoId });
  };

  const handleReject = (videoId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectVideo.mutate({ videoId, reason: rejectReason });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Video Verification Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review and approve/reject submitted video proofs
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : pendingVideos && pendingVideos.length > 0 ? (
          <div className="grid gap-6">
            {pendingVideos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <FiClock className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Pending Review
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          User
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {video.user.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {video.user.email}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Metric
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {video.metric.name}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Video Proof
                      </h3>
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <video
                          src={video.url}
                          controls
                          className="w-full h-full object-cover"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>

                    {selectedVideo === video.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4"
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Provide a reason for rejection..."
                        />
                      </motion.div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprove(video.id)}
                        disabled={approveVideo.isPending}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      
                      {selectedVideo === video.id ? (
                        <button
                          onClick={() => handleReject(video.id)}
                          disabled={rejectVideo.isPending}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-md transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                          <span>Confirm Reject</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedVideo(video.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      )}
                      
                      {selectedVideo === video.id && (
                        <button
                          onClick={() => {
                            setSelectedVideo(null);
                            setRejectReason('');
                          }}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiEye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No pending videos
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All video submissions have been reviewed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 