import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ReactJson = dynamic(() => import('@microlink/react-json-view'), {
  ssr: false,
});

interface Log {
  id: number;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  origin: string | null;
  message: string;
  payload: any;
  created_at: string;
}

interface LogsResponse {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasPayloadFilter, setHasPayloadFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage on mount and focus input
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Save search term to recent searches
  const saveToRecentSearches = useCallback((term: string) => {
    if (!term.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
        saveToRecentSearches(searchTerm);
      }
      if (hasPayloadFilter) params.append('hasPayload', 'true');
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const res = await fetch(`/api/logs?${params.toString()}`);
      const data: LogsResponse = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, hasPayloadFilter, page, limit, saveToRecentSearches]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, hasPayloadFilter, page, limit, fetchLogs]);

  // Auto-refresh logs every second
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleReset = () => {
    setSearchTerm('');
    setHasPayloadFilter(false);
    setPage(1);
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        setTotal(0);
        setTotalPages(0);
        setPage(1);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const handleViewPayload = (log: Log) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const handleQuickSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <>
      <Head>
        <title>Logly - Logs Dashboard</title>
      </Head>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-6">Logs</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              ref={searchInputRef}
              placeholder="Search by origin or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hasPayload"
              checked={hasPayloadFilter}
              onCheckedChange={(checked) =>
                setHasPayloadFilter(checked as boolean)
              }
            />
            <label
              htmlFor="hasPayload"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Has Payload
            </label>
          </div>
          <Button onClick={handleReset} variant="outline" disabled={loading}>
            Reset
          </Button>
          <Button onClick={handleClearLogs} variant="destructive" disabled={loading}>
            Clear All Logs
          </Button>
        </div>

        {/* Quick Search Pills */}
        {recentSearches.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Recent searches:</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  <span>{term}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(term);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Created At</TableHead>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[150px]">Origin</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[200px]">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex justify-center">
                    <span className="loader"></span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => handleViewPayload(log)}
                  className="cursor-pointer"
                >
                  <TableCell className="text-sm">
                    {new Date(log.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}{' '}
                    {new Date(log.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      log.level === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                      log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                      log.level === 'DEBUG' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                    }`}>
                      {log.level.charAt(0) + log.level.slice(1).toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell>{log.origin || '-'}</TableCell>
                  <TableCell className="max-w-md truncate">{log.message}</TableCell>
                  <TableCell className="max-w-[500px]">
                    {log.payload ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded truncate block">
                        {JSON.stringify(log.payload)}
                      </code>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(parseInt(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* JSON Viewer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details - ID: {selectedLog?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 items-start">
            {/* Level, Origin and Created At in one row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-sm text-muted-foreground mb-1">Level</h3>
                <p className="text-sm">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    selectedLog?.level === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                    selectedLog?.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400' :
                    selectedLog?.level === 'DEBUG' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  }`}>
                    {selectedLog?.level.charAt(0) + selectedLog?.level.slice(1).toLowerCase()}
                  </span>
                </p>
              </div>
              <div className="flex-1">
                <h3 className="text-sm text-muted-foreground mb-1">Origin</h3>
                <p className="text-sm">{selectedLog?.origin || 'N/A'}</p>
              </div>
              <div className="flex-1">
                <h3 className="text-sm text-muted-foreground mb-1">Created At</h3>
                <p className="text-sm">
                  {selectedLog?.created_at
                    ? new Date(selectedLog.created_at).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Message in its own row */}
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Message</h3>
              <p className="text-sm">{selectedLog?.message}</p>
            </div>

            {/* Payload in its own row */}
            {selectedLog?.payload && (
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Payload</h3>
                <div className="rounded-md overflow-auto min-h-[500px] max-h-96">
                  <ReactJson
                    src={selectedLog.payload}
                    collapsed={false}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={false}
                    name={false}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
