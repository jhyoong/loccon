import { Command } from 'commander';
import { ContextManager } from '../../core/context';
import * as readline from 'readline';

export function createRemoveCommand(): Command {
  const command = new Command('remove');
  
  command
    .description('Remove a context')
    .argument('<tag>', 'Context tag')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .option('-f, --force', 'Force removal without confirmation')
    .action(async (tag: string, options: any) => {
      try {
        const contextManager = await ContextManager.create(options.storagePath);
        
        // Check if context exists
        const context = await contextManager.read(tag);
        if (!context) {
          console.error(`Context '${tag}' not found`);
          process.exit(1);
        }

        // Show confirmation unless forced
        if (!options.force) {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const answer = await new Promise<string>((resolve) => {
            rl.question(`Are you sure you want to remove context '${tag}'? (y/N): `, resolve);
          });

          rl.close();

          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('Removal cancelled');
            return;
          }
        }

        const removed = await contextManager.remove(tag);
        if (removed) {
          console.log(`Removed context '${tag}'`);
        } else {
          console.error(`Failed to remove context '${tag}'`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}