#!/usr/bin/env node

/**
 * Claursor System - Start Bridge Server
 * This script starts the bridge server and manages its lifecycle
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');
const { program } = require('commander');

// Configure the CLI options
program
  .version('1.0.0')
  .description('Start the Claursor server')
  .option('-p, --port <port>', 'Port to run the server on', '8000')
  .option('-d, --debug', 'Run in debug mode with verbose logging', false)
  .option('--no-auto-connect', 'Disable auto-connecting to the editor', false)
  .parse(process.argv);

const options = program.opts();

// Configuration
const PORT = options.port;
const DEBUG = options.debug;
const AUTO_CONNECT = options.autoConnect;

// Find the Python executable
function findPythonExecutable() {
  const possiblePythonCommands = ['python3', 'python'];
  
  for (const command of possiblePythonCommands) {
    try {
      const result = require('child_process').spawnSync(command, ['-c', 'print("Found Python")']);
      if (result.status === 0) {
        return command;
      }
    } catch (error) {
      // Ignore errors and try the next command
    }
  }
  
  return null;
}

// Get the path to the server script
function getServerScriptPath() {
  // First check if we're running from the installed package
  const packagePath = path.join(__dirname, '..', 'server', 'api-bridge-server.py');
  if (fs.existsSync(packagePath)) {
    return packagePath;
  }
  
  // If not found, we might be running from the development environment
  const devPath = path.join(__dirname, 'server', 'api-bridge-server.py');
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  // If still not found, look for it in the current directory
  const localPath = path.join(process.cwd(), 'api-bridge-server.py');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  
  return null;
}

// Start the bridge server
function startBridgeServer() {
  console.log(chalk.blue('┌──────────────────────────────────────┐'));
  console.log(chalk.blue('│      Claursor System Server       │'));
  console.log(chalk.blue('└──────────────────────────────────────┘'));
  console.log();
  
  // Find Python
  const spinner = ora('Finding Python executable...').start();
  const pythonCommand = findPythonExecutable();
  
  if (!pythonCommand) {
    spinner.fail('Python not found! Please install Python 3.x');
    process.exit(1);
  }
  
  spinner.succeed(`Found Python executable: ${pythonCommand}`);
  
  // Find server script
  spinner.text = 'Finding server script...';
  spinner.start();
  
  const serverScriptPath = getServerScriptPath();
  
  if (!serverScriptPath) {
    spinner.fail('Server script not found!');
    process.exit(1);
  }
  
  spinner.succeed(`Found server script: ${serverScriptPath}`);
  
  // Start the server
  spinner.text = 'Starting bridge server...';
  spinner.start();
  
  const serverProcess = spawn(pythonCommand, [serverScriptPath], {
    env: {
      ...process.env,
      PORT,
      DEBUG: DEBUG ? '1' : '0'
    }
  });
  
  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    
    if (output.includes('Starting API Bridge Server')) {
      spinner.succeed('Bridge server started successfully!');
      console.log(chalk.green(`Server running at http://localhost:${PORT}`));
      console.log('\nPress Ctrl+C to stop the server');
    } else if (DEBUG) {
      console.log(chalk.gray(`[SERVER] ${output}`));
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    
    if (output.includes('Error')) {
      console.error(chalk.red(`[ERROR] ${output}`));
    } else if (DEBUG) {
      console.warn(chalk.yellow(`[WARNING] ${output}`));
    }
  });
  
  // Handle server errors and exit
  serverProcess.on('error', (error) => {
    spinner.fail(`Failed to start bridge server: ${error.message}`);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(chalk.red(`Bridge server exited with code ${code}`));
    }
    
    console.log(chalk.blue('Bridge server stopped'));
    process.exit(code);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nStopping bridge server...'));
    serverProcess.kill('SIGINT');
  });
  
  // Notify about auto-connect status
  if (AUTO_CONNECT) {
    console.log(chalk.cyan('\nAuto-connect is enabled. The server will automatically connect to the editor.'));
  } else {
    console.log(chalk.yellow('\nAuto-connect is disabled. You need to manually connect from the editor.'));
  }
}

// Start the server
startBridgeServer();
