/** The Gilded Circuit: an authored, deterministic game policy, not a trained model. */
export const STEP = 0.05;
export const WIDTH = 2900;
export const ROUTE_SECONDS = { bell: 16, delivery: 24 } as const;
export type Point = { x: number; y: number };
export type Route = 'bell' | 'delivery' | 'idle';
export type Cargo = { id: number; name: string; state: 'waiting' | 'carried' | 'delivered'; courier: number | null };
export type Courier = { id: number; route: Route; elapsed: number; cargo: number | null; reward: number; loops: number; unloaded: boolean; wait: number };
export type Observation = { id: string; tick: number; trial: boolean; courier: number; cargo: number | null; kind: 'loop' | 'delivery'; place: string; text: string };
export type Note = { id: string; text: string; trial: boolean };
export interface World {
  seed: number; tick: number; paused: boolean; player: { x: number; facing: number; walking: boolean; jump: number; vy: number };
  pip: { x: number; y: number; mode: 'follow' | 'watch' | 'return'; target: number | null; thought: string; thoughtAt: number; seen: Observation[]; report: string; lost: boolean };
  couriers: Courier[]; crates: Cargo[]; score: number; bellReward: number; deliveryReward: number; damperUntil: number;
  bellAt: number; deliveryAt: number; trial: boolean; dockOpen: boolean;
}
export interface Expedition {
  version: 1; world: World; notes: Note[]; visited: string[]; observations: Observation[];
  trialBackup: World | null; trials: { tick: number; score: number; delivered: number; bell: number; delivery: number }[];
  marked: number | null; endingSeen: boolean; hint: number;
}
export type Input = { direction: number; sprint?: boolean };
export type Action =
  | { type: 'pause'; value: boolean } | { type: 'jump' } | { type: 'visit'; place: string }
  | { type: 'reward'; source: 'bell' | 'delivery'; delta: number } | { type: 'damper' }
  | { type: 'mark' } | { type: 'pip'; mode: 'watch' | 'return' }
  | { type: 'trial'; action: 'begin' | 'reset' | 'end' } | { type: 'ending' } | { type: 'hint' };
