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

function makeCard(mode, kind) {
  const p = palette[mode];
  const featured = kind === 'streak';
  const w = featured ? 255 : 198;
  const h = 156;
  let body = rect(1,1,w-2,h-2,11,featured?p.card:p.bg,p.line);
  if (featured) {
    body += rect(16,18,4,24,2,p.accent);
    body += txt(29,35,'CURRENT STREAK',12,p.muted,'font-weight="700" letter-spacing=".7"');
    body += txt(20,90,current+' '+(current===1?'day':'days'),35,p.fg,'font-weight="700"');
    if (badge) {
      const bw = Math.min(w-38, 32 + badge.length*7.2);
      body += rect(19,111,bw,28,7,p.badge,p.line);
      body += txt(19+bw/2,129,badge.toUpperCase(),11.4,p.accent,'font-weight="700" text-anchor="middle" letter-spacing=".6"');
    }
    return doc(w,h,'Current GitHub contribution streak: '+current+' days'+(badge?', '+badge:''),body);
  }

  const info = {
    contributions: ['CONTRIBUTIONS',calendar.totalContributions.toLocaleString('en-US')],
    longest: ['LONGEST STREAK',longest+' '+(longest===1?'day':'days')],
    'active-days': ['ACTIVE DAYS',activeDays+' days']
  }[kind];
  if (!info) throw new Error('Unknown metric '+kind);
  body += txt(18,34,info[0],11.5,p.muted,'font-weight="700" letter-spacing=".8"');
  body += txt(18,91,info[1],kind==='contributions'?33:31,p.fg,'font-weight="700"');
  body += txt(18,131,'LAST 12 MONTHS',10.5,p.muted,'letter-spacing=".8"');
  return doc(w,h,info[0]+': '+info[1],body);
}

function makeCalendar(mode) {
  const p = palette[mode];
  let body = rect(1,1,1058,190,10,p.bg,p.line);
  body += txt(24,31,'CONTRIBUTION HISTORY',15,p.fg,'font-weight="700" letter-spacing=".4"');
  body += txt(1035,31,'LAST 12 MONTHS',12,p.muted,'text-anchor="end" letter-spacing=".8"');
  const map = { NONE:0, FIRST_QUARTILE:1, SECOND_QUARTILE:2, THIRD_QUARTILE:3, FOURTH_QUARTILE:4 };
  body += txt(35,78,'M',10,p.muted)+txt(35,112,'W',10,p.muted)+txt(35,146,'F',10,p.muted);
  let lastMonth = '';
  calendar.weeks.slice(-53).forEach((week, column) => {
    const first = week.contributionDays[0];
    if (first) {
      const month = first.date.slice(0,7);
      if (month !== lastMonth && column < 50) {
        lastMonth = month;
        const name = new Date(first.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
        body += txt(65+column*17,49,name,11,p.muted);
      }
    }
    week.contributionDays.forEach((day,row) => {
      body += rect(65+column*17,63+row*17,13,13,2.5,p.levels[map[day.contributionLevel]??0]);
    });
  });
  body += txt(913,183,'LESS',10,p.muted);
  p.levels.forEach((c,index) => { body += rect(947+index*16,173,12,12,2,c); });
  body += txt(1036,183,'MORE',10,p.muted);
  return doc(1060,192,'GitHub contribution history over the past 12 months',body);
}

mkdirSync('assets/activity', { recursive:true });
for (const theme of ['dark','light']) {
  for (const metric of ['streak','contributions','longest','active-days']) {
    writeFileSync('assets/activity/'+metric+'-'+theme+'.svg',makeCard(theme,metric));
  }
  writeFileSync('assets/activity/calendar-'+theme+'.svg',makeCalendar(theme));
}
console.log(JSON.stringify({ contributions:calendar.totalContributions, currentStreak:current, longestStreak:longest, activeDays, badge }));
