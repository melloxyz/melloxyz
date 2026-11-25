import { mkdirSync, writeFileSync } from 'node:fs';
import { contributionStats, monthlyContributions } from './activity-core.mjs';

const palettes = {
  dark:{bg:'#0D1117',panel:'#161B22',line:'#30363D',text:'#F0F3FA',muted:'#9DAABD',blue:'#6495FF',bar:'#29446E'},
  light:{bg:'#FFFFFF',panel:'#F6F8FC',line:'#D8DFEB',text:'#182237',muted:'#53647B',blue:'#185AE8',bar:'#BBCDF3'}
};
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const text=(x,y,value,size,color,extra='')=>'<text x="'+x+'" y="'+y+'" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(value)+'</text>';
const rect=(x,y,w,h,r,color)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+color+'"/>';
const svg=(w,h,title,body)=>'<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(title)+'</title>'+body+'</svg>';
const format=value=>Number(value).toLocaleString('en-US');

function overview(p,mobile,stats,updated) {
  const w=mobile?390:1060,h=mobile?221:166;
  let s=rect(0,0,w,h,14,p.panel);
  s+=text(24,30,'A habit of building.',mobile?15:18,p.text,'font-weight="600"');
  if(!mobile)s+=text(w-24,30,'Rolling year · updated '+updated,12,p.muted,'text-anchor="end"');
  const items=[[format(stats.contributions),'contributions'],[format(stats.activeDays),'active days'],[stats.current+'d','current streak'],[stats.longest+'d','longest streak']];
  items.forEach(([value,label],i)=>{
    const x=24+(mobile?i%2:i)*(mobile?184:262),y=mobile?Math.floor(i/2)*79:0;
    s+=text(x,y+(mobile?79:98),value,mobile?32:43,p.text,'font-weight="600" letter-spacing="-1.2"');
    s+=text(x,y+(mobile?101:125),label,mobile?12:14,i===1?p.blue:p.muted);
  });
  if(mobile)s+=text(24,204,'Rolling year · updated '+updated,10,p.muted);
  return svg(w,h,'Activity in the rolling year: '+stats.contributions+' contributions, '+stats.activeDays+' active days, '+stats.current+'-day current streak, '+stats.longest+'-day longest streak. Updated '+updated+'.',s);
}

function chart(p,mobile,months,updated) {
  const w=mobile?390:1060,h=mobile?288:302,left=mobile?28:36,right=mobile?24:36;
  const baseline=mobile?204:218,plotH=mobile?110:122;
  const step=(w-left-right)/months.length,barW=step*(mobile?.64:.65);
  const max=Math.max(1,...months.map(m=>m.count));
  const best=months.reduce((a,b)=>b.count>a.count?b:a,months[0]);
  let s=rect(.5,.5,w-1,h-1,14,p.bg)+'<rect x=".5" y=".5" width="'+(w-1)+'" height="'+(h-1)+'" rx="14" fill="none" stroke="'+p.line+'"/>';
  s+='<style>@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}.bar{transform-box:fill-box;transform-origin:center bottom;animation:grow .8s ease-out both}@media(prefers-reduced-motion:reduce){.bar{animation:none}}</style>';
  s+=text(left,33,'Your rhythm, month by month.',mobile?16:21,p.text,'font-weight="600" letter-spacing="-.3"');
  s+=text(left,57,months[0].month+' — '+months.at(-1).month,mobile?11:12,p.muted);
  for(const fraction of [0,.5,1]) {
    const y=baseline-fraction*plotH;
    s+='<path d="M'+left+' '+y+'H'+(w-right)+'" stroke="'+p.line+'" stroke-dasharray="'+(fraction?'2 5':'none')+'"/>';
  }
  months.forEach((m,i)=>{
    const x=left+i*step+(step-barW)/2,barH=m.count/max*plotH,isBest=m.count>0&&m.month===best.month;
    if(barH)s+='<g class="bar" style="animation-delay:'+(i*25)+'ms">'+rect(x,baseline-barH,barW,barH,3,isBest?p.blue:p.bar)+'</g>';
    if(isBest)s+=text(x+barW/2,baseline-barH-10,format(m.count),mobile?11:13,p.blue,'text-anchor="middle" font-weight="600"');
    const label=new Date(m.month+'-01T00:00:00Z').toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
    if(!mobile||i%2===0)s+=text(x+barW/2,baseline+23,label,mobile?10:12,p.muted,'text-anchor="middle"');
  });
  s+=text(left,h-33,'First and current months are partial.',mobile?10:12,p.muted);
  s+=text(left,h-14,'GitHub contributions · as of '+updated,mobile?10:12,p.muted);
  return svg(w,h,'Monthly GitHub contributions from '+months[0].month+' through '+months.at(-1).month+'. '+months.map(m=>m.month+': '+m.count).join('; ')+'. First and current months are partial.',s);
}

export function renderActivity(calendar,now) {
  const stats=contributionStats(calendar,now);
  const months=monthlyContributions(calendar,now);
  const updated=new Date(now).toISOString().slice(0,10);
  mkdirSync('assets/activity',{recursive:true});
  for(const theme of ['dark','light']) for(const mobile of [false,true]) {
    const suffix=(mobile?'-mobile':'')+'-'+theme+'.svg',p=palettes[theme];
    writeFileSync('assets/activity/overview'+suffix,overview(p,mobile,stats,updated));
    writeFileSync('assets/activity/monthly'+suffix,chart(p,mobile,months,updated));
  }
  return stats;
}
