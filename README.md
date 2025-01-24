
# Dynamic Content Generation Service

A TypeScript-based web server that generates dynamic content using Claude AI. The service creates personalized web content based on URL paths and caches responses for improved performance.

## Features

- Dynamic HTML, CSS, and JavaScript generation using Claude AI
- Content caching with expiration
- Rate limiting for API requests 
- Request context tracking
- Media file handling
- Built-in error handling and retries

## Project Structure

```
├── src/
│   ├── services/
│   │   ├── cache.ts      # Caching service
│   │   ├── claude.ts     # Claude AI integration
│   │   └── rateLimit.ts  # Rate limiting service
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── utils/
│   │   ├── contentType.ts # Content type utilities
│   │   └── prompts.ts    # AI prompt generation
│   └── server.ts         # Main server implementation
```

## Setup

1. Create a `prompt.txt` file in the root directory with your site description
2. Set your Anthropic API key in Replit Secrets as `ANTHROPIC_API_KEY`
3. Run the server: `npx ts-node src/server.ts`

## API

The server handles requests based on URL paths:
- `/*.html` - Generates HTML content
- `/*.css` - Generates CSS styles
- `/*.js` - Generates JavaScript code
- `/media/*` - Serves media files from public directory

## Configuration

- Server port: 8000
- Cache duration: 1 hour
- Rate limit: Configurable in rateLimit service
- Max retries for AI requests: 3

Built with TypeScript, Node.js, and Claude AI on Replit.
