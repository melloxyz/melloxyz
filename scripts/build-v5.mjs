import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { stackGroups, agents, buildAreas } from './profile-v5-data.mjs';

const palette = {
  dark: {
    bg:'#0D1117',
    panel:'#161B22',
    tile:'#21262D',
    line:'#30363D',
    text:'#FFFFFF',
    muted:'#E6EDF3',
    submuted:'#9198A1',
    icon:'#FFFFFF',
    accent:'#FFFFFF'
  },
  light: {
    bg:'#FFFFFF',
    panel:'#F6F8FA',
    tile:'#FFFFFF',
    line:'#D0D7DE',
    text:'#1F2328',
    muted:'#656D76',
    submuted:'#656D76',
    icon:'#1F2328',
    accent:'#0969DA'
  }
};
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const rect = (x,y,w,h,r,fill,stroke) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'"':'')+'/>';
const line = (x1,y1,x2,y2,color) => '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="1"/>';
const fontStack = '-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,&quot;Noto Sans&quot;,Helvetica,Arial,sans-serif';
const text = (x,y,str,size,color,extra='') => '<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" font-family="'+fontStack+'" '+extra+'>'+esc(str)+'</text>';
const svg = (w,h,label,body) => '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><title>'+esc(label)+'</title>'+body+'</svg>';

const iconCache = new Map();
function brand(slug,x,y,ink) {
  if (!iconCache.has(slug)) {
    const source = readFileSync('assets/chips/'+slug+'-dark.svg','utf8');
    const m = source.match(/<g\b[^>]*>[\s\S]*?<\/g>/);
    if (!m) throw new Error('No embedded logo in '+slug);
    iconCache.set(slug,m[0]);
  }
  const icon = iconCache.get(slug)
    .replace(/fill="#[0-9A-Fa-f]{6}"/g,'fill="'+ink+'"')
    .replace(/stroke="#[0-9A-Fa-f]{6}"/g,'stroke="'+ink+'"');
  return '<g transform="translate('+(x-13)+' '+(y-10)+')">'+icon+'</g>';
}
function lucide(slug,x,y,ink,size=18) {
  const source=readFileSync('assets/icons/'+slug+'.svg','utf8');
  const inside=source.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>[\s\S]*$/,'')
     .replace(/stroke="#[0-9A-Fa-f]{6}"/g,'stroke="'+ink+'"')
     .replace(/stroke="currentColor"/g,'stroke="'+ink+'"')
     .replace(/fill="currentColor"/g,'fill="'+ink+'"');
  return '<g transform="translate('+x+' '+y+') scale('+(size/24)+')" fill="none" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="'+ink+'">'+inside+'</g>';
}
function pill(label,slug,x,y,p,mobile=false) {
  const size=mobile?11.5:12.5;
  const w=Math.ceil(label.length*(mobile?6.65:7.25))+45;
  const h=mobile?28:30;
  let result=rect(x,y,w,h,6,p.tile,p.line);
  result+=brand(slug,x+8,y+(h-20)/2,p.icon);
  result+=text(x+33,y+(mobile?19:20),label,size,p.text,'font-weight="600"');
  return { width:w, height:h, markup:result };
}

function hero(theme,mobile) {
  const p=palette[theme], w=mobile?390:1200, h=mobile?196:218;
  const gridId='subtle-grid';
  let s='<defs><pattern id="'+gridId+'" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="'+p.line+'" stroke-width=".6" opacity=".22"/></pattern></defs>';
  s+=rect(.5,.5,w-1,h-1,10,p.bg,p.line);
  s+=rect(1,1,w-2,h-2,10,'url(#'+gridId+')');
  if(mobile){
    s+=text(24,32,'MELLO / INDIE BUILDER · AI EXPLORER',10.5,p.muted,'letter-spacing="1.6" font-weight="700"');
    s+=text(22,107,'Mello.',68,p.text,'font-weight="750" letter-spacing="-5.7"');
    s+=text(25,139,'Developer by curiosity.',14,p.text,'font-weight="600"');
    s+=text(25,158,'Maker by habit.',14,p.text,'font-weight="600"');
    s+=text(25,181,'TOOLS  /  SYSTEMS  /  DESIGN',9,p.submuted,'letter-spacing="1.3"');
    [['typescript','TypeScript'],['react','React'],['python','Python'],['docker','Docker']].forEach(([slug,label],i)=>{
      const x=252+(i%2)*66,y=48+Math.floor(i/2)*53;
      s+=rect(x,y,57,47,6,p.panel,p.line)+brand(slug,x+18,y+5,p.icon);
      s+=text(x+28.5,y+40,label,7.5,p.text,'text-anchor="middle" font-weight="600"');
    });
  } else {
    s+=text(45,42,'MELLO  /  INDIE BUILDER  ·  AI EXPLORER  ·  BRAZIL',11.5,p.muted,'font-weight="700" letter-spacing="2.1"');
    s+=text(40,132,'Mello.',95,p.text,'font-weight="750" letter-spacing="-8.7"');
    s+=text(47,163,'Developer by curiosity. Maker by habit.',20,p.text,'font-weight="600"');
    s+=text(47,186,'Independent builder exploring modern developer tooling and intelligent systems.',14.2,p.muted);
    s+=text(47,207,'TOOLS   /   AUTOMATION   /   SYSTEMS   /   DESIGN',10.2,p.submuted,'letter-spacing="1.65"');
    [['typescript','TypeScript'],['javascript','JavaScript'],['react','React'],['nodejs','Node.js'],['python','Python'],['cloudflare','Cloudflare']].forEach(([slug,label],i)=>{
      const x=803+(i%3)*126,y=25+Math.floor(i/3)*82;
      s+=rect(x,y,116,72,7,p.panel,p.line)+brand(slug,x+47,y+12,p.icon);
      s+=text(x+58,y+58,label,10.2,p.text,'text-anchor="middle" font-weight="600"');
    });
  }
  return svg(w,h,'Mello. Developer by curiosity. Maker by habit.',s);
}

