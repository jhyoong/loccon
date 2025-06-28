import { Command } from 'commander';
import { ContextManager } from '../../core/context';
import { parseCategories } from '../../utils/common';

export function createAddCommand(): Command {
  const command = new Command('add');
  
  command
    .description('Add a new context')
    .argument('<tag>', 'Context tag')
    .argument('<content>', 'Context content')
    .option('-c, --categories <categories>', 'Comma-separated categories')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .action(async (tag: string, content: string, options: any) => {
      try {
        const contextManager = await ContextManager.create(options.storagePath);
        const categories = options.categories ? parseCategories(options.categories) : [];
        
        await contextManager.add(tag, content, categories);
        console.log(`Added context '${tag}'`);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}