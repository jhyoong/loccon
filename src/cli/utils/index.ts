export function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('An unknown error occurred');
  }
  process.exit(1);
}

export function getVersionString(): string {
  try {
    const packageJson = require('../../../package.json');
    return packageJson.version;
  } catch {
    return '1.0.0';
  }
}