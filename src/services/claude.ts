import Anthropic from '@anthropic-ai/sdk';
import { ContentType, ContextData } from '../types';
import { generatePrompt } from '../utils/prompts';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractContentFromMarkdown(text: string, contentType: ContentType): string {
    const codeBlockRegex = new RegExp(`\`\`\`${contentType}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i');
    const match = text.match(codeBlockRegex);

    if (!match) {
      console.log('\n=== Claude Response Analysis ===');
      console.log('Failed to find code block in response');
      console.log('Content Type:', contentType);
      console.log('Full Response:', text);
      throw new Error(`No ${contentType} code block found in the response`);
    }

    return match[1].trim();
  }

  async generateContent(path: string, contentType: ContentType, context: ContextData): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          // Add exponential backoff delay for retries
          await this.sleep(RETRY_DELAY * Math.pow(2, attempt - 1));
        }

        const prompt = generatePrompt(path, contentType, context);

        // Log the prompt being sent to Claude
        console.log('\n=== Claude API Request ===');
        console.log(`Time: ${new Date().toISOString()}`);
        console.log(`Path: ${path}`);
        console.log(`Content Type: ${contentType}`);
        console.log('Prompt:', prompt);
        console.log('Context length:', context.previousRequests.length);

        const message = await this.anthropic.messages.create({
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
          model: MODEL,
        });

        const content = message.content[0];
        if ('text' in content) {
          const extractedContent = this.extractContentFromMarkdown(content.text, contentType);
          console.log(`Generated content length: ${extractedContent.length} characters`);
          return extractedContent;
        }
        throw new Error('Unexpected response format from Claude API');

      } catch (error: unknown) {
        lastError = error;

        if (error instanceof Error) {
          // Log both the prompt and response when there's an extraction error
          if (error.message.includes('No code block found')) {
            console.log('\n=== Error Details ===');
            console.log('Failed attempt:', attempt + 1);
            console.log('Error:', error.message);
          }
        }

        // Check if it's a rate limit error
        if (error instanceof Error && 
            ('status' in error) && 
            (error as any).status === 429) {
          console.log(`Rate limited on attempt ${attempt + 1}, retrying...`);
          continue;
        }

        // For other errors, throw immediately
        console.error('Error generating content:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to generate ${contentType} content: ${errorMessage}`);
      }
    }

    // If we exhausted all retries
    console.error('Max retries reached for Claude API request');
    const errorMessage = lastError instanceof Error ? lastError.message : 'Max retries reached';
    throw new Error(`Failed to generate ${contentType} content after ${MAX_RETRIES} attempts: ${errorMessage}`);
  }
}

export const claudeService = new ClaudeService();