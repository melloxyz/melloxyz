import { mkdirSync, writeFileSync } from 'node:fs';

const user = process.env.PROFILE_USER || 'melloxyz';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Missing GITHUB_TOKEN');

const now = new Date();
const from = new Date(now);
from.setUTCFullYear(from.getUTCFullYear() - 1);

const query = 'query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }';
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mello-profile-activity'
  },
  body: JSON.stringify({ query, variables: { login: user, from: from.toISOString(), to: now.toISOString() } })
});
if (!res.ok) throw new Error('GitHub GraphQL HTTP ' + res.status + ' ' + await res.text());
const payload = await res.json();
if (payload.errors?.length) throw new Error(JSON.stringify(payload.errors));

const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar?.weeks?.length) throw new Error('Contribution calendar unavailable');

const lower = from.toISOString().slice(0, 10);
const upper = now.toISOString().slice(0, 10);
const days = calendar.weeks.flatMap(w => w.contributionDays)
  .filter(d => d.date >= lower && d.date <= upper)
  .sort((a, b) => a.date.localeCompare(b.date));

const activeDays = days.filter(d => d.contributionCount > 0).length;
let longest = 0;
let run = 0;
for (const day of days) {
  run = day.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let last = days.length - 1;
if (last >= 0 && days[last].contributionCount === 0) last--;
let current = 0;
while (last >= 0 && days[last].contributionCount > 0) { current++; last--; }

const badge = current === 0 ? null :
  current >= 60 ? 'Long-Term Streak' :
  current >= 30 ? 'Consistent Builder' :
  current >= 14 ? 'On a Roll' :
  current >= 7 ? 'In Rhythm' : 'Building Momentum';

const palette = {
  dark: { bg:'#10151B', card:'#171D25', line:'#34404B', fg:'#EFF3F7', muted:'#A2B0BD', badge:'#263544', accent:'#B9C9D6', levels:['#202832','#364553','#596D7E','#91A5B5','#DCE7F0'] },
  light: { bg:'#FBFCFD', card:'#F5F7FA', line:'#D6DEE5', fg:'#17212B', muted:'#5D6E7B', badge:'#E1E9EF', accent:'#425A6C', levels:['#E8EDF1','#C9D3DB','#A3B1BE','#73899C','#354C60'] }
};

const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const txt = (x, y, value, size, fill, extra='') => '<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-family="Arial,Helvetica,sans-serif" font-size="'+size+'" '+extra+'>'+esc(value)+'</text>';
const rect = (x,y,w,h,r,fill,stroke) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
const doc = (w,h,title,body) => '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(title)+'</title>'+body+'</svg>';

function makeOverview(mode) {
  const p = palette[mode];
  let body = rect(1, 1, 1058, 180, 12, p.bg, p.line);

  const entries = [
    { label: 'CURRENT STREAK', value: current+' '+(current===1?'day':'days'), featured: true },
    { label: 'CONTRIBUTIONS', value: calendar.totalContributions.toLocaleString('en-US') },
    { label: 'LONGEST STREAK', value: longest+' '+(longest===1?'day':'days') },
    { label: 'ACTIVE DAYS', value: activeDays+' days' }
  ];

  entries.forEach((entry, index) => {
    const x = 16 + index * 260;
    body += rect(x, 16, 248, 150, 10, p.card, p.line);
    if (entry.featured) body += rect(x+18, 34, 4, 21, 2, p.accent);
    body += txt(x+(entry.featured?31:19), 48, entry.label, 12, p.muted, 'font-weight="700" letter-spacing=".65"');
    body += txt(x+19, 104, entry.value, index===1?36:33, p.fg, 'font-weight="700"');
    if (entry.featured && badge) {
      const bw = Math.min(211, 30+badge.length*7.15);
      body += rect(x+18, 122, bw, 27, 7, p.badge, p.line);
      body += txt(x+18+bw/2, 139, badge.toUpperCase(), 11.2, p.accent, 'font-weight="700" text-anchor="middle" letter-spacing=".4"');
    } else if (!entry.featured) {
      body += txt(x+19, 142, 'LAST 12 MONTHS', 10.5, p.muted, 'letter-spacing=".8"');
    }
  });

  return doc(1060, 182, 'GitHub activity: '+current+'-day streak, '+calendar.totalContributions+' contributions, '+longest+'-day longest streak, '+activeDays+' active days', body);
}

function makeCalendar(mode) {
  const p = palette[mode];
  const w = 1060;
  const h = 258;
  const x0 = 80;
  const y0 = 94;
  const step = 17;
  const size = 13;
  const weeks = calendar.weeks.slice(-53);
  const levelMap = { NONE:0, FIRST_QUARTILE:1, SECOND_QUARTILE:2, THIRD_QUARTILE:3, FOURTH_QUARTILE:4 };

  let body = rect(1, 1, w-2, h-2, 12, p.bg, p.line);
  body += txt(24, 33, 'CONTRIBUTION HISTORY', 15, p.fg, 'font-weight="700" letter-spacing=".45"');
  body += txt(1036, 33, 'LAST 12 MONTHS', 12, p.muted, 'text-anchor="end" letter-spacing=".8"');
  body += '<path d="M24 51 H1036" stroke="'+p.line+'" stroke-width="1"/>';
  body += txt(45, y0+step+11, 'M', 11, p.muted);
  body += txt(45, y0+step*3+11, 'W', 11, p.muted);
  body += txt(45, y0+step*5+11, 'F', 11, p.muted);

  if (weeks.length && weeks[0].contributionDays.length) {
    const first = weeks[0].contributionDays[0].date;
    const label = new Date(first+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
    body += txt(x0, 77, label, 11, p.muted);
  }

  weeks.forEach((week, col) => {
    const monthStart = week.contributionDays.find(d => d.date.slice(8,10) === '01');
    if (monthStart && col > 2 && col <= 50) {
      const monthLabel = new Date(monthStart.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
      body += txt(x0+col*step, 77, monthLabel, 11, p.muted);
    }
    week.contributionDays.forEach(day => {
      const weekday = new Date(day.date+'T00:00:00Z').getUTCDay();
      body += rect(x0+col*step, y0+weekday*step, size, size, 2.6, p.levels[levelMap[day.contributionLevel]??0]);
    });
  });

  body += '<path d="M24 226 H1036" stroke="'+p.line+'" stroke-width="1"/>';
  body += txt(909, 247, 'LESS', 10.5, p.muted, 'letter-spacing=".3"');
  p.levels.forEach((c,index) => {
    body += rect(945+index*16, 237, 12, 12, 2.3, c);
  });
  body += txt(1036, 247, 'MORE', 10.5, p.muted, 'text-anchor="end" letter-spacing=".3"');
  return doc(w, h, 'GitHub contributions for the last 12 months', body);
}

mkdirSync('assets/activity', { recursive:true });
for (const theme of ['dark','light']) {
  writeFileSync('assets/activity/overview-'+theme+'.svg',makeOverview(theme));
  writeFileSync('assets/activity/calendar-'+theme+'.svg',makeCalendar(theme));
}
console.log(JSON.stringify({ contributions:calendar.totalContributions, currentStreak:current, longestStreak:longest, activeDays, badge }));
