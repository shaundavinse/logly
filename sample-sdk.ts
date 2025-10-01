type LogCategory = 'request' | 'general' | 'CEL';

const LOGLY_ENDPOINT = 'http://localhost:3847/api/logs';

/**
 * Send a log to the Logly service
 */
async function sendLog(
  level: string,
  content: unknown,
  category: LogCategory
): Promise<void> {
  try {
    const payload = typeof content === 'object' ? content : { value: content };

    await fetch(LOGLY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: category,
        message: `[${level}] ${typeof content === 'string' ? content : JSON.stringify(content)}`,
        payload,
      }),
    });
  } catch (error) {
    // Silently fail to avoid breaking the application
    console.error('Failed to send log to Logly:', error);
  }
}

export const Logger = {
  debug: (content: unknown, category: LogCategory = 'general') => {
    console.log('%c[DEBUG]:%c', 'color: yellow; font-weight: 600;', '', content);
    sendLog('DEBUG', content, category);
  },

  info: (content: unknown, category: LogCategory = 'general') => {
    console.log('%c[INFO]:%c', 'color: yellow; font-weight: 600;', '', content);
    sendLog('INFO', content, category);
  },

  warn: (content: unknown, category: LogCategory = 'general') => {
    console.log('%c[WARNING]:%c', 'color: yellow; font-weight: 600;', '', content);
    sendLog('WARNING', content, category);
  },

  error: (content: unknown, category: LogCategory = 'general') => {
    console.log('%c[ERROR]:%c', 'color: red; font-weight: 600;', '', content);
    sendLog('ERROR', content, category);
  },
};
