export function youtubeDuration(str) {
  if (!str) return;

  const pad = (num) => num.toString().padStart(2, '0');

  const matches = str.match(/PT((\d+)H)?((\d+)M)?((\d+)S)?/);

  if (matches) {
    const [, , hours = 0, , minutes = 0, , seconds = 0] = matches;

    return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  }
}
