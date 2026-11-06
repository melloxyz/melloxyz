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
    panel:'#161B22', stroke:'#30363D', text:'#FFFFFF', muted:'#E6EDF3',
    emphasis:'#FFFFFF', badge:'#21262D', levels:['#202832','#364553','#596D7E','#91A5B5','#DCE7F0']
  },
  light: {
    panel:'#F5F7F9', stroke:'#D0D8E0', text:'#1E2933', muted:'#586976',
    emphasis:'#42586B', badge:'#E3EBF1', levels:['#E8EDF1','#C9D3DB','#A3B1BE','#73899C','#354C60']
  }
};
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const rect=(x,y,w,h,r,fill,stroke)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
const fontStack='-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Noto Sans&quot;,Helvetica,Arial,sans-serif';
const txt=(x,y,v,size,color,extra='')=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-family="'+fontStack+'" font-size="'+size+'" '+extra+'>'+esc(v)+'</text>';
const svg=(w,h,title,content)=>'<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(title)+'</title>'+content+'</svg>';

function metricCards(theme,mobile) {
  const p=palettes[theme];
  const width=mobile?390:1060;
  const cardW=mobile?191:256;
  const cardH=mobile?95:112;
  const gap=mobile?8:12;
  const height=mobile?198:112;
  const labels=[
    ['CURRENT STREAK',stats.current+' '+(stats.current===1?'day':'days')],
    ['CONTRIBUTIONS',Number(stats.contributions).toLocaleString('en-US')],
    ['LONGEST STREAK',stats.longest+' '+(stats.longest===1?'day':'days')],
    ['ACTIVE DAYS',stats.activeDays+' '+(stats.activeDays===1?'day':'days')]
  ];
  let content='';
  labels.forEach(([label,value],index)=>{
    const x=(mobile?(index%2):index)*(cardW+gap)+.5;
    const y=(mobile?Math.floor(index/2):0)*(cardH+gap)+.5;
    content+=rect(x,y,cardW-1,cardH-1,9,p.panel,p.stroke);
    if(index===0)content+=rect(x+12,y+12,3,15,1.5,p.emphasis);
    content+=txt(x+(index===0?23:13),y+(mobile?23:27),label,mobile?10:11.2,p.muted,'font-weight="700" letter-spacing=".55"');
    content+=txt(x+13,y+(mobile?57:69),value,mobile?(index===1?27:25):(index===1?34:32),p.text,'font-weight="700"');
    if(index===0 && stats.badge) {
      const bw=Math.min(cardW-24,20+stats.badge.length*(mobile?6.1:6.6));
      const by=y+(mobile?68:82);
      content+=rect(x+12,by,bw,21,5,p.badge,p.stroke);
      content+=txt(x+12+bw/2,by+14,stats.badge.toUpperCase(),mobile?9.5:10.1,p.emphasis,'font-weight="700" text-anchor="middle" letter-spacing=".12"');
    } else if(index>0) {
      content+=txt(x+13,y+(mobile?79:94),'LAST 12 MONTHS',mobile?9:10,p.muted,'letter-spacing=".6"');
    }
  });
  return svg(width,height,'GitHub activity: '+stats.current+'-day streak, '+stats.contributions+' contributions, '+stats.longest+'-day longest streak, '+stats.activeDays+' active days',content);
}

function calendarSvg(theme,mobile) {
  const p=palettes[theme];
  const w=mobile?390:1060;
  const h=mobile?195:223;
  const baseX=mobile?47:78;
  const baseY=mobile?65:75;
  const stepX=mobile?12:17;
  const stepY=mobile?14:17;
  const cell=mobile?10:13;
  const weeks=calendar.weeks.slice(mobile?-26:-53);
  const levels={NONE:0,FIRST_QUARTILE:1,SECOND_QUARTILE:2,THIRD_QUARTILE:3,FOURTH_QUARTILE:4};
  let content=rect(.5,.5,w-1,h-1,10,p.panel,p.stroke);
  content+=txt(18,mobile?23:27,'CONTRIBUTION HISTORY',mobile?11:13,p.text,'font-weight="700" letter-spacing=".45"');
  content+=txt(w-18,mobile?23:27,mobile?'LAST 26 WEEKS':'LAST 12 MONTHS',mobile?9:11,p.muted,'text-anchor="end" letter-spacing=".65"');
  content+='<path d="M18 '+(mobile?38:42)+'H'+(w-18)+'" stroke="'+p.stroke+'" stroke-width="1"/>';
  content+=txt(mobile?22:45,baseY+stepY+8,'M',mobile?10:11,p.muted);
  content+=txt(mobile?22:45,baseY+stepY*3+8,'W',mobile?10:11,p.muted);
  content+=txt(mobile?22:45,baseY+stepY*5+8,'F',mobile?10:11,p.muted);
  let lastMonth='';
  weeks.forEach((week,col)=>{
    const monthStart=week.contributionDays.find(day=>day.date.slice(8,10)==='01');
    const anchor=monthStart || (col===0?week.contributionDays[0]:null);
    if(anchor) {
      const currentMonth=anchor.date.slice(0,7);
      if(lastMonth!==currentMonth && (col===0 || Boolean(monthStart))) {
        lastMonth=currentMonth;
        const monthName=new Date(anchor.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
        content+=txt(baseX+col*stepX,mobile?55:64,monthName,mobile?9:10.5,p.muted);
      }
    }
    week.contributionDays.forEach(day=>{
      const row=dayOfWeekUTC(day.date);
      content+=rect(baseX+col*stepX,baseY+row*stepY,cell,cell,Math.round(cell*.2),p.levels[levels[day.contributionLevel]??0]);
    });
  });
  const dividerY=mobile?168:195;
  content+='<path d="M18 '+dividerY+'H'+(w-18)+'" stroke="'+p.stroke+'" stroke-width="1"/>';
  const legendY=mobile?176:203;
  const legendStart=mobile?252:874;
  content+=txt(legendStart-11,legendY+10,'LESS',mobile?9:10,p.muted,'text-anchor="end"');
  p.levels.forEach((color,i)=>content+=rect(legendStart+i*(mobile?14:15),legendY,mobile?10:11,mobile?10:11,2,color));
  content+=txt(w-18,legendY+10,'MORE',mobile?9:10,p.muted,'text-anchor="end"');
  return svg(w,h,'GitHub contribution calendar for the '+(mobile?'last 26 weeks':'last 12 months'),content);
}

mkdirSync('assets/activity',{recursive:true});
for(const theme of ['dark','light']) {
  writeFileSync('assets/activity/overview-'+theme+'.svg',metricCards(theme,false));
  writeFileSync('assets/activity/overview-mobile-'+theme+'.svg',metricCards(theme,true));
  writeFileSync('assets/activity/calendar-'+theme+'.svg',calendarSvg(theme,false));
  writeFileSync('assets/activity/calendar-mobile-'+theme+'.svg',calendarSvg(theme,true));
}
console.log(JSON.stringify(stats));
