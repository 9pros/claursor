/**
 * Code Bridge System - Node.js Library
 * Provides a Node.js interface for interacting with the bridge server
 */

const fetch = require('node-fetch');

/**
 * Main Claursor class for interacting with the bridge server
 */
class Claursor {
  /**
   * Create a new Claursor instance
   * @param {string} bridgeUrl - URL of the bridge server
   */
  constructor(bridgeUrl = 'http://localhost:8000') {
    this.bridgeUrl = bridgeUrl;
    this.connected = false;
  }

  /**
   * Check if the bridge server is running and connected to the editor
   * @returns {Promise<boolean>} - Whether the bridge is connected
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.bridgeUrl}/health`, { timeout: 5000 });
      
      if (response.ok) {
        // Now check if we have context from the editor
        const contextResponse = await fetch(`${this.bridgeUrl}/api/context`);
        if (contextResponse.ok) {
          const context = await contextResponse.json();
          // If we have project_root, we're likely connected to the editor
          this.connected = context.project_root !== null;
          return this.connected;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking connection:', error.message);
      return false;
    }
  }

  /**
   * Get information about the current file in the editor
   * @returns {Promise<object|null>} - Current file information or null if not connected
   */
  async getCurrentFile() {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return null;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/context`);
      if (response.ok) {
        const context = await response.json();
        return context.current_file;
      }
      return null;
    } catch (error) {
      console.error('Error getting current file:', error.message);
      return null;
    }
  }

  /**
   * Get the current selection in the editor
   * @returns {Promise<object|null>} - Current selection information or null if not connected
   */
  async getSelection() {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return null;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'getSelection' })
      });
      
      if (response.ok) {
        const { action_id } = await response.json();
        
        // Wait for the result
        const result = await this._waitForActionResult(action_id);
        if (result && result.success) {
          return result.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting selection:', error.message);
      return null;
    }
  }

  /**
   * Replace the current selection in the editor
   * @param {string} text - Text to replace the selection with
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async replaceSelection(text) {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return false;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'replaceSelection', text })
      });
      
      if (response.ok) {
        const { action_id } = await response.json();
        
        // Wait for the result
        const result = await this._waitForActionResult(action_id);
        return result && result.success;
      }
      
      return false;
    } catch (error) {
      console.error('Error replacing selection:', error.message);
      return false;
    }
  }

  /**
   * Get the content of a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<string|null>} - File content or null if not found
   */
  async readFile(filePath) {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return null;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/file?path=${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      return null;
    } catch (error) {
      console.error('Error reading file:', error.message);
      return null;
    }
  }

  /**
   * Write content to a file
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write to the file
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async writeFile(filePath, content) {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return false;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error writing file:', error.message);
      return false;
    }
  }

  /**
   * Open a file in the editor
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async openFile(filePath) {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return false;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'openFile', path: filePath })
      });
      
      if (response.ok) {
        const { action_id } = await response.json();
        
        // Wait for the result
        const result = await this._waitForActionResult(action_id);
        return result && result.success;
      }
      
      return false;
    } catch (error) {
      console.error('Error opening file:', error.message);
      return false;
    }
  }

  /**
   * Show a message in the editor
   * @param {string} message - Message to show
   * @param {string} messageType - Type of message (info, warning, error)
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async showMessage(message, messageType = 'info') {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return false;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'showMessage', 
          message, 
          messageType 
        })
      });
      
      if (response.ok) {
        const { action_id } = await response.json();
        
        // Wait for the result
        const result = await this._waitForActionResult(action_id);
        return result && result.success;
      }
      
      return false;
    } catch (error) {
      console.error('Error showing message:', error.message);
      return false;
    }
  }

  /**
   * Execute a shell command
   * @param {string} command - Command to execute
   * @returns {Promise<object|null>} - Command result or null if failed
   */
  async executeCommand(command) {
    if (!this.connected && !(await this.checkConnection())) {
      console.error('Not connected to the editor');
      return null;
    }
    
    try {
      const response = await fetch(`${this.bridgeUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error executing command:', error.message);
      return null;
    }
  }

  /**
   * Wait for an action result
   * @private
   * @param {string} actionId - ID of the action to wait for
   * @returns {Promise<object|null>} - Action result or null if timed out
   */
  async _waitForActionResult(actionId) {
    // Try to get the result for 5 seconds (10 attempts, 500ms apart)
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const response = await fetch(`${this.bridgeUrl}/api/actions/${actionId}/result`);
        
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error getting action result:', error.message);
      }
    }
    
    return null;
  }
}

// Export the main class and any utility functions
module.exports = {
  Claursor
};
