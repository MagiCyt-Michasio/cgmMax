const test=require('node:test');
const assert=require('node:assert/strict');
const {cleanEntries,linearFit,forecast,historicalSimilarity,aggregate,dayProfile,quality}=require('../server');

test('cleanEntries keeps zero glucose values only if physically valid and sorts timestamps',()=>{
 const x=cleanEntries([{date:2000,sgv:90},{date:1000,sgv:0},{date:3000,sgv:110},{date:null,sgv:120}]);
 assert.deepEqual(x.map(v=>v.v),[90,110]);
});
test('cleanEntries does not convert null to zero',()=>assert.deepEqual(cleanEntries([{date:1,sgv:null},{date:2,sgv:100}]).map(x=>x.v),[100]));
test('linearFit recovers a slope',()=>assert.equal(linearFit([{x:0,y:100},{x:1,y:98},{x:2,y:96}]).slope,-2));
test('forecast needs four points',()=>assert.equal(forecast([{t:1,v:100},{t:2,v:99}]).available,false));
test('forecast makes four horizons and caps long threshold estimate',()=>{
 const entries=Array.from({length:9},(_,i)=>({t:100000+i*300000,v:150-i*0.1}));
 const f=forecast(entries);assert.equal(f.available,true);assert.equal(f.horizons.length,4);assert.equal(f.timeTo70,null);
});
test('median and aggregate handle empty or even sample count',()=>{
 const a=aggregate([{t:1,v:100},{t:2,v:200}]);assert.equal(a.median,150);assert.equal(a.readings,2);
 assert.equal(aggregate([]).mean,null);
});
test('hour profile returns all 24 hours',()=>assert.equal(dayProfile([{t:new Date(2026,0,1,3).getTime(),v:120}]).length,24));
test('quality handles no entries',()=>assert.equal(quality([],null).minutesSinceLatest,null));
test('historical similarity returns a useful unavailable result for insufficient similar matches',()=>{
 const entries=[];for(let i=0;i<120;i++)entries.push({t:i*300000,v:150+Math.sin(i/4)*2});
 const r=historicalSimilarity(entries);assert.equal(r.available,false);assert.match(r.reason,/podobnych epizodów/);
});
