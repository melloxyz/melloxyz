import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionStats, streakBadge, dayOfWeekUTC } from '../scripts/activity-core.mjs';

const cal = (...days) => ({
  totalContributions: days.reduce((n, d) => n + d[1], 0),
  weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount, contributionLevel:'FIRST_QUARTILE' })) }]
});

test('badge boundaries', () => {
  const expected = [[0,null],[1,'Building Momentum'],[6,'Building Momentum'],[7,'In Rhythm'],[13,'In Rhythm'],[14,'On a Roll'],[29,'On a Roll'],[30,'Consistent Builder'],[59,'Consistent Builder'],[60,'Long-Term Streak']];
  for (const [days, badge] of expected) assert.equal(streakBadge(days), badge);
});

test('today with contributions extends current and longest streak', () => {
  const result = contributionStats(cal(['2026-11-04',1],['2026-11-05',2],['2026-11-06',1]), new Date('2026-11-06T11:00:00Z'));
  assert.deepEqual([result.current,result.longest,result.activeDays,result.contributions], [3,3,3,4]);
});

test('yesterday remains an active streak until end of today', () => {
  const result = contributionStats(cal(['2026-11-04',1],['2026-11-05',1],['2026-11-06',0]),new Date('2026-11-06T12:00:00Z'));
  assert.equal(result.current,2);
  assert.equal(result.activeDays,2);
});

test('yesterday without contributions ends current streak', () => {
  const result = contributionStats(cal(['2026-11-03',2],['2026-11-04',1],['2026-11-05',0],['2026-11-06',0]),new Date('2026-11-06T12:00:00Z'));
  assert.equal(result.current,0);
  assert.equal(result.longest,2);
});

test('correct weekdays, independent of local timezone', () => {
  assert.equal(dayOfWeekUTC('2026-11-01'),0);
  assert.equal(dayOfWeekUTC('2026-11-02'),1);
  assert.equal(dayOfWeekUTC('2026-11-06'),5);
});

test('never counts future dates', () => {
  const result=contributionStats(cal(['2026-11-05',1],['2026-11-06',2],['2026-11-07',5]),new Date('2026-11-06T12:00:00Z'));
  assert.equal(result.activeDays,2);
  assert.equal(result.current,2);
});
