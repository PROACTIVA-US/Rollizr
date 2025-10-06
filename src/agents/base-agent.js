/**
 * Base Agent Class
 * Abstract base class for all Rollizr agents
 */

const ClaudeClient = require('../utils/claude-client');

class BaseAgent {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.description = config.description;
    this.systemPrompt = config.systemPrompt;
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
    this.client = new ClaudeClient();
    this.conversationHistory = [];
  }

  /**
   * Execute the agent's primary task
   * @param {string|object} input - The input data for the agent
   * @param {object} context - Additional context (previous agent outputs, metadata, etc.)
   * @returns {Promise<object>} - The agent's output
   */
  async execute(input, context = {}) {
    const startTime = Date.now();

    try {
      // Build the user message
      const userMessage = this._buildUserMessage(input, context);

      // Call Claude API
      const response = await this.client.sendMessage(
        this.systemPrompt,
        userMessage,
        {
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      // Parse the response
      const output = this._parseResponse(response.content);

      // Log execution
      const executionTime = Date.now() - startTime;
      this._logExecution(input, output, response.usage, executionTime);

      return {
        success: true,
        agent: this.name,
        role: this.role,
        output: output,
        metadata: {
          executionTime,
          tokensUsed: response.usage,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return {
        success: false,
        agent: this.name,
        role: this.role,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Execute with conversation history (for multi-turn interactions)
   * @param {string|object} input - The input data
   * @param {array} history - Previous conversation messages
   * @param {object} context - Additional context
   * @returns {Promise<object>} - The agent's output
   */
  async executeWithHistory(input, history = [], context = {}) {
    const startTime = Date.now();

    try {
      const userMessage = this._buildUserMessage(input, context);

      // Build messages array from history
      const messages = [
        ...history,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await this.client.sendConversation(
        this.systemPrompt,
        messages,
        {
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const output = this._parseResponse(response.content);
      const executionTime = Date.now() - startTime;

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.content }
      );

      return {
        success: true,
        agent: this.name,
        role: this.role,
        output: output,
        conversationHistory: this.conversationHistory,
        metadata: {
          executionTime,
          tokensUsed: response.usage,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return {
        success: false,
        agent: this.name,
        role: this.role,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Build the user message from input and context
   * Override this method in subclasses for custom formatting
   * @param {string|object} input - The input data
   * @param {object} context - Additional context
   * @returns {string} - Formatted user message
   */
  _buildUserMessage(input, context) {
    let message = '';

    // Add context if provided
    if (Object.keys(context).length > 0) {
      message += '=== CONTEXT ===\n';
      message += JSON.stringify(context, null, 2);
      message += '\n\n';
    }

    // Add input
    message += '=== TASK ===\n';
    if (typeof input === 'string') {
      message += input;
    } else {
      message += JSON.stringify(input, null, 2);
    }

    return message;
  }

  /**
   * Parse the agent's response
   * Override this method in subclasses for custom parsing
   * @param {string} content - The raw response from Claude
   * @returns {object} - Parsed output
   */
  _parseResponse(content) {
    // Try to parse as JSON first
    const parsed = this.client.parseJSON(content);
    if (parsed) {
      return parsed;
    }

    // If not JSON, return as structured text
    return {
      rawResponse: content,
      parsed: false,
    };
  }

  /**
   * Log agent execution for observability
   * @param {any} input - The input provided
   * @param {any} output - The output generated
   * @param {object} usage - Token usage stats
   * @param {number} executionTime - Time taken in ms
   */
  _logExecution(input, output, usage, executionTime) {
    const log = {
      timestamp: new Date().toISOString(),
      agent: this.name,
      role: this.role,
      executionTime: `${executionTime}ms`,
      tokensUsed: usage,
      inputPreview: typeof input === 'string' ? input.substring(0, 100) : 'object',
      success: true,
    };

    // In production, send this to your observability stack
    // For now, just console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Agent Execution:', JSON.stringify(log, null, 2));
    }
  }

  /**
   * Reset conversation history
   */
  resetHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get agent info
   * @returns {object} - Agent metadata
   */
  getInfo() {
    return {
      name: this.name,
      role: this.role,
      description: this.description,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }
}

module.exports = BaseAgent;
