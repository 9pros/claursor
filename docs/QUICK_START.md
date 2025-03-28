# Claursor System - Quick Start Guide

This guide will help you quickly get started with the Claursor System, which connects your code editor to conversation interfaces.

## Installation

### Option 1: Install from npm (recommended for users)

```bash
# Install globally
npm install -g claursor

# Start the bridge server
code-bridge start
```

### Option 2: Install from GitHub (recommended for developers)

```bash
# Clone the repository
git clone https://github.com/9pros/claursor.git
cd claursor

# Install dependencies
npm install
pip install -r server/requirements.txt

# Start the bridge server
npm start
```

## Connect to Your Editor

### VSCode/Cursor

1. Install the Claursor extension:
   - Open VSCode/Cursor
   - Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
   - Search for "Claursor"
   - Click Install

2. Connect to the bridge server:
   - Press Ctrl+Shift+P (or Cmd+Shift+P)
   - Type "Claursor: Connect"
   - Select this command

3. You should see a notification that the connection was successful.

## Using the Bridge System

### From Python

```python
from code_bridge import CursorInterface

# Create a bridge instance
bridge = CursorInterface()

# Check if connected
if bridge.check_connection():
    print("Connected to the editor!")
    
    # Get current file
    current_file = bridge.get_current_file()
    print(f"Current file: {current_file}")
    
    # Create a new file
    bridge.write_file_content(
        "example.py",
        "print('Hello from Claursor!')"
    )
    
    # Open the file in the editor
    bridge.open_file("example.py")
```

### From Node.js

```javascript
const { CodeBridge } = require('claursor');

// Create a bridge instance
const bridge = new CodeBridge();

// Check if connected
bridge.checkConnection().then(connected => {
    if (connected) {
        console.log("Connected to the editor!");
        
        // Get current file
        bridge.getCurrentFile().then(file => {
            console.log("Current file:", file);
        });
        
        // Create a new file
        bridge.writeFile(
            "example.js",
            "console.log('Hello from Claursor!');"
        ).then(() => {
            // Open the file in the editor
            bridge.openFile("example.js");
        });
    }
});
```

## Available Features

- File operations (read, write, open)
- Command execution
- Code analysis and suggestions
- Editor integration (get/replace selection, show messages)
- Project structure exploration

## Troubleshooting

If you encounter issues:

1. Check if the bridge server is running
2. Verify the VSCode extension is installed and connected
3. Check the logs:
   - Bridge server logs: `bridge_server.log`
   - VSCode extension logs: VSCode Output panel (View > Output > Claursor)

## Next Steps

For more advanced usage and customization, see the full documentation at:
https://github.com/9pros/claursor