function build(theme,mobile) {
  const p=palette[theme], w=mobile?390:1060;
  const first=mobile?45:40, step=mobile?58:40, h=first+step*5+8;
  let s=rect(.5,.5,w-1,h-1,10,p.bg,p.line);
  s+=text(mobile?18:26,mobile?27:26,'FOCUS AREAS',mobile?10:11,p.muted,'font-weight="700" letter-spacing="1.5"');
  s+=line(18,first-6,w-18,first-6,p.line);
  buildAreas.forEach((item,i)=>{
    const y=first+i*step;
    if(i>0)s+=line(mobile?18:26,y-5,w-(mobile?18:26),y-5,p.line);
    s+=rect(mobile?18:25,y+7,26,26,6,p.panel,p.line);
    s+=lucide(item.icon,mobile?23:30,y+12,p.icon,16);
    if(mobile){
      s+=text(55,y+18,item.title,12.3,p.text,'font-weight="700"');
      s+=text(55,y+36,item.detail,10.5,p.muted);
    } else {
      s+=text(68,y+24,item.title,13.5,p.text,'font-weight="700"');
      s+=text(377,y+24,item.detail,12.6,p.muted);
    }
  });
  return svg(w,h,'What I build: developer tools, web applications, AI, automation, and business software',s);
}

function stackPanel(theme,mobile,firstHalf) {
  const p=palette[theme],w=mobile?390:1060;
  const groups=firstHalf?stackGroups.slice(0,3):stackGroups.slice(3);
  let y=mobile?14:8;
  let result='';
  groups.forEach((g,i)=>{
    if(i>0)result+=line(mobile?14:18,y-3,w-(mobile?14:18),y-3,p.line);
    if(mobile){
      result+=text(18,y+21,g.name.toUpperCase(),10.5,p.muted,'font-weight="700" letter-spacing=".75"');
      let cx=18, cy=y+33, usedRows=1;
      g.items.forEach(([label,slug])=>{
        const el=pill(label,slug,cx,cy,p,true);
        if(cx+el.width>w-18){cx=18;cy+=35;usedRows++; }
        const real=pill(label,slug,cx,cy,p,true);
        result+=real.markup;cx+=real.width+7;
      });
      y+=33+usedRows*35+11;
    } else {
      result+=text(22,y+31,g.name.toUpperCase(),11.3,p.muted,'font-weight="700" letter-spacing=".55"');
      let cx=242;
      g.items.forEach(([label,slug])=>{
        const el=pill(label,slug,cx,y+10,p);
        result+=el.markup;
        cx+=el.width+8;
      });
      if(cx>w+4)throw new Error('Desktop stack row overflows: '+g.name+' '+cx);
      y+=50;
    }
  });
  const h=y+(mobile?1:3);
  return svg(w,h,(firstHalf?'Languages, frontend, and backend technologies':'Cloud and developer tools'),rect(.5,.5,w-1,h-1,10,p.bg,p.line)+result);
}

function agentsPanel(theme,mobile) {
  const p=palette[theme],w=mobile?390:1060,h=mobile?117:67;
  let result=rect(.5,.5,w-1,h-1,10,p.bg,p.line);
  result+=text(mobile?18:24,mobile?23:37,'CODING AGENTS',mobile?10.5:11.4,p.muted,'font-weight="700" letter-spacing="1"');
  let x=mobile?18:216,y=mobile?33:17;
  agents.forEach(([label,slug])=>{
    let el=pill(label,slug,x,y,p,mobile);
    if(x+el.width>w-18){x=mobile?18:216;y+=35;el=pill(label,slug,x,y,p,mobile);}
    result+=el.markup;x+=el.width+8;
  });
  if(y+32>h)throw new Error('Agents panel overflow at '+y);
  return svg(w,h,'Coding agents: Codex, Claude Code, Antigravity, T3 Code, and OpenCode',result);
}

mkdirSync('assets/headers',{recursive:true});
mkdirSync('assets/sections',{recursive:true});
for(const theme of ['dark','light']){
  for(const mobile of [false,true]){
    const suffix=(mobile?'-mobile':'')+'-'+theme+'.svg';
    writeFileSync('assets/headers/hero'+suffix,hero(theme,mobile));
    writeFileSync('assets/sections/build'+suffix,build(theme,mobile));
    writeFileSync('assets/sections/stack-core'+suffix,stackPanel(theme,mobile,true));
    writeFileSync('assets/sections/stack-tools'+suffix,stackPanel(theme,mobile,false));
    writeFileSync('assets/sections/agents'+suffix,agentsPanel(theme,mobile));
  }
}
console.log('Generated V5 hero and four compact editorial panels in both themes and viewports with high-contrast white fonts & icons.');
