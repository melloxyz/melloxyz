import assert from 'node:assert/strict';
import { stackGroups, agents } from './profile-v5-data.mjs';
import { existsSync, readFileSync } from 'node:fs';

const readme=readFileSync('README.md','utf8');
const selected=[
  'typescript','javascript','python','sql',
  'react','nextjs','tailwindcss','shadcnui','lucide',
  'nodejs','fastify','postgresql','sqlite','prisma',
  'docker','cloudflare','workers',
  'git','github','githubactions','pnpm',
  'codex','claude-code','antigravity','t3-code','opencode'
];
for(const name of selected) for(const theme of ['dark','light']) {
  assert(existsSync('assets/chips/'+name+'-'+theme+'.svg'),'Missing approved chip: '+name);
}
const curated=[...stackGroups.flatMap(group=>group.items.map(([,slug])=>slug)),...agents.map(([,slug])=>slug)].sort();
assert.deepEqual(curated,[...selected].sort(),'Keep the complete approved tool list available');

const paths=[...readme.matchAll(/\.\/(assets\/[^"'<>\s]+\.svg)/g)].map(m=>m[1]);
assert(paths.length>0,'README must include local visuals');
for(const path of paths) assert(existsSync(path),'Missing README image: '+path);
assert(!/<script\b|<table\b/i.test(readme),'Use GitHub-safe profile markup');
assert(/^### Development activity$/mi.test(readme),'Missing activity section');
assert(readme.indexOf('### Development activity')<readme.indexOf('### Code, AI'),'Activity must follow the hero');
assert(readme.includes('https://x.com/mxrvit'),'Missing X profile');
assert(/Discord\s*<code>mefrog<\/code>/i.test(readme),'Missing Discord handle');
assert(!/https:\/\/github\.com\/melloxyz\//i.test(readme),'Do not feature individual projects');
assert(!readme.includes('assets/chips/'),'Keep the visible stack compact');

for(const path of ['assets/headers/hero','assets/activity/overview','assets/activity/monthly','assets/sections/interests','assets/sections/stack']) {
  for(const suffix of ['-dark','-light','-mobile-dark','-mobile-light']) assert(paths.includes(path+suffix+'.svg'),'Missing responsive source: '+path+suffix);
}
for(const picture of readme.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
  const content=picture[1];
  assert(content.indexOf('max-width: 640px')<content.indexOf('srcset='),'Mobile sources must precede desktop sources');
  assert(/<img[^>]*alt="[^"]+"/.test(content),'Every visual needs alternative text');
}
const links=[...readme.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]);
for(const href of links) {
  assert(href.startsWith('https://')||href.startsWith('mailto:'),'Unexpected link scheme: '+href);
  new URL(href);
}
for(const path of paths.filter(path=>/headers\/hero|activity\/monthly/.test(path))) {
  const source=readFileSync(path,'utf8');
  assert(source.includes('prefers-reduced-motion'),'Animations must respect reduced motion: '+path);
}
console.log('README valid: '+new Set(paths).size+' local SVG references, responsive themes, compact tools and '+links.length+' links.');
