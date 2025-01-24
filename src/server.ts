import * as http from 'http';
import { URL } from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { claudeService } from './services/claude';
import { cacheService } from './services/cache';
import { rateLimitService } from './services/rateLimit';
import { getContentType, getMimeType } from './utils/contentType';

const PORT = 8000;

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    // Get client IP for rate limiting
    const ip = req.socket.remoteAddress || '0.0.0.0';

    // Log request details
    console.log('\n=== Incoming Request ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`IP: ${ip}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);

    // Check rate limit
    if (!rateLimitService.isAllowed(ip)) {
      console.log('Rate limit exceeded for IP:', ip);
      res.writeHead(429, { 'Content-Type': 'text/plain' });
      res.end('Too Many Requests');
      return;
    }

    // Parse URL
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    // Determine content type
    const contentType = getContentType(path);
    const mimeType = getMimeType(contentType);

    console.log(`Content Type: ${contentType}`);
    console.log(`MIME Type: ${mimeType}`);

    // Check cache
    const cachedContent = cacheService.get(path);
    if (cachedContent) {
      console.log('Cache hit for path:', path);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(cachedContent.content);
      return;
    }

    console.log('Cache miss for path:', path);

    // Generate new content
    const context = cacheService.getContext();
    const content = await claudeService.generateContent(path, contentType, context);

    // Cache the response
    cacheService.set(path, content, mimeType);

    // Send response
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});