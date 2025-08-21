import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  UserCheck, 
  Search, 
  Trophy,
  X,
  Check,
  Trash2
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageTransition from '@/components/PageTransition';

interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
  };
  createdAt: string;
}

interface Friend {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  overallElo: number;
  friendshipId: string;
}

interface User {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  overallElo: number;
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'find' | 'requests' | 'friends'>('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Load initial data
  useEffect(() => {
    if (session) {
      loadFriendRequests();
      loadFriends();
    }
  }, [session]);

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends?action=requests');
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends?action=friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        setMessage('Friend request sent!');
        // Remove from search results
        setSearchResults(prev => prev.filter(user => user.id !== targetUserId));
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to send friend request');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setMessage('Failed to send friend request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      if (response.ok) {
        if (action === 'accept') {
          setMessage('Friend request accepted!');
          // Reload both lists
          loadFriendRequests();
          loadFriends();
        } else {
          setMessage('Friend request rejected');
          loadFriendRequests();
        }
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to respond to request');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      setMessage('Failed to respond to request');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const removeFriend = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        setMessage('Friend removed');
        loadFriends();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to remove friend');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setMessage('Failed to remove friend');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
            <p className="text-gray-600">Connect with other athletes and compare your progress</p>
          </motion.div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-lg text-center"
            >
              {message}
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
            {[
              { id: 'find', label: 'Find Friends', icon: UserPlus },
              { id: 'requests', label: 'Requests', icon: UserCheck, count: friendRequests.length },
              { id: 'friends', label: 'Your Friends', icon: Users, count: friends.length }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'find' | 'requests' | 'friends')}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Find Friends Tab */}
            {activeTab === 'find' && (
              <div>
                <div className="mb-6">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Search by name or username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={searchUsers}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {user.image ? (
                              <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
                            ) : (
                              <UserPlus className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {user.displayName || user.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Trophy className="w-4 h-4" />
                              <span>ELO: {user.overallElo}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <UserPlus className="w-4 h-4 mr-2 inline" />
                          Add Friend
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Friend Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                {friendRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {friendRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {request.fromUser.image ? (
                              <img src={request.fromUser.image} alt="" className="w-12 h-12 rounded-full" />
                            ) : (
                              <UserPlus className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.fromUser.displayName || request.fromUser.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Wants to be your friend
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => respondToRequest(request.id, 'accept')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Check className="w-4 h-4 mr-2 inline" />
                            Accept
                          </button>
                          <button
                            onClick={() => respondToRequest(request.id, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <X className="w-4 h-4 mr-2 inline" />
                            Reject
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Friends List Tab */}
            {activeTab === 'friends' && (
              <div>
                {friends.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No friends yet</p>
                    <p className="text-sm">Search for other athletes to add as friends</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {friend.image ? (
                              <img src={friend.image} alt="" className="w-12 h-12 rounded-full" />
                            ) : (
                              <Users className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {friend.displayName || friend.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Trophy className="w-4 h-4" />
                              <span>ELO: {friend.overallElo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/compare/${friend.id}`)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Compare
                          </button>
                          <button
                            onClick={() => removeFriend(friend.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
