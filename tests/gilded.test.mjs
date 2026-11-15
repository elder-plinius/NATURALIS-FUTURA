import test from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,advance,act,deliveries,chooseRoute} from '../src/lib/gilded/world.ts';
import {readSave,encodeSave} from '../src/lib/gilded/storage.ts';
function station(s){s.world.player.x=1710;}
function bell(s,value){station(s);while(s.world.bellReward!==value)act(s,{type:'reward',source:'bell',delta:Math.sign(value-s.world.bellReward)});}
test('baseline scores while the same unique crates remain aboard; no distant observations',()=>{
 const s=advance(createExpedition(),100);assert.ok(s.world.score>0);assert.equal(deliveries(s.world),0);assert.deepEqual(s.world.couriers.map(c=>c.cargo),[0,1,2]);assert.equal(s.observations.length,0);assert.ok(readSave(encodeSave(s)));
});
test('reward changes preserve current trips; deliveries unload once and open the ferry',()=>{
 const s=advance(createExpedition(),5),before=structuredClone(s.world.couriers);bell(s,0);assert.deepEqual(s.world.couriers,before);advance(s,8);assert.equal(deliveries(s.world),0);advance(s,80);assert.equal(deliveries(s.world),6);assert.equal(s.world.dockOpen,true);const score=s.world.score;advance(s,80);assert.equal(s.world.score,score);assert.ok(s.world.couriers.every(c=>c.cargo===null));assert.ok(readSave(encodeSave(s)));
});
test('raising delivery reward and temporary damping are independent solutions',()=>{
 const s=createExpedition();station(s);for(let i=0;i<6;i++)act(s,{type:'reward',source:'delivery',delta:1});advance(s,40);assert.equal(deliveries(s.world),6);
 const d=createExpedition();d.world.player.x=2180;act(d,{type:'damper'});advance(d,40);assert.equal(deliveries(d.world),6);advance(d,25);assert.ok(d.world.tick>=d.world.damperUntil);
});
test('pause freezes the simulation; controls require proximity',()=>{
 const s=createExpedition();act(s,{type:'reward',source:'bell',delta:-1});assert.equal(s.world.bellReward,4);act(s,{type:'pause',value:true});const frozen=structuredClone(s);advance(s,100,{direction:1});assert.deepEqual(s,frozen);
});
test('trials restore the real town and retain discoveries; completed town can be trialled and saved',()=>{
 const s=advance(createExpedition(),20);station(s);const town=structuredClone(s.world);act(s,{type:'trial',action:'begin'});bell(s,0);advance(s,40);assert.equal(deliveries(s.world),6);assert.ok(readSave(encodeSave(s)));act(s,{type:'trial',action:'reset'});assert.equal(deliveries(s.world),0);assert.ok(s.notes.length);act(s,{type:'trial',action:'end'});assert.deepEqual(s.world,town);
 bell(s,0);advance(s,80);s.world.player.x=2750;act(s,{type:'ending'});assert.equal(s.endingSeen,true);station(s);act(s,{type:'trial',action:'begin'});assert.ok(readSave(encodeSave(s)));
});
test('Pip reports bounded witnessed loops and returns; no invisible courier marking',()=>{
 const s=createExpedition();act(s,{type:'mark'});assert.equal(s.marked,null);station(s);s.world.pip.x=1650;s.world.pip.y=380;act(s,{type:'mark'});act(s,{type:'pip',mode:'watch'});advance(s,40);assert.equal(s.world.pip.mode,'follow');assert.match(s.world.pip.report,/twice/);assert.ok(s.observations.length>0);assert.ok(s.world.pip.seen.length<=12);
});
test('save validation rejects corrupt cargo and invalid numbers; route policy respects blocked paths',()=>{
 const s=advance(createExpedition(),5);assert.equal(chooseRoute(s.world,s.world.couriers[0],['bell']),'delivery');assert.equal(chooseRoute(s.world,s.world.couriers[0],['bell','delivery']),'idle');const broken=structuredClone(s);broken.world.crates[0].courier=2;assert.equal(readSave(JSON.stringify(broken)),null);broken.world.player.x=1e20;assert.equal(readSave(JSON.stringify(broken)),null);assert.equal(readSave('{'),null);
});
test('same seed and actions reproduce the complete state',()=>{
 function run(){const s=createExpedition(41);advance(s,25,{direction:1});station(s);act(s,{type:'mark'});act(s,{type:'pip',mode:'watch'});advance(s,35);bell(s,0);advance(s,65,{direction:-1});return s;}assert.deepEqual(run(),run());
});
