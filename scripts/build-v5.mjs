import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { stackGroups, agents } from './profile-v5-data.mjs';

const palettes = {
  dark: { bg:'#0D1117', panel:'#161B22', line:'#30363D', text:'#F0F3FA', muted:'#9DAABD', blue:'#6495FF' },
  light: { bg:'#FFFFFF', panel:'#F6F8FC', line:'#D8DFEB', text:'#182237', muted:'#53647B', blue:'#185AE8' }
};
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const font = 'Segoe UI,Helvetica,Arial,sans-serif';
const text = (x,y,value,size,fill,extra='') => '<text x="'+x+'" y="'+y+'" font-family="'+font+'" font-size="'+size+'" fill="'+fill+'" '+extra+'>'+esc(value)+'</text>';
const rect = (x,y,w,h,r,fill,stroke='none') => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'" stroke="'+stroke+'"/>';
const line = (x1,y1,x2,y2,color) => '<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="'+color+'"/>';
const motion = '<style>@keyframes arrive{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes signal{from{stroke-dashoffset:160}to{stroke-dashoffset:0}}.intro{animation:arrive .7s ease-out both}.signal{stroke-dasharray:6 154;animation:signal 5s linear 2}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>';
const svg = (w,h,label,body) => '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(label)+'</title>'+motion+body+'</svg>';

function constellation(p,x,y,scale) {
  const paths = ['M-136 -48H-76L-30 0','M30 0L76 -48H136','M-136 64H-76L-30 0','M30 0L76 64H136'];
  let s='<g transform="translate('+x+' '+y+') scale('+scale+')" fill="none">';
  s+='<circle r="99" stroke="'+p.line+'"/><circle r="69" stroke="'+p.line+'" stroke-dasharray="2 8"/>';
  for(const d of paths) s+='<path d="'+d+'" stroke="'+p.blue+'" stroke-opacity=".45"/><path class="signal" d="'+d+'" stroke="'+p.blue+'" stroke-width="2"/>';
  for(const [dx,dy] of [[-136,-48],[136,-48],[-136,64],[136,64]]) s+='<circle cx="'+dx+'" cy="'+dy+'" r="5" fill="'+p.bg+'" stroke="'+p.blue+'" stroke-width="2"/>';
  s+='<rect x="-30" y="-30" width="60" height="60" rx="18" fill="'+p.blue+'" transform="rotate(-12)"/>';
  s+='<path d="m-9 -9-9 9 9 9M9 -9l9 9-9 9M3 -13l-6 26" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  s+=text(-136,-67,'build',12,p.muted,'text-anchor="middle"');
  s+=text(136,-67,'learn',12,p.muted,'text-anchor="middle"');
  s+=text(136,90,'share',12,p.muted,'text-anchor="middle"');
  s+='<path d="M-6 -106h12M0 -112v12" stroke="'+p.blue+'" stroke-width="2"/>';
  return s+'</g>';
}

function hero(theme,mobile) {
  const p=palettes[theme],w=mobile?390:1060,h=mobile?476:352,x=mobile?24:38;
  let s=rect(.5,.5,w-1,h-1,16,p.bg,p.line);
  s+=text(x,38,'A personal lab, always in progress.',mobile?12:14,p.muted);
  s+='<g class="intro"><text x="'+(x-5)+'" y="'+(mobile?133:177)+'" font-family="Georgia,Times New Roman,serif" font-size="'+(mobile?100:148)+'" letter-spacing="-7" fill="'+p.text+'">Mello.</text>';
  s+=text(x,mobile?174:228,'Curiosity into code.',mobile?25:32,p.text,'font-weight="600" letter-spacing="-.8"');
  s+=text(x,mobile?208:267,'Built to be shared.',mobile?25:32,p.text,'font-weight="600" letter-spacing="-.8"')+'</g>';
  s+=constellation(p,mobile?195:820,mobile?337:169,mobile?.78:1.16);
  s+=line(x,h-48,w-x,h-48,p.line);
  s+=text(x,h-22,'Code / AI / Open source',mobile?12:13,p.blue,'font-weight="600"');
  s+=text(w-x,h-22,'Based in Brazil',mobile?11:12,p.muted,'text-anchor="end"');
  return svg(w,h,'Mello. Curiosity into code. Built to be shared.',s);
}

