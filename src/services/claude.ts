import Anthropic from '@anthropic-ai/sdk';
import { ContentType, ContextData } from '../types';
import { generatePrompt } from '../utils/prompts';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const MODEL = 'claude-3-5-sonnet-20241022';

class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateContent(path: string, contentType: ContentType, context: ContextData): Promise<string> {
    try {
      const prompt = generatePrompt(path, contentType, context);

      const message = await this.anthropic.messages.create({
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
      });

      // Handle the content correctly from the message response
      const content = message.content[0];
      if ('text' in content) {
        return content.text;
      }
      throw new Error('Unexpected response format from Claude API');

    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error(`Failed to generate ${contentType} content: ${error.message}`);
    }
  }
}

export const claudeService = new ClaudeService();