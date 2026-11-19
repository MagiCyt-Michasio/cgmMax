'use strict';
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('node:path');
const app = express();
const PORT = Number(process.env.PORT || 3060);
const DB_NAME = process.env.MONGODB_DB || 'nightscout';
const STALE_MIN = Number(process.env.DATA_STALE_MINUTES || 15);
const URI = process.env.MONGODB_URI;
let db;
let mongo;
app.disable('x-powered-by');
app.use(express.json({limit:'16kb'}));
app.use(express.static(path.join(__dirname,'public')));
const num = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
const entryTime = d => num(d.date) ?? (d.dateString ? Date.parse(d.dateString) : null);
function cleanEntries(rows) {
 return rows.map(x=>({t:entryTime(x),v:num(x.sgv)})).filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.v)&&x.v>0&&x.v<1000).sort((a,b)=>a.t-b.t);
}
function linearFit(points) {
 const mx=points.reduce((s,p)=>s+p.x,0)/points.length, my=points.reduce((s,p)=>s+p.y,0)/points.length;
 const den=points.reduce((s,p)=>s+(p.x-mx)**2,0);
 const slope=den?points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/den:0;
 return {slope,intercept:my-slope*mx};
}
function median(a){if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function forecast(entries) {
 const now=entries.at(-1), recent=entries.filter(e=>now.t-e.t<=45*60000);
 if(recent.length<4)return {available:false,reason:'Za mało świeżych punktów do prognozy.'};
 const x0=recent[0].t, fit=linearFit(recent.map(e=>({x:(e.t-x0)/60000,y:e.v})));
 const slope=Math.max(-5,Math.min(5,fit.slope));
 const residual=Math.sqrt(recent.reduce((s,e)=>s+(e.v-(fit.intercept+fit.slope*((e.t-x0)/60000)))**2,0)/recent.length);
 const horizons=[15,30,45,60].map(minutes=>{const raw=now.v+slope*minutes,band=1.96*residual;return {minutes,value:Math.round(Math.max(20,Math.min(600,raw))),low:Math.round(Math.max(20,raw-band)),high:Math.round(Math.min(600,raw+band))};});
 const t70=slope<-.03?(now.v-70)/Math.abs(slope):null;
 return {available:true,current:now.v,slopePerMinute:Number(slope.toFixed(3)),horizons,residual:Number(residual.toFixed(1)),timeTo70:t70!==null&&t70>0&&t70<=120?Math.round(t70):null,method:'linear-trend-45m',confidence:recent.length>=8&&residual<15?'moderate':'low',sampleCount:recent.length};
}
function historicalSimilarity(entries) {
 const current=entries.slice(-6); if(current.length<6||entries.length<60)return {available:false,reason:'Za mało historii do porównania epizodów.'};
 const vector=current.map(e=>e.v), episodes=[];
 for(let i=30;i<entries.length-18;i++){
  const candidate=entries.slice(i-6,i); if(candidate.length!==6)continue;
  const gap=entries[i-1].t-entries[i-6].t; if(gap>50*60000||gap<15*60000)continue;
  const distance=Math.sqrt(candidate.reduce((s,e,j)=>s+(e.v-vector[j])**2,0)/6);
  if(distance<35){const future=entries.slice(i,i+12);episodes.push({distance,minimum:Math.min(...future.map(e=>e.v)),change:future.at(-1).v-candidate[5]});}
 }
 episodes.sort((a,b)=>a.distance-b.distance);const best=episodes.slice(0,20);
 if(best.length<5)return {available:false,reason:'Znaleziono mniej niż pięć podobnych epizodów.'};
 return {available:true,samples:best.length,similarHypoRate:Math.round(best.filter(e=>e.minimum<70).length/best.length*100),medianFutureChange:median(best.map(e=>e.change)),medianFutureMinimum:median(best.map(e=>e.minimum))};
}
function aggregate(entries) {
 const v=entries.map(e=>e.v); if(!v.length)return {readings:0,mean:null,median:null,min:null,max:null,below70:null,range70to180:null,above180:null,sd:null};
 const mean=v.reduce((a,b)=>a+b,0)/v.length,variance=v.reduce((s,x)=>s+(x-mean)**2,0)/v.length;
 return {readings:v.length,mean:Math.round(mean),median:Math.round(median(v)),min:Math.min(...v),max:Math.max(...v),below70:Math.round(v.filter(x=>x<70).length/v.length*100),range70to180:Math.round(v.filter(x=>x>=70&&x<=180).length/v.length*100),above180:Math.round(v.filter(x=>x>180).length/v.length*100),sd:Math.round(Math.sqrt(variance))};
}
function dayProfile(entries){
 const slots=Array.from({length:24},()=>({sum:0,count:0,low:0,high:0}));
 for(const e of entries){const h=new Date(e.t).getHours(),s=slots[h];s.sum+=e.v;s.count++;if(e.v<70)s.low++;if(e.v>180)s.high++;}
 return slots.map((s,h)=>({hour:h,mean:s.count?Math.round(s.sum/s.count):null,readings:s.count,below70:s.count?Math.round(s.low/s.count*100):null,above180:s.count?Math.round(s.high/s.count*100):null}));
}
function quality(entries,latest,now=Date.now()){
 const gaps=[];for(let i=1;i<entries.length;i++)gaps.push((entries[i].t-entries[i-1].t)/60000);
 const valid=gaps.filter(x=>x>0&&x<360),stale=!latest||now-latest.t>STALE_MIN*60000;
 return {stale,minutesSinceLatest:latest?Math.max(0,Math.round((now-latest.t)/60000)):null,medianIntervalMinutes:median(valid),longGaps:valid.filter(x=>x>15).length,coveragePercent:entries.length?Math.round(valid.filter(x=>x<=10).length/Math.max(1,entries.length-1)*100):0};
}
app.get('/api/health',(req,res)=>res.json({ok:!!db,service:'cgm-predict',version:'0.2.0',database:DB_NAME}));
app.get('/api/data',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const hours=Math.max(1,Math.min(8760,Number(req.query.hours)||24)),cutoff=Date.now()-hours*3600000;
  const [raw,treatments]=await Promise.all([
   db.collection('entries').find({type:'sgv',date:{$gte:cutoff},sgv:{$type:'number'}}).sort({date:1}).toArray(),
   db.collection('treatments').find({$or:[{timestamp:{$gte:cutoff}},{created_at:{$gte:new Date(cutoff).toISOString()}}]}).sort({timestamp:1}).limit(1000).toArray()
  ]);
  const entries=cleanEntries(raw),latest=entries.at(-1)||null;
  res.json({hours,entries,latest,stale:!latest||Date.now()-latest.t>STALE_MIN*60000,quality:quality(entries,latest),treatments:treatments.map(t=>({timestamp:num(t.timestamp)||Date.parse(t.created_at||''),insulin:num(t.insulin),carbs:num(t.carbs),eventType:t.eventType||'',notes:t.notes||'',enteredBy:t.enteredBy||''})).filter(t=>Number.isFinite(t.timestamp))});
 }catch(e){console.error(e);res.status(500).json({error:'Nightscout read failed'});}
});
app.get('/api/analytics',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const days=Math.max(1,Math.min(365,Number(req.query.days)||30)),cutoff=Date.now()-days*86400000;
  const raw=await db.collection('entries').find({type:'sgv',date:{$gte:cutoff},sgv:{$type:'number'}}).sort({date:1}).toArray();
  const entries=cleanEntries(raw);res.json({days,summary:aggregate(entries),hourly:dayProfile(entries),quality:quality(entries,entries.at(-1)||null)});
 }catch(e){console.error(e);res.status(500).json({error:'Analytics failed'});}
});
app.get('/api/predict',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const rows=await db.collection('entries').find({type:'sgv',sgv:{$type:'number'}}).sort({date:-1}).limit(1200).toArray();
  const entries=cleanEntries(rows.reverse()),latest=entries.at(-1)||null;
  if(!latest)return res.json({available:false,reason:'No glucose data'});
  if(Date.now()-latest.t>STALE_MIN*60000)return res.json({available:false,stale:true,reason:'Ostatni odczyt jest nieaktualny.'});
  res.json({generatedAt:Date.now(),forecast:forecast(entries),historical:historicalSimilarity(entries),dataPoints:entries.length});
 }catch(e){console.error(e);res.status(500).json({error:'Prediction failed'});}
});
app.get('/api/metrics',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{const days=Math.max(1,Math.min(365,Number(req.query.days)||30)),raw=await db.collection('entries').find({type:'sgv',date:{$gte:Date.now()-days*86400000},sgv:{$type:'number'}}).toArray();res.json({days,...aggregate(cleanEntries(raw))});}
 catch(e){console.error(e);res.status(500).json({error:'Metrics failed'});}
});
async function start(){
 if(!URI)throw new Error('MONGODB_URI is required');
 mongo=new MongoClient(URI,{maxPoolSize:5,serverSelectionTimeoutMS:5000});
 await mongo.connect();db=mongo.db(DB_NAME);await db.command({ping:1});
 app.listen(PORT,'0.0.0.0',()=>console.log('CGM Predict 0.2.0 listening on '+PORT));
}
if(require.main===module)start().catch(e=>{console.error(e);process.exit(1)});
module.exports={cleanEntries,linearFit,forecast,historicalSimilarity,aggregate,dayProfile,quality,app};