function interests(theme,mobile) {
  const p=palettes[theme],w=mobile?390:1060,h=mobile?406:204,pad=mobile?24:28;
  const items=[
    ['Code','Making ideas useful.','Practical tools, thoughtful interfaces,','and fewer repetitive tasks.'],
    ['AI','Curiosity, with a feedback loop.','Exploring agents, intelligent systems,','and new ways to build software.'],
    ['Open source','Good ideas travel further.','Sharing what I learn and building','tools other people can use.']
  ];
  let s=rect(.5,.5,w-1,h-1,14,p.panel,p.line);
  items.forEach(([title,lead,a,b],i)=>{
    const x=mobile?pad:pad+i*350,y=mobile?i*130:0;
    if(i) s+=mobile?line(pad,y+7,w-pad,y+7,p.line):'<path d="M'+(x-18)+' 24V180" stroke="'+p.line+'"/>';
    s+=text(x,y+43,title,mobile?26:28,p.blue,'font-weight="600" letter-spacing="-.7"');
    s+=text(x,y+75,lead,mobile?14:15,p.text,'font-weight="600"');
    s+=text(x,y+101,a,mobile?13:14,p.muted);
    s+=text(x,y+121,b,mobile?13:14,p.muted);
  });
  return svg(w,h,'Code: making ideas useful. AI: exploring new ways to build. Open source: sharing tools and learning.',s);
}

function brand(slug,x,y,p) {
  const source=readFileSync('assets/chips/'+slug+'-dark.svg','utf8');
  const match=source.match(/<g\b[^>]*>[\s\S]*?<\/g>/);
  if(!match) throw new Error('No embedded logo in '+slug);
  return '<g transform="translate('+(x-13)+' '+(y-10)+')">'+match[0].replace(/fill="#[0-9A-Fa-f]{6}"/g,'fill="'+p.text+'"').replace(/stroke="#[0-9A-Fa-f]{6}"/g,'stroke="'+p.text+'"')+'</g>';
}

function stack(theme,mobile) {
  const p=palettes[theme],w=mobile?390:1060;
  // Keep the owner's complete approved tool list in profile-v5-data; show only a compact selection here.
  const selected=new Set(['typescript','python','react','nextjs','nodejs','postgresql','cloudflare','docker']);
  const items=stackGroups.flatMap(g=>g.items).filter(([,slug])=>selected.has(slug));
  let s='',x=mobile?24:28,y=24;
  for(const [label,slug] of items) {
    const width=46+label.length*7.2;
    if(x+width>w-24) {x=mobile?24:28;y+=43;}
    s+=brand(slug,x+4,y+8,p);
    s+=text(x+31,y+19,label,14,p.text);
    x+=width+14;
  }
  const agentsLabel=agents.slice(0,2).map(([label])=>label).join(' + ');
  s+=line(24,y+43,w-24,y+43,p.line);
  s+=text(24,y+70,'AI in the workflow, too.',13,p.muted);
  s+=text(24,y+92,agentsLabel,14,p.text,'font-weight="600"');
  return svg(w,y+113,'Selected tools: '+items.map(([label])=>label).join(', ')+'. AI workflow: '+agentsLabel,rect(.5,.5,w-1,y+112,14,p.bg,p.line)+s);
}

mkdirSync('assets/headers',{recursive:true});
mkdirSync('assets/sections',{recursive:true});
for(const theme of ['dark','light']) for(const mobile of [false,true]) {
  const suffix=(mobile?'-mobile':'')+'-'+theme+'.svg';
  writeFileSync('assets/headers/hero'+suffix,hero(theme,mobile));
  writeFileSync('assets/sections/interests'+suffix,interests(theme,mobile));
  writeFileSync('assets/sections/stack'+suffix,stack(theme,mobile));
}
console.log('Generated personal lab hero, interests and compact stack in both themes and viewports.');
