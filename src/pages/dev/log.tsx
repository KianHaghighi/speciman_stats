import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Download, 
  Trash2, 
  Search,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug
} from 'lucide-react';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  ts: string;
  scope: string;
  msg: string;
  userId?: string;
  reqId?: string;
  meta?: Record<string, unknown>;
}

export default function DevLogViewer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not in development or not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (process.env.NODE_ENV !== 'development') {
      router.push('/');
      return;
    }
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
  }, [session, status, router]);

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dev/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (session && process.env.NODE_ENV === 'development') {
      fetchLogs();
    }
  }, [session]);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Scope filter
    if (scopeFilter) {
      filtered = filtered.filter(log => 
        log.scope.toLowerCase().includes(scopeFilter.toLowerCase())
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.msg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.reqId?.includes(searchQuery) ||
        log.userId?.includes(searchQuery) ||
        JSON.stringify(log.meta || {}).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, levelFilter, scopeFilter, searchQuery]);

  const clearLogs = async () => {
    try {
      await fetch('/api/dev/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `${log.ts} [${log.level.toUpperCase()}] [${log.scope}] ${log.reqId ? `[${log.reqId}]` : ''} ${log.userId ? `[user:${log.userId}]` : ''} ${log.msg} ${JSON.stringify(log.meta || {})}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (process.env.NODE_ENV !== 'development') {
    return <div className="flex items-center justify-center min-h-screen">Development only</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Terminal className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Development Logs</h1>
              <p className="text-gray-600">Last 500 log entries</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={downloadLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={clearLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            {/* Scope Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scope
              </label>
              <input
                type="text"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                placeholder="Filter by scope..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(l => l.level === 'warn').length}
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.level === 'info').length}
            </div>
            <div className="text-sm text-gray-600">Info</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-600">
              {logs.filter(l => l.level === 'debug').length}
            </div>
            <div className="text-sm text-gray-600">Debug</div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Log Entries ({filteredLogs.length})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No logs match your filters
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                    className={`p-4 border-l-4 ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                          <span>{new Date(log.ts).toLocaleString()}</span>
                          <span>•</span>
                          <span className="font-medium">{log.scope}</span>
                          {log.reqId && (
                            <>
                              <span>•</span>
                              <span className="font-mono bg-gray-100 px-1 rounded">
                                {log.reqId}
                              </span>
                            </>
                          )}
                          {log.userId && (
                            <>
                              <span>•</span>
                              <span className="font-mono bg-blue-100 px-1 rounded">
                                user:{log.userId}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 font-medium mb-1">
                          {log.msg}
                        </div>
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                            {JSON.stringify(log.meta, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
