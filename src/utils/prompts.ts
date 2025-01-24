import { ContentType, ContextData } from '../types';

export function generatePrompt(path: string, contentType: ContentType, context: ContextData): string {
  const basePrompt = `You are an AI content generator that creates web content. Generate ${contentType.toUpperCase()} content for the path "${path}".`;

  const contextPrompt = context.previousRequests.length > 0 
    ? `\n\nContext from previous requests:\n${context.previousRequests
        .map(req => `${req.path}: ${req.content.substring(0, 100)}...`)
        .join('\n')}`
    : '';

  const typeSpecificPrompt = getTypeSpecificPrompt(contentType);

  return `${basePrompt}${contextPrompt}\n\n${typeSpecificPrompt}`;
}

function getTypeSpecificPrompt(contentType: ContentType): string {
  switch (contentType) {
    case 'html':
      return 'Generate valid HTML5 content. Include semantic markup and ensure accessibility.';
    case 'css':
      return 'Generate clean, modern CSS. Use flexbox/grid where appropriate. Include responsive design considerations.';
    case 'js':
      return 'Generate clean JavaScript code. Use modern ES6+ syntax. Ensure error handling and browser compatibility.';
  }
}