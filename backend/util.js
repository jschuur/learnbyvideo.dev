import pc from 'picocolors';

export const warn = (str) => console.log(`${pc.yellow('Warning')}: ${str}`);

export const error = (str) => console.error(`${pc.red('Warning')}: ${str}`);
