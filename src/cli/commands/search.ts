import { Command } from 'commander';
import { ContextManager } from '../../core/context';
import { formatTimestamp, categoriesToString } from '../../utils/common';

export function createSearchCommand(): Command {
  const command = new Command('search');
  
  command
    .description('Search contexts')
    .argument('<query>', 'Search query')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .option('-j, --json', 'Output as JSON')
    .option('-f, --fuzzy', 'Use fuzzy search with Fuse.js')
    .action(async (query: string, options: any) => {
      try {
        const contextManager = await ContextManager.create(options.storagePath);
        const results = await contextManager.search(query, options.fuzzy);
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        } else {
          if (results.length === 0) {
            console.log(`No contexts found matching '${query}'`);
          } else {
            console.log(`\nFound ${results.length} matching contexts:\n`);
            
            for (const result of results) {
              console.log(`Tag: ${result.tag}`);
              console.log(`Created: ${formatTimestamp(result.entry.metadata.created)}`);
              console.log(`Categories: ${categoriesToString(result.entry.metadata.categories) || 'None'}`);
              console.log(`Content: ${result.entry.content.substring(0, 150)}${result.entry.content.length > 150 ? '...' : ''}`);
              console.log('---');
            }
          }
        }
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}