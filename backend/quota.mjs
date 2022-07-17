#!/usr/bin/env node
import 'dotenv/config';

import { map } from 'lodash-es';
import minimost from 'minimost';
import pc from 'picocolors';
import sparkline from 'sparkline';

import prisma from '../prisma/prisma.mjs';
import QuotaTracker from './youtubeQuota.mjs';

import config from './config.mjs';

const options = minimost(process.argv.slice(2), {
  boolean: ['verbose'],
  alias: {
    v: 'verbose',
  },
}).flags;

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

const QUOTA_LIMIT = config.taskQuotas.all;

const POINTS_PAD_WIDTH = Math.max(...Object.values(config.taskQuotas).map((points) => points.toString().length)) + 2;
const TASK_PAD_WIDTH = Math.max(...Object.keys(config.taskQuotas).map((key) => key.length)) + 2;

const numColor = (num) =>
  num <= 0 ? 'gray' : num >= QUOTA_LIMIT ? 'red' : num >= QUOTA_LIMIT * 0.8 ? 'yellow' : 'green';

function padNum(num, { color } = {}) {
  const formattedNum = `${Intl.NumberFormat('en-US').format(num)}`.padStart(POINTS_PAD_WIDTH, ' ');

  return color ? pc[numColor(num)](formattedNum) : formattedNum;
}

async function taskQuotaSummary(taskName) {
  const quotaTracker = new QuotaTracker({ task: taskName });
  const task = taskName || 'all';

  const usage = await quotaTracker.todaysUsage;
  const limit = config.taskQuotas[task];

  console.log(`${task.padEnd(TASK_PAD_WIDTH, ' ')} ${padNum(usage, { color: true })} /${padNum(limit)}`);
}

const showSparkline = (chartData) =>
  console.log(
    ` ${pc.yellow(
      sparkline(
        map(chartData, ({ points }) => Number(points)),
        { min: 0, max: QUOTA_LIMIT }
      )
    )}\n`
  );

function showDailyUsage(chartData) {
  for (const { date, points } of chartData) console.log(`${pc.dim(date)} ${padNum(points, { color: true })}`);
}

(async () => {
  const chartData = await prisma.$queryRawUnsafe(sparklineQuery);

  if (options.verbose) showDailyUsage(chartData);
  showSparkline(chartData);

  for (const task of Object.keys(config.taskQuotas)) {
    if (task !== 'all') await taskQuotaSummary(task);
  }
  await taskQuotaSummary();
})();
