const test=require('node:test'),assert=require('node:assert/strict');
const {cleanEntries,linearFit,forecast,historicalSimilarity,aggregate,dayProfile,quality,walkForwardBacktest}=require('../server');
test('cleanEntries filters invalid readings and sorts',()=>assert.deepEqual(cleanEntries([{date:2,sgv:90},{date:1,sgv:null},{date:3,sgv:110}]).map(x=>x.v),[90,110]));
test('linearFit recovers slope',()=>assert.equal(linearFit([{x:0,y:100},{x:1,y:98},{x:2,y:96}]).slope,-2));
test('forecast requires four recent points',()=>assert.equal(forecast([{t:1,v:100},{t:2,v:99}]).available,false));
test('forecast limits displayed threshold estimate',()=>{const a=Array.from({length:9},(_,i)=>({t:100000+i*300000,v:150-i*.1})),f=forecast(a);assert.equal(f.available,true);assert.equal(f.timeTo70,null);assert.equal(f.horizons.length,4)});
test('aggregate median and empty values',()=>{assert.equal(aggregate([{t:1,v:100},{t:2,v:200}]).median,150);assert.equal(aggregate([]).mean,null)});
test('hourly profile has 24 slots',()=>assert.equal(dayProfile([{t:new Date(2026,0,1,3).getTime(),v:120}]).length,24));
test('quality handles empty data',()=>assert.equal(quality([],null).minutesSinceLatest,null));
test('similarity returns valid result shape',()=>{const a=Array.from({length:160},(_,i)=>({t:i*300000,v:150+Math.sin(i/4)*2})),r=historicalSimilarity(a);assert.equal(typeof r.available,'boolean');});
test('walk-forward backtest evaluates only historical cutoffs with future targets',()=>{
 const start=Date.UTC(2026,0,1),a=Array.from({length:400},(_,i)=>({t:start+i*5*60000,v:120+Math.sin(i/12)*10+i*.02}));
 const r=walkForwardBacktest(a,{stepMinutes:15});
 assert.equal(r.method,'walk-forward-linear-trend-v1');
 assert.ok(r.horizons[15].samples>0);
 assert.ok(Number.isFinite(r.horizons[15].mae));
 assert.ok(Number.isFinite(r.horizons[15].baselineMae));
});
test('walk-forward does not evaluate a tiny dataset',()=>{
 const a=Array.from({length:5},(_,i)=>({t:i*300000,v:120}));
 const r=walkForwardBacktest(a);
 assert.equal(r.available,false);
});
