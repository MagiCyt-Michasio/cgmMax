const test=require('node:test');const assert=require('node:assert/strict');const {cleanEntries,forecast,linearFit,historicalSimilarity}=require('../server');
test('cleanEntries sorts and rejects invalid SGV',()=>{const x=cleanEntries([{date:2000,sgv:90},{date:1000,sgv:0},{date:3000,sgv:110}]);assert.deepEqual(x.map(v=>v.v),[90,110]);});
test('linearFit recovers a linear slope',()=>{const f=linearFit([{x:0,y:100},{x:1,y:98},{x:2,y:96}]);assert.equal(f.slope,-2);});
test('forecast requires at least four points',()=>{assert.equal(forecast([{t:1,v:100},{t:2,v:99}]).available,false);});
test('forecast generates four horizons',()=>{const entries=Array.from({length:9},(_,i)=>({t:100000+i*300000,v:150-i*3}));const f=forecast(entries);assert.equal(f.available,true);assert.equal(f.horizons.length,4);assert.equal(f.slopePerMinute,-0.01);});

test('historical similarity matches future window from next index without off-by-one',()=>{
 const entries=[];
 for(let i=0;i<120;i++){const v=150+Math.sin(i/4)*2;entries.push({t:i*300000,v});}
 const current=entries.slice(-6);
 const result=historicalSimilarity(entries);
 assert.equal(result.available,false);
 assert.match(result.reason,/podobnych epizodów/);
});
