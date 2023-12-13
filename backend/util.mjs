import pc from 'picocolors';
import prettyMilliseconds from 'pretty-ms';

export const warn = (str) => console.log(`${pc.yellow('Warning')}: ${str}`);

export const error = (str) => console.error(`${pc.red('Error')}: ${str}`);

export const debug = (str) => process.env.DEBUG && console.log(str);

export const logTimeSpent = (startTime) => console.log(`\nRun time: ${prettyMilliseconds(Date.now() - startTime)}`);

export const logMemoryUsage = () =>
	console.log(`Memory used: ~${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`);
