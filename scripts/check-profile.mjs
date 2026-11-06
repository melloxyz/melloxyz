import assert from 'node:assert/strict';
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

for(const name of selected) {
  for(const theme of ['dark','light']) {
    const file='assets/chips/'+name+'-'+theme+'.svg';
    assert(existsSync(file),'Missing selected chip: '+file);
  }
}

const paths=[...readme.matchAll(/\.\/(assets\/[^"'<>\s]+\.svg)/g)].map(m=>m[1]);
const missing=[...new Set(paths)].filter(p=>!existsSync(p));
assert.deepEqual(missing,[],'README has missing SVG references');

assert(!readme.includes('#### AI Platforms'), 'Unapproved AI Platforms section');
assert(!/(\bgames?\b|\bexperiments?\b)/i.test(readme), 'Unapproved project types in README');
assert(!/<script\b/i.test(readme),'Scripts cannot run in README');
assert(readme.includes('### Development activity'),'Missing activity section');
assert(readme.includes('https://x.com/mxrvit'),'Missing X profile');
assert(readme.includes('Discord: <code>mefrog</code>'),'Missing Discord handle');

const links=[...readme.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]);
for(const href of links) {
  if(href.startsWith('#')) {
    const slug=href.slice(1);
    const headings=[...readme.matchAll(/^#{2,6}\s+(.+)$/gm)].map(m=>m[1].toLowerCase().replace(/[^\w\s-]/g,'').trim().replace(/\s/g,'-'));
    assert(headings.includes(slug),'Broken section link: '+href);
  } else {
    assert(href.startsWith('https://') || href.startsWith('mailto:'),'Unexpected link scheme: '+href);
    if(href.startsWith('https://')) new URL(href);
  }
}
console.log('README valid:',selected.length,'selected technologies,',new Set(paths).size,'local SVG references,',links.length,'links');

for (const variant of ['overview','calendar']) for (const theme of ['dark','light']) assert(existsSync('assets/activity/'+variant+'-mobile-'+theme+'.svg'), 'Missing mobile activity variant');
