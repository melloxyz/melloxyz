import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const binary=process.env.CHROME_BIN;
if(!binary)throw new Error('CHROME_BIN is not set');
const browser=await chromium.launch({executablePath:binary,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
mkdirSync('previews',{recursive:true});
const uri=process.env.PROFILE_PREVIEW_URL||'http://127.0.0.1:8765/previews/profile.html';
try {
  for(const theme of ['dark','light']) {
    const context=await browser.newContext({viewport:{width:1280,height:900},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:1});
    const page=await context.newPage();
    await page.goto(uri,{waitUntil:'load'});
    await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    const check=await page.evaluate(()=>({
      width:innerWidth,scroll:document.documentElement.scrollWidth,
      images:[...document.images].map(img=>({loaded:img.complete&&img.naturalWidth>0,src:img.currentSrc,width:img.getBoundingClientRect().width}))
    }));
    if(check.images.length!==2||check.images.some(img=>!img.loaded||img.width<700||img.src.includes('mobile')||!img.src.endsWith('-'+theme+'.svg')))throw new Error('Incorrect desktop imagery: '+JSON.stringify(check));
    if(check.scroll>check.width)throw new Error('Horizontal overflow');
    await page.screenshot({path:'previews/desktop-'+theme+'.png',fullPage:true,animations:'disabled'});
    console.log(theme,JSON.stringify(check));
    await context.close();
  }
} finally {await browser.close();}
