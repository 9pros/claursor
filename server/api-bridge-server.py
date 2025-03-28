from flask import Flask, request, jsonify
import os
import sys
import json
import logging
import subprocess
import threading
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("bridge_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Store for pending actions and results
pending_actions = []
action_results = {}
conversation_context = {
    "files_open": [],
    "current_file": None,
    "selection": None,
    "cursor_position": None,
    "project_root": None,
    "environment": {
        "os": sys.platform,
        "python_version": sys.version
    }
}

def execute_shell_command(command: str) -> Dict[str, Any]:
    """Execute a shell command and return the result"""
    logger.info(f"Executing command: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True,
            timeout=60
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode,
            "success": result.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Command execution timed out",
            "return_code": -1,
            "success": False
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": str(e),
            "return_code": -1,
            "success": False
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/api/actions', methods=['GET'])
def get_pending_actions():
    """Get pending actions for Cursor to execute"""
    global pending_actions
    actions = pending_actions.copy()
    pending_actions = []
    return jsonify({"actions": actions})

@app.route('/api/actions', methods=['POST'])
def add_action():
    """Add a new action for Cursor to execute"""
    global pending_actions
    data = request.json
    
    if not data or "type" not in data:
        return jsonify({"error": "Invalid action format"}), 400
    
    action_id = f"action-{len(pending_actions) + len(action_results) + 1}"
    data["id"] = action_id
    pending_actions.append(data)
    
    return jsonify({"action_id": action_id}), 201

@app.route('/api/actions/<action_id>/result', methods=['POST'])
def submit_action_result(action_id):
    """Submit the result of an executed action"""
    global action_results
    data = request.json
    
    if not data:
        return jsonify({"error": "Invalid result format"}), 400
    
    action_results[action_id] = data
    logger.info(f"Received result for action {action_id}: {json.dumps(data)[:100]}...")
    
    return jsonify({"status": "success"}), 200

@app.route('/api/context', methods=['GET'])
def get_context():
    """Get the current conversation context"""
    return jsonify(conversation_context)

@app.route('/api/context', methods=['POST'])
def update_context():
    """Update the conversation context from Cursor"""
    global conversation_context
    data = request.json
    
    if not data:
        return jsonify({"error": "Invalid context format"}), 400
    
    # Update only the fields that are provided
    for key, value in data.items():
        conversation_context[key] = value
    
    logger.info(f"Updated context: {json.dumps(conversation_context)[:100]}...")
    
    return jsonify({"status": "success"}), 200

@app.route('/api/execute', methods=['POST'])
def execute_command():
    """Execute a shell command and return the result"""
    data = request.json
    
    if not data or "command" not in data:
        return jsonify({"error": "Missing command"}), 400
    
    result = execute_shell_command(data["command"])
    return jsonify(result)

@app.route('/api/file', methods=['GET'])
def get_file_content():
    """Get the content of a file"""
    file_path = request.args.get('path')
    
    if not file_path:
        return jsonify({"error": "Missing file path"}), 400
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({"content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/file', methods=['POST'])
def write_file_content():
    """Write content to a file"""
    data = request.json
    
    if not data or "path" not in data or "content" not in data:
        return jsonify({"error": "Missing path or content"}), 400
    
    try:
        with open(data["path"], 'w', encoding='utf-8') as f:
            f.write(data["content"])
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def main():
    """Main entry point for the bridge server"""
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting API Bridge Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == '__main__':
    main()
