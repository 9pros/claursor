// API Bridge Extension for VSCode/Cursor
// This extension connects the editor to our conversation interface

const vscode = require('vscode');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Bridge server configuration
const BRIDGE_SERVER_URL = 'http://localhost:8000';
const POLL_INTERVAL = 1000; // ms

// Store for active polling
let isPolling = false;
let pollingInterval = null;

/**
 * Activate the extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Claursor extension is now active');

    // Register commands
    let disposable = vscode.commands.registerCommand('claursor.connect', async function () {
        await connectToBridge();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('claursor.disconnect', function () {
        disconnectFromBridge();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('claursor.sendContext', async function () {
        await sendCurrentContext();
    });

    context.subscriptions.push(disposable);

    // Start polling immediately if auto-connect is enabled
    const config = vscode.workspace.getConfiguration('claursor');
    if (config.get('autoConnect', true)) {
        connectToBridge();
    }
}

/**
 * Deactivate the extension
 */
function deactivate() {
    disconnectFromBridge();
}

/**
 * Connect to the bridge server and start polling for actions
 */
async function connectToBridge() {
    try {
        // Check if the bridge server is running
        const response = await fetch(`${BRIDGE_SERVER_URL}/health`);
        if (!response.ok) {
            vscode.window.showErrorMessage('Could not connect to Claursor server. Make sure it\'s running.');
            return;
        }

        // Start polling for actions
        startPolling();
        
        // Send initial context
        await sendCurrentContext();
        
        vscode.window.showInformationMessage('Connected to Claursor server');
    } catch (error) {
        vscode.window.showErrorMessage(`Error connecting to Claursor: ${error.message}`);
    }
}

/**
 * Disconnect from the bridge server and stop polling
 */
function disconnectFromBridge() {
    stopPolling();
    vscode.window.showInformationMessage('Disconnected from Claursor server');
}

/**
 * Start polling the bridge server for actions
 */
function startPolling() {
    if (isPolling) {
        return;
    }

    isPolling = true;
    
    // Poll immediately
    pollForActions();
    
    // Set up interval for continued polling
    pollingInterval = setInterval(pollForActions, POLL_INTERVAL);
    
    console.log('Started polling for actions');
}

/**
 * Stop polling the bridge server
 */
function stopPolling() {
    if (!isPolling) {
        return;
    }

    isPolling = false;
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    console.log('Stopped polling for actions');
}

/**
 * Poll the bridge server for actions to execute
 */
async function pollForActions() {
    try {
        const response = await fetch(`${BRIDGE_SERVER_URL}/api/actions`);
        if (!response.ok) {
            console.error('Error polling for actions:', response.statusText);
            return;
        }

        const data = await response.json();
        
        if (data.actions && data.actions.length > 0) {
            console.log(`Received ${data.actions.length} actions to execute`);
            
            // Process all actions
            for (const action of data.actions) {
                processAction(action);
            }
        }
    } catch (error) {
        console.error('Error polling for actions:', error);
    }
}

/**
 * Process a single action
 * @param {Object} action - The action to process
 */
