import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const readme=readFileSync('README.md','utf8');
const paths=[...readme.matchAll(/\.\/(assets\/[^"'<>\s]+\.svg)/g)].map(m=>m[1]);
assert.equal(new Set(paths).size,4,'Use only a hero and an activity card, each in two themes');
for(const path of paths) assert(existsSync(path),'Missing README image: '+path);
assert(!/<script\b|<table\b/i.test(readme),'Use GitHub-safe profile markup');
assert(!/mobile|max-width|min-width/.test(readme),'Desktop layout must not select mobile variants');
assert(!/^### /m.test(readme),'Keep the profile free of repeated section headings');
assert(readme.includes('https://x.com/mxrvit'),'Missing X profile');
assert(/Discord\s*<code>mefrog<\/code>/i.test(readme),'Missing Discord handle');
assert(!/https:\/\/github\.com\/melloxyz\//i.test(readme),'Do not feature individual projects');
assert(/open.source/i.test(readme),'Keep open source explicit');

for(const path of ['assets/headers/hero','assets/activity/overview']) {
  for(const suffix of ['-dark','-light']) assert(paths.includes(path+suffix+'.svg'),'Missing theme: '+path+suffix);
}
for(const picture of readme.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
  assert(/<img[^>]*alt="[^"]+"/.test(picture[1]),'Every visual needs alternative text');
}
const links=[...readme.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]);
for(const href of links) {
  assert(href.startsWith('https://')||href.startsWith('mailto:'),'Unexpected link scheme: '+href);
  new URL(href);
}
for(const path of paths) assert(readFileSync(path,'utf8').includes('prefers-reduced-motion'),'Animations must respect reduced motion: '+path);
console.log('README valid: two desktop SVG cards, both themes, accessible image descriptions and '+links.length+' links.');
