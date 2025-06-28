# Agency Uptime

A distributed uptime monitoring service for agencies.

## Features

- Distributed monitoring from multiple regions
- HTTP(S) endpoint monitoring (GET/HEAD)
- ICMP ping monitoring
- SSL certificate monitoring
- Configurable check intervals (1-60 minutes)
- Redundant confirmation (multiple workers must agree on downtime)
- Real-time status updates via Redis pub/sub
- REST API for configuration and reporting

## Architecture

The service consists of:
- Worker nodes running in different regions
- Redis for coordination and temporary storage
- REST API for configuration and status retrieval

Workers use a consensus mechanism to validate downtime - multiple workers must agree before a site is marked as down.

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Redis (provided via Docker)

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/youragency/agency_uptime.git
   cd agency_uptime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   PORT=3000
   REDIS_URL=redis://localhost:6379
   WORKER_ENABLED=false
   WORKER_REGION=local
   CHECK_TIMEOUT=30000
   ```

## Running Locally

1. Start Redis and workers using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. The API will be available at http://localhost:3000

## API Endpoints

### Sites

- `GET /api/sites` - List all monitored sites
- `GET /api/sites/:id` - Get site details
- `POST /api/sites` - Add new site to monitor
- `PUT /api/sites/:id` - Update site configuration
- `DELETE /api/sites/:id` - Remove site from monitoring
- `GET /api/sites/:id/status` - Get current site status
- `GET /api/sites/:id/history` - Get recent check history

### Site Configuration

Example POST/PUT request body:
```json
{
  "url": "https://example.com",
  "checkInterval": 5,
  "method": "GET"
}
```

Valid methods:
- `GET` - HTTP GET request
- `HEAD` - HTTP HEAD request
- `PING` - ICMP ping

## Deployment

The service is designed to run in Docker containers. Use the provided `docker-compose.yml` to deploy:

1. Build and start all services:
   ```bash
   docker-compose up -d --build
   ```

2. Scale workers as needed:
   ```bash
   docker-compose up -d --scale worker_us_east=2 worker_eu=2
   ```

## Development

1. Start Redis:
   ```bash
   docker-compose up -d redis
   ```

2. Run the service in development mode:
   ```bash
   npm run dev
   ```

## License

MIT 