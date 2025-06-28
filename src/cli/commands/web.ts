import { Command } from 'commander';
import { startWebServer } from '../../web/server';

export function createWebCommand(): Command {
  const command = new Command('web');
  
  command
    .description('Start the web interface')
    .option('-s, --storage-path <path>', 'Custom storage path')
    .option('-p, --port <port>', 'Port number (default: 5069)', '5069')
    .option('--no-open', 'Do not automatically open browser')
    .action(async (options: any) => {
      try {
        const port = parseInt(options.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          console.error('Invalid port number');
          process.exit(1);
        }

        await startWebServer(port, options.storagePath, options.open);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return command;
}