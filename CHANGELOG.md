# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-28

### Added
- Initial release of Loccon
- Full CLI interface with Commander.js
- Web interface with Express server
- Sharded JSON storage architecture (5MB per shard)
- Search functionality with both simple and fuzzy search (Fuse.js)
- Category system for organizing contexts
- File locking mechanism for concurrent access protection
- Cross-platform support (macOS, Linux, Windows)
- Global and local storage path resolution
- TypeScript implementation with full type safety

### CLI Commands
- `loccon` - Start web interface
- `loccon <tag>` - Read context as JSON
- `loccon add <tag> <content>` - Add new context
- `loccon read <tag>` - Read context content only
- `loccon list` - List all contexts
- `loccon search <query>` - Search contexts
- `loccon remove <tag>` - Remove context
- `loccon web` - Start web server

### CLI Options
- `--storage-path` - Custom storage location
- `--categories` - Add categories to contexts
- `--fuzzy` - Enable fuzzy search
- `--json` - Output as JSON
- `--verbose` - Detailed output
- `--force` - Skip confirmations
- `--no-open` - Don't auto-open browser

### Web Interface Features
- Add/edit contexts with clean UI
- Real-time search with fuzzy matching
- Category management
- Context statistics
- Responsive design
- Modern CSS styling

### Storage Features
- Automatic directory structure creation
- Sharded JSON files for performance
- Tag-to-shard index for O(1) lookups
- Metadata tracking (entries, sizes, timestamps)
- Index rebuilding capability
- Configurable storage paths

### Developer Features
- TypeScript source code
- Modular architecture
- Prepared for testing framework
- Comprehensive documentation
- NPM package ready
- Development scripts included

### Dependencies
- commander ^9.0.0 - CLI framework
- express ^4.18.0 - Web server
- fs-extra ^11.0.0 - Enhanced file operations
- fuse.js ^6.6.0 - Fuzzy search

### Dev Dependencies
- TypeScript ^5.0.0
- Jest ^30.0.3 (testing framework)
- @types/jest ^30.0.0
- @types packages for type definitions

---

## Future Releases

See [GitHub Issues](https://github.com/jhyoong/loccon/issues) for planned features and improvements.

### Planned Features
- File upload support for code contexts
- Bulk import/export operations
- Advanced search indexing
- MCP (Model Context Protocol) integration
- Backup and sync capabilities
- Plugin system
- VS Code extension