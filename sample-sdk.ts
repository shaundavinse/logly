const LOGLY_ENDPOINT = 'http://localhost:3847/api/logs';

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

/**
 * Send a log to the Logly service
 */
async function sendLog(
  origin: string,
  level: LogLevel,
  message: string,
  payload?: unknown
): Promise<void> {
  try {
    await fetch(LOGLY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        origin,
        message,
        payload: payload || null,
      }),
    });
  } catch (error) {
    // Silently fail to avoid breaking the application
    console.error('Failed to send log to Logly:', error);
  }
}

/**
 * Create a logger instance for a specific origin (e.g., file name or module)
 */
export function createLogger(origin: string) {
  const log = sendLog.bind(null, origin);

  return {
    debug: log.bind(null, 'DEBUG'),
    info: log.bind(null, 'INFO'),
    warn: log.bind(null, 'WARNING'),
    error: log.bind(null, 'ERROR'),
  };
}
