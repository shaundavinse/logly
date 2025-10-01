# Logly

A lightweight logging service with a web-based dashboard for viewing and searching logs.

**Note:** This service is designed to run locally on your development machine. It is not intended for production deployment or public exposure.

## Features

- **HTTP API** for receiving logs from any application
- **SQLite database** for persistent log storage
- **Web dashboard** with search, filtering, and pagination
- **JSON payload viewer** for structured log data
- **Recent searches** with localStorage persistence
- **Real-time search** with debouncing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will run on `http://localhost:3847`

### Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/logs

Create a new log entry.

**Request Body:**
```json
{
  "level": "INFO",              // optional: DEBUG | INFO | WARNING | ERROR (default: INFO)
  "origin": "my-app",           // optional: source/category of the log
  "message": "Something happened", // required: log message
  "payload": { "key": "value" }    // optional: any JSON data
}
```

**Response:**
```json
{
  "id": 1,
  "level": "INFO",
  "origin": "my-app",
  "message": "Something happened",
  "payload": { "key": "value" }
}
```

### GET /api/logs

Retrieve logs with optional filtering and pagination.

**Query Parameters:**
- `search` - Search in origin and message fields
- `hasPayload` - Filter logs that have a payload (`true`)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "logs": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### DELETE /api/logs

Delete all logs.

**Response:**
```json
{
  "message": "All logs deleted"
}
```

## Using the SDK

See [sample-sdk.ts](./sample-sdk.ts) for a ready-to-use logging SDK that integrates with this service.

```typescript
import { createLogger } from './sample-sdk';

// Create a logger for your module/file
const logger = createLogger('UserService');

// Simple logging
logger.info('User logged in');
logger.error('Payment failed');

// With structured data
logger.debug('Button clicked', { userId: 123, action: 'click' });
logger.warn('High memory usage', { usage: '85%' });
```

## Dashboard Features

- **Search**: Real-time search across origin and message fields
- **Filter**: Show only logs with payloads
- **Pagination**: Configurable items per page (5/10/25/50/100)
- **Recent Searches**: Quick access to your last 5 searches
- **JSON Viewer**: Click any log row to view full details with formatted JSON
- **Clear Logs**: Delete all logs with confirmation

## Tech Stack

- **Next.js 15** (Pages Router)
- **TypeScript**
- **SQLite** (better-sqlite3)
- **Tailwind CSS**
- **shadcn/ui**
- **@microlink/react-json-view**
