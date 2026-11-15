import { createExpedition, type Expedition, type World } from './world.ts';
export const SAVE_KEY='naturalis-futura:gilded-circuit:v1';
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,min=0,max=1e8):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const integer=(v:unknown,min=0,max=1e8):v is number=>num(v,min,max)&&Number.isInteger(v);
const str=(v:unknown,n=600):v is string=>typeof v==='string'&&v.length<=n;
const fields=(v:Record<string,unknown>,sample:object)=>Object.keys(v).length===Object.keys(sample).length&&Object.keys(v).every(k=>Object.hasOwn(sample,k));
function observations(v:unknown,max:number):boolean{return Array.isArray(v)&&v.length<=max&&v.every(o=>obj(o)&&str(o.id,100)&&integer(o.tick)&&typeof o.trial==='boolean'&&integer(o.courier,0,2)&&(o.cargo===null||integer(o.cargo,0,5))&&['loop','delivery'].includes(String(o.kind))&&str(o.place,80)&&str(o.text));}
function validWorld(v:unknown):v is World{
 if(!obj(v)||!fields(v,createExpedition().world)||!integer(v.seed,0,0xffffffff)||!integer(v.tick)||typeof v.paused!=='boolean'||typeof v.trial!=='boolean'||typeof v.dockOpen!=='boolean')return false;
 if(!obj(v.player)||!num(v.player.x,65,2835)||![-1,1].includes(Number(v.player.facing))||typeof v.player.walking!=='boolean'||!num(v.player.jump,0,150)||!num(v.player.vy,-1000,300))return false;
 if(!obj(v.pip)||!num(v.pip.x,-100,3100)||!num(v.pip.y,-100,1100)||!['follow','watch','return'].includes(String(v.pip.mode))||!(v.pip.target===null||integer(v.pip.target,0,2))||!str(v.pip.thought)||!str(v.pip.report)||!integer(v.pip.thoughtAt)||typeof v.pip.lost!=='boolean'||!observations(v.pip.seen,12))return false;
 if(!integer(v.score)||!integer(v.bellReward,0,12)||!integer(v.deliveryReward,0,12)||!integer(v.damperUntil)||!integer(v.bellAt,-999)||!integer(v.deliveryAt,-999))return false;
 if(!Array.isArray(v.crates)||v.crates.length!==6||!v.crates.every((q,i)=>obj(q)&&q.id===i&&str(q.name,20)&&['waiting','carried','delivered'].includes(String(q.state))&&(q.courier===null||integer(q.courier,0,2))))return false;
 if(!Array.isArray(v.couriers)||v.couriers.length!==3||!v.couriers.every((q,i)=>obj(q)&&q.id===i&&['bell','delivery','idle'].includes(String(q.route))&&num(q.elapsed,0,24.1)&&(q.cargo===null||integer(q.cargo,0,5))&&integer(q.reward,0,12)&&integer(q.loops)&&typeof q.unloaded==='boolean'&&num(q.wait,-.1,10)))return false;
 const crates=v.crates as World['crates'],couriers=v.couriers as World['couriers'];
 for(const q of crates){if(q.state==='carried'){if(q.courier===null||couriers[q.courier].cargo!==q.id)return false;}else if(q.courier!==null||couriers.some(c=>c.cargo===q.id))return false;}
 if(couriers.some(c=>c.cargo!==null&&(crates[c.cargo].state!=='carried'||crates[c.cargo].courier!==c.id)))return false;
 if(v.dockOpen!== (crates.filter(q=>q.state==='delivered').length>=3))return false;
 return true;
}
export function readSave(raw:string|null):Expedition|null{
 if(!raw||raw.length>80000)return null;
 try{const s:unknown=JSON.parse(raw);if(!obj(s)||!fields(s,createExpedition())||s.version!==1||!validWorld(s.world))return null;
 if(!(s.trialBackup===null||validWorld(s.trialBackup))||s.world.trial!==(s.trialBackup!==null))return null;
 if(s.trialBackup&&s.trialBackup.trial)return null;
 if(!Array.isArray(s.notes)||s.notes.length>40||!s.notes.every(n=>obj(n)&&str(n.id,100)&&str(n.text)&&typeof n.trial==='boolean'))return null;
 if(!Array.isArray(s.visited)||s.visited.length>8||!s.visited.every(v=>['arrival','kitchen','supplies','balcony','station','damper','overlook','departure'].includes(String(v))))return null;
 if(!observations(s.observations,24)||!Array.isArray(s.trials)||s.trials.length>6||!s.trials.every(t=>obj(t)&&integer(t.tick)&&integer(t.score)&&integer(t.delivered,0,6)&&integer(t.bell,0,12)&&integer(t.delivery,0,12)))return null;
 if(!(s.marked===null||integer(s.marked,0,2))||typeof s.endingSeen!=='boolean'||!integer(s.hint,0,3))return null;
 if(s.endingSeen&&!s.world.dockOpen&&!s.trialBackup?.dockOpen)return null;
 return structuredClone(s) as unknown as Expedition;
 }catch{return null;}
}
export function encodeSave(state:Expedition):string {const raw=JSON.stringify(state);if(!readSave(raw))throw new Error('Invalid expedition state');return raw;}
