const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const pg=await b.newPage(); const errs=[], csp=[];
 pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 pg.on('console',m=>{ const t=m.text(); if(m.type()==='error'){ (/Content Security Policy/i.test(t)?csp:errs).push(t); }});
 await pg.goto('http://localhost:4321/');
 await pg.waitForTimeout(1000);
 console.log('title:', await pg.title());
 console.log('first step:', await pg.textContent('#stepTitle'));

 // drive a full CA 65+ call over HTTP
 await pg.locator('[data-choice="onMedicare"][data-v="no"]').click().catch(()=>{});
 for(let i=0;i<40;i++){
   for(const [k,v] of Object.entries({onMedicare:'no',makesDecisions:'yes',soa:'yes',
       workStatus:'retired',ssStatus:'no',coverageSource:'marketplace',healthTone:'healthy',
       dentalImport:'yes',hasPaper:'yes',leaning:'supp',incomeConsistent:'yes',assets200k:'no',
       retirementSpecialist:'no',retirementReferral:'yes',outcome:'app'})){
     const sel=`[data-choice="${k}"][data-v="${v}"]`;
     if(await pg.locator(sel).count()) await pg.locator(sel).first().click();
   }
   const z=pg.locator('[data-k="zip"]').first();
   if(await pg.locator('[data-k="zip"]').count() && await z.inputValue()===''){ await z.fill('90210'); await z.dispatchEvent('change'); }
   const d=pg.locator('[data-k="dob"]').first();
   if(await pg.locator('[data-k="dob"]').count() && await d.inputValue()===''){ await d.click(); await pg.keyboard.type('03141961'); }
   if(await pg.locator('#btnNext').isDisabled()) break;
   await pg.locator('#btnNext').click();
 }
 console.log('reached:', await pg.textContent('#stepTitle'));
 const sum=await pg.textContent('#sumPre').catch(()=>'');
 console.log('summary has CA restriction:', /CHS and skilled nursing cannot be sold/.test(sum));
 console.log('supp umbrella line:', (sum.match(/^Supplement umbrella.*$/m)||[''])[0].trim());

 // localStorage persistence across a reload, on the http origin
 await pg.reload(); await pg.waitForTimeout(400);
 console.log('after reload, dob persisted:', await pg.evaluate(()=>A('dob')));

 // fonts actually load over the network here?
 const fonts=await pg.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family));
 console.log('fonts loaded:', fonts.length?[...new Set(fonts)].join(', '):'(none — offline sandbox, falls back)');
 console.log('\nCSP violations:', csp.length?csp:'none');
 console.log('JS errors:', errs.length?errs:'none');
 await b.close();
})();
