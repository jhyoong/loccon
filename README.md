# Loccon

A simple **local context storage and management tool** with CLI and web interfaces. Store, search, and organize code snippets, notes, and development contexts with sharded JSON storage.

[![npm version](https://badge.fury.io/js/loccon.svg)](https://badge.fury.io/js/loccon)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- **CLI Interface** - Fast command-line operations
- **Web Interface** - Beautiful browser-based UI
- **Fuzzy Search** - Find contexts with partial matches
- **Sharded Storage** - Efficient 5MB JSON file management
- **Categories** - Organize contexts with tags
- **File Locking** - Safe concurrent access
- **Cross-platform** - Works on macOS, Linux, and Windows

## Quick Start

### Installation

```bash
# Install globally
npm install -g loccon

# Or install locally in your project
npm install loccon
```

### Basic Usage

```bash
# Start web interface (opens browser automatically)
loccon

# Add a new context
loccon add "api-key" "const API_KEY = 'your-api-key'" --categories "config,keys"

# Read a context (returns full JSON)
loccon api-key

# Read context content only
loccon read api-key

# List all contexts
loccon list

# Search contexts
loccon search "api"

# Search with fuzzy matching
loccon search "api" --fuzzy

# Remove a context
loccon remove api-key
```

## CLI Reference

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `loccon` | Start web interface | `loccon` |
| `loccon <tag>` | Get context as JSON | `loccon my-snippet` |
| `loccon add <tag> <content>` | Add new context | `loccon add "func" "function test() {}"` |
| `loccon read <tag>` | Read context content | `loccon read my-snippet` |
| `loccon list` | List all contexts | `loccon list --verbose` |
| `loccon search <query>` | Search contexts | `loccon search "react" --fuzzy` |
| `loccon remove <tag>` | Remove context | `loccon remove my-snippet --force` |
| `loccon web` | Start web server | `loccon web --port 8080` |

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-s, --storage-path <path>` | Custom storage location | `--storage-path ./my-contexts` |
| `-c, --categories <cats>` | Comma-separated categories | `--categories "react,hooks"` |
| `-f, --fuzzy` | Use fuzzy search | `--fuzzy` |
| `-j, --json` | Output as JSON | `--json` |
| `-v, --verbose` | Detailed output | `--verbose` |
| `--force` | Skip confirmations | `--force` |
| `--no-open` | Don't open browser | `--no-open` |

## Web Interface

The web interface provides a user-friendly way to manage your contexts:

```bash
# Start on default port (5069)
loccon

# Start on custom port
loccon web --port 8080

# Use custom storage path
loccon web --storage-path ./project-contexts
```

**Features:**
- Add/edit contexts with syntax highlighting
- Real-time search with fuzzy matching
- Category management
- Context statistics
- Responsive design

## Storage Architecture

Loccon uses a **sharded storage system** for optimal performance:

```
.loccon/
├── config.json        # Configuration and metadata
├── index.json         # Tag-to-shard mapping (O(1) lookups)
├── metadata.json      # Statistics and shard information
└── shards/
    ├── shard-001.json # ~5MB each
    ├── shard-002.json
    └── ...
```

### Storage Locations

- **Global install**: `~/.loccon/`
- **Local install**: `{project}/.loccon/`
- **Custom path**: Use `--storage-path` option

## Advanced Usage

### Programmatic API

```javascript
const { ContextManager } = require('loccon');

async function example() {
  const manager = await ContextManager.create();
  
  // Add context
  await manager.add('my-tag', 'content here', ['category1', 'category2']);
  
  // Read context
  const context = await manager.read('my-tag');
  
  // Search contexts
  const results = await manager.search('query', true); // fuzzy=true
  
  // List all
  const allContexts = await manager.getAll();
}
```

### Categories

Organize your contexts with categories:

```bash
# Add with categories
loccon add "react-hook" "useState example" --categories "react,hooks,state"

# Search by category
loccon search "hooks"

# List with category info
loccon list --verbose
```

### Search Examples

```bash
# Simple text search
loccon search "function"

# Fuzzy search (finds partial matches)
loccon search "func" --fuzzy

# Search in categories
loccon search "react"

# JSON output for scripting
loccon search "api" --json
```

## Development

### Setup

```bash
git clone https://github.com/jhyoong/loccon.git
cd loccon
npm install
npm run build
```

### Scripts

```bash
npm run build     # Compile TypeScript
npm run dev       # Development mode
npm test          # Run tests
npm pack          # Test package creation
```

### Project Structure

```
src/
├── cli/          # CLI commands and interface
├── core/         # Core storage and context management
├── web/          # Web server and API
├── types/        # TypeScript interfaces
└── utils/        # Shared utilities
```

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Requirements

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/jhyoong/loccon/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/jhyoong/loccon/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/jhyoong/loccon/wiki)

## Roadmap

- [ ] File upload support for code contexts
- [ ] Bulk import/export operations
- [ ] Advanced search indexing
- [ ] MCP (Model Context Protocol) integration
- [ ] Backup and sync capabilities
- [ ] Plugin system
- [ ] VS Code extension

---

**Made by [JiaHui Yoong](https://github.com/jhyoong)**
