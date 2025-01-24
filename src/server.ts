import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { claudeService } from './services/claude';
import { cacheService } from './services/cache';
import { rateLimitService } from './services/rateLimit';
import { getContentType, getMimeType, isMediaFile } from './utils/contentType';

const PORT = 8000;
const PUBLIC_DIR = path.join(process.cwd(), 'public');

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

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
    const reqPath = url.pathname;

    // Handle media files directly
    if (isMediaFile(reqPath)) {
      const filePath = path.join(PUBLIC_DIR, reqPath);
      if (fs.existsSync(filePath)) {
        const mimeType = getMimeType(reqPath);
        const stream = fs.createReadStream(filePath);
        res.writeHead(200, { 'Content-Type': mimeType });
        stream.pipe(res);
        return;
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
        return;
      }
    }

    // For non-media files, continue with normal processing
    const contentType = getContentType(reqPath);
    const mimeType = getMimeType(reqPath);

    console.log(`Content Type: ${contentType}`);
    console.log(`MIME Type: ${mimeType}`);

    // Check cache
    const cachedContent = cacheService.get(reqPath);
    if (cachedContent) {
      console.log('Cache hit for path:', reqPath);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(cachedContent.content);
      return;
    }

    console.log('Cache miss for path:', reqPath);

    // Generate new content
    const context = cacheService.getContext();
    const content = await claudeService.generateContent(reqPath, contentType, context);

    // Cache the response
    cacheService.set(reqPath, content, mimeType);

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