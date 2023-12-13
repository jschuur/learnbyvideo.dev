import pc from 'picocolors';
import pluralize from 'pluralize';

import { addQuotaUsage, todaysQuotaUsage } from './db.mjs';
import { debug, error, warn } from './util.mjs';

import config from './config.mjs';

// Look Mom, I'm using classes in JavaScript!
class QuotaTracker {
	constructor({ task, force = false }) {
		this.task = task;
		this.force = force;
		this.usage = 0;
	}

	get todaysUsage() {
		return todaysQuotaUsage(this.task);
	}

	async logUsage({ endpoint, parts }) {
		const quotaCost = parts.split(',').reduce((acc, part) => acc + config.youTubeApiPartQuotas[part], 1);

		debug(`YouTube API quota used for ${endpoint}: ${quotaCost}`);

		this.usage += quotaCost;

		try {
			await addQuotaUsage({ endpoint, parts, points: quotaCost, task: this.task });
		} catch ({ message }) {
			warn(`Couldn't log quota usage: ${message}`);
		}
	}

	async showSummary() {
		const todaysTaskQuotaUsage = await todaysQuotaUsage(this.task);
		const todaysTotalQuotaUsage = await todaysQuotaUsage();

		console.log(
			`Quota Usage for current ${this.task} task: ${pc.cyan(
				pluralize('point', this.usage, true)
			)}. Today: ${todaysTaskQuotaUsage}/${config.taskQuotas[this.task]} (task), ${todaysTotalQuotaUsage}/${
				config.taskQuotas.all
			} (total)`
		);
	}

	// See if you're over the daily quota for a task. Exits if so, or returns true if returnLimited was true
	async checkUsage({ returnLimited = false } = {}) {
		const todaysTaskQuotaUsage = await todaysQuotaUsage(this.task);
		const pointsLimit = config.taskQuotas[this.task] || -1;

		if (todaysTaskQuotaUsage > pointsLimit) {
			if (!this.force) {
				error(`Exceeded daily quota limit for ${this.task}: ${todaysTaskQuotaUsage} > ${pointsLimit} points. Exiting.`);

				// Sometimes you need to still gracefully do stuff when you have exceeded quota allotment
				if (returnLimited) return true;
				process.exit(1);
			} else
				warn(
					`Force option used. Continuing despite exceeding daily quota limit for ${this.task}: ${todaysTaskQuotaUsage} > ${pointsLimit} points.`
				);
		}

		return false;
	}
}

export default QuotaTracker;
