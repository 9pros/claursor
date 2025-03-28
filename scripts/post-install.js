#!/usr/bin/env node

/**
 * Claursor System - Post-Install Script
 * This script runs after npm install to set up the environment
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ora = require('ora');

console.log(chalk.blue('┌──────────────────────────────────────┐'));
console.log(chalk.blue('│    Claursor System - Setup        │'));
console.log(chalk.blue('└──────────────────────────────────────┘'));
console.log();

// Find Python executable
function findPythonExecutable() {
  const possiblePythonCommands = ['python3', 'python'];
  
  for (const command of possiblePythonCommands) {
    try {
      const result = execSync(`${command} -c "print('Found Python')"`, { encoding: 'utf8' });
      if (result.includes('Found Python')) {
        return command;
      }
    } catch (error) {
      // Ignore errors and try the next command
    }
  }
  
  return null;
}

// Install Python dependencies
function installPythonDependencies(pythonCommand) {
  const spinner = ora('Installing Python dependencies...').start();
  
  // Get the path to requirements.txt
  const requirementsPath = path.join(__dirname, '..', 'server', 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    spinner.warn('requirements.txt not found, skipping Python dependencies');
    return;
  }
  
  try {
    execSync(`${pythonCommand} -m pip install -r "${requirementsPath}"`, { 
      encoding: 'utf8',
      stdio: 'pipe' 
    });
    spinner.succeed('Python dependencies installed successfully');
  } catch (error) {
    spinner.fail(`Failed to install Python dependencies: ${error.message}`);
    console.log(chalk.yellow('You may need to manually install Python dependencies:'));
    console.log(chalk.yellow(`  ${pythonCommand} -m pip install -r "${requirementsPath}"`));
  }
}

// Check if the VSCode extension is installed
function checkVSCodeExtension() {
  const spinner = ora('Checking VSCode extension...').start();
  
  try {
    // Check if code command is available
    execSync('code --version', { encoding: 'utf8', stdio: 'pipe' });
    
    // Check if our extension is installed
    const result = execSync('code --list-extensions', { encoding: 'utf8' });
    
    if (result.includes('claursor-vscode')) {
      spinner.succeed('VSCode extension is already installed');
      return true;
    } else {
      spinner.info('VSCode extension is not installed');
      return false;
    }
  } catch (error) {
    spinner.info('VSCode command not found, skipping extension check');
    return false;
  }
}

// Suggest installing the VSCode extension
function suggestInstallingExtension() {
  console.log(chalk.yellow('\nTo complete the setup, install the VSCode extension:'));
  console.log(chalk.white('  1. Open VSCode'));
  console.log(chalk.white('  2. Go to Extensions (Ctrl+Shift+X)'));
  console.log(chalk.white('  3. Search for "Claursor"'));
  console.log(chalk.white('  4. Click Install'));
  console.log();
  console.log(chalk.yellow('Or run this command:'));
  console.log(chalk.white('  code --install-extension claursor-vscode'));
  console.log();
}

// Main function
async function main() {
  // Find Python
  const spinner = ora('Finding Python executable...').start();
  const pythonCommand = findPythonExecutable();
  
  if (!pythonCommand) {
    spinner.fail('Python not found! Please install Python 3.x');
    console.log(chalk.yellow('You need Python to run the bridge server.'));
    console.log(chalk.yellow('Please install Python 3.x from https://www.python.org/downloads/'));
    return;
  }
  
  spinner.succeed(`Found Python executable: ${pythonCommand}`);
  
  // Install Python dependencies
  installPythonDependencies(pythonCommand);
  
  // Check VSCode extension
  const extensionInstalled = checkVSCodeExtension();
  
  if (!extensionInstalled) {
    suggestInstallingExtension();
  }
  
  // Show success message
  console.log(chalk.green('\nSetup completed!'));
  console.log(chalk.white('To start the bridge server, run:'));
  console.log(chalk.cyan('  npx claursor start'));
  console.log();
  console.log(chalk.white('For more information, see the README.md file or visit:'));
  console.log(chalk.cyan('  https://github.com/yourusername/claursor-system'));
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Error during installation: ${error.message}`));
  process.exit(1);
});
