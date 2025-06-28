import express from 'express';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ContextManager } from '../core/context';
import { createAPIRoutes } from './api/routes';
import * as childProcess from 'child_process';

export async function startWebServer(port: number = 5069, storagePath?: string, openBrowser: boolean = true): Promise<void> {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Create context manager
  const contextManager = await ContextManager.create(storagePath);

  // API routes
  app.use('/api', createAPIRoutes(contextManager));

  // Serve static files
  const staticPath = path.join(__dirname, 'static');
  
  // Check if static files exist, if not create basic ones
  await ensureStaticFiles(staticPath);
  app.use(express.static(staticPath));

  // Catch-all route to serve index.html for SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`Loccon web interface running at http://localhost:${port}`);
    console.log(`Storage path: ${contextManager.getStoragePath()}`);
    
    if (openBrowser) {
      openBrowserToUrl(`http://localhost:${port}`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
      process.exit(0);
    });
  });

  return new Promise((resolve) => {
    server.on('listening', resolve);
  });
}

async function ensureStaticFiles(staticPath: string): Promise<void> {
  await fs.ensureDir(staticPath);

  const indexPath = path.join(staticPath, 'index.html');
  const stylePath = path.join(staticPath, 'style.css');
  const scriptPath = path.join(staticPath, 'app.js');

  // Create basic HTML file if it doesn't exist
  if (!await fs.pathExists(indexPath)) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loccon - Local Context Manager</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Loccon</h1>
            <p>Local Context Storage & Management</p>
        </header>
        
        <main>
            <section id="add-section">
                <h2>Add New Context</h2>
                <form id="add-form">
                    <input type="text" id="tag-input" placeholder="Context tag" required>
                    <textarea id="content-input" placeholder="Context content" required rows="4"></textarea>
                    <input type="text" id="categories-input" placeholder="Categories (comma-separated)">
                    <button type="submit">Add Context</button>
                </form>
            </section>

            <section id="search-section">
                <h2>Search</h2>
                <div class="search-controls">
                    <input type="text" id="search-input" placeholder="Search contexts...">
                    <label>
                        <input type="checkbox" id="fuzzy-search"> Fuzzy search
                    </label>
                    <button id="search-btn">Search</button>
                    <button id="clear-search">Clear</button>
                </div>
            </section>

            <section id="contexts-section">
                <h2>Contexts</h2>
                <div id="contexts-container">
                    <!-- Contexts will be loaded here -->
                </div>
            </section>
        </main>

        <div id="modal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3 id="modal-title">Edit Context</h3>
                <form id="edit-form">
                    <input type="hidden" id="edit-tag">
                    <textarea id="edit-content" rows="6" required></textarea>
                    <input type="text" id="edit-categories" placeholder="Categories (comma-separated)">
                    <div class="modal-buttons">
                        <button type="submit">Save</button>
                        <button type="button" id="cancel-edit">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>`;
    await fs.writeFile(indexPath, html);
  }

  // Create basic CSS file if it doesn't exist
  if (!await fs.pathExists(stylePath)) {
    const css = `/* Basic styles for Loccon web interface */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
    color: #2c3e50;
    font-size: 2.5em;
    margin-bottom: 10px;
}

header p {
    color: #7f8c8d;
    font-size: 1.1em;
}

section {
    background: white;
    margin-bottom: 30px;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

/* Form styles */
form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

input, textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

button {
    padding: 12px 24px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}

button:hover {
    background: #2980b9;
}

button.danger {
    background: #e74c3c;
}

button.danger:hover {
    background: #c0392b;
}

/* Search controls */
.search-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}

.search-controls input[type="text"] {
    flex: 1;
    min-width: 200px;
}

/* Context cards */
.context-card {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 15px;
    background: #fafafa;
}

.context-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
}

.context-tag {
    font-weight: bold;
    font-size: 1.1em;
    color: #2c3e50;
}

.context-actions {
    display: flex;
    gap: 8px;
}

.context-actions button {
    padding: 6px 12px;
    font-size: 12px;
}

.context-content {
    margin-bottom: 15px;
    white-space: pre-wrap;
    background: white;
    padding: 15px;
    border-radius: 4px;
    border-left: 4px solid #3498db;
}

.context-meta {
    font-size: 0.9em;
    color: #7f8c8d;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
}

.context-categories {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.category-tag {
    background: #ecf0f1;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    color: #2c3e50;
}

/* Modal styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 10% auto;
    padding: 30px;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    position: relative;
}

.close {
    position: absolute;
    right: 20px;
    top: 15px;
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
}

.close:hover {
    color: #000;
}

.modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
}

/* Responsive design */
@media (max-width: 768px) {
    #app {
        padding: 10px;
    }
    
    .search-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .context-header {
        flex-direction: column;
        gap: 10px;
    }
    
    .context-meta {
        flex-direction: column;
    }
}

/* Loading and empty states */
.loading {
    text-align: center;
    padding: 40px;
    color: #7f8c8d;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #7f8c8d;
}

.empty-state h3 {
    margin-bottom: 10px;
    color: #95a5a6;
}`;
    await fs.writeFile(stylePath, css);
  }

  // Create basic JavaScript file if it doesn't exist
  if (!await fs.pathExists(scriptPath)) {
    const js = `// Loccon Web Interface JavaScript

class LocconApp {
    constructor() {
        this.contexts = {};
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadContexts();
    }

