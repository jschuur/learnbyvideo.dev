#!/usr/bin/env node
import 'dotenv/config';

import { map } from 'lodash-es';
import pc from 'picocolors';
import prisma from '../prisma/prisma.mjs';
import sparkline from 'sparkline';

import { QuotaTracker } from './youtubeQuota.mjs';

import config from './config.mjs';

const sparklineQuery = `
  SELECT
  	date_trunc('day', days)::date AS date,
    usage.points
  FROM generate_series((CURRENT_DATE - INTERVAL '31' day), CURRENT_DATE, '1 day'::INTERVAL) days
  LEFT JOIN (
    SELECT
      DATE(date) AS date,
      SUM(points) AS points
    FROM
      "QuotaUsage"
    WHERE DATE(date) > (CURRENT_DATE - INTERVAL '31' day)::date
    GROUP BY DATE(date)) usage
  ON
    days.date = usage.date
  ORDER BY date ASC`;

const POINTS_PAD_WIDTH =
  Math.max(...Object.values(config.taskQuotas).map((points) => points.toString().length)) + 2;
const TASK_PAD_WIDTH = Math.max(...Object.keys(config.taskQuotas).map((key) => key.length)) + 2;

function padNum(num) {
  return `${Intl.NumberFormat('en-US').format(num)}`.padStart(POINTS_PAD_WIDTH, ' ');
}

async function taskQuotaSummary(task) {
  const quotaTracker = new QuotaTracker(task);
  const usage = await quotaTracker.todaysUsage;
  const limit = config.taskQuotas[task];

  const color =
    usage <= 0 ? 'gray' : usage >= limit ? 'red' : usage >= limit * 0.8 ? 'yellow' : 'green';

  console.log(
    `${task.padEnd(TASK_PAD_WIDTH, ' ')} ${pc[color](`${padNum(usage)} /${padNum(limit)}`)}`
  );
}

(async () => {
  const chartData = await prisma.$queryRawUnsafe(sparklineQuery);

  console.log(
    ' ' +
      pc.yellow(sparkline(map(chartData, 'points'), { min: 0, max: config.taskQuotas.all })) +
      '\n'
  );
  for (const task of Object.keys(config.taskQuotas)) {
    if (task === 'all') continue;

    await taskQuotaSummary(task);
  }
  await taskQuotaSummary('all');

})();
