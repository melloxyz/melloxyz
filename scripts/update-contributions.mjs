import { mkdirSync, writeFileSync } from 'node:fs';
import { contributionStats, dayOfWeekUTC } from './activity-core.mjs';

const user = process.env.PROFILE_USER || 'melloxyz';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Missing GITHUB_TOKEN');

const now = new Date();
const from = new Date(now);
from.setUTCFullYear(from.getUTCFullYear()-1);
const query = 'query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }';
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer '+token,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    'User-Agent': 'melloxyz-profile-activity'
  },
  body: JSON.stringify({ query, variables:{ login:user, from:from.toISOString(), to:now.toISOString() } })
});
if (!res.ok) throw new Error('GitHub GraphQL HTTP '+res.status+': '+await res.text());
const body=await res.json();
if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
const calendar=body.data?.user?.contributionsCollection?.contributionCalendar;
const stats=contributionStats(calendar,now);

const palettes={
  dark: {
    panel:'#161B22', stroke:'#36414D', text:'#EFF3F7', muted:'#A9B7C4',
    emphasis:'#CAD7E2', badge:'#273847', levels:['#202832','#364553','#596D7E','#91A5B5','#DCE7F0']
  },
  light: {
    panel:'#F5F7F9', stroke:'#D0D8E0', text:'#1E2933', muted:'#586976',
    emphasis:'#42586B', badge:'#E3EBF1', levels:['#E8EDF1','#C9D3DB','#A3B1BE','#73899C','#354C60']
  }
};
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const rect=(x,y,w,h,r,fill,stroke)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
const txt=(x,y,v,size,color,extra='')=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="Arial,Helvetica,sans-serif" font-size="'+size+'" '+extra+'>'+esc(v)+'</text>';
const svg=(w,h,title,content)=>'<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(title)+'</title>'+content+'</svg>';

function metricCards(theme,mobile) {
  const p=palettes[theme];
  const width=mobile?620:1060;
  const height=mobile?340:172;
  const cardW=mobile?304:256;
  const cardH=mobile?163:170;
  const gapX=mobile?12:12;
  const gapY=14;
  const labels=[
    ['CURRENT STREAK',stats.current+' '+(stats.current===1?'day':'days')],
    ['CONTRIBUTIONS',Number(stats.contributions).toLocaleString('en-US')],
    ['LONGEST STREAK',stats.longest+' '+(stats.longest===1?'day':'days')],
    ['ACTIVE DAYS',stats.activeDays+' '+(stats.activeDays===1?'day':'days')]
  ];
  let result='';
  labels.forEach(([label,value],i)=>{
    const col=mobile?(i%2):i;
    const row=mobile?Math.floor(i/2):0;
    const x=col*(cardW+gapX)+.5;
    const y=row*(cardH+gapY)+.5;
    result+=rect(x,y,cardW-1,cardH-1,11,p.panel,p.stroke);
    if(i===0) result+=rect(x+20,y+23,3,23,1.5,p.emphasis);
    result+=txt(x+(i===0?33:20),y+(mobile?41:39),label,mobile?14:12,p.muted,'font-weight="700" letter-spacing=".7"');
    result+=txt(x+20,y+(mobile?106:102),value,mobile?(i===1?45:43):(i===1?36:35),p.text,'font-weight="700"');
    if(i===0 && stats.badge) {
      const bw=Math.min(cardW-38,30+stats.badge.length*(mobile?9:7.4));
      const by=y+(mobile?122:121);
      result+=rect(x+18,by,bw,mobile?27:27,7,p.badge,p.stroke);
      result+=txt(x+18+bw/2,by+18,stats.badge.toUpperCase(),mobile?12:11.5,p.emphasis,'font-weight="700" text-anchor="middle" letter-spacing=".35"');
    } else if(i>0) {
      result+=txt(x+20,y+(mobile?145:146),'LAST 12 MONTHS',mobile?12:10.5,p.muted,'letter-spacing=".8"');
    }
  });
  return svg(width,height,'Development activity: '+stats.current+'-day streak, '+stats.contributions+' contributions, '+stats.longest+'-day longest streak, '+stats.activeDays+' active days',result);
}

