import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionStats, streakBadge, dayOfWeekUTC, monthlyContributions } from '../scripts/activity-core.mjs';

const cal = (...days) => ({
  totalContributions: days.reduce((n, d) => n + d[1], 0),
  weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount, contributionLevel:'FIRST_QUARTILE' })) }]
});

test('monthly activity keeps empty months and separates years within the rolling window', () => {
  const result = monthlyContributions(cal(['2025-11-23',99],['2025-11-24',2],['2025-12-01',3],['2026-11-24',5],['2026-11-25',99]), new Date('2026-11-24T12:00:00Z'));
  assert.equal(result.length,13);
  assert.deepEqual(result[0],{month:'2025-11',count:2});
  assert.deepEqual(result[1],{month:'2025-12',count:3});
  assert.deepEqual(result[2],{month:'2026-01',count:0});
  assert.deepEqual(result.at(-1),{month:'2026-11',count:5});
  assert.equal(result.reduce((sum,month)=>sum+month.count,0),10);
});

test('monthly activity renders an empty calendar and rejects invalid data', () => {
  assert(monthlyContributions(cal(),new Date('2026-11-24T12:00:00Z')).every(month=>month.count===0));
  assert.throws(()=>monthlyContributions(null),/unavailable/);
  assert.throws(()=>monthlyContributions(cal(['2026-11-24',-1]),new Date('2026-11-24T12:00:00Z')),/Invalid contribution count/);
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

test('stale last contribution cannot produce an active streak', () => {
  const result=contributionStats(cal(['2026-11-01',1],['2026-11-02',1],['2026-11-03',0]),new Date('2026-11-06T12:00:00Z'));
  assert.equal(result.current,0);
  assert.equal(result.longest,2);
});
