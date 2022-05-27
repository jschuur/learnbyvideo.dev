import pc from 'picocolors';

export const warn = (str) => console.log(`${pc.yellow('Warning')}: ${str}`);

export const error = (str) => console.error(`${pc.red('Warning')}: ${str}`);

export const debug = (str) => process.env.DEBUG && console.log(str);

