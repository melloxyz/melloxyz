import { mkdirSync, writeFileSync } from 'node:fs';
import { contributionStats, monthlyContributions } from './activity-core.mjs';

const palettes={
  dark:{bg:'#0D1117',line:'#30363D',text:'#F0F3FA',muted:'#9DAABD',blue:'#6495FF',bar:'#344B6E'},
  light:{bg:'#FFFFFF',line:'#D8DFEB',text:'#182237',muted:'#53647B',blue:'#185AE8',bar:'#BCCDF0'}
};
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const text=(x,y,value,size,color,extra='')=>'<text x="'+x+'" y="'+y+'" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(value)+'</text>';
const format=value=>Number(value).toLocaleString('en-US');

function activityCard(p,stats,months,updated) {
  const baseline=177,plotH=101,left=490,step=42;
  const max=Math.max(1,...months.map(m=>m.count));
  const best=months.reduce((a,b)=>b.count>a.count?b:a,months[0]);
  let body='<rect x=".5" y=".5" width="1059" height="249" rx="10" fill="'+p.bg+'" stroke="'+p.line+'"/>'
    +'<style>@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}.bar{transform-box:fill-box;transform-origin:center bottom;animation:grow .7s ease-out both}@media(prefers-reduced-motion:reduce){.bar{animation:none}}</style>';
  body+=text(30,38,'A year of building.',19,p.text,'font-weight="600"');
  body+=text(30,113,format(stats.contributions),44,p.text,'font-weight="600" letter-spacing="-1.5"');
  body+=text(30,141,'contributions',14,p.muted);
  body+=text(246,113,format(stats.activeDays),44,p.text,'font-weight="600" letter-spacing="-1.5"');
  body+=text(246,141,'active days',14,p.muted);
  body+=text(30,190,'Small steps. Something to show for them.',14,p.muted);
  body+='<path d="M450 30V202" stroke="'+p.line+'"/>';
  body+=text(left,38,'Monthly contributions',14,p.muted);
  body+='<path d="M'+left+' '+baseline+'H1030" stroke="'+p.line+'"/>';
  months.forEach((m,i)=>{
    const x=left+i*step,barH=m.count/max*plotH,isBest=m.count>0&&m.month===best.month;
    if(barH)body+='<rect class="bar" x="'+x+'" y="'+(baseline-barH)+'" width="26" height="'+barH+'" rx="2" fill="'+(isBest?p.blue:p.bar)+'" style="animation-delay:'+(i*20)+'ms"/>';
    const label=new Date(m.month+'-01T00:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
    body+=text(x+13,199,label,11,p.muted,'text-anchor="middle"');
  });
  body+=text(30,231,'GitHub · '+months[0].month+' to '+months.at(-1).month+' · updated '+updated,11,p.muted);
  body+=text(1030,231,'First and current months are partial.',11,p.muted,'text-anchor="end"');
  const title='GitHub activity: '+stats.contributions+' contributions and '+stats.activeDays+' active days in the rolling year. Updated '+updated+'. Monthly counts: '+months.map(m=>m.month+': '+m.count).join('; ')+'. First and current months are partial.';
  return '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="1060" height="250" viewBox="0 0 1060 250"><title>'+esc(title)+'</title>'+body+'</svg>';
}

export function renderActivity(calendar,now) {
  const stats=contributionStats(calendar,now);
  const months=monthlyContributions(calendar,now);
  const updated=new Date(now).toISOString().slice(0,10);
  mkdirSync('assets/activity',{recursive:true});
  for(const [theme,p] of Object.entries(palettes)) {
    writeFileSync('assets/activity/overview-'+theme+'.svg',activityCard(p,stats,months,updated));
  }
  return stats;
}