    bindEvents() {
        // Add form
        document.getElementById('add-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddContext();
        });

        // Search
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        document.getElementById('clear-search').addEventListener('click', () => {
            this.clearSearch();
        });

        // Modal
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateContext();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadContexts() {
        try {
            const response = await fetch('/api/contexts');
            this.contexts = await response.json();
            this.renderContexts(this.contexts);
        } catch (error) {
            this.showError('Failed to load contexts: ' + error.message);
        }
    }

    async handleAddContext() {
        const tag = document.getElementById('tag-input').value.trim();
        const content = document.getElementById('content-input').value.trim();
        const categories = document.getElementById('categories-input').value.trim();

        if (!tag || !content) {
            alert('Tag and content are required');
            return;
        }

        try {
            const response = await fetch('/api/contexts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag, content, categories })
            });

            if (response.ok) {
                document.getElementById('add-form').reset();
                await this.loadContexts();
                this.showSuccess('Context added successfully');
            } else {
                const error = await response.json();
                this.showError(error.error);
            }
        } catch (error) {
            this.showError('Failed to add context: ' + error.message);
        }
    }

    async handleSearch() {
        const query = document.getElementById('search-input').value.trim();
        const fuzzy = document.getElementById('fuzzy-search').checked;

        if (!query) {
            this.loadContexts();
            return;
        }

        try {
            const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&fuzzy=\${fuzzy}\`);
            const results = await response.json();
            
            const searchContexts = {};
            results.forEach(result => {
                searchContexts[result.tag] = result.entry;
            });
            
            this.renderContexts(searchContexts);
            this.currentSearch = query;
        } catch (error) {
            this.showError('Search failed: ' + error.message);
        }
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        document.getElementById('fuzzy-search').checked = false;
        this.currentSearch = '';
        this.loadContexts();
    }

    renderContexts(contexts) {
        const container = document.getElementById('contexts-container');
        const entries = Object.entries(contexts);

        if (entries.length === 0) {
            container.innerHTML = \`
                <div class="empty-state">
                    <h3>No contexts found</h3>
                    <p>\${this.currentSearch ? 'Try a different search term' : 'Add your first context above'}</p>
                </div>
            \`;
            return;
        }

        container.innerHTML = entries.map(([tag, entry]) => \`
            <div class="context-card">
                <div class="context-header">
                    <div class="context-tag">\${this.escapeHtml(tag)}</div>
                    <div class="context-actions">
                        <button onclick="app.editContext('\${tag}')">Edit</button>
                        <button class="danger" onclick="app.deleteContext('\${tag}')">Delete</button>
                    </div>
                </div>
                <div class="context-content">\${this.escapeHtml(entry.content)}</div>
                <div class="context-meta">
                    <div>
                        <strong>Created:</strong> \${new Date(entry.metadata.created).toLocaleString()}
                        <br>
                        <strong>Modified:</strong> \${new Date(entry.metadata.modified).toLocaleString()}
                    </div>
                    <div class="context-categories">
                        \${entry.metadata.categories.map(cat => 
                            \`<span class="category-tag">\${this.escapeHtml(cat)}</span>\`
                        ).join('')}
                    </div>
                </div>
            </div>
        \`).join('');
    }

    editContext(tag) {
        const context = this.contexts[tag];
        if (!context) return;

        document.getElementById('edit-tag').value = tag;
        document.getElementById('edit-content').value = context.content;
        document.getElementById('edit-categories').value = context.metadata.categories.join(', ');
        document.getElementById('modal-title').textContent = \`Edit Context: \${tag}\`;
        document.getElementById('modal').style.display = 'block';
    }

    async handleUpdateContext() {
        const tag = document.getElementById('edit-tag').value;
        const content = document.getElementById('edit-content').value.trim();
        const categories = document.getElementById('edit-categories').value.trim();

        if (!content) {
            alert('Content is required');
            return;
        }

        try {
            const response = await fetch(\`/api/contexts/\${encodeURIComponent(tag)}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, categories })
            });

            if (response.ok) {
                this.closeModal();
                await this.loadContexts();
                this.showSuccess('Context updated successfully');
            } else {
                const error = await response.json();
                this.showError(error.error);
            }
        } catch (error) {
            this.showError('Failed to update context: ' + error.message);
        }
    }

    async deleteContext(tag) {
        if (!confirm(\`Are you sure you want to delete the context '\${tag}'?\`)) {
            return;
        }

        try {
            const response = await fetch(\`/api/contexts/\${encodeURIComponent(tag)}\`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadContexts();
                this.showSuccess('Context deleted successfully');
            } else {
                const error = await response.json();
                this.showError(error.error);
            }
        } catch (error) {
            this.showError('Failed to delete context: ' + error.message);
        }
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        // Simple alert for now - could be enhanced with proper notifications
        alert(message);
    }

    showError(message) {
        alert('Error: ' + message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LocconApp();
});`;
    await fs.writeFile(scriptPath, js);
  }
}

function openBrowserToUrl(url: string): void {
  const platform = process.platform;
  let command: string;

  switch (platform) {
    case 'darwin': // macOS
      command = 'open';
      break;
    case 'win32': // Windows
      command = 'start';
      break;
    default: // Linux and others
      command = 'xdg-open';
      break;
  }

  childProcess.spawn(command, [url], { detached: true, stdio: 'ignore' });
}