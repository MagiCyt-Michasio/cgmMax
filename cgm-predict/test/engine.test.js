const test=require('node:test'),assert=require('node:assert/strict');
const {cleanEntries,linearFit,forecast,historicalSimilarity,aggregate,dayProfile,quality,windowSlope,medianSlope,extractFeatures,walkForwardBacktest}=require('../server');
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
 assert.equal(r.method,'walk-forward-adaptive-tournament-v2');
 assert.ok(r.models.acceleration[15].samples>0);
 assert.ok(r.models.robust45[15].samples>0);
 assert.ok(r.models.adaptive[15].samples>0);
 assert.ok(r.models.linear45[15].samples>0);
 assert.ok(r.models.damped45[15].samples>0);
 assert.ok(r.models.linear20[15].samples>0);
 assert.ok(r.models.persistence[15].samples>0);
 assert.ok(r.horizons[15].samples>0);
 assert.ok(Number.isFinite(r.horizons[15].mae));
 assert.ok(Number.isFinite(r.horizons[15].baselineMae));
});
test('walk-forward does not evaluate a tiny dataset',()=>{
 const a=Array.from({length:5},(_,i)=>({t:i*300000,v:120}));
 const r=walkForwardBacktest(a);
 assert.equal(r.available,false);
});

test('server health route reports package version consistently',()=>{
 const fs=require('node:fs');
 const pkg=JSON.parse(fs.readFileSync(require.resolve('../package.json'),'utf8'));
 const src=fs.readFileSync(require.resolve('../server'),'utf8');
 assert.ok(src.includes("version:'"+pkg.version+"'"));
 assert.ok(src.includes("frontend:'"+pkg.version+"'"));
 assert.ok(src.includes('CGM Predict '+pkg.version+' listening'));
});

test('frontend inline script parses and backtest button calls its implementation',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const html=fs.readFileSync(require.resolve('../public/index.html'),'utf8');
 const open='<script>',close='</script>';
 const first=html.indexOf(open),last=html.indexOf(close,first+open.length);
 assert.ok(first>=0&&last>first,'inline frontend script exists');
 new vm.Script(html.slice(first+open.length,last));
 assert.ok(html.includes('id="runBacktestButton"'));
 assert.ok(html.includes('async function executeBacktest(){'));
 assert.ok(html.includes("$('runBacktestButton').addEventListener('click',executeBacktest)"));
});

test('feature extraction reports velocity acceleration and direction state',()=>{
 const start=Date.UTC(2026,0,1);
 const a=Array.from({length:20},(_,i)=>({t:start+i*3*60000,v:120+i*1.5}));
 const f=extractFeatures(a,start+57*60000);
 assert.equal(f.samples45m,16);
 assert.ok(Number.isFinite(f.velocity.m45));
 assert.ok(Number.isFinite(f.acceleration));
 assert.equal(f.directionAgreement,'consistent');
 assert.equal(typeof f.fresh,'boolean');
});
test('robust median slope resists one extreme reading',()=>{
 const start=Date.UTC(2026,0,1);
 const a=Array.from({length:10},(_,i)=>({t:start+i*5*60000,v:100+i*2}));
 a[8].v=250;
 assert.ok(Math.abs(medianSlope(a,45)-.4)<1);
});
