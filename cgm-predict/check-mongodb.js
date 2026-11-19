'use strict';
require('dotenv').config();
const { MongoClient } = require('mongodb');
async function main() {
 const uri=process.env.MONGODB_URI||'mongodb://127.0.0.1:27018/?directConnection=true';
 const dbName=process.env.MONGODB_DB||'nightscout';
 const client=new MongoClient(uri,{serverSelectionTimeoutMS:5000});
 try {
  await client.connect(); const db=client.db(dbName); await db.command({ping:1});
  const [entryCount,treatmentCount,latest,sample]=await Promise.all([
   db.collection('entries').countDocuments({type:'sgv'}),db.collection('treatments').estimatedDocumentCount(),
   db.collection('entries').find({type:'sgv',sgv:{$type:'number'}}).sort({date:-1}).limit(1).next(),
   db.collection('treatments').findOne({}, {projection:{timestamp:1,created_at:1,eventType:1,insulin:1,carbs:1}})
  ]);
  console.log(JSON.stringify({ok:true,database:dbName,entryCount,treatmentCount,latestEntry:latest?{date:latest.date,dateString:latest.dateString,sgv:latest.sgv}:null,treatmentSampleFields:sample?Object.keys(sample):[]},null,2));
 } finally { await client.close(); }
}
main().catch(e=>{console.error('MongoDB check failed:',e.message);process.exitCode=1;});
