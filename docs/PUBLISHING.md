# Publishing Guide for Claursor System

This guide explains how to publish the Claursor System to GitHub and npm, making it easily accessible to users.

## Directory Structure

The package has been structured for easy distribution:

```
code-bridge/
├── package.json                 # Main npm package configuration
├── README.md                    # Project documentation
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore file
├── server/                      # Bridge server
│   ├── api-bridge-server.py     # Flask server implementation
│   ├── requirements.txt         # Python dependencies
│   └── wsgi.py                  # WSGI entry point
├── vscode-extension/            # VSCode Extension
│   ├── package.json             # Extension configuration
│   ├── extension.js             # Extension implementation
│   └── ...
├── lib/                         # Client libraries
│   ├── python/                  # Python library
│   └── node/                    # Node.js library
└── scripts/                     # Utility scripts
    ├── install.sh               # Unix installation script
    ├── install.bat              # Windows installation script
    ├── start-bridge.js          # Start server script
    ├── post-install.js          # Post-installation script
    └── publish-packages.sh      # Package publishing script
```

## Publishing to GitHub

1. Create a new repository on GitHub (e.g., `claursor`)

2. Initialize Git and push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/9pros/claursor.git
   git push -u origin main
   ```

3. Create a release:
   - Tag: v1.0.0 (use the version in package.json)
   - Title: Claursor System v1.0.0
   - Description: Include key features and changes
   - Upload a ZIP file of the project
   
4. Enable GitHub Pages (optional):
   - Go to repository Settings > Pages
   - Select main branch and `/docs` folder
   - This will host your documentation at `https://9pros.github.io/claursor`

## Publishing to npm

1. Make sure you have an npm account:
   ```bash
   npm login
   ```

2. Update the package.json with your information:
   - Change "9pros" to your actual npm username
   - Update the GitHub repository URL
   - Verify all dependencies are correctly listed

3. Publish the package:
   ```bash
   # Test the package first
   npm pack
   
   # Publish to npm
   npm publish
   ```
   
   You can also use the provided script:
   ```bash
   ./scripts/publish-packages.sh
   ```

4. Your package will be available at `https://www.npmjs.com/package/claursor`

## Publishing the VSCode Extension

1. Install the VSCE tool if you haven't already:
   ```bash
   npm install -g @vscode/vsce
   ```

2. Create a publisher on the Visual Studio Marketplace:
   - Go to https://marketplace.visualstudio.com/manage
   - Create a new publisher if you don't have one

3. Update the VSCode extension package.json:
   - Change "9pros" to your publisher ID
   - Verify all extension details are correct

4. Package and publish the extension:
   ```bash
   cd vscode-extension
   vsce package
   vsce publish
   ```

5. Your extension will be available in the Visual Studio Marketplace

## Publishing to PyPI (Python Package Index)

1. Make sure you have a PyPI account:
   ```bash
   pip install twine
   twine --help
   ```

2. Update the Python setup.py with your information:
   - Change "9pros" to your actual username
   - Update your email and other information
   
3. Build and publish the package:
   ```bash
   cd lib/python
   python setup.py sdist bdist_wheel
   twine upload dist/*
   ```

4. Your package will be available at `https://pypi.org/project/code-bridge/`

## Setting Up Continuous Integration (Optional)

You can use GitHub Actions to automatically:
- Run tests
- Build packages
- Publish to npm and VSCode Marketplace on release

1. Create a `.github/workflows/release.yml` file with appropriate CI/CD configuration
2. Configure npm and VSCode Marketplace tokens as GitHub repository secrets

## Distribution Strategy

For a smooth user experience:

1. **GitHub**: Main source code repository and issue tracking
2. **npm**: Distribution channel for the CLI tool and Node.js library
3. **PyPI**: Distribution channel for the Python library
4. **VSCode Marketplace**: Distribution channel for the VSCode extension

This multi-channel approach ensures users can install your system in the way that's most convenient for them.