function calendarSvg(theme,mobile) {
  const p=palettes[theme];
  const w=mobile?620:1060;
  const h=mobile?270:255;
  const baseX=mobile?53:80;
  const baseY=mobile?90:91;
  const stepX=mobile?20:17;
  const stepY=mobile?19:17;
  const cell=mobile?16:13;
  const weeks=calendar.weeks.slice(mobile?-26:-53);
  const levels={NONE:0,FIRST_QUARTILE:1,SECOND_QUARTILE:2,THIRD_QUARTILE:3,FOURTH_QUARTILE:4};
  let result=rect(.5,.5,w-1,h-1,12,p.panel,p.stroke);
  result+=txt(24,32,'CONTRIBUTION HISTORY',mobile?16:15,p.text,'font-weight="700" letter-spacing=".4"');
  result+=txt(w-24,32,mobile?'LAST 26 WEEKS':'LAST 12 MONTHS',mobile?12:12,p.muted,'text-anchor="end" letter-spacing=".7"');
  result+='<path d="M24 49H'+(w-24)+'" stroke="'+p.stroke+'" stroke-width="1"/>';
  const weekdayLabelX=mobile?25:45;
  result+=txt(weekdayLabelX,baseY+stepY+10,'M',mobile?12:11,p.muted);
  result+=txt(weekdayLabelX,baseY+stepY*3+10,'W',mobile?12:11,p.muted);
  result+=txt(weekdayLabelX,baseY+stepY*5+10,'F',mobile?12:11,p.muted);
  let lastMonth='';
  weeks.forEach((week,col)=>{
    const monthStart=week.contributionDays.find(d=>d.date.slice(8,10)==='01');
    const anchor=monthStart ?? (col===0?week.contributionDays[0]:null);
    if(anchor) {
      const currentMonth=anchor.date.slice(0,7);
      if(lastMonth!==currentMonth && (!monthStart?col===0:true)) {
        lastMonth=currentMonth;
        const text=new Date(anchor.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
        result+=txt(baseX+col*stepX,75,text,mobile?12:11,p.muted);
      }
    }
    for(const day of week.contributionDays) {
      const row=dayOfWeekUTC(day.date);
      result+=rect(baseX+col*stepX,baseY+row*stepY,cell,cell,Math.round(cell*.2),p.levels[levels[day.contributionLevel]??0]);
    }
  });
  const sepY=mobile?236:223;
  result+='<path d="M24 '+sepY+'H'+(w-24)+'" stroke="'+p.stroke+'" stroke-width="1"/>';
  const legendY=mobile?246:232;
  const legendStart=mobile?466:921;
  result+=txt(legendStart-18,legendY+11,'LESS',mobile?11:10.5,p.muted,'text-anchor="end"');
  p.levels.forEach((c,i)=>{result+=rect(legendStart+i*(mobile?18:16),legendY,mobile?14:12,mobile?14:12,2.5,c);});
  result+=txt(w-18,legendY+11,'MORE',mobile?11:10.5,p.muted,'text-anchor="end"');
  return svg(w,h,'Contribution calendar, '+(mobile?'last 26 weeks':'last 12 months'),result);
}

mkdirSync('assets/activity',{recursive:true});
for(const theme of ['dark','light']) {
  writeFileSync('assets/activity/overview-'+theme+'.svg',metricCards(theme,false));
  writeFileSync('assets/activity/overview-mobile-'+theme+'.svg',metricCards(theme,true));
  writeFileSync('assets/activity/calendar-'+theme+'.svg',calendarSvg(theme,false));
  writeFileSync('assets/activity/calendar-mobile-'+theme+'.svg',calendarSvg(theme,true));
}
console.log(JSON.stringify(stats));
