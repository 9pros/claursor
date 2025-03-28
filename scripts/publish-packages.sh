#!/bin/bash

# Claursor System - Publish Packages
# This script publishes the Claursor System packages to npm and PyPI

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print banner
echo -e "${BLUE}┌──────────────────────────────────────┐${NC}"
echo -e "${BLUE}│    Publish Claursor Packages      │${NC}"
echo -e "${BLUE}└──────────────────────────────────────┘${NC}"
echo

# Check for npm
echo -e "${BLUE}Checking for npm...${NC}"
if ! command -v npm &>/dev/null; then
    echo -e "${RED}npm not found! Please install npm${NC}"
    exit 1
fi

# Check for Python
echo -e "${BLUE}Checking for Python...${NC}"
if command -v python3 &>/dev/null; then
    PYTHON="python3"
elif command -v python &>/dev/null; then
    PYTHON="python"
else
    echo -e "${RED}Python not found! Please install Python 3.x${NC}"
    exit 1
fi

# Check for pip
echo -e "${BLUE}Checking for pip...${NC}"
if command -v pip3 &>/dev/null; then
    PIP="pip3"
elif command -v pip &>/dev/null; then
    PIP="pip"
else
    echo -e "${RED}pip not found! Please install pip${NC}"
    exit 1
fi

# Check for twine (for PyPI publishing)
echo -e "${BLUE}Checking for twine...${NC}"
if ! command -v twine &>/dev/null; then
    echo -e "${YELLOW}twine not found. Installing...${NC}"
    $PIP install twine
fi

# Check for vsce (for VSCode extension publishing)
echo -e "${BLUE}Checking for vsce...${NC}"
if ! command -v vsce &>/dev/null; then
    echo -e "${YELLOW}vsce not found. Installing...${NC}"
    npm install -g @vscode/vsce
fi

# Ask what to publish
echo -e "${BLUE}What would you like to publish?${NC}"
echo "1. Everything (npm package, PyPI package, VSCode extension)"
echo "2. npm package only"
echo "3. PyPI package only"
echo "4. VSCode extension only"
read -p "Enter your choice (1-4): " PUBLISH_CHOICE

# Publish npm package
publish_npm_package() {
    echo -e "${BLUE}Publishing npm package...${NC}"
    
    # Navigate to project root
    cd "$(dirname "$0")/.." || exit 1
    
    # Make sure we're logged in
    echo -e "${YELLOW}Checking npm login status...${NC}"
    npm whoami &>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}You need to login to npm first:${NC}"
        npm login
    fi
    
    # Create npm package
    echo -e "${BLUE}Creating npm package...${NC}"
    npm pack
    
    # Publish to npm
    echo -e "${BLUE}Publishing to npm...${NC}"
    npm publish
    
    echo -e "${GREEN}npm package published successfully!${NC}"
}

# Publish PyPI package
publish_pypi_package() {
    echo -e "${BLUE}Publishing PyPI package...${NC}"
    
    # Navigate to Python library directory
    cd "$(dirname "$0")/../lib/python" || exit 1
    
    # Build the package
    echo -e "${BLUE}Building Python package...${NC}"
    $PYTHON setup.py sdist bdist_wheel
    
    # Upload to PyPI
    echo -e "${BLUE}Uploading to PyPI...${NC}"
    twine upload dist/*
    
    echo -e "${GREEN}PyPI package published successfully!${NC}"
}

# Publish VSCode extension
publish_vscode_extension() {
    echo -e "${BLUE}Publishing VSCode extension...${NC}"
    
    # Navigate to VSCode extension directory
    cd "$(dirname "$0")/../vscode-extension" || exit 1
    
    # Make sure we have the required files
    if [ ! -f "package.json" ] || [ ! -f "extension.js" ]; then
        echo -e "${RED}Missing required files in VSCode extension directory!${NC}"
        exit 1
    fi
    
    # Package the extension
    echo -e "${BLUE}Packaging VSCode extension...${NC}"
    vsce package
    
    # Publish to VSCode Marketplace
    echo -e "${BLUE}Publishing to VSCode Marketplace...${NC}"
    vsce publish
    
    echo -e "${GREEN}VSCode extension published successfully!${NC}"
}

# Execute based on choice
case $PUBLISH_CHOICE in
    1)
        publish_npm_package
        publish_pypi_package
        publish_vscode_extension
        ;;
    2)
        publish_npm_package
        ;;
    3)
        publish_pypi_package
        ;;
    4)
        publish_vscode_extension
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Publication process completed!${NC}"
