# Claursor

Claursor is a powerful API bridge between Cursor code editor and Claude Desktop. Seamlessly integrate AI assistance into your development workflow - create, edit, analyze, and refactor code through natural language. Features real-time context sharing, file operations, command execution, and intelligent code suggestions.

## Features

- 🔄 Two-way communication between Cursor/VSCode and Claude Desktop
- 📁 File operations (read, write, open)
- 🖥️ Command execution in the editor
- 📊 Code analysis and suggestions
- 🔌 Extensible API for custom integrations

## Installation

### Installing the Bridge Server

```bash
# Install globally
npm install -g claursor

# Start the bridge server
claursor start
```

### Manual VSCode Extension Installation

Since the extension is not published on the VSCode Marketplace, you'll need to install it manually:

1. Download the `.vsix` file from the latest release on GitHub
   - Go to https://github.com/yourusername/claursor/releases
   - Download the `.vsix` file from the latest release assets

2. Install using VSCode:
   - Open VSCode
   - Go to Extensions view (Ctrl+Shift+X)
   - Click on the "..." menu (top right of Extensions view)
   - Select "Install from VSIX..."
   - Navigate to the downloaded `.vsix` file and select it

3. Alternatively, install from command line:
   ```bash
   code --install-extension path/to/claursor-vscode-1.0.0.vsix
   ```

4. Connect to the bridge server:
   - Open the Command Palette (Ctrl+Shift+P)
   - Type "Claursor: Connect"
   - Select the command to connect to the bridge server

### Building the Extension Yourself

If you want to build the extension yourself:

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/claursor.git
   cd claursor
   ```

2. Install dependencies
   ```bash
   npm install
   cd vscode-extension
   npm install
   ```

3. Package the extension
   ```bash
   cd vscode-extension
   npm run package
   ```

4. The `.vsix` file will be created in the vscode-extension directory

## Usage

### From Python

```python
from claursor import ClausorInterface

# Create a bridge instance
bridge = ClausorInterface()

# Check connection
if bridge.check_connection():
    print("Connected to the code editor!")
    
    # Create a new file
    success = bridge.write_file_content(
        "example.py", 
        "print('Hello, world!')"
    )
    print("File created:", success)
```

### From Node.js

```javascript
const { Claursor } = require('claursor');

// Create a bridge instance
const bridge = new Claursor();

// Check connection
bridge.checkConnection().then(connected => {
  if (connected) {
    console.log('Connected to the code editor!');
    
    // Create a new file
    bridge.writeFile('example.js', 'console.log("Hello, world!");')
      .then(success => console.log('File created:', success));
  }
});
```

## Architecture

This system consists of three main components:

1. **Bridge Server**: A Flask server that handles communication between the code editor and conversation interface
2. **VSCode Extension**: Connects to the bridge server and executes actions in the editor
3. **Client Libraries**: Node.js and Python libraries for interacting with the bridge server

## Contributing and Support

We welcome contributions to Claursor! If you're interested in joining the project as a contributor, have feature suggestions, or would like to make a donation to support ongoing development, please reach out directly to max@9pros.com.

Whether you're a developer looking to enhance the codebase, a designer interested in improving the UX, or someone who wants to support this project financially, we'd love to hear from you. All inquiries about participation and support should be directed to the email above.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
