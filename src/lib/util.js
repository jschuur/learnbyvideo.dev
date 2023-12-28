export function youtubeDuration(str) {
  if (!str) return null;

  const pad = (num) => num.toString().padStart(2, '0');

  const matches = str.match(/P((\d+)D)?T((\d+)H)?((\d+)M)?((\d+)S)?/);

  if (matches) {
    const [, , days = 0, , hours = 0, , minutes = 0, , seconds = 0] = matches;

    return days
      ? `${days}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : hours
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  }

  return null;
}

export const shortDateTime = (date) =>
  Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(date));
