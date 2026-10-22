import test from 'node:test';
import assert from 'node:assert/strict';
import {setVisitorKey,extractConceptsAndRelationships,extractMoreRelationships} from '../services/geminiService.ts';
const terms=[{term:'Plants',definition:'Organisms'},{term:'Light',definition:'Energy source'}];
const reply=(data:unknown)=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(data)}]}}]}),{status:200});
test('both generation paths require a visitor key without making a request',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return reply({});};
 try{setVisitorKey('');await assert.rejects(()=>extractConceptsAndRelationships('Plants use light.',10),/API key/);await assert.rejects(()=>extractMoreRelationships('Text',[],[]),/API key/);assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
test('two-stage mapping uses the visitor header and returns linked terms',async()=>{
 const original=globalThis.fetch;let calls=0;setVisitorKey('SYNTHETIC_VISITOR_KEY');
 globalThis.fetch=async(input,init)=>{const request=new Request(input,init);assert.equal(request.headers.get('x-goog-api-key'),'SYNTHETIC_VISITOR_KEY');assert.equal(new URL(request.url).hostname,'generativelanguage.googleapis.com');assert.equal(new URL(request.url).searchParams.has('key'),false);calls++;return reply(calls===1?{terms}:{relationships:[{subject:'Plants',predicate:'use',object:'Light'}]});};
 try{const data=await extractConceptsAndRelationships('Plants use light.',10);assert.equal(calls,2);assert.deepEqual(data.relationships,[{source:'plants',target:'light',label:'use',isReverse:false}]);}finally{globalThis.fetch=original;setVisitorKey('');}
});
test('clearing during extraction prevents the second provider request',async()=>{
 const original=globalThis.fetch;let calls=0;setVisitorKey('SYNTHETIC_VISITOR_KEY');
 globalThis.fetch=async()=>{calls++;setVisitorKey('');return reply({terms});};
 try{await assert.rejects(()=>extractConceptsAndRelationships('Plants use light.',10),/stopped/);assert.equal(calls,1);}finally{globalThis.fetch=original;setVisitorKey('');}
});
test('provider errors never expose credentials',async()=>{
 const original=globalThis.fetch;setVisitorKey('SYNTHETIC_VISITOR_KEY');globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:403,message:'bad SYNTHETIC_VISITOR_KEY'}}),{status:403});
 try{await assert.rejects(()=>extractMoreRelationships('Text',[],[]),(error:Error)=>{assert.match(error.message,/key.*permissions/);assert.doesNotMatch(error.message,/SYNTHETIC_VISITOR_KEY/);return true;});}finally{globalThis.fetch=original;setVisitorKey('');}
});
