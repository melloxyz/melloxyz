import { mkdirSync, writeFileSync } from 'node:fs';

const palettes={
  dark:{bg:'#0D1117',text:'#F0F3FA',muted:'#9DAABD',line:'#30363D',blue:'#6495FF'},
  light:{bg:'#FFFFFF',text:'#182237',muted:'#53647B',line:'#D8DFEB',blue:'#185AE8'}
};
const esc=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const text=(x,y,value,size,color,extra='')=>'<text x="'+x+'" y="'+y+'" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(value)+'</text>';

mkdirSync('assets/headers',{recursive:true});
for(const [theme,p] of Object.entries(palettes)) {
  const body='<rect width="1060" height="224" fill="'+p.bg+'"/>'
    +'<style>@keyframes reveal{from{opacity:0}to{opacity:1}}.intro{animation:reveal .8s ease-out both}@media(prefers-reduced-motion:reduce){.intro{animation:none}}</style>'
    +'<g class="intro">'+text(0,94,'Mello.',88,p.text,'font-weight="650" letter-spacing="-5"')
    +text(1058,86,'Developer from Brazil',15,p.muted,'text-anchor="end"')
    +text(2,147,'Building useful things. Learning in public.',26,p.text,'letter-spacing="-.5"')
    +text(2,182,'Programming, AI, and open source.',17,p.muted)+'</g>'
    +'<path d="M2 219H1058" stroke="'+p.line+'"/><path d="M2 219H94" stroke="'+p.blue+'" stroke-width="3"/>';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" role="img" width="1060" height="224" viewBox="0 0 1060 224"><title>Mello. Building useful things. Learning in public. Programming, AI, and open source. Developer from Brazil.</title>'+body+'</svg>';
  writeFileSync('assets/headers/hero-'+theme+'.svg',svg);
}
console.log('Generated two desktop hero themes.');