async function processAction(action) {
    console.log(`Processing action: ${action.type}`);
    
    let result = {
        action_id: action.id,
        success: false,
        error: null,
        data: null
    };
    
    try {
        switch (action.type) {
            case 'openFile':
                result = await handleOpenFile(action, result);
                break;
            
            case 'editFile':
                result = await handleEditFile(action, result);
                break;
            
            case 'getFileContent':
                result = await handleGetFileContent(action, result);
                break;
            
            case 'executeCommand':
                result = await handleExecuteCommand(action, result);
                break;
            
            case 'showMessage':
                result = await handleShowMessage(action, result);
                break;
            
            case 'getSelection':
                result = await handleGetSelection(action, result);
                break;
            
            case 'replaceSelection':
                result = await handleReplaceSelection(action, result);
                break;
            
            default:
                result.error = `Unknown action type: ${action.type}`;
                break;
        }
    } catch (error) {
        result.success = false;
        result.error = error.message;
        console.error(`Error processing action ${action.type}:`, error);
    }
    
    // Send the result back to the bridge server
    try {
        const response = await fetch(`${BRIDGE_SERVER_URL}/api/actions/${action.id}/result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
        });
        
        if (!response.ok) {
            console.error('Error sending action result:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending action result:', error);
    }
}

/**
 * Handle the openFile action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleOpenFile(action, result) {
    if (!action.path) {
        result.error = 'Missing file path';
        return result;
    }
    
    try {
        const document = await vscode.workspace.openTextDocument(action.path);
        await vscode.window.showTextDocument(document);
        
        result.success = true;
        result.data = { path: action.path };
    } catch (error) {
        result.error = `Error opening file: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the editFile action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleEditFile(action, result) {
    if (!action.path || !action.edits) {
        result.error = 'Missing path or edits';
        return result;
    }
    
    try {
        const document = await vscode.workspace.openTextDocument(action.path);
        const editor = await vscode.window.showTextDocument(document);
        
        await editor.edit(editBuilder => {
            for (const edit of action.edits) {
                const range = new vscode.Range(
                    new vscode.Position(edit.startLine, edit.startCharacter),
                    new vscode.Position(edit.endLine, edit.endCharacter)
                );
                
                editBuilder.replace(range, edit.text);
            }
        });
        
        result.success = true;
        result.data = { path: action.path };
    } catch (error) {
        result.error = `Error editing file: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the getFileContent action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleGetFileContent(action, result) {
    if (!action.path) {
        result.error = 'Missing file path';
        return result;
    }
    
    try {
        const document = await vscode.workspace.openTextDocument(action.path);
        const content = document.getText();
        
        result.success = true;
        result.data = { 
            path: action.path,
            content: content,
            language: document.languageId
        };
    } catch (error) {
        result.error = `Error getting file content: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the executeCommand action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleExecuteCommand(action, result) {
    if (!action.command) {
        result.error = 'Missing command';
        return result;
    }
    
    try {
        const commandResult = await vscode.commands.executeCommand(
            action.command, 
            ...(action.args || [])
        );
        
        result.success = true;
        result.data = { result: commandResult };
    } catch (error) {
        result.error = `Error executing command: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the showMessage action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleShowMessage(action, result) {
    if (!action.message) {
        result.error = 'Missing message';
        return result;
    }
    
    try {
        let response;
        const options = action.options || [];
        
        switch (action.messageType) {
            case 'info':
                response = await vscode.window.showInformationMessage(action.message, ...options);
                break;
            
            case 'warning':
                response = await vscode.window.showWarningMessage(action.message, ...options);
                break;
            
            case 'error':
                response = await vscode.window.showErrorMessage(action.message, ...options);
                break;
            
            default:
                response = await vscode.window.showInformationMessage(action.message, ...options);
                break;
        }
        
        result.success = true;
        result.data = { response };
    } catch (error) {
        result.error = `Error showing message: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the getSelection action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleGetSelection(action, result) {
    try {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            result.error = 'No active editor';
            return result;
        }
        
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        
        result.success = true;
        result.data = {
            text,
            range: {
                startLine: selection.start.line,
                startCharacter: selection.start.character,
                endLine: selection.end.line,
                endCharacter: selection.end.character
            },
            fileName: editor.document.fileName,
            languageId: editor.document.languageId
        };
    } catch (error) {
        result.error = `Error getting selection: ${error.message}`;
    }
    
    return result;
}

/**
 * Handle the replaceSelection action
 * @param {Object} action - The action to handle
 * @param {Object} result - The result object to populate
 * @returns {Object} - The updated result
 */
async function handleReplaceSelection(action, result) {
    if (!action.text) {
        result.error = 'Missing text';
        return result;
    }
    
    try {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            result.error = 'No active editor';
            return result;
        }
        
        await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, action.text);
        });
        
        result.success = true;
    } catch (error) {
        result.error = `Error replacing selection: ${error.message}`;
    }
    
    return result;
}

/**
 * Send the current context to the bridge server
 */
async function sendCurrentContext() {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    const context = {
        files_open: [],
        current_file: null,
        selection: null,
        cursor_position: null,
        project_root: workspaceFolders ? workspaceFolders[0].uri.fsPath : null
    };
    
    // Add open editors
    vscode.window.visibleTextEditors.forEach(editor => {
        context.files_open.push({
            path: editor.document.fileName,
            language: editor.document.languageId
        });
    });
    
    // Add current editor info
    if (editor) {
        context.current_file = {
            path: editor.document.fileName,
            language: editor.document.languageId
        };
        
        const selection = editor.selection;
        
        if (!selection.isEmpty) {
            context.selection = {
                text: editor.document.getText(selection),
                start: {
                    line: selection.start.line,
                    character: selection.start.character
                },
                end: {
                    line: selection.end.line,
                    character: selection.end.character
                }
            };
        }
        
        context.cursor_position = {
            line: editor.selection.active.line,
            character: editor.selection.active.character
        };
    }
    
    try {
        const response = await fetch(`${BRIDGE_SERVER_URL}/api/context`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(context)
        });
        
        if (!response.ok) {
            console.error('Error sending context:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending context:', error);
    }
}

// Exports
module.exports = {
    activate,
    deactivate
};
