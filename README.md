# Claursor

A bridge system that connects code editors (like VSCode/Cursor) to conversation interfaces, enabling seamless integration between your development environment and AI assistants.

## Features

- 🔄 Two-way communication between code editors and conversation interfaces
- 📁 File operations (read, write, open)
- 🖥️ Command execution in the editor
- 📊 Code analysis and suggestions
- 🔌 Extensible API for custom integrations

## Installation

### Using npm (recommended)

```bash
# Install globally
npm install -g claursor-system

# Start the bridge server
claursor start
```

### Manual Installation

1. Clone the repository
```bash
git clone https://github.com/9pros/claursor-system.git
cd claursor-system
```

2. Install dependencies
```bash
npm install
pip install -r server/requirements.txt
```

3. Start the bridge server
```bash
npm start
```

## VSCode Extension Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Claursor"
4. Click Install

Alternatively, install from the command line:
```bash
code --install-extension claursor-vscode
```

## Usage

### From Node.js

```javascript
const { Claursor } = require('claursor-system');

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

### From Python

```python
from code_bridge import CursorInterface

# Create a bridge instance
bridge = CursorInterface()

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

## Architecture

This system consists of three main components:

1. **Bridge Server**: A Flask server that handles communication between the code editor and conversation interface
2. **VSCode Extension**: Connects to the bridge server and executes actions in the editor
3. **Client Libraries**: Node.js and Python libraries for interacting with the bridge server

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
