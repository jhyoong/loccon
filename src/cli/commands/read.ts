import { Command } from 'commander';
import { ContextManager } from '../../core/context';

export function createReadCommand(): Command {
  const command = new Command('read');
  
  command
    .description('Read a context')
    .argument('<tag>', 'Context tag')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .option('-j, --json', 'Output as JSON')
    .action(async (tag: string, options: any) => {
      try {
        const contextManager = await ContextManager.create(options.storagePath);
        const context = await contextManager.read(tag);
        
        if (!context) {
          console.error(`Context '${tag}' not found`);
          process.exit(1);
        }

        if (options.json) {
          console.log(JSON.stringify({ [tag]: context }, null, 2));
        } else {
          console.log(context.content);
        }
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}