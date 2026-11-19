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
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));
const n = v => Number.isFinite(Number(v)) ? Number(v) : null;
const ts = d => n(d?.date) ?? (d?.dateString ? Date.parse(d.dateString) : null);
function cleanEntries(rows) {
 return rows.map(x=>({t:ts(x),v:n(x.sgv)})).filter(x=>x.t && x.v && x.v>0 && x.v<1000).sort((a,b)=>a.t-b.t);
}
function linearFit(points) {
 const meanX=points.reduce((s,p)=>s+p.x,0)/points.length;
 const meanY=points.reduce((s,p)=>s+p.y,0)/points.length;
 const den=points.reduce((s,p)=>s+(p.x-meanX)**2,0);
 const slope=den?points.reduce((s,p)=>s+(p.x-meanX)*(p.y-meanY),0)/den:0;
 return {slope,intercept:meanY-slope*meanX};
}
function forecast(entries) {
 const now=entries.at(-1), recent=entries.filter(e=>now.t-e.t<=45*60000);
 if(recent.length<4) return {available:false,reason:'Za mało świeżych punktów do prognozy.'};
 const x0=recent[0].t, fit=linearFit(recent.map(e=>({x:(e.t-x0)/60000,y:e.v})));
 const slope=Math.max(-5,Math.min(5,fit.slope));
 const residual=Math.sqrt(recent.reduce((s,e)=>s+(e.v-(fit.intercept+fit.slope*((e.t-x0)/60000)))**2,0)/recent.length);
 const horizons=[15,30,45,60].map(minutes=>({minutes,value:Math.round(Math.max(20,Math.min(600,now.v+slope*minutes))),low:Math.round(Math.max(20,now.v+slope*minutes-1.96*residual)),high:Math.round(Math.min(600,now.v+slope*minutes+1.96*residual))}));
 const threshold=70, timeToLow=slope<0?(now.v-threshold)/Math.abs(slope):null;
 return {available:true,current:now.v,slopePerMinute:Number(slope.toFixed(2)),horizons,residual:Number(residual.toFixed(1)),timeTo70:timeToLow!==null&&timeToLow>0?Math.round(timeToLow):null,method:'trend-regression',confidence:recent.length>=8?'moderate':'low'};
}
function historicalSimilarity(entries) {
 const current=entries.slice(-6);
 if(current.length<6||entries.length<60)return {available:false,reason:'Za mało historii do porównania epizodów.'};
 const vector=current.map(e=>e.v);
 const episodes=[];
 for(let i=30;i<entries.length-18;i++){
  const candidate=entries.slice(i-6,i);
  if(candidate.length!==6)continue;
  const gap=entries[i-1].t-entries[i-6].t;
  if(gap>50*60000||gap<15*60000)continue;
  const distance=Math.sqrt(candidate.reduce((s,e,j)=>s+(e.v-vector[j])**2,0)/6);
  if(distance<35)episodes.push({distance,minimum:Math.min(...entries.slice(i,i+12).map(e=>e.v)),drop:entries[i+11].v-candidate[5]});
 }
 episodes.sort((a,b)=>a.distance-b.distance);
 const best=episodes.slice(0,20);
 if(best.length<5)return {available:false,reason:'Znaleziono mniej niż pięć podobnych epizodów.'};
 const lows=best.filter(e=>e.minimum<70).length;
 return {available:true,samples:best.length,similarHypoRate:Number((lows/best.length*100).toFixed(0)),medianFutureDrop:best.map(e=>e.drop).sort((a,b)=>a-b)[Math.floor(best.length/2)]};
}
app.get('/api/health',(req,res)=>res.json({ok:!!db,service:'cgm-predict',database:DB_NAME}));
app.get('/api/data',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const hours=Math.max(1,Math.min(8760,Number(req.query.hours)||72));
  const newest=await db.collection('entries').find({type:'sgv',sgv:{$type:'number'}}).sort({date:-1}).limit(1).next();
  if(!newest)return res.json({entries:[],treatments:[],stale:true});
  const cutoff=Date.now()-hours*3600000;
  const [raw,treatments]=await Promise.all([
   db.collection('entries').find({type:'sgv',date:{$gte:cutoff},sgv:{$type:'number'}}).sort({date:1}).toArray(),
   db.collection('treatments').find({$or:[{timestamp:{$gte:cutoff}},{created_at:{$gte:new Date(cutoff).toISOString()}}]}).toArray()
  ]);
  const entries=cleanEntries(raw),latest=entries.at(-1);
  res.json({entries,treatments:treatments.map(t=>({timestamp:n(t.timestamp)||Date.parse(t.created_at||''),insulin:n(t.insulin)||0,carbs:n(t.carbs)||0,eventType:t.eventType||''})),latest,stale:!latest||Date.now()-latest.t>STALE_MIN*60000});
 }catch(e){console.error(e);res.status(500).json({error:'Nightscout read failed'});}
});
app.get('/api/predict',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const rows=await db.collection('entries').find({type:'sgv',sgv:{$type:'number'}}).sort({date:-1}).limit(600).toArray();
  const entries=cleanEntries(rows.reverse()),latest=entries.at(-1);
  if(!latest)return res.json({available:false,reason:'No glucose data'});
  const stale=Date.now()-latest.t>STALE_MIN*60000;
  if(stale)return res.json({available:false,stale:true,reason:'Ostatni odczyt jest nieaktualny.'});
  res.json({generatedAt:Date.now(),forecast:forecast(entries),historical:historicalSimilarity(entries),dataPoints:entries.length});
 }catch(e){console.error(e);res.status(500).json({error:'Prediction failed'});}
});
app.get('/api/metrics',async(req,res)=>{
 if(!db)return res.status(503).json({error:'Database unavailable'});
 try{
  const days=Math.max(1,Math.min(365,Number(req.query.days)||30));
  const raw=await db.collection('entries').find({type:'sgv',date:{$gte:Date.now()-days*86400000},sgv:{$type:'number'}}).toArray();
  const entries=cleanEntries(raw),values=entries.map(e=>e.v);
  res.json({days,readings:values.length,mean:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null,below70:values.length?Math.round(values.filter(v=>v<70).length/values.length*100):null,range70to180:values.length?Math.round(values.filter(v=>v>=70&&v<=180).length/values.length*100):null,above180:values.length?Math.round(values.filter(v=>v>180).length/values.length*100):null});
 }catch(e){console.error(e);res.status(500).json({error:'Metrics failed'});}
});
async function start(){
 if(!URI)throw new Error('MONGODB_URI is required');
 const client=new MongoClient(URI,{maxPoolSize:5,serverSelectionTimeoutMS:5000});
 await client.connect(); db=client.db(DB_NAME); await db.command({ping:1});
 app.listen(PORT,'0.0.0.0',()=>console.log('CGM Predict listening on '+PORT));
}
if(require.main===module)start().catch(e=>{console.error(e);process.exit(1)});
module.exports={cleanEntries,forecast,historicalSimilarity,linearFit,app};
