const args = process.argv.slice(1);
export const isDev = args.some(val => val === '--serve');
