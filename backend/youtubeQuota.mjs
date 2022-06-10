import pc from 'picocolors';
import pluralize from 'pluralize';

import { addQuotaUsage, todaysQuotaUsage } from './db.mjs';
import { debug, warn } from './util.mjs';

import config from './config.mjs';

// Look Mom, I'm using classes in JavaScript!
export class QuotaTracker {
  constructor(task) {
    this.task = task;
    this.usage = 0;
  }

  get todaysUsage() {
    return todaysQuotaUsage(this.task);
  }

  async logUsage({ endpoint, parts }) {
    const quotaCost = parts
      .split(',')
      .reduce((acc, part) => acc + config.youTubeApiPartQuotas[part], 1);

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
      )}. Today: ${todaysTaskQuotaUsage}/${
        config.taskQuotas[this.task]
      } (task), ${todaysTotalQuotaUsage}/${config.taskQuotas.all} (total)`
    );
  }

  async checkUsage({ returnLimited = false } = {}) {
    const todaysTaskQuotaUsage = await todaysQuotaUsage(this.task);
    const pointsLimit = config.taskQuotas[this.task] || -1;

    if (todaysTaskQuotaUsage > pointsLimit) {
      console.log(
        `${pc.yellow('Warning:')} Exceeded daily quota limit for ${
          this.task
        }: ${todaysTaskQuotaUsage} > ${pointsLimit} points. Exiting.`
      );

      // Sometimes you need to still gracefully do stuff when you have exceeded quota allotment
      if (returnLimited) return true;
      else process.exit(1);
    }
  }
}