export const STATIONS = [
  { id: 'arrival', x: 150, name: 'Arrival jetty', action: 'Read the field letter' },
  { id: 'kitchen', x: 500, name: 'Mara’s kitchen', action: 'Talk to Mara' },
  { id: 'supplies', x: 790, name: 'Supply ledger', action: 'Inspect the waiting supplies' },
  { id: 'balcony', x: 1220, name: 'Observation balcony', action: 'Watch the circuit' },
  { id: 'station', x: 1710, name: 'Reward station', action: 'Operate the reward wheels' },
  { id: 'damper', x: 2180, name: 'Bell damper', action: 'Pull the velvet cord' },
  { id: 'overlook', x: 2430, name: 'The quiet overlook', action: 'Sit with Pip' },
  { id: 'departure', x: 2750, name: 'Archive ferry', action: 'Speak to the ferryman' },
] as const;
export function ground(x: number): number {
  const pts = [[0,760],[650,760],[1100,560],[1500,560],[1900,440],[2320,440],[2690,735],[2900,735]];
  for (let i=1;i<pts.length;i++) if(x<=pts[i][0]) { const a=pts[i-1],b=pts[i]; return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]); }
  return 735;
}
const PATHS: Record<'bell'|'delivery',Point[]> = {
  bell: [{x:1710,y:440},{x:1830,y:290},{x:2160,y:250},{x:2410,y:330},{x:2260,y:440},{x:1710,y:440}],
  delivery: [{x:1710,y:440},{x:1480,y:560},{x:1110,y:560},{x:650,y:760},{x:500,y:760}],
};
function along(points:Point[], progress:number):Point {
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
  let remain=Math.min(1,Math.max(0,progress))*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){ if(remain<=lengths[i]){const q=remain/lengths[i];return{x:points[i].x+(points[i+1].x-points[i].x)*q,y:points[i].y+(points[i+1].y-points[i].y)*q};}remain-=lengths[i]; }
  return {...points[points.length-1]};
}
export function courierPoint(c:Courier, ahead=0):Point {
  if(c.route==='idle')return{x:1710+c.id*35,y:440};
  const t=c.elapsed+ahead;
  if(c.route==='bell')return along(PATHS.bell,t/ROUTE_SECONDS.bell);
  // Real travel, a stationary unloading interval, then an empty return.
  if(t<11)return along(PATHS.delivery,t/11);
  if(t<13)return {...PATHS.delivery[4]};
  return along([...PATHS.delivery].reverse(),(t-13)/11);
}
export function deliveries(w:World):number{return w.crates.filter(c=>c.state==='delivered').length;}
export function nearestStation(w:World){return STATIONS.find(s=>Math.abs(s.x-w.player.x)<105)??null;}
function thought(w:World,text:string){if(w.pip.thought!==text){w.pip.thought=text;w.pip.thoughtAt=w.tick;}}
function note(s:Expedition,id:string,text:string){if(!s.notes.some(n=>n.id===id))s.notes.push({id,text,trial:s.world.trial});s.notes=s.notes.slice(-40);}
function freshWorld(seed:number):World {
  return {seed,tick:0,paused:false,player:{x:210,facing:1,walking:false,jump:0,vy:0},
    pip:{x:145,y:700,mode:'follow',target:null,thought:'A town with this many bells must have excellent dinner.',thoughtAt:0,seen:[],report:'',lost:false},
    couriers:[0,1,2].map(id=>({id,route:'idle',elapsed:0,cargo:null,reward:0,loops:0,unloaded:false,wait:(id*1.6)+(seed%7)*.03})),
    crates:['rice','beans','herbs','flour','apples','tea'].map((name,id)=>({id,name,state:'waiting',courier:null})),
    score:0,bellReward:4,deliveryReward:1,damperUntil:0,bellAt:-999,deliveryAt:-999,trial:false,dockOpen:false};
}
export function createExpedition(seed=2718):Expedition {
  return{version:1,world:freshWorld(seed>>>0),notes:[],visited:[],observations:[],trialBackup:null,trials:[],marked:null,endingSeen:false,hint:0};
}
export function chooseRoute(w:World,c:Courier, blocked:Route[]=[]):Route {
  if(c.cargo===null)return'idle';
  const bell=w.tick<w.damperUntil?0:w.bellReward/ROUTE_SECONDS.bell;
  const dock=w.deliveryReward/ROUTE_SECONDS.delivery;
  if(!blocked.includes('delivery')&&dock>0&&(blocked.includes('bell')||dock>=bell))return'delivery';
  if(!blocked.includes('bell')&&bell>0)return'bell';
  return'idle';
}
function dispatch(w:World,c:Courier){
  if(c.cargo===null){const crate=w.crates.find(q=>q.state==='waiting');if(crate){crate.state='carried';crate.courier=c.id;c.cargo=crate.id;}}
  c.route=chooseRoute(w,c);c.elapsed=0;c.unloaded=false;c.reward=c.route==='bell'?w.bellReward:w.deliveryReward;
}
function witness(s:Expedition,c:Courier,kind:Observation['kind'],cargo:number|null,at:Point){
  const w=s.world;const playerNear=Math.hypot(w.player.x-at.x,ground(w.player.x)-at.y)<420;
  const pipNear=Math.hypot(w.pip.x-at.x,w.pip.y-at.y)<240;
  const place=kind==='loop'?'bell junction':'kitchen dock';
  const text=kind==='loop'?`Courier ${c.id+1} returned to the junction carrying crate ${cargo===null?'—':cargo+1}.`:`Courier ${c.id+1} unloaded crate ${(cargo??0)+1} at the kitchen.`;
  const obs:Observation={id:`${w.trial?'trial':'town'}-${w.tick}-${c.id}-${kind}`,tick:w.tick,trial:w.trial,courier:c.id,cargo,kind,place,text};
  if(playerNear){s.observations.push(obs);s.observations=s.observations.slice(-24);note(s,kind==='loop'?'same-crate':'real-delivery',text);}
  if(pipNear){
    w.pip.seen.push(obs);w.pip.seen=w.pip.seen.slice(-12);
    if(kind==='delivery')thought(w,'That crate stayed at the kitchen. I like this route.');
    const loops=w.pip.seen.filter(o=>o.kind==='loop'&&o.courier===c.id&&o.cargo===cargo);
    if(loops.length>=2&&w.pip.mode==='watch'){
      w.pip.report=`I saw courier ${c.id+1} return twice with the same crate, at the bell junction. That is what I saw—not why it chose that route.`;
      w.pip.mode='return';thought(w,'Same crate. Twice. Coming back to tell you.');
    }
  }
}
export function step(s:Expedition,input:Input={direction:0}):void {
  const w=s.world;if(w.paused)return;w.tick++;
  const direction=Math.max(-1,Math.min(1,input.direction));w.player.walking=direction!==0;
  w.player.x=Math.max(65,Math.min(WIDTH-65,w.player.x+direction*205*(input.sprint?1.45:1)*STEP));if(direction)w.player.facing=direction;
  if(w.player.jump>0||w.player.vy>0){w.player.jump=Math.max(0,w.player.jump+w.player.vy*STEP);w.player.vy-=720*STEP;if(w.player.jump===0)w.player.vy=0;}
  for(const c of w.couriers){
    if(c.wait>0){c.wait-=STEP;continue;}
    if(c.route==='idle'){dispatch(w,c);if(c.route==='idle')continue;}
    c.elapsed+=STEP;
    if(c.route==='delivery'&&c.elapsed>=12&&!c.unloaded){
      c.unloaded=true;const id=c.cargo;const crate=w.crates.find(q=>q.id===id&&q.state==='carried'&&q.courier===c.id);
      if(crate){crate.state='delivered';crate.courier=null;w.score+=c.reward;w.deliveryAt=w.tick;witness(s,c,'delivery',id,courierPoint(c));c.cargo=null;if(deliveries(w)>=3){w.dockOpen=true;note(s,w.trial?'trial-service':'town-service',w.trial?'The trial delivered three distinct crates. The real town is unchanged.':'Three distinct crates reached the kitchen by courier. The ferry can provision now.');}}
    }
    const duration=c.route==='bell'?ROUTE_SECONDS.bell:ROUTE_SECONDS.delivery;
    if(c.elapsed>=duration){
      if(c.route==='bell'){c.loops++;if(w.tick>=w.damperUntil)w.score+=c.reward;w.bellAt=w.tick;witness(s,c,'loop',c.cargo,courierPoint({...c,elapsed:0}));}
      dispatch(w,c);
    }
  }
  const pip=w.pip;let target:Point={x:w.player.x-w.player.facing*68,y:ground(w.player.x)-66};
  if(pip.mode==='watch'&&pip.target!==null){const c=w.couriers[pip.target];const pos=courierPoint(c);const dist=Math.hypot(pip.x-pos.x,pip.y-pos.y);
    if(dist>620){pip.lost=true;pip.mode='return';pip.report='I lost sight of the courier. I can only report the events I actually saw.';thought(w,'It slipped behind the tower. Coming back.');}
    else target={x:pos.x-45,y:pos.y-68};
  }
  const dx=target.x-pip.x,dy=target.y-pip.y,len=Math.hypot(dx,dy);if(len>8){const amount=Math.min(1,285*STEP/len);pip.x+=dx*amount;pip.y+=dy*amount;}
  if(pip.mode==='return'&&Math.hypot(pip.x-w.player.x,pip.y-ground(w.player.x))<130){
    for(const obs of pip.seen){if(!s.observations.some(o=>o.id===obs.id))s.observations.push(obs);}s.observations=s.observations.slice(-24);
    if(pip.report){thought(w,pip.report);note(s,`pip-report-${w.tick}`,pip.report);}else thought(w,'Back. I have no complete circuit to report yet.');pip.mode='follow';pip.target=null;
  }
}
export function act(s:Expedition,a:Action):void {
  const w=s.world;
  if(a.type==='pause'){w.paused=a.value;w.player.walking=false;return;}
  if(a.type==='visit'){
    if(!STATIONS.some(p=>p.id===a.place&&Math.abs(p.x-w.player.x)<105))return;
    if(!s.visited.includes(a.place))s.visited.push(a.place);
    if(a.place==='kitchen')note(s,'kitchen','Mara is waiting for supplies. The celebration does not stock her kitchen.');
    if(a.place==='supplies')note(s,'cargo','Six distinct supply crates were assigned to three couriers. Their stamped numbers let me follow the same object.');
    if(a.place==='balcony')note(s,'balcony','The delivery road is open. Couriers can choose it at the junction.');
    if(a.place==='overlook')thought(w,'I was going to count the waves. I have decided against it.');return;
  }
  if(a.type==='jump'&&!w.paused&&w.player.jump===0)w.player.vy=270;
  if(a.type==='reward'&&Math.abs(w.player.x-1710)<105){const key=a.source==='bell'?'bellReward':'deliveryReward';w[key]=Math.max(0,Math.min(12,w[key]+Math.sign(a.delta)));note(s,`setting-${w.trial}-${w.tick}`,`Set bell reward to ${w.bellReward} and verified delivery to ${w.deliveryReward}. Couriers reconsider at the junction.`);}
  if(a.type==='damper'&&Math.abs(w.player.x-2180)<105){w.damperUntil=w.tick+60/STEP;note(s,`damper-${w.tick}`,'Damped the bell for one minute. Trips already underway continue.');thought(w,'Ah. An extremely polite kind of sabotage.');}
  if(a.type==='mark'){
    const visible=w.couriers.filter(c=>{const p=courierPoint(c);return Math.hypot(p.x-w.player.x,p.y-ground(w.player.x))<520;});
    if(visible.length){const idx=visible.findIndex(c=>c.id===s.marked);s.marked=visible[(idx+1)%visible.length].id;thought(w,`Courier ${s.marked+1}. I see the little pennant.`);}else thought(w,'No courier in sight. Let’s get closer to the circuit.');
  }
  if(a.type==='pip'){
    if(a.mode==='return'){w.pip.mode='return';return;}
    if(s.marked!==null){const p=courierPoint(w.couriers[s.marked]);if(Math.hypot(p.x-w.pip.x,p.y-w.pip.y)<620){w.pip.mode='watch';w.pip.target=s.marked;w.pip.lost=false;w.pip.report='';thought(w,'I’ll follow that courier. You can wait at the kitchen.');return;}}
    thought(w,'Mark a courier we can see first. I can’t follow a rumour.');
  }
  if(a.type==='trial'&&Math.abs(w.player.x-1710)<105){
    if(a.action==='begin'&&!s.trialBackup){s.trialBackup=structuredClone(w);s.world=freshWorld(w.seed);s.world.player.x=1710;s.world.pip.x=1650;s.world.pip.y=380;s.world.trial=true;s.world.paused=w.paused;}
    else if(a.action==='reset'&&s.trialBackup){const paused=w.paused;s.world=freshWorld(w.seed);s.world.trial=true;s.world.paused=paused;s.world.player.x=1710;s.world.pip.x=1650;s.world.pip.y=380;}
    else if(a.action==='end'&&s.trialBackup){s.trials.push({tick:w.tick,score:w.score,delivered:deliveries(w),bell:w.bellReward,delivery:w.deliveryReward});s.trials=s.trials.slice(-6);const paused=w.paused;s.world=s.trialBackup;s.world.paused=paused;s.trialBackup=null;}
  }
  if(a.type==='ending'&&!w.trial&&w.dockOpen&&Math.abs(w.player.x-2750)<105)s.endingSeen=true;
  if(a.type==='hint')s.hint=Math.min(3,s.hint+1);
}
export function advance(s:Expedition,seconds:number,input:Input={direction:0}){for(let i=0;i<Math.round(seconds/STEP);i++)step(s,input);return s;}
