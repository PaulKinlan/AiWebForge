import { ContentType } from '../types';
import * as path from 'path';

export function getContentType(url: string): ContentType {
  const extension = path.extname(url).toLowerCase();

  switch (extension) {
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.js':
      return 'js';
    default:
      return 'html'; // Default to HTML if no extension
  }
}

export function getMimeType(contentType: ContentType): string {
  switch (contentType) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
  }
}