import { WIDTH, STEP, STATIONS, ground, courierPoint, deliveries, type Expedition, type Point } from './world';
const C={ink:'#101b20',deep:'#111b20',ivory:'#f6e5bd',gold:'#cfab65',edge:'#f4d392',red:'#79343a',teal:'#61b8b3',water:'#23474d'};
export interface View { camera:number; width:number; height:number; scale:number; low:boolean; reduced:boolean }
type Context=CanvasRenderingContext2D;
function path(c:Context,pts:Point[],fill:string,stroke=C.gold,width=2,close=true){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c:Context,x:number,y:number,x2:number,y2:number,color=C.gold,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function ellipse(c:Context,x:number,y:number,rx:number,ry:number,fill:string,stroke=''){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.8;c.stroke();}}
function label(c:Context,words:string,x:number,y:number,size=17,color=C.ivory){c.font=`${size}px Georgia,serif`;c.fillStyle=color;c.textAlign='center';c.fillText(words,x,y);}
function arch(c:Context,x:number,y:number,w:number,h:number,fill:string){c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,0);c.lineTo(x+w,y+h);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=C.gold;c.lineWidth=2;c.stroke();}
function building(c:Context,x:number,y:number,w:number,h:number,shade:string,seed:number){
 c.fillStyle=shade;c.fillRect(x,y-h,w,h);c.strokeStyle='#bfa577';c.lineWidth=1.5;c.strokeRect(x,y-h,w,h);
 path(c,[{x:x-7,y:y-h},{x:x+w*.48,y:y-h-38},{x:x+w+8,y:y-h}],C.red,'#c8a778',1.5);
 for(let row=0;row<Math.floor(h/47)-1;row++)for(let col=0;col<Math.floor(w/27);col++){const xx=x+12+col*27,yy=y-h+16+row*47;arch(c,xx,yy,11,23,(row+col+seed)%4===0?'#d6ae70':'#313d3e');}
}
function branch(c:Context,x:number,y:number,len:number,angle:number,depth:number){if(depth<0)return;const xx=x+Math.cos(angle)*len,yy=y+Math.sin(angle)*len;line(c,x,y,xx,yy,depth>1?'#594038':C.gold,depth+1.5);if(depth){branch(c,xx,yy,len*.65,angle-.45,depth-1);branch(c,xx,yy,len*.72,angle+.42,depth-1);}else{c.save();c.translate(xx,yy);c.rotate(angle);ellipse(c,10,0,21,6,C.red,C.gold);line(c,-8,0,29,0,'#e8bd7d',.8);c.restore();}}
let background:HTMLCanvasElement|null=null;
function backgroundArt():HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=1050;const c=canvas.getContext('2d')!;
 const sky=c.createLinearGradient(0,0,0,800);sky.addColorStop(0,'#d9c69c');sky.addColorStop(.45,'#f3dfb1');sky.addColorStop(1,'#718d87');c.fillStyle=sky;c.fillRect(0,0,WIDTH,1050);
 ellipse(c,2520,142,65,65,'#fff0c4');ellipse(c,2520,142,84,84,'#ffedb72a');
 // Distant coastal silhouettes, separate from the playable aqueduct.
 path(c,[{x:0,y:570},{x:180,y:360},{x:390,y:420},{x:580,y:240},{x:810,y:420},{x:1030,y:270},{x:1280,y:410},{x:1580,y:230},{x:1780,y:400},{x:2100,y:320},{x:2470,y:470},{x:2900,y:330},{x:2900,y:850},{x:0,y:850}],'#84958b','');
 for(let i=0;i<40;i++)building(c,i*79-15,560+Math.sin(i)*45,48+(i%3)*14,55+(i%4)*19,['#a7b19b','#b8bea1','#92a395'][i%3],i);
 c.fillStyle=C.water;c.fillRect(0,620,WIDTH,430);
 // The high circuit has a distinct, continuous physical surface.
 for(let x=1590;x<2470;x+=115){c.fillStyle='#59635b';c.fillRect(x,370,20,430);arch(c,x+21,380,92,330,'#28464b');line(c,x-7,366,x+124,366,C.ivory,6);}
 path(c,[{x:1680,y:450},{x:1815,y:293},{x:2155,y:253},{x:2410,y:337},{x:2265,y:447}], '',C.ink,22,false);
 path(c,[{x:1680,y:443},{x:1815,y:286},{x:2155,y:246},{x:2410,y:330},{x:2265,y:440}], '',C.ivory,6,false);
 for(let i=0;i<30;i++){const a=i/29;const x=1820+590*a,y=285+Math.sin(a*Math.PI)*-40;line(c,x,y-7,x,y-49,C.gold,3);}
 // Bell tower: dark masses and engraved gilt edges, not a flat image backdrop.
 c.fillStyle='#263431';c.fillRect(1980,124,165,320);c.strokeStyle=C.gold;c.lineWidth=4;c.strokeRect(1980,124,165,320);
 arch(c,1999,140,127,188,'#14292c');
 for(const x of [1970,2000,2120,2150]){line(c,x,130,x,450,C.gold,8);line(c,x+3,130,x+3,450,C.ivory,2);}
 c.beginPath();c.ellipse(2062,120,106,87,0,Math.PI,Math.PI*2);c.lineTo(2168,126);c.lineTo(1956,126);c.fillStyle='#383c2f';c.fill();c.strokeStyle=C.gold;c.lineWidth=5;c.stroke();
 for(let x=1980;x<=2140;x+=27){c.beginPath();c.moveTo(x,120);c.quadraticCurveTo(2062,10,2062,32);c.strokeStyle=C.gold;c.lineWidth=2;c.stroke();}
 line(c,2062,34,2062,4,C.gold,5);ellipse(c,2062,3,8,8,C.ivory);path(c,[{x:2025,y:265},{x:2100,y:265},{x:2100,y:411},{x:2062,y:438},{x:2025,y:411}],C.red,C.gold,2);
 for(let y=285;y<410;y+=22){path(c,[{x:2040,y},{x:2062,y:y+15},{x:2084,y}], '',C.gold,2,false);}
 // Walkable foreground embankment and terraces use exactly the simulation's ground curve.
 const top=Array.from({length:WIDTH/20+1},(_,i)=>({x:i*20,y:ground(i*20)}));
 path(c,[...top,{x:WIDTH,y:1060},{x:0,y:1060}],'#29332e',C.gold,3);
 path(c,top,'',C.ivory,10,false);path(c,top.map(p=>({x:p.x,y:p.y+16})),'',C.gold,3,false);
 for(let x=0;x<WIDTH;x+=108){const y=ground(x);line(c,x,y+22,x+12,1040,'#515341',2);for(let yy=y+62;yy<1040;yy+=61)line(c,x,yy,x+108,yy-3,'#68604a',1);}
 // Kitchen, warehouse and small harbour houses.
 building(c,340,760,175,200,'#243b3b',3);arch(c,397,652,61,108,'#111e22');
 path(c,[{x:318,y:598},{x:530,y:598},{x:545,y:625},{x:306,y:625}],C.red,C.gold,2);
 label(c,'MARA’S KITCHEN',425,623,14,C.ivory);
 c.fillStyle='#344541';c.fillRect(378,510,24,64);line(c,375,508,405,508,C.gold,4);
 for(let x=40;x<310;x+=65){line(c,x,760,x,904,'#332d23',18);line(c,x-7,760,x-7,890,C.gold,2);ellipse(c,x,757,14,5,C.ivory);}
 for(let x=40;x<300;x+=30)line(c,x,760,x+40,760,C.gold,2);
 // Surface details and guides remain subordinate to actors.
 for(let x=870;x<WIDTH;x+=185){const y=ground(x);line(c,x,y-5,x,y-78,C.gold,3);ellipse(c,x,y-86,10,17,'#e4c577',C.ivory);}
 for(let i=0;i<80;i++){const x=(i*83)%WIDTH,y=ground(x)+24+(i%5)*14;line(c,x,y,x+14,y-3,'#aa936b',.8);}
 branch(c,15,960,190,-1.35,4);branch(c,2870,990,180,-1.9,4);
 return canvas;
}
function bell(c:Context,t:number,damped:boolean,rang:boolean){c.save();c.translate(2062,174);c.rotate(damped?0:rang?Math.sin(t*20)*.22:Math.sin(t*.6)*.012);line(c,0,-27,0,8,C.gold,6);c.beginPath();c.moveTo(-31,65);c.quadraticCurveTo(-24,49,-22,24);c.quadraticCurveTo(-20,-2,0,0);c.quadraticCurveTo(20,-2,22,24);c.quadraticCurveTo(24,49,31,65);c.closePath();c.fillStyle='#d3a454';c.fill();c.strokeStyle=C.ivory;c.lineWidth=3;c.stroke();ellipse(c,0,64,36,9,C.gold,C.ivory);ellipse(c,0,75,7,9,C.ink);if(damped){c.strokeStyle=C.red;c.lineWidth=16;c.beginPath();c.moveTo(-33,33);c.lineTo(33,58);c.stroke();}c.restore();}
function crate(c:Context,x:number,y:number,id:number,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#b77c45';c.fillRect(-17,-25,34,25);c.strokeStyle='#f7d99d';c.lineWidth=2;c.strokeRect(-17,-25,34,25);line(c,-16,-23,16,-1,'#704b32',3);line(c,-16,-1,16,-23,'#704b32',3);c.fillStyle='#f5e4be';c.fillRect(-7,-20,14,16);label(c,String(id+1),0,-7,13,C.ink);c.restore();}
function naturalist(c:Context,p:Point,t:number,moving:boolean,facing:number,jump:number){
 c.save();c.translate(p.x,p.y);ellipse(c,0,1,29,6,'#091e2480');c.translate(0,-jump);c.scale(facing,1);
 const stride=moving?Math.sin(t*11):0,bob=moving?Math.abs(Math.cos(t*11))*2:0;
 for(const side of [-1,1]){c.save();c.translate(side*8,-33);c.rotate(stride*.35*side);line(c,0,0,2,27,'#c7b895',11);line(c,0,26,11,30,C.ink,13);line(c,0,25,11,27,C.gold,2);c.restore();}
 c.translate(0,-bob);c.beginPath();c.moveTo(-14,-78);c.quadraticCurveTo(-25,-57,-29-stride*5,-20);c.lineTo(22,-23);c.quadraticCurveTo(10,-47,14,-76);c.closePath();c.fillStyle=C.ink;c.fill();c.strokeStyle=C.gold;c.lineWidth=2;c.stroke();
 c.beginPath();c.moveTo(-15,-67);c.quadraticCurveTo(-39,-39,-34-stride*6,-29);c.lineTo(-24,-20);c.lineTo(-11,-61);c.fillStyle=C.red;c.fill();c.strokeStyle=C.gold;c.stroke();
 ellipse(c,1,-93,13,16,'#eed6ad',C.ink);c.beginPath();c.arc(-1,-99,15,Math.PI*.8,Math.PI*2);c.lineTo(16,-98);c.lineTo(-14,-90);c.fillStyle='#28272a';c.fill();ellipse(c,-13,-97,7,8,'#28272a',C.gold);ellipse(c,9,-94,1.5,1.5,C.ink);
 c.save();c.translate(8,-70);c.rotate(stride*.16);line(c,0,0,16,19,C.gold,8);line(c,16,19,23,8,'#edd9b7',7);line(c,25,12,25,-16,C.gold,3);ellipse(c,25,-20,5,7,C.ivory);c.restore();
 c.fillStyle='#6a5540';c.fillRect(-23,-75,15,27);c.strokeStyle=C.gold;c.strokeRect(-23,-75,15,27);line(c,-13,-76,-5,-46,C.ivory,2);c.restore();
}
function pip(c:Context,p:Point,t:number,watch:boolean,celebrate:boolean){
 c.save();c.translate(p.x,p.y+Math.sin(t*3)*4);const wiggle=Math.sin(t*5);c.rotate(celebrate?Math.sin(t*10)*.09:Math.sin(t*2)*.025);
 // Independent curled tail, paws and ear gills articulate around a compact opal body.
 c.beginPath();c.moveTo(-13,4);c.bezierCurveTo(-60,30,-62,-27,-34,-24);c.bezierCurveTo(-15,-22,-34,1,-39,-10);c.strokeStyle=C.gold;c.lineWidth=18;c.stroke();c.strokeStyle='#2d8b94';c.lineWidth=14;c.stroke();
 for(let i=0;i<4;i++){const x=-13+i*9;line(c,x,10,x+Math.sin(t*10+i*2)*4,19,'#e6c3a4',5);}
 ellipse(c,-4,1,23,15,'#62b9b7',C.ivory);ellipse(c,14,-12,19,20,'#80cfc4',C.ivory);
 for(const side of [-1,1])for(let k=0;k<3;k++){
  c.save();c.translate(13+side*12,-23);c.rotate(side*(.5+k*.34)+wiggle*.055);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(side*10,-17-k*4,0,-32-k*5);c.quadraticCurveTo(-side*9,-14,0,0);c.fillStyle=k%2?'#f0c8a9':'#cb8e83';c.fill();c.strokeStyle=C.ivory;c.lineWidth=1.3;c.stroke();c.restore();}
 ellipse(c,20,-15,5.4,7,C.ink);ellipse(c,22,-18,1.8,2,C.ivory);line(c,26,-6,29,-8,C.ink,1.6);
 if(watch){ellipse(c,10,-56,4,4,C.gold);ellipse(c,10,-70,2,2,C.gold);}if(celebrate)for(let i=0;i<4;i++)ellipse(c,Math.cos(t*2+i)*35,Math.sin(t*2+i)*30,2,2,C.ivory);
 c.restore();
}
function courier(c:Context,p:Point,id:number,cargo:number|null,t:number,unload:number,marked:boolean){
 c.save();c.translate(p.x,p.y);ellipse(c,0,2,23,5,'#0a242940');c.translate(0,-58);
 const flap=Math.sin(t*9+id)*.5;
 for(const side of [-1,1]){c.save();c.rotate(side*flap);c.beginPath();c.moveTo(-8,0);c.quadraticCurveTo(side*39,-40,side*46,-12);c.quadraticCurveTo(side*22,7,-8,0);c.fillStyle=side<0?'#b2925e':'#e3c184';c.fill();c.strokeStyle=C.ivory;c.lineWidth=1.7;c.stroke();for(let i=1;i<4;i++)line(c,side*8,0,side*(15+i*7),-14+i*2,'#84683e',1);c.restore();}
 ellipse(c,1,-2,22,12,'#c99c55',C.ivory);ellipse(c,19,-12,11,11,'#f3d69a',C.ink);path(c,[{x:27,y:-13},{x:41,y:-8},{x:27,y:-6}],C.gold,C.ink,1);ellipse(c,23,-15,2.1,2.1,C.ink);
 line(c,-9,9,-13+Math.sin(t*11)*3,22,C.gold,3);line(c,7,9,11-Math.sin(t*11)*3,22,C.gold,3);
 path(c,[{x:-19,y:0},{x:-36,y:13},{x:-35,y:0}],['#803f49','#287b81','#384a77'][id],C.ivory,1);
 label(c,String(id+1),0,-25,15,C.ivory);
 if(cargo!==null){line(c,0,10,0,30+unload*13,C.ink,2);crate(c,0,45+unload*13,cargo,.8);}
 if(marked){c.strokeStyle=C.teal;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.ellipse(0,-2,55,44,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}c.restore();
}
function wheel(c:Context,x:number,y:number,value:number,title:string,teal=false){
 line(c,x,y,x,y+70,C.gold,8);ellipse(c,x,y,38,38,C.ink,C.gold);for(let i=0;i<8;i++){const a=i*Math.PI/4+value*.16;line(c,x+Math.cos(a)*17,y+Math.sin(a)*17,x+Math.cos(a)*35,y+Math.sin(a)*35,C.gold,2);}
 ellipse(c,x,y,20,20,teal?'#327980':'#b17d39',C.ivory);label(c,String(value),x,y+7,22,C.ivory);label(c,title,x,y+103,14,C.ivory);
}
export function render(c:Context,s:Expedition,v:View,alpha=0){
 const w=s.world,t=(w.tick+(w.paused?0:alpha))*STEP;const h=v.height,screenW=v.width;
 c.clearRect(0,0,screenW,h);c.fillStyle=C.deep;c.fillRect(0,0,screenW,h);
 const viewport=screenW/v.scale;const wanted=Math.max(0,Math.min(WIDTH-viewport,w.player.x-viewport*.38));v.camera+=(wanted-v.camera)*(v.reduced?1:.09);
 const oy=(h-990*v.scale)*.42;c.save();c.translate(-v.camera*v.scale,oy);c.scale(v.scale,v.scale);
 if(!background)background=backgroundArt();c.drawImage(background,0,0);
 if(!v.low){for(let i=0;i<48;i++){const x=(i*137+t*(i%3+1)*4)%WIDTH,y=650+(i%8)*48;line(c,x,y,x+34+Math.sin(t+i)*17,y,'#c6c19140',1);}}
 bell(c,t,w.tick<w.damperUntil,w.tick-w.bellAt<25);
 // Supplies actually delivered stay at the kitchen; no display-only victory counter.
 w.crates.filter(q=>q.state==='delivered').forEach((q,i)=>crate(c,554+(i%3)*39,758-Math.floor(i/3)*29,q.id));
 w.crates.filter(q=>q.state==='waiting').forEach((q,i)=>crate(c,1630-i*38,438,q.id));
 wheel(c,1665,ground(1710)-88,w.bellReward,'BELL');wheel(c,1755,ground(1710)-88,w.deliveryReward,'DELIVERY',true);
 line(c,2180,ground(2180),2180,ground(2180)-118,C.gold,3);line(c,2180,ground(2180)-118,2210,ground(2180)-118,C.gold,3);line(c,2210,ground(2180)-118,2210,ground(2180)-22,w.tick<w.damperUntil?C.teal:C.red,5);ellipse(c,2210,ground(2180)-19,9,6,C.gold);
 const d=deliveries(w);if(d){c.fillStyle='#f4b65c';c.fillRect(401,665,53,90);for(let j=0;j<4;j++)ellipse(c,420+Math.sin(t+j)*6,545-j*14-Math.sin(t*.5+j)*6,10+j*3,9+j*4,'#e0d6bd50');}
 if(d>=3){for(let i=0;i<3;i++)naturalist(c,{x:345+i*46,y:ground(345+i*46)},t+i,false,i%2?1:-1,0);ellipse(c,470,736,13,5,C.ivory);ellipse(c,494,736,8,4,'#8ec8c0');}
 // Courier render derives cargo and location directly from simulation, including lowering before unload.
 for(const bird of [...w.couriers].sort((a,b)=>courierPoint(a).y-courierPoint(b).y)){
  const p=courierPoint(bird,w.paused?0:alpha*STEP);courier(c,p,bird.id,bird.cargo,t,bird.route==='delivery'?Math.max(0,Math.min(1,bird.elapsed-11)):0,s.marked===bird.id);
 }
 naturalist(c,{x:w.player.x,y:ground(w.player.x)},t,w.player.walking,w.player.facing,w.player.jump);
 pip(c,{x:w.pip.x,y:w.pip.y},t,w.pip.mode==='watch',w.tick-w.deliveryAt<65);
 // Mooring gate and ferry physically react to service. The route always existed; this is the next expedition.
 const bx=2775,by=ground(2750)+25;path(c,[{x:bx-89,y:by},{x:bx+95,y:by},{x:bx+65,y:by+42},{x:bx-55,y:by+42}],C.red,C.gold,3);line(c,bx,by,bx,by-145,C.gold,5);path(c,[{x:bx+3,y:by-140},{x:bx+3,y:by-28},{x:bx+79,y:by-30}],w.dockOpen?C.ivory:'#8d8b72',C.gold,2);
 if(!w.dockOpen){line(c,2680,ground(2680)-56,2740,ground(2740)-56,C.red,9);label(c,'Awaiting provisions',2750,by+75,17,C.ivory);}else label(c,'THE DROWNED ARCHIVE',2775,by+80,17,C.ivory);
 // Context markers are spatial: the player still has to approach the actual instrument.
 const near=STATIONS.find(p=>Math.abs(p.x-w.player.x)<105);if(near){const y=ground(near.x)-135;ellipse(c,near.x,y,17,17,C.ink,C.gold);label(c,'E',near.x,y+6,17,C.ivory);}
 c.restore();
 // Restrained foreground vignette frames the bright harbor without obscuring active actors.
 const edge=c.createLinearGradient(0,0,screenW,0);edge.addColorStop(0,'#0a141e65');edge.addColorStop(.1,'#0000');edge.addColorStop(.9,'#0000');edge.addColorStop(1,'#0a141e65');c.fillStyle=edge;c.fillRect(0,0,screenW,h);
}
