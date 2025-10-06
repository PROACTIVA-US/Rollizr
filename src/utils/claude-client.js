/**
 * Claude Client Utility
 * Wrapper around Anthropic SDK for agent interactions
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

class ClaudeClient {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';
  }

  /**
   * Send a message to Claude and get a response
   * @param {string} systemPrompt - The system prompt defining agent behavior
   * @param {string} userMessage - The user's message/task
   * @param {object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<object>} - Claude's response
   */
  async sendMessage(systemPrompt, userMessage, options = {}) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || 4096,
        temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      return {
        success: true,
        content: response.content[0].text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        stopReason: response.stop_reason,
      };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send a multi-turn conversation to Claude
   * @param {string} systemPrompt - The system prompt
   * @param {array} messages - Array of message objects with role and content
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Claude's response
   */
  async sendConversation(systemPrompt, messages, options = {}) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || parseInt(process.env.MAX_TOKENS) || 4096,
        temperature: options.temperature || parseFloat(process.env.TEMPERATURE) || 0.7,
        system: systemPrompt,
        messages: messages,
      });

      return {
        success: true,
        content: response.content[0].text,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        stopReason: response.stop_reason,
      };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Parse JSON from Claude's response (handles markdown code blocks)
   * @param {string} content - Claude's response content
   * @returns {object|null} - Parsed JSON or null if parsing failed
   */
  parseJSON(content) {
    try {
      // Try direct JSON parse first
      return JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('Failed to parse JSON from markdown block:', e2);
          return null;
        }
      }

      // Try to find JSON object in text
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e3) {
          console.error('Failed to parse JSON object from text:', e3);
          return null;
        }
      }

      console.error('No valid JSON found in response');
      return null;
    }
  }
}

module.exports = ClaudeClient;
