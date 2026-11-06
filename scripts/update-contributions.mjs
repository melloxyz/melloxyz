import { mkdirSync, writeFileSync } from 'node:fs';

const user = process.env.PROFILE_USER || 'melloxyz';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Missing GITHUB_TOKEN');
const now = new Date();
const from = new Date(now);
from.setUTCFullYear(from.getUTCFullYear() - 1);
const query = 'query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }';
const res = await fetch('https://api.github.com/graphql', {
  method:'POST',
  headers:{ Authorization:'Bearer ' + token, 'Content-Type':'application/json', Accept:'application/vnd.github+json', 'User-Agent':'mello-profile-activity' },
  body:JSON.stringify({query,variables:{ login:user, from:from.toISOString(), to:now.toISOString() }}),
});
if (!res.ok) throw new Error('GitHub GraphQL HTTP '+res.status+' '+await res.text());
const payload = await res.json();
if (payload.errors?.length) throw new Error(JSON.stringify(payload.errors));
const cal = payload.data?.user?.contributionsCollection?.contributionCalendar;
if (!cal?.weeks?.length) throw new Error('GitHub contribution calendar unavailable');
const today = now.toISOString().slice(0,10);
const days = cal.weeks.flatMap(w => w.contributionDays).filter(d => d.date <= today).sort((a,b) => a.date.localeCompare(b.date));
let longest = 0, running = 0;
for (const d of days) { running = d.contributionCount > 0 ? running+1 : 0; longest = Math.max(longest,running); }
let i = days.length-1;
if (i>=0 && days[i].contributionCount === 0) i--;
let current = 0;
while (i>=0 && days[i].contributionCount>0) { current++; i--; }

const colors = {
 dark:{bg:'#10151B',card:'#171D25',line:'#34404B',fg:'#EFF3F7',muted:'#A2B0BD',levels:['#202832','#364553','#596D7E','#91A5B5','#DCE7F0']},
 light:{bg:'#FBFCFD',card:'#FFFFFF',line:'#D6DEE5',fg:'#17212B',muted:'#5D6E7B',levels:['#E8EDF1','#C9D3DB','#A3B1BE','#73899C','#354C60']},
};
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const label = (x,y,value,size,fill,extra='') => '<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-family="Arial,Helvetica,sans-serif" font-size="'+size+'" '+extra+'>'+esc(value)+'</text>';
const svg = (w,h,inside) => '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+inside+'</svg>';
const rect = (x,y,w,h,r,fill,stroke) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
function metrics(theme) {
 const p=colors[theme];
 let s='<title>GitHub contributions and streak for '+esc(user)+'</title>'+rect(1,1,1058,165,10,p.bg,p.line);
 const entries=[
  ['CONTRIBUTIONS · LAST 12 MONTHS',cal.totalContributions.toLocaleString('en-US'),'From GitHub contribution calendar'],
  ['CURRENT STREAK',current+' '+(current===1?'day':'days'),'Through today or yesterday'],
  ['LONGEST STREAK · LAST 12 MONTHS',longest+' '+(longest===1?'day':'days'),'Longest run in this date range']
 ];
 entries.forEach((a,k)=>{const x=15+k*350;s+=rect(x,14,330,137,7,p.card,p.line)+label(x+18,46,a[0],12,p.muted,'font-weight="700" letter-spacing=".7"')+label(x+18,101,a[1],35,p.fg,'font-weight="700"')+label(x+18,128,a[2],12,p.muted);});
 return svg(1060,167,s);
}
function calendar(theme) {
 const p=colors[theme];
 let s='<title>GitHub contribution history for '+esc(user)+'</title>'+rect(1,1,1058,189,10,p.bg,p.line);
 s+=label(24,30,'CONTRIBUTION HISTORY',15,p.fg,'font-weight="700" letter-spacing=".4"')+label(1030,30,'LAST 12 MONTHS',12,p.muted,'text-anchor="end" letter-spacing=".8"');
 const weeks=cal.weeks.slice(-53);
 const map={NONE:0,FIRST_QUARTILE:1,SECOND_QUARTILE:2,THIRD_QUARTILE:3,FOURTH_QUARTILE:4};
 s+=label(35,78,'M',10,p.muted)+label(35,112,'W',10,p.muted)+label(35,146,'F',10,p.muted);
 let lastMonth='';
 weeks.forEach((w,k)=>{
  if (w.contributionDays.length) {
   const d=w.contributionDays[0]; const month=d.date.slice(0,7);
   if (month!==lastMonth && k<50) { lastMonth=month; const name=new Date(d.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});s+=label(65+k*17,49,name,11,p.muted); }
  }
  w.contributionDays.forEach((d,j)=>{let level=map[d.contributionLevel]||0;s+=rect(65+k*17,63+j*17,13,13,2.4,p.levels[level]);});
 });
 s+=label(24,181,'Public activity and optional aggregated private contributions',11,p.muted);
 s+=label(916,181,'LESS',10,p.muted);
 p.levels.forEach((c,j)=>s+=rect(951+j*16,172,12,12,2,c));
 s+=label(1036,181,'MORE',10,p.muted);
 return svg(1060,191,s);
}
mkdirSync('assets/activity',{recursive:true});
for (const mode of ['dark','light']) {
 writeFileSync('assets/activity/metrics-'+mode+'.svg',metrics(mode));
 writeFileSync('assets/activity/calendar-'+mode+'.svg',calendar(mode));
}
console.log('Updated profile activity graphics:',cal.totalContributions,'contributions;',current,'current streak;',longest,'longest (12 months)');
