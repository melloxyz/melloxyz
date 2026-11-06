/** Pure contribution statistics; independent of SVG rendering and GitHub API. */
export function streakBadge(days) {
  if (days <= 0) return null;
  if (days >= 60) return 'Long-Term Streak';
  if (days >= 30) return 'Consistent Builder';
  if (days >= 14) return 'On a Roll';
  if (days >= 7) return 'In Rhythm';
  return 'Building Momentum';
}

export function dayOfWeekUTC(date) {
  return new Date(date + 'T00:00:00Z').getUTCDay();
}

export function contributionStats(calendar, now = new Date()) {
  if (!calendar?.weeks?.length) throw new Error('Contribution calendar unavailable');
  const currentDate = new Date(now);
  if (Number.isNaN(currentDate.valueOf())) throw new Error('Invalid date');
  const from = new Date(currentDate);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const start = from.toISOString().slice(0, 10);
  const end = currentDate.toISOString().slice(0, 10);
  const days = calendar.weeks.flatMap(w => w.contributionDays)
    .filter(d => d.date >= start && d.date <= end)
    .sort((a,b) => a.date.localeCompare(b.date));
  const activeDays = days.filter(d => d.contributionCount > 0).length;

  let longest = 0, running = 0;
  for (const day of days) {
    running = day.contributionCount > 0 ? running + 1 : 0;
    longest = Math.max(longest, running);
  }

  let i = days.length - 1;
  // A streak is alive until the end of today if the user contributed yesterday.
  if (i >= 0 && days[i].date === end && days[i].contributionCount === 0) i--;
  const yesterday = new Date(currentDate);
  yesterday.setUTCDate(yesterday.getUTCDate()-1);
  if (i >= 0 && days[i].date < yesterday.toISOString().slice(0,10)) i = -1;
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }

  return {
    contributions: calendar.totalContributions,
    activeDays,
    current,
    longest,
    badge: streakBadge(current)
  };
}
