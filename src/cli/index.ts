#!/usr/bin/env node

import { Command } from 'commander';
import { ContextManager } from '../core/context';
import { createAddCommand } from './commands/add';
import { createReadCommand } from './commands/read';
import { createListCommand } from './commands/list';
import { createSearchCommand } from './commands/search';
import { createRemoveCommand } from './commands/remove';
import { createWebCommand } from './commands/web';
import { getVersionString } from './utils';
import { startWebServer } from '../web/server';

const program = new Command();

program
  .name('loccon')
  .description('Local context storage and management tool')
  .version(getVersionString());

// Add subcommands
program.addCommand(createAddCommand());
program.addCommand(createReadCommand());
program.addCommand(createListCommand());
program.addCommand(createSearchCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createWebCommand());

// Handle special cases for main command behavior
program
  .argument('[tag]', 'Context tag to read (returns full JSON)')
  .option('-s, --storage-path <path>', 'Custom storage path')
  .action(async (tag?: string, options?: any) => {
    try {
      if (tag) {
        // loccon <tag> → Return entire JSON for specific tag
        const contextManager = await ContextManager.create(options?.storagePath);
        const context = await contextManager.read(tag);
        
        if (!context) {
          console.error(`Context '${tag}' not found`);
          process.exit(1);
        }

        console.log(JSON.stringify({ [tag]: context }, null, 2));
      } else {
        // loccon → Start web interface on port 5069
        await startWebServer(5069, options?.storagePath, true);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();