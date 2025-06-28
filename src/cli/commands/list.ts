import { Command } from 'commander';
import { ContextManager } from '../../core/context';
import { formatTimestamp, categoriesToString } from '../../utils/common';

export function createListCommand(): Command {
  const command = new Command('list');
  
  command
    .description('List all contexts')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .option('-j, --json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed information')
    .action(async (options: any) => {
      try {
        const contextManager = await ContextManager.create(options.storagePath);
        
        if (options.verbose) {
          const allContexts = await contextManager.getAll();
          
          if (options.json) {
            console.log(JSON.stringify(allContexts, null, 2));
          } else {
            console.log(`\nFound ${Object.keys(allContexts).length} contexts:\n`);
            
            for (const [tag, entry] of Object.entries(allContexts)) {
              console.log(`Tag: ${tag}`);
              console.log(`Created: ${formatTimestamp(entry.metadata.created)}`);
              console.log(`Modified: ${formatTimestamp(entry.metadata.modified)}`);
              console.log(`Categories: ${categoriesToString(entry.metadata.categories) || 'None'}`);
              console.log(`Content: ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}`);
              console.log('---');
            }
          }
        } else {
          const tags = await contextManager.list();
          
          if (options.json) {
            console.log(JSON.stringify(tags, null, 2));
          } else {
            if (tags.length === 0) {
              console.log('No contexts found');
            } else {
              console.log(`Found ${tags.length} contexts:`);
              tags.forEach(tag => console.log(`  ${tag}`));
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