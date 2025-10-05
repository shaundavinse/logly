import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb, Log, CreateLogInput } from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  if (req.method === 'POST') {
    try {
      // Parse body if it's a string
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (parseError) {
          // Log the parse error
          const stmt = db.prepare(
            'INSERT INTO logs (level, origin, message, payload) VALUES (?, ?, ?, ?)'
          );

          const errorPayload = JSON.stringify({
            error: 'Invalid JSON in request body',
            receivedBody: body,
          });

          stmt.run('ERROR', 'logly-api', 'Failed log request: Invalid JSON', errorPayload);

          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      }

      const { level, origin, message, payload }: CreateLogInput = body;

      if (!message) {
        // Log the failed request as an ERROR entry
        const stmt = db.prepare(
          'INSERT INTO logs (level, origin, message, payload) VALUES (?, ?, ?, ?)'
        );

        const errorPayload = JSON.stringify({
          error: 'Message is required',
          receivedBody: body,
        });

        stmt.run('ERROR', origin || 'logly-api', 'Failed log request: Message is required', errorPayload);

        return res.status(400).json({ error: 'Message is required' });
      }

      const stmt = db.prepare(
        'INSERT INTO logs (level, origin, message, payload) VALUES (?, ?, ?, ?)'
      );

      const payloadStr = payload ? JSON.stringify(payload) : null;
      const result = stmt.run(level || 'INFO', origin || null, message, payloadStr);

      return res.status(201).json({
        id: result.lastInsertRowid,
        level: level || 'INFO',
        origin: origin || null,
        message,
        payload: payload || null,
      });
    } catch (error) {
      console.error('Error creating log:', error);

      // Log the error as an ERROR entry
      try {
        const stmt = db.prepare(
          'INSERT INTO logs (level, origin, message, payload) VALUES (?, ?, ?, ?)'
        );

        const errorPayload = JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          receivedBody: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
        });

        stmt.run('ERROR', 'logly-api', 'Failed to create log entry', errorPayload);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }

      return res.status(500).json({ error: 'Failed to create log' });
    }
  } else if (req.method === 'GET') {
    try {
      const { search, hasPayload, page = '1', limit = '10' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      let query = 'SELECT * FROM logs WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM logs WHERE 1=1';
      const params: any[] = [];
      const countParams: any[] = [];

      // Filter by search term (searches origin AND message)
      if (search && typeof search === 'string' && search.trim()) {
        const normalizedSearch = search.trim().replace(/[^a-z0-9]/gi, '').toLowerCase();
        query += ` AND (LOWER(REPLACE(REPLACE(REPLACE(origin, ' ', ''), '-', ''), '_', '')) LIKE ? OR LOWER(REPLACE(REPLACE(REPLACE(message, ' ', ''), '-', ''), '_', '')) LIKE ?)`;
        countQuery += ` AND (LOWER(REPLACE(REPLACE(REPLACE(origin, ' ', ''), '-', ''), '_', '')) LIKE ? OR LOWER(REPLACE(REPLACE(REPLACE(message, ' ', ''), '-', ''), '_', '')) LIKE ?)`;
        params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`);
        countParams.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`);
      }

      // Filter by payload presence if checkbox is checked
      if (hasPayload === 'true') {
        query += ' AND payload IS NOT NULL';
        countQuery += ' AND payload IS NOT NULL';
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      // Get total count
      const countStmt = db.prepare(countQuery);
      const countResult = countStmt.get(...countParams) as { total: number };
      const total = countResult.total;

      // Get paginated logs
      const stmt = db.prepare(query);
      const logs = stmt.all(...params) as Log[];

      // Parse JSON payload for each log
      const logsWithParsedPayload = logs.map((log) => ({
        ...log,
        payload: log.payload ? JSON.parse(log.payload) : null,
      }));

      return res.status(200).json({
        logs: logsWithParsedPayload,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const stmt = db.prepare('DELETE FROM logs');
      stmt.run();
      return res.status(200).json({ message: 'All logs deleted' });
    } catch (error) {
      console.error('Error deleting logs:', error);
      return res.status(500).json({ error: 'Failed to delete logs' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
