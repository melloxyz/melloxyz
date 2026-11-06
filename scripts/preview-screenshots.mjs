import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const binary=process.env.CHROME_BIN;
if (!binary) throw new Error('CHROME_BIN is not set');
const browser=await chromium.launch({executablePath:binary,headless:true,args:['--no-sandbox','--allow-file-access-from-files','--disable-dev-shm-usage']});
mkdirSync('previews',{recursive:true});
const uri=pathToFileURL(resolve('previews/profile.html')).href;
try {
  for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844]]) {
    for(const theme of ['dark','light']) {
      const context=await browser.newContext({viewport:{width,height},colorScheme:theme,deviceScaleFactor:1});
      const page=await context.newPage();
      await page.goto(uri,{waitUntil:'load'});
      await page.locator('img').evaluateAll(async imgs=>await Promise.all(imgs.map(async im=>{if(!im.complete)await new Promise(r=>{im.addEventListener('load',r,{once:true});im.addEventListener('error',r,{once:true});});})));
      const check=await page.evaluate(()=>({
        viewport:window.innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        broken:[...document.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),
        images:document.images.length
      }));
      const visual=await page.evaluate(()=>{
        const main=document.querySelector('main');
        const imgs=[...document.images];
        const hero=imgs.find(i=>i.alt?.startsWith('Mello.'));
        const overview=imgs.find(i=>i.alt?.startsWith('Current streak'));
        const calendar=imgs.find(i=>i.alt==='GitHub contribution calendar');
        return {
          main:main?.getBoundingClientRect().width,
          hero:hero?.getBoundingClientRect().width,
          overview:overview?.getBoundingClientRect().width,
          calendar:calendar?.getBoundingClientRect().width,
          mobileHero:hero?.currentSrc.includes('mobile-'),
          mobileOverview:overview?.currentSrc.includes('-mobile-'),
          mobileCalendar:calendar?.currentSrc.includes('-mobile-')
        };
      });
      console.log(label,theme,JSON.stringify({...check,visual}));
      if(!visual.main||!visual.overview||!visual.calendar)throw new Error('Activity imagery is missing');
      if(visual.overview<visual.main*.75||visual.calendar<visual.main*.75)throw new Error('Activity graphics rendered too small: '+JSON.stringify(visual));
      if(visual.mobileHero!==(label==='mobile')||visual.mobileOverview!==(label==='mobile')||visual.mobileCalendar!==(label==='mobile'))throw new Error('Incorrect media variants: '+JSON.stringify(visual));
      if(check.broken.length)throw new Error('Broken preview images: '+check.broken.join(','));
      if(check.scrollWidth>check.viewport+3)throw new Error('Horizontal overflow: '+label+' '+theme+' '+check.scrollWidth+'/'+check.viewport);
      await page.screenshot({path:'previews/'+label+'-'+theme+'.png',fullPage:true,animations:'disabled'});
      await context.close();
    }
  }
} finally { await browser.close(); }
