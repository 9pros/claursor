"""
Cursor Integration Library
This module provides functions to interact with Cursor from within the conversation
"""

import os
import sys
import subprocess
import time
import requests
import json
from typing import Dict, List, Any, Optional, Union

class ClausorInterface:
    """
    Interface for interacting with Cursor through the bridge server
    """
    
    def __init__(self, bridge_url: str = "http://localhost:8000"):
        self.bridge_url = bridge_url
        self._connected = False
    
    def check_connection(self) -> bool:
        """Check if the bridge server is running and connected to Cursor"""
        try:
            response = requests.get(f"{self.bridge_url}/health", timeout=5)
            if response.status_code == 200:
                # Now check if we have context from Cursor
                context_response = requests.get(f"{self.bridge_url}/api/context")
                if context_response.status_code == 200:
                    context = context_response.json()
                    # If we have project_root, we're likely connected to Cursor
                    self._connected = context.get("project_root") is not None
                    return self._connected
            return False
        except:
            return False
    
    def get_current_file(self) -> Optional[Dict[str, Any]]:
        """Get information about the current file in Cursor"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return None
        
        try:
            response = requests.get(f"{self.bridge_url}/api/context")
            if response.status_code == 200:
                context = response.json()
                return context.get("current_file")
            return None
        except:
            return None
    
    def get_current_selection(self) -> Optional[Dict[str, Any]]:
        """Get the current selection in Cursor"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return None
        
        try:
            response = requests.post(f"{self.bridge_url}/api/actions", json={"type": "getSelection"})
            if response.status_code == 201:
                action_id = response.json()["action_id"]
                
                # Wait for the result
                for _ in range(10):  # Try for 5 seconds (10 * 0.5s)
                    time.sleep(0.5)
                    result_response = requests.get(f"{self.bridge_url}/api/actions/{action_id}/result")
                    if result_response.status_code == 200:
                        result = result_response.json()
                        if result.get("success"):
                            return result.get("data")
                        break
            return None
        except:
            return None
    
    def replace_selection(self, text: str) -> bool:
        """Replace the current selection in Cursor"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return False
        
        try:
            response = requests.post(
                f"{self.bridge_url}/api/actions", 
                json={"type": "replaceSelection", "text": text}
            )
            if response.status_code == 201:
                action_id = response.json()["action_id"]
                
                # Wait for the result
                for _ in range(10):  # Try for 5 seconds (10 * 0.5s)
                    time.sleep(0.5)
                    result_response = requests.get(f"{self.bridge_url}/api/actions/{action_id}/result")
                    if result_response.status_code == 200:
                        result = result_response.json()
                        return result.get("success", False)
            return False
        except:
            return False
    
    def get_file_content(self, file_path: str) -> Optional[str]:
        """Get the content of a file"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return None
        
        try:
            response = requests.get(f"{self.bridge_url}/api/file", params={"path": file_path})
            if response.status_code == 200:
                return response.json()["content"]
            return None
        except:
            return None
    
    def write_file_content(self, file_path: str, content: str) -> bool:
        """Write content to a file"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return False
        
        try:
            response = requests.post(
                f"{self.bridge_url}/api/file",
                json={"path": file_path, "content": content}
            )
            return response.status_code == 200
        except:
            return False
    
    def open_file(self, file_path: str) -> bool:
        """Open a file in Cursor"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return False
        
        try:
            response = requests.post(
                f"{self.bridge_url}/api/actions",
                json={"type": "openFile", "path": file_path}
            )
            if response.status_code == 201:
                action_id = response.json()["action_id"]
                
                # Wait for the result
                for _ in range(10):  # Try for 5 seconds (10 * 0.5s)
                    time.sleep(0.5)
                    result_response = requests.get(f"{self.bridge_url}/api/actions/{action_id}/result")
                    if result_response.status_code == 200:
                        result = result_response.json()
                        return result.get("success", False)
            return False
        except:
            return False
    
    def show_message(self, message: str, message_type: str = "info") -> bool:
        """Show a message in Cursor"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return False
        
        try:
            response = requests.post(
                f"{self.bridge_url}/api/actions",
                json={
                    "type": "showMessage", 
                    "message": message, 
                    "messageType": message_type
                }
            )
            if response.status_code == 201:
                action_id = response.json()["action_id"]
                
                # Wait for the result
                for _ in range(10):  # Try for 5 seconds (10 * 0.5s)
                    time.sleep(0.5)
                    result_response = requests.get(f"{self.bridge_url}/api/actions/{action_id}/result")
                    if result_response.status_code == 200:
                        result = result_response.json()
                        return result.get("success", False)
            return False
        except:
            return False
    
    def execute_command(self, command: str) -> Optional[Dict[str, Any]]:
        """Execute a shell command"""
        if not self._connected and not self.check_connection():
            print("Not connected to Cursor")
            return None
        
        try:
            response = requests.post(
                f"{self.bridge_url}/api/execute",
                json={"command": command}
            )
            if response.status_code == 200:
                return response.json()
            return None
        except:
            return None


# Simple test function to check if the bridge is working
def test_bridge_connection(bridge_url: str = "http://localhost:8000") -> bool:
    """Test the connection to the bridge server"""
    cursor = ClausorInterface(bridge_url)
    return cursor.check_connection()


if __name__ == "__main__":
    # When run directly, check if the bridge is working
    if test_bridge_connection():
        print("Successfully connected to Cursor via the bridge server")
    else:
        print("Failed to connect to Cursor. Is the bridge server running?")
