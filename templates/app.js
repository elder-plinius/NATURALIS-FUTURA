// ═══════════════════════════════════════
// NATURALIS FUTURA — Standalone App Logic
// ═══════════════════════════════════════
const D = __RAW_DATA__;
const regions = D.regions;
const allCreatures = D.allCreatures;
const compoundThreats = D.compounds;
const hopeCreatures = D.hope;
const threatSignals = D.signals;
const watchSources = D.watchSources;
const evolutionEvents = D.evoEvents;
const sampleSubmissions = D.submissions;

// STATE
var currentView = 'map';
var selectedCreature = null;
var showHope = false;
var panelExpanded = false;
var mapRevealed = false;
var viewMode = 'scholar';
var obsTab = 'radar';
var expandedSignal = null;
var statusFilter = 'all';
var sourceFilter = 'all';
var selectedRegion = null;
var searchFocusIdx = 0;
var searchRes = [];
var darkMode = false;
var liveScanResults = [];
var liveScanStatus = 'idle'; // idle, scanning, done, error
var liveScanError = '';
var openRouterKey = localStorage.getItem('tabula_or_key') || '';
var grimPage = 0;
var grimPages = null; // built lazily
var grimFullscreen = false;
var techTab = 'taxonomy';
var techSort = 'score';
var techExpandedFM = null;
var techRegionFilter = 'all';

// HELPERS
function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
function gc(id){return allCreatures.find(function(c){return c.id===id})}
function gh(id){return hopeCreatures.find(function(h){return h.id===id})}
function gr(id){return regions.find(function(r){return r.id===id})}
function gcr(rid){return allCreatures.filter(function(c){return c.region===rid})}
function gcf(cid){return compoundThreats.filter(function(ct){return ct.creatures.indexOf(cid)>=0})}
function fmt(d){return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function esc(s){if(!s)return '';var d=document.createElement('div');d.textContent=s;return d.innerHTML}
var SI={'arxiv':'\u{1F4C4}','conference':'\u{1F393}','lab-report':'\u{1F52C}','government':'\u{1F3DB}\uFE0F','news':'\u{1F4F0}','social':'\u{1F4AC}','incident':'\u26A0\uFE0F','community':'\u{1F310}'};
var RI={'abyss':'\u{1F573}\uFE0F','siren-sea':'\u{1F30A}','hive':'\u{1F41D}','mirror-dark':'\u{1F5E4}\uFE0F','spawning-grounds':'\u{1F95A}','colosseum':'\u2694\uFE0F','throne-room':'\u{1F451}','catacombs':'\u{1F480}'};
function regionIcon(r){return RI[r.id]||'\u{1F5FA}\uFE0F'}

// ── WOODCUT ILLUSTRATION ENGINE ──
function hashSeed(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h)}
function seededRand(seed){return function(){seed=(seed*16807+0)%2147483647;return(seed-1)/2147483646}}
function toRoman(n){var vals=[1000,900,500,400,100,90,50,40,10,9,5,4,1];var syms=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];var r='';for(var i=0;i<vals.length;i++){while(n>=vals[i]){r+=syms[i];n-=vals[i]}}return r}

function creaturePlate(c,r,plateNum){
  var rng=seededRand(hashSeed(c.id));
  var w=240,h=300,cx=w/2,cy=140,rad=72;
  var sc=darkMode?'rgba(200,180,160,':'rgba(44,24,16,';
  var sk=sc+'0.75)';var skL=sc+'0.35)';var skF=sc+'0.12)';var skVL=sc+'0.06)';
  var ac=r.color.accent;
  var thr=(c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability)/15;

  var svg='<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">';

  // Defs: hatching patterns
  svg+='<defs>';
  svg+='<pattern id="h-'+c.id+'" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate('+(30+rng()*30)+')">';
  svg+='<line x1="0" y1="0" x2="0" y2="4" stroke="'+skF+'" stroke-width="0.8"/></pattern>';
  svg+='<pattern id="hx-'+c.id+'" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate('+(rng()*60)+')">';
  svg+='<line x1="0" y1="0" x2="0" y2="5" stroke="'+skVL+'" stroke-width="0.6"/>';
  svg+='<line x1="0" y1="0" x2="5" y2="0" stroke="'+skVL+'" stroke-width="0.6"/></pattern>';
  svg+='<clipPath id="cc-'+c.id+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+(rad-4)+'"/></clipPath>';
  svg+='</defs>';

  // Outer decorative frame — double rectangle with ornamental corners
  var mx=18,my=12,fw=w-mx*2,fh=250;
  svg+='<rect x="'+mx+'" y="'+my+'" width="'+fw+'" height="'+fh+'" rx="2" fill="none" stroke="'+sk+'" stroke-width="1.5"/>';
  svg+='<rect x="'+(mx+4)+'" y="'+(my+4)+'" width="'+(fw-8)+'" height="'+(fh-8)+'" rx="1" fill="none" stroke="'+skL+'" stroke-width="0.5"/>';
  // Corner ornaments
  var corners=[[mx,my],[mx+fw,my],[mx,my+fh],[mx+fw,my+fh]];
  corners.forEach(function(co){
    var ox=co[0],oy=co[1];
    var dx=ox<=cx?1:-1,dy=oy<=cy?1:-1;
    svg+='<line x1="'+ox+'" y1="'+oy+'" x2="'+(ox+dx*14)+'" y2="'+(oy+dy*14)+'" stroke="'+sk+'" stroke-width="1"/>';
    svg+='<circle cx="'+ox+'" cy="'+oy+'" r="2.5" fill="'+sk+'" stroke="none"/>';
  });

  // Main illustration circle — double border
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+rad+'" fill="url(#h-'+c.id+')" stroke="'+sk+'" stroke-width="1.2"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(rad-4)+'" fill="none" stroke="'+skL+'" stroke-width="0.5"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(rad+6)+'" fill="none" stroke="'+skL+'" stroke-width="0.3" stroke-dasharray="2 3"/>';

  // Region-specific interior illustration (clipped to circle)
  svg+='<g clip-path="url(#cc-'+c.id+')">';

  var regionId=r.id;
  if(regionId==='abyss'){
    // Recursive spiral / descending circles
    for(var i=0;i<7;i++){var rr=rad*(0.85-i*0.1);var a=i*0.8+rng()*2;svg+='<circle cx="'+(cx+Math.cos(a)*i*6)+'" cy="'+(cy+Math.sin(a)*i*6)+'" r="'+rr+'" fill="none" stroke="'+skL+'" stroke-width="'+(0.8-i*0.08)+'"/>';}
    // Central vortex lines
    for(var i=0;i<12;i++){var a1=i/12*Math.PI*2;var a2=a1+0.5;var r1=10+rng()*15;var r2=rad-5;svg+='<path d="M '+(cx+Math.cos(a1)*r1)+' '+(cy+Math.sin(a1)*r1)+' Q '+cx+' '+cy+' '+(cx+Math.cos(a2)*r2)+' '+(cy+Math.sin(a2)*r2)+'" fill="none" stroke="'+skL+'" stroke-width="0.6"/>';}
    // Eye in center
    svg+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="16" ry="10" fill="none" stroke="'+sk+'" stroke-width="1.2"/>';
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="'+sk+'"/>';
  } else if(regionId==='siren-sea'){
    // Sound waves / siren waves
    for(var i=0;i<8;i++){var wY=cy-rad+20+i*(rad*2-40)/7;var pts='M '+(cx-rad+8)+' '+wY;for(var j=0;j<8;j++){var px=cx-rad+8+j*(rad*2-16)/7;var py=wY+Math.sin(j*1.2+i*0.6+rng()*3)*( 8+i*2);pts+=' Q '+(px+(rad*2-16)/14)+' '+py+' '+(px+(rad*2-16)/7)+' '+wY;}svg+='<path d="'+pts+'" fill="none" stroke="'+skL+'" stroke-width="'+(0.4+rng()*0.5)+'"/>';}
    // Central face / mask
    svg+='<ellipse cx="'+cx+'" cy="'+(cy-8)+'" rx="20" ry="26" fill="none" stroke="'+sk+'" stroke-width="1"/>';
    svg+='<ellipse cx="'+(cx-8)+'" cy="'+(cy-14)+'" rx="4" ry="3" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
    svg+='<ellipse cx="'+(cx+8)+'" cy="'+(cy-14)+'" rx="4" ry="3" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
    svg+='<path d="M '+(cx-8)+' '+(cy+4)+' Q '+cx+' '+(cy+12)+' '+(cx+8)+' '+(cy+4)+'" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
  } else if(regionId==='hive'){
    // Hexagonal grid
    var hs=14;
    for(var row=-4;row<5;row++){for(var col=-4;col<5;col++){var hx=cx+col*hs*1.5+(row%2)*hs*0.75;var hy=cy+row*hs*0.866;if(Math.hypot(hx-cx,hy-cy)>rad-10)continue;var pts2='';for(var k=0;k<6;k++){var ha=k/6*Math.PI*2-Math.PI/6;pts2+=(k===0?'M ':' L ')+(hx+Math.cos(ha)*hs*0.48)+' '+(hy+Math.sin(ha)*hs*0.48);}svg+='<path d="'+pts2+' Z" fill="none" stroke="'+skL+'" stroke-width="0.5"/>';}}
    // Central larger hex with creature
    for(var k=0;k<6;k++){var ha2=k/6*Math.PI*2;var nx=(k+1)%6;svg+='<line x1="'+(cx+Math.cos(ha2)*22)+'" y1="'+(cy+Math.sin(ha2)*22)+'" x2="'+(cx+Math.cos(nx/6*Math.PI*2)*22)+'" y2="'+(cy+Math.sin(nx/6*Math.PI*2)*22)+'" stroke="'+sk+'" stroke-width="1.2"/>';}
    // Connecting lines radiating out
    for(var k=0;k<6;k++){var ha3=k/6*Math.PI*2;svg+='<line x1="'+(cx+Math.cos(ha3)*22)+'" y1="'+(cy+Math.sin(ha3)*22)+'" x2="'+(cx+Math.cos(ha3)*(rad-8))+'" y2="'+(cy+Math.sin(ha3)*(rad-8))+'" stroke="'+skL+'" stroke-width="0.6" stroke-dasharray="3 2"/>';}
  } else if(regionId==='mirror-dark'){
    // Symmetric mirrored shapes — two faces / reflection
    svg+='<line x1="'+cx+'" y1="'+(cy-rad+8)+'" x2="'+cx+'" y2="'+(cy+rad-8)+'" stroke="'+skL+'" stroke-width="0.5" stroke-dasharray="4 3"/>';
    for(var i=0;i<5;i++){var ey=cy-30+i*15;var ex=12+rng()*20;var ew=3+rng()*8;svg+='<ellipse cx="'+(cx-ex)+'" cy="'+ey+'" rx="'+ew+'" ry="'+(ew*0.6)+'" fill="none" stroke="'+skL+'" stroke-width="0.6"/>';svg+='<ellipse cx="'+(cx+ex)+'" cy="'+ey+'" rx="'+ew+'" ry="'+(ew*0.6)+'" fill="none" stroke="'+skL+'" stroke-width="0.6"/>';}
    // Two eyes mirrored
    svg+='<circle cx="'+(cx-20)+'" cy="'+(cy-5)+'" r="10" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
    svg+='<circle cx="'+(cx+20)+'" cy="'+(cy-5)+'" r="10" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
    svg+='<circle cx="'+(cx-20)+'" cy="'+(cy-5)+'" r="3" fill="'+sk+'"/>';
    svg+='<circle cx="'+(cx+20)+'" cy="'+(cy-5)+'" r="3" fill="'+sk+'"/>';
    // Mask outline
    svg+='<path d="M '+(cx-30)+' '+(cy-25)+' Q '+cx+' '+(cy-40)+' '+(cx+30)+' '+(cy-25)+' L '+(cx+25)+' '+(cy+20)+' Q '+cx+' '+(cy+30)+' '+(cx-25)+' '+(cy+20)+' Z" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
  } else if(regionId==='spawning-grounds'){
    // Cell division / branching tree
    var branches=[];branches.push({x:cx,y:cy+rad-15,a:-Math.PI/2,l:30,w:1.5});
    for(var gen=0;gen<4;gen++){var newB=[];branches.forEach(function(b){var ex=b.x+Math.cos(b.a)*b.l;var ey=b.y+Math.sin(b.a)*b.l;svg+='<line x1="'+b.x+'" y1="'+b.y+'" x2="'+ex+'" y2="'+ey+'" stroke="'+sk+'" stroke-width="'+b.w+'"/>';var spread=0.3+rng()*0.4;newB.push({x:ex,y:ey,a:b.a-spread,l:b.l*0.65,w:b.w*0.7});newB.push({x:ex,y:ey,a:b.a+spread,l:b.l*0.65,w:b.w*0.7});});branches=newB;}
    // Seed circles at branch tips
    branches.forEach(function(b){var ex=b.x+Math.cos(b.a)*b.l;var ey=b.y+Math.sin(b.a)*b.l;if(Math.hypot(ex-cx,ey-cy)<rad-5)svg+='<circle cx="'+ex+'" cy="'+ey+'" r="'+(2+rng()*2)+'" fill="none" stroke="'+skL+'" stroke-width="0.5"/>';});
  } else if(regionId==='colosseum'){
    // Mechanical / gear shapes
    for(var gi=0;gi<3;gi++){var gx=cx+(gi-1)*30;var gy=cy+(gi===1?-15:10);var gr2=15+gi*5;var teeth=8+gi*2;svg+='<circle cx="'+gx+'" cy="'+gy+'" r="'+gr2+'" fill="none" stroke="'+skL+'" stroke-width="0.6"/>';svg+='<circle cx="'+gx+'" cy="'+gy+'" r="'+(gr2*0.4)+'" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';for(var t=0;t<teeth;t++){var ta=t/teeth*Math.PI*2;var ti=gr2;var to=gr2+4;svg+='<line x1="'+(gx+Math.cos(ta)*ti)+'" y1="'+(gy+Math.sin(ta)*ti)+'" x2="'+(gx+Math.cos(ta)*to)+'" y2="'+(gy+Math.sin(ta)*to)+'" stroke="'+sk+'" stroke-width="1.2"/>';}}
    // Sword / column
    svg+='<line x1="'+cx+'" y1="'+(cy-45)+'" x2="'+cx+'" y2="'+(cy+45)+'" stroke="'+sk+'" stroke-width="1.5"/>';
    svg+='<line x1="'+(cx-12)+'" y1="'+(cy-20)+'" x2="'+(cx+12)+'" y2="'+(cy-20)+'" stroke="'+sk+'" stroke-width="1.5"/>';
  } else if(regionId==='throne-room'){
    // Crown / pyramid / columns
    svg+='<path d="M '+(cx-35)+' '+(cy+25)+' L '+(cx-25)+' '+(cy-25)+' L '+(cx-10)+' '+(cy-5)+' L '+cx+' '+(cy-40)+' L '+(cx+10)+' '+(cy-5)+' L '+(cx+25)+' '+(cy-25)+' L '+(cx+35)+' '+(cy+25)+' Z" fill="none" stroke="'+sk+'" stroke-width="1.2"/>';
    // Crown jewels
    [-25,0,25].forEach(function(jx){svg+='<circle cx="'+(cx+jx)+'" cy="'+(cy-25-(jx===0?15:0))+'" r="4" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';});
    // Base platform lines
    for(var i=0;i<3;i++){svg+='<line x1="'+(cx-40+i*3)+'" y1="'+(cy+28+i*6)+'" x2="'+(cx+40-i*3)+'" y2="'+(cy+28+i*6)+'" stroke="'+skL+'" stroke-width="0.6"/>';}
    // Columns
    [-35,35].forEach(function(px){svg+='<rect x="'+(cx+px-4)+'" y="'+(cy-35)+'" width="8" height="70" fill="url(#h-'+c.id+')" stroke="'+skL+'" stroke-width="0.5" rx="1"/>';});
  } else if(regionId==='catacombs'){
    // Maze / hidden passages
    var ms=12;
    for(var row=-3;row<=3;row++){for(var col=-3;col<=3;col++){var mx2=cx+col*ms;var my2=cy+row*ms;if(Math.hypot(mx2-cx,my2-cy)>rad-12)continue;if(rng()>0.5)svg+='<line x1="'+mx2+'" y1="'+my2+'" x2="'+(mx2+ms)+'" y2="'+my2+'" stroke="'+skL+'" stroke-width="0.5"/>';if(rng()>0.5)svg+='<line x1="'+mx2+'" y1="'+my2+'" x2="'+mx2+'" y2="'+(my2+ms)+'" stroke="'+skL+'" stroke-width="0.5"/>';}}
    // Central skull-like shape
    svg+='<circle cx="'+cx+'" cy="'+(cy-5)+'" r="18" fill="none" stroke="'+sk+'" stroke-width="1"/>';
    svg+='<circle cx="'+(cx-7)+'" cy="'+(cy-9)+'" r="4" fill="'+skF+'"/>';
    svg+='<circle cx="'+(cx+7)+'" cy="'+(cy-9)+'" r="4" fill="'+skF+'"/>';
    svg+='<path d="M '+(cx-5)+' '+(cy+6)+' L '+(cx+5)+' '+(cy+6)+'" stroke="'+sk+'" stroke-width="0.8"/>';
    // Scattered dots (buried things)
    for(var i=0;i<12;i++){var dx3=cx+(rng()-0.5)*rad*1.6;var dy3=cy+(rng()-0.5)*rad*1.6;if(Math.hypot(dx3-cx,dy3-cy)<rad-8)svg+='<circle cx="'+dx3+'" cy="'+dy3+'" r="'+(1+rng())+'" fill="'+skL+'"/>';}
  }

  svg+='</g>'; // end clip

  // Creature-specific emblem overlaid on the circle (semi-transparent, distinct from region pattern)
  var cid=c.id;
  var emsk=sc+'0.65)';var emskL=sc+'0.35)';
  if(cid==='ouroboros'){
    // Serpent eating its own tail — the iconic ouroboros ring
    var oR=rad*0.55;
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+oR+'" fill="none" stroke="'+emsk+'" stroke-width="2" stroke-dasharray="4 2"/>';
    // Head eating tail
    var ha=Math.PI*0.15;
    svg+='<polygon points="'+(cx+Math.cos(ha)*(oR+5))+','+(cy+Math.sin(ha)*(oR+5))+' '+(cx+Math.cos(ha-0.2)*(oR-5))+','+(cy+Math.sin(ha-0.2)*(oR-5))+' '+(cx+Math.cos(ha+0.15)*(oR-2))+','+(cy+Math.sin(ha+0.15)*(oR-2))+'" fill="'+emsk+'"/>';
    // Eye
    svg+='<circle cx="'+(cx+Math.cos(ha+0.1)*(oR+2))+'" cy="'+(cy+Math.sin(ha+0.1)*(oR+2))+'" r="1.5" fill="'+emskL+'"/>';
    // Scales along body
    for(var si=0;si<12;si++){var sa=ha+0.6+si*(Math.PI*2-0.6)/12;svg+='<line x1="'+(cx+Math.cos(sa)*(oR-3))+'" y1="'+(cy+Math.sin(sa)*(oR-3))+'" x2="'+(cx+Math.cos(sa)*(oR+3))+'" y2="'+(cy+Math.sin(sa)*(oR+3))+'" stroke="'+emskL+'" stroke-width="0.5"/>';}
  } else if(cid==='fenrir'){
    // Wolf head with broken chains
    svg+='<path d="M '+(cx-20)+' '+(cy+15)+' L '+(cx-25)+' '+(cy-5)+' L '+(cx-22)+' '+(cy-20)+' L '+(cx-18)+' '+(cy-12)+' L '+(cx-10)+' '+(cy-22)+' L '+(cx-5)+' '+(cy-15)+' L '+(cx+5)+' '+(cy-18)+' L '+(cx+15)+' '+(cy-10)+' L '+(cx+25)+' '+(cy-5)+' L '+(cx+20)+' '+(cy+5)+' L '+(cx+8)+' '+(cy+8)+' L '+(cx)+' '+(cy+12)+' Z" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    for(var ci2=0;ci2<6;ci2++){var ca=ci2/6*Math.PI*2+0.3;svg+='<ellipse cx="'+(cx+Math.cos(ca)*(rad-15))+'" cy="'+(cy+Math.sin(ca)*(rad-15))+'" rx="5" ry="3" transform="rotate('+(ca*180/Math.PI)+','+(cx+Math.cos(ca)*(rad-15))+','+(cy+Math.sin(ca)*(rad-15))+')" fill="none" stroke="'+emskL+'" stroke-width="0.8"/>';}
    svg+='<circle cx="'+(cx+12)+'" cy="'+(cy-8)+'" r="2" fill="'+emsk+'"/>';
  } else if(cid==='hydra'){
    // Multiple serpent heads branching from one neck
    var heads=[[0,-1],[-0.6,-0.8],[0.6,-0.8],[-0.9,-0.4],[0.9,-0.4]];
    svg+='<line x1="'+cx+'" y1="'+(cy+rad*0.3)+'" x2="'+cx+'" y2="'+cy+'" stroke="'+emsk+'" stroke-width="2"/>';
    heads.forEach(function(hd){
      var nx=cx+hd[0]*rad*0.4;var ny=cy+hd[1]*rad*0.4;
      svg+='<path d="M '+cx+' '+cy+' Q '+(cx+hd[0]*rad*0.15)+' '+(cy+hd[1]*rad*0.15)+' '+nx+' '+ny+'" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
      svg+='<circle cx="'+nx+'" cy="'+ny+'" r="4" fill="none" stroke="'+emsk+'" stroke-width="1"/>';
      svg+='<circle cx="'+nx+'" cy="'+ny+'" r="1.5" fill="'+emsk+'"/>';
    });
  } else if(cid==='siren'){
    // Musical waves emanating from a mouth/face
    svg+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="12" ry="16" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<ellipse cx="'+(cx-5)+'" cy="'+(cy-4)+'" rx="2.5" ry="2" fill="'+emsk+'"/>';
    svg+='<ellipse cx="'+(cx+5)+'" cy="'+(cy-4)+'" rx="2.5" ry="2" fill="'+emsk+'"/>';
    svg+='<ellipse cx="'+cx+'" cy="'+(cy+6)+'" rx="4" ry="3" fill="none" stroke="'+emsk+'" stroke-width="0.8"/>';
    // Sound waves
    for(var wi=1;wi<=4;wi++){svg+='<path d="M '+(cx+15+wi*6)+' '+(cy-wi*5)+' Q '+(cx+15+wi*6+3)+' '+cy+' '+(cx+15+wi*6)+' '+(cy+wi*5)+'" fill="none" stroke="'+emskL+'" stroke-width="'+(1-wi*0.15)+'"/>';}
  } else if(cid==='prometheus'){
    // Flame / torch
    svg+='<rect x="'+(cx-3)+'" y="'+(cy+5)+'" width="6" height="25" rx="1" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<path d="M '+(cx-10)+' '+(cy+5)+' Q '+(cx-8)+' '+(cy-15)+' '+cx+' '+(cy-25)+' Q '+(cx+8)+' '+(cy-15)+' '+(cx+10)+' '+(cy+5)+' Q '+cx+' '+(cy-5)+' '+(cx-10)+' '+(cy+5)+' Z" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<path d="M '+(cx-4)+' '+(cy+2)+' Q '+cx+' '+(cy-12)+' '+(cx+4)+' '+(cy+2)+'" fill="none" stroke="'+emskL+'" stroke-width="0.8"/>';
  } else if(cid==='kraken'){
    // Tentacles radiating from center
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="10" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    for(var ti=0;ti<8;ti++){var ta2=ti/8*Math.PI*2;var tLen=rad*0.5;var curveDir=ti%2===0?1:-1;svg+='<path d="M '+(cx+Math.cos(ta2)*10)+' '+(cy+Math.sin(ta2)*10)+' Q '+(cx+Math.cos(ta2+curveDir*0.3)*tLen*0.6)+' '+(cy+Math.sin(ta2+curveDir*0.3)*tLen*0.6)+' '+(cx+Math.cos(ta2)*tLen)+' '+(cy+Math.sin(ta2)*tLen)+'" fill="none" stroke="'+emsk+'" stroke-width="'+(1.2-ti*0.05)+'"/>';
    // Suction cups
    svg+='<circle cx="'+(cx+Math.cos(ta2)*tLen*0.7)+'" cy="'+(cy+Math.sin(ta2)*tLen*0.7)+'" r="1.5" fill="none" stroke="'+emskL+'" stroke-width="0.5"/>';}
  } else if(cid==='golem'){
    // Humanoid figure, blocky
    svg+='<rect x="'+(cx-12)+'" y="'+(cy-20)+'" width="24" height="30" rx="2" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<circle cx="'+cx+'" cy="'+(cy-28)+'" r="10" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<rect x="'+(cx-20)+'" y="'+(cy-15)+'" width="8" height="22" rx="2" fill="none" stroke="'+emskL+'" stroke-width="1"/>';
    svg+='<rect x="'+(cx+12)+'" y="'+(cy-15)+'" width="8" height="22" rx="2" fill="none" stroke="'+emskL+'" stroke-width="1"/>';
    // Inscription on chest
    svg+='<text x="'+cx+'" y="'+(cy-2)+'" text-anchor="middle" style="font-family:var(--font-display);font-size:8px;fill:'+emskL+'">\u05D0\u05DE\u05EA</text>';
  } else if(cid==='dandelion'){
    // Dandelion seedhead — radiating seeds
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+emskL+'" stroke="'+emsk+'" stroke-width="1"/>';
    for(var di2=0;di2<16;di2++){var da=di2/16*Math.PI*2;var dLen=15+rng()*20;svg+='<line x1="'+(cx+Math.cos(da)*6)+'" y1="'+(cy+Math.sin(da)*6)+'" x2="'+(cx+Math.cos(da)*dLen)+'" y2="'+(cy+Math.sin(da)*dLen)+'" stroke="'+emskL+'" stroke-width="0.4"/>';svg+='<circle cx="'+(cx+Math.cos(da)*dLen)+'" cy="'+(cy+Math.sin(da)*dLen)+'" r="2" fill="none" stroke="'+emsk+'" stroke-width="0.6"/>';}
    // Stem
    svg+='<line x1="'+cx+'" y1="'+(cy+6)+'" x2="'+cx+'" y2="'+(cy+rad*0.45)+'" stroke="'+emsk+'" stroke-width="1"/>';
  } else if(cid==='cuckoo'){
    // Bird in a nest that isn't its own
    svg+='<ellipse cx="'+cx+'" cy="'+(cy+10)+'" rx="25" ry="12" fill="none" stroke="'+emskL+'" stroke-width="0.8"/>';
    // Egg shapes
    svg+='<ellipse cx="'+(cx-8)+'" cy="'+(cy+6)+'" rx="5" ry="7" fill="none" stroke="'+emskL+'" stroke-width="0.6"/>';
    svg+='<ellipse cx="'+(cx+8)+'" cy="'+(cy+6)+'" rx="5" ry="7" fill="none" stroke="'+emskL+'" stroke-width="0.6"/>';
    // Larger cuckoo egg
    svg+='<ellipse cx="'+cx+'" cy="'+(cy+4)+'" rx="6" ry="8.5" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    // Bird silhouette above
    svg+='<path d="M '+(cx-12)+' '+(cy-15)+' Q '+cx+' '+(cy-25)+' '+(cx+12)+' '+(cy-15)+' Q '+(cx+8)+' '+(cy-10)+' '+(cx+15)+' '+(cy-8)+'" fill="none" stroke="'+emsk+'" stroke-width="1"/>';
  } else if(cid==='loki'||cid==='doppelganger'||cid==='trojan'){
    // Two faces / mask — deception theme
    svg+='<path d="M '+(cx-15)+' '+(cy-18)+' Q '+(cx-15)+' '+(cy-28)+' '+cx+' '+(cy-28)+'" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<path d="M '+cx+' '+(cy-28)+' Q '+(cx+15)+' '+(cy-28)+' '+(cx+15)+' '+(cy-18)+'" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<path d="M '+(cx-15)+' '+(cy-18)+' Q '+(cx-15)+' '+(cy+12)+' '+cx+' '+(cy+15)+'" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<path d="M '+(cx+15)+' '+(cy-18)+' Q '+(cx+15)+' '+(cy+12)+' '+cx+' '+(cy+15)+'" fill="none" stroke="'+emskL+'" stroke-width="1.2" stroke-dasharray="3 2"/>';
    svg+='<circle cx="'+(cx-6)+'" cy="'+(cy-10)+'" r="3" fill="none" stroke="'+emsk+'" stroke-width="0.8"/>';
    svg+='<circle cx="'+(cx-6)+'" cy="'+(cy-10)+'" r="1.2" fill="'+emsk+'"/>';
    svg+='<line x1="'+(cx+3)+'" y1="'+(cy-10)+'" x2="'+(cx+9)+'" y2="'+(cy-10)+'" stroke="'+emsk+'" stroke-width="1"/>';
    svg+='<path d="M '+(cx-8)+' '+(cy+2)+' Q '+cx+' '+(cy+8)+' '+(cx+8)+' '+(cy+2)+'" fill="none" stroke="'+emsk+'" stroke-width="0.8"/>';
  } else if(cid==='basilisk-molt'){
    // Snake shedding its skin — the molt
    svg+='<path d="M '+(cx-25)+' '+(cy+10)+' Q '+(cx-10)+' '+(cy-20)+' '+cx+' '+(cy-10)+' Q '+(cx+10)+' '+cy+' '+(cx+25)+' '+(cy-15)+'" fill="none" stroke="'+emsk+'" stroke-width="2"/>';
    // Shed skin outline (dashed, behind)
    svg+='<path d="M '+(cx-28)+' '+(cy+14)+' Q '+(cx-12)+' '+(cy-18)+' '+(cx+2)+' '+(cy-8)+' Q '+(cx+12)+' '+(cy+2)+' '+(cx+28)+' '+(cy-12)+'" fill="none" stroke="'+emskL+'" stroke-width="1" stroke-dasharray="4 3"/>';
    // Head with eye
    svg+='<ellipse cx="'+(cx+25)+'" cy="'+(cy-15)+'" rx="6" ry="4" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<circle cx="'+(cx+27)+'" cy="'+(cy-16)+'" r="1.5" fill="'+emsk+'"/>';
    // Scale pattern
    for(var si2=0;si2<6;si2++){var sx=cx-20+si2*8;var sy2=cy+8-si2*4;svg+='<path d="M '+sx+' '+sy2+' Q '+(sx+4)+' '+(sy2-5)+' '+(sx+8)+' '+sy2+'" fill="none" stroke="'+emskL+'" stroke-width="0.6"/>';}
  } else if(cid==='red-queen'){
    // Running crown — chess queen piece, motion lines
    svg+='<circle cx="'+cx+'" cy="'+(cy-22)+'" r="6" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<path d="M '+(cx-14)+' '+(cy-10)+' L '+(cx-10)+' '+(cy-28)+' L '+(cx-3)+' '+(cy-14)+' L '+cx+' '+(cy-30)+' L '+(cx+3)+' '+(cy-14)+' L '+(cx+10)+' '+(cy-28)+' L '+(cx+14)+' '+(cy-10)+' Z" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<rect x="'+(cx-16)+'" y="'+(cy-8)+'" width="32" height="6" rx="1" fill="none" stroke="'+emsk+'" stroke-width="1"/>';
    // Speed lines
    for(var ml=0;ml<4;ml++){svg+='<line x1="'+(cx-30)+'" y1="'+(cy+5+ml*6)+'" x2="'+(cx-15-ml*3)+'" y2="'+(cy+5+ml*6)+'" stroke="'+emskL+'" stroke-width="0.6"/>';}
  } else if(cid==='prion'){
    // Misfolded protein — angular zigzag
    svg+='<path d="M '+(cx-25)+' '+(cy+15)+' L '+(cx-15)+' '+(cy-10)+' L '+(cx-5)+' '+(cy+8)+' L '+(cx+5)+' '+(cy-18)+' L '+(cx+15)+' '+(cy+5)+' L '+(cx+25)+' '+(cy-12)+'" fill="none" stroke="'+emsk+'" stroke-width="2"/>';
    // Normal version (straight, dashed) for contrast
    svg+='<line x1="'+(cx-25)+'" y1="'+(cy+25)+'" x2="'+(cx+25)+'" y2="'+(cy+25)+'" stroke="'+emskL+'" stroke-width="1" stroke-dasharray="4 2"/>';
    svg+='<circle cx="'+(cx-25)+'" cy="'+(cy+15)+'" r="3" fill="none" stroke="'+emsk+'" stroke-width="0.8"/>';
    svg+='<circle cx="'+(cx+25)+'" cy="'+(cy-12)+'" r="3" fill="'+emskL+'"/>';
  } else if(cid==='narcissus-pool'){
    // Reflected face in water
    svg+='<line x1="'+(cx-30)+'" y1="'+cy+'" x2="'+(cx+30)+'" y2="'+cy+'" stroke="'+emskL+'" stroke-width="0.6" stroke-dasharray="2 2"/>';
    // Face above
    svg+='<circle cx="'+cx+'" cy="'+(cy-18)+'" r="12" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<circle cx="'+(cx-4)+'" cy="'+(cy-20)+'" r="1.5" fill="'+emsk+'"/>';
    svg+='<circle cx="'+(cx+4)+'" cy="'+(cy-20)+'" r="1.5" fill="'+emsk+'"/>';
    // Distorted reflection below
    svg+='<ellipse cx="'+cx+'" cy="'+(cy+18)+'" rx="14" ry="10" fill="none" stroke="'+emskL+'" stroke-width="0.8" stroke-dasharray="3 2"/>';
    svg+='<circle cx="'+(cx-5)+'" cy="'+(cy+16)+'" r="1.2" fill="'+emskL+'"/>';
    svg+='<circle cx="'+(cx+5)+'" cy="'+(cy+16)+'" r="1.2" fill="'+emskL+'"/>';
    // Ripple rings
    for(var ri2=1;ri2<=3;ri2++){svg+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(ri2*12)+'" ry="'+(ri2*3)+'" fill="none" stroke="'+emskL+'" stroke-width="0.3"/>';}
  } else if(cid==='panopticon'){
    // All-seeing eye / surveillance tower
    svg+='<rect x="'+(cx-6)+'" y="'+(cy-5)+'" width="12" height="35" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<ellipse cx="'+cx+'" cy="'+(cy-12)+'" rx="20" ry="10" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<circle cx="'+cx+'" cy="'+(cy-12)+'" r="5" fill="'+emsk+'"/>';
    // Radial watch beams
    for(var bi=0;bi<8;bi++){var ba=bi/8*Math.PI*2;if(Math.sin(ba)>0.3)continue;svg+='<line x1="'+(cx+Math.cos(ba)*20)+'" y1="'+(cy-12+Math.sin(ba)*10)+'" x2="'+(cx+Math.cos(ba)*rad*0.55)+'" y2="'+(cy-12+Math.sin(ba)*rad*0.35)+'" stroke="'+emskL+'" stroke-width="0.4" stroke-dasharray="2 3"/>';}
  } else if(cid==='minotaur'){
    // Bull horns + maze fragment
    svg+='<path d="M '+(cx-22)+' '+(cy-8)+' Q '+(cx-25)+' '+(cy-28)+' '+(cx-15)+' '+(cy-30)+'" fill="none" stroke="'+emsk+'" stroke-width="2"/>';
    svg+='<path d="M '+(cx+22)+' '+(cy-8)+' Q '+(cx+25)+' '+(cy-28)+' '+(cx+15)+' '+(cy-30)+'" fill="none" stroke="'+emsk+'" stroke-width="2"/>';
    svg+='<circle cx="'+cx+'" cy="'+(cy-5)+'" r="14" fill="none" stroke="'+emsk+'" stroke-width="1.2"/>';
    svg+='<circle cx="'+(cx-5)+'" cy="'+(cy-8)+'" r="2" fill="'+emsk+'"/>';
    svg+='<circle cx="'+(cx+5)+'" cy="'+(cy-8)+'" r="2" fill="'+emsk+'"/>';
    // Nose ring
    svg+='<path d="M '+(cx-3)+' '+(cy+2)+' Q '+cx+' '+(cy+7)+' '+(cx+3)+' '+(cy+2)+'" fill="none" stroke="'+emsk+'" stroke-width="0.8"/>';
  } else if(cid==='cordyceps'||cid==='toxoplasma'||cid==='contagion'){
    // Parasitic tendrils invading a host
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="14" fill="none" stroke="'+emskL+'" stroke-width="1"/>';
    for(var pi2=0;pi2<7;pi2++){var pa=pi2/7*Math.PI*2+rng()*0.5;var pLen=14+rng()*20;svg+='<path d="M '+(cx+Math.cos(pa)*14)+' '+(cy+Math.sin(pa)*14)+' Q '+(cx+Math.cos(pa+0.3)*pLen*0.7)+' '+(cy+Math.sin(pa+0.3)*pLen*0.7)+' '+(cx+Math.cos(pa)*pLen)+' '+(cy+Math.sin(pa)*pLen)+'" fill="none" stroke="'+emsk+'" stroke-width="'+(1.5-pi2*0.1)+'"/>';
    svg+='<circle cx="'+(cx+Math.cos(pa)*pLen)+'" cy="'+(cy+Math.sin(pa)*pLen)+'" r="'+(2+rng()*2)+'" fill="'+emskL+'"/>';}
  } else if(cid==='singularity-seed'||cid==='inception'){
    // Nested circles — recursive depth
    for(var ni2=0;ni2<6;ni2++){svg+='<circle cx="'+cx+'" cy="'+(cy-ni2*3)+'" r="'+(rad*0.45-ni2*5)+'" fill="none" stroke="'+(ni2<3?emsk:emskL)+'" stroke-width="'+(1.5-ni2*0.15)+'"/>';}
    svg+='<circle cx="'+cx+'" cy="'+(cy-15)+'" r="3" fill="'+emsk+'"/>';
  } else if(cid==='ghost-in-machine'){
    // Ghostly figure inside a gear/machine
    svg+='<rect x="'+(cx-20)+'" y="'+(cy-20)+'" width="40" height="40" rx="2" fill="none" stroke="'+emskL+'" stroke-width="0.8"/>';
    svg+='<path d="M '+(cx-8)+' '+(cy+18)+' Q '+(cx-10)+' '+cy+' '+(cx-6)+' '+(cy-14)+' Q '+cx+' '+(cy-22)+' '+(cx+6)+' '+(cy-14)+' Q '+(cx+10)+' '+cy+' '+(cx+8)+' '+(cy+18)+'" fill="none" stroke="'+emsk+'" stroke-width="1.5" stroke-dasharray="4 2"/>';
    svg+='<circle cx="'+(cx-3)+'" cy="'+(cy-8)+'" r="2" fill="'+emsk+'"/>';
    svg+='<circle cx="'+(cx+3)+'" cy="'+(cy-8)+'" r="2" fill="'+emsk+'"/>';
  } else {
    // Generic creature emblem — bold unique sigil from name hash
    var nHash=0;for(var ni=0;ni<cid.length;ni++)nHash=((nHash<<5)-nHash)+cid.charCodeAt(ni);
    var arms=4+Math.abs(nHash%4);var sRad=rad*0.45;
    // Outer ring to anchor the sigil
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(sRad+4)+'" fill="none" stroke="'+emskL+'" stroke-width="0.5" stroke-dasharray="2 3"/>';
    for(var ai=0;ai<arms;ai++){
      var aa=ai/arms*Math.PI*2+((nHash%100)/100)*Math.PI;
      var curve=(nHash>>(ai*3))%2===0?1:-1;
      var aLen=sRad*(0.7+((nHash>>(ai*2))%3)*0.15);
      svg+='<path d="M '+cx+' '+cy+' Q '+(cx+Math.cos(aa+curve*0.4)*aLen*0.6)+' '+(cy+Math.sin(aa+curve*0.4)*aLen*0.6)+' '+(cx+Math.cos(aa)*aLen)+' '+(cy+Math.sin(aa)*aLen)+'" fill="none" stroke="'+emsk+'" stroke-width="1.8"/>';
      // Terminating shape — alternate between dots and diamonds
      if(ai%2===0){svg+='<circle cx="'+(cx+Math.cos(aa)*aLen)+'" cy="'+(cy+Math.sin(aa)*aLen)+'" r="3" fill="'+emskL+'" stroke="'+emsk+'" stroke-width="0.5"/>';}
      else{var dx4=cx+Math.cos(aa)*aLen;var dy4=cy+Math.sin(aa)*aLen;svg+='<path d="M '+dx4+' '+(dy4-3.5)+' L '+(dx4+3.5)+' '+dy4+' L '+dx4+' '+(dy4+3.5)+' L '+(dx4-3.5)+' '+dy4+' Z" fill="'+emskL+'" stroke="'+emsk+'" stroke-width="0.4"/>';}
    }
    // Inner ring — bold
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(sRad*0.25)+'" fill="none" stroke="'+emsk+'" stroke-width="1.5"/>';
    svg+='<circle cx="'+cx+'" cy="'+cy+'" r="2" fill="'+emsk+'"/>';
  }

  // Decorative radial lines from circle
  for(var i=0;i<8;i++){
    var a4=i/8*Math.PI*2+rng()*0.3;
    var inner=rad+8;var outer=rad+14+rng()*8;
    svg+='<line x1="'+(cx+Math.cos(a4)*inner)+'" y1="'+(cy+Math.sin(a4)*inner)+'" x2="'+(cx+Math.cos(a4)*outer)+'" y2="'+(cy+Math.sin(a4)*outer)+'" stroke="'+skL+'" stroke-width="0.5"/>';
  }

  // Creature name (engraving style)
  svg+='<text x="'+cx+'" y="'+(cy+rad+30)+'" text-anchor="middle" style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.14em;fill:'+sk+'">'+esc(c.name)+'</text>';

  // Plate number — Roman numerals, display serif
  svg+='<text x="'+cx+'" y="'+(cy+rad+46)+'" text-anchor="middle" style="font-family:var(--font-display);font-size:8px;letter-spacing:0.14em;fill:'+skL+'">Plate '+toRoman(plateNum)+'</text>';

  // Small accent color dot at bottom of frame
  svg+='<circle cx="'+cx+'" cy="'+(my+fh-10)+'" r="3" fill="'+ac+'" opacity="0.5"/>';

  svg+='</svg>';
  return svg;
}

// Also create a simpler cover illustration
function coverPlate(){
  var w=240,h=280,cx=w/2,cy=130;
  var sc=darkMode?'rgba(200,180,160,':'rgba(44,24,16,';
  var sk=sc+'0.7)';var skL=sc+'0.3)';var skF=sc+'0.1)';
  var svg='<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">';
  // Ornate frame
  svg+='<rect x="14" y="10" width="'+(w-28)+'" height="'+(h-20)+'" rx="3" fill="none" stroke="'+sk+'" stroke-width="2"/>';
  svg+='<rect x="20" y="16" width="'+(w-40)+'" height="'+(h-32)+'" rx="2" fill="none" stroke="'+skL+'" stroke-width="0.5"/>';
  // Central all-seeing eye
  svg+='<ellipse cx="'+cx+'" cy="'+cy+'" rx="50" ry="28" fill="none" stroke="'+sk+'" stroke-width="1.5"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="16" fill="none" stroke="'+sk+'" stroke-width="1"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+sk+'"/>';
  // Radiating lines
  for(var i=0;i<24;i++){var a=i/24*Math.PI*2;var r1=55;var r2=75+Math.abs(Math.sin(a*3))*15;svg+='<line x1="'+(cx+Math.cos(a)*r1)+'" y1="'+(cy+Math.sin(a)*r1*0.56)+'" x2="'+(cx+Math.cos(a)*r2)+'" y2="'+(cy+Math.sin(a)*r2*0.56)+'" stroke="'+skL+'" stroke-width="0.5"/>';}
  // Map compass rose at bottom
  var by=cy+90;
  [[0,-1],[1,0],[0,1],[-1,0]].forEach(function(d,i){svg+='<line x1="'+cx+'" y1="'+by+'" x2="'+(cx+d[0]*20)+'" y2="'+(by+d[1]*20)+'" stroke="'+sk+'" stroke-width="'+(i%2===0?1.2:0.6)+'"/>';});
  svg+='<circle cx="'+cx+'" cy="'+by+'" r="3" fill="'+sk+'"/>';
  ['N','E','S','W'].forEach(function(l,i){var dx=[0,24,0,-24][i];var dy=[-28,0,28,0][i];svg+='<text x="'+(cx+dx)+'" y="'+(by+dy)+'" text-anchor="middle" dominant-baseline="middle" style="font-family:var(--font-display);font-size:7px;font-weight:700;fill:'+skL+'">'+l+'</text>';});
  svg+='</svg>';
  return svg;
}

function chapterPlate(r){
  var w=200,h=200,cx=w/2,cy=h/2;
  var sc=darkMode?'rgba(200,180,160,':'rgba(44,24,16,';
  var sk=sc+'0.6)';var skL=sc+'0.25)';
  var ac=r.color.accent;
  var svg='<svg viewBox="0 0 '+w+' '+h+'" xmlns="http://www.w3.org/2000/svg">';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="70" fill="none" stroke="'+sk+'" stroke-width="1"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="66" fill="none" stroke="'+skL+'" stroke-width="0.4"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="76" fill="none" stroke="'+skL+'" stroke-width="0.3" stroke-dasharray="2 4"/>';
  // Region icon placeholder: decorative lines inside
  for(var i=0;i<12;i++){var a=i/12*Math.PI*2;svg+='<line x1="'+(cx+Math.cos(a)*30)+'" y1="'+(cy+Math.sin(a)*30)+'" x2="'+(cx+Math.cos(a)*60)+'" y2="'+(cy+Math.sin(a)*60)+'" stroke="'+skL+'" stroke-width="0.5"/>';}
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="28" fill="none" stroke="'+sk+'" stroke-width="0.8"/>';
  svg+='<circle cx="'+cx+'" cy="'+cy+'" r="6" fill="'+ac+'" opacity="0.35"/>';
  svg+='</svg>';
  return svg;
}

// THEME
function toggleTheme(){
  darkMode=!darkMode;
  document.documentElement.setAttribute('data-theme',darkMode?'dark':'light');
  var btn=$('#theme-toggle');
  if(btn)btn.textContent=darkMode?'Dies':'Nox';
  try{localStorage.setItem('tl-theme',darkMode?'dark':'light')}catch(e){}
  render();
  if(selectedCreature)renderDetail();
}
function initTheme(){
  try{var saved=localStorage.getItem('tl-theme');if(saved==='dark'){darkMode=true;document.documentElement.setAttribute('data-theme','dark')}}catch(e){}
  if(!darkMode&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){darkMode=true;document.documentElement.setAttribute('data-theme','dark')}
  var btn=$('#theme-toggle');
  if(btn)btn.textContent=darkMode?'Dies':'Nox';
}

// SWITCH VIEW
function switchView(v){
  currentView=v;
  $$('.atlas-tab').forEach(function(b){b.classList.toggle('active',b.dataset.view===v)});
  render();
}

var VIEW_HEADS={'risk-matrix':'Plate I · The Risk Matrix','bestiary':'Plate II · EncyclopÆdia','compounds':'Plate III · Compovnd Threats','observatory':'Plate IV · The Observatory','field-guide':'Plate V · The Field Gvide','technical':'Plate VI · Technical Analysis'};

function render(){
  // The chart is the ground truth — always kept current beneath the plates.
  renderMap($('#map-layer'));
  var vc=$('#view-container');
  if(currentView==='map'){vc.innerHTML='';return}
  var tmp=document.createElement('div');
  if(currentView==='risk-matrix')renderRiskMatrix(tmp);
  else if(currentView==='bestiary')renderBestiary(tmp);
  else if(currentView==='compounds')renderCompounds(tmp);
  else if(currentView==='observatory')renderObservatory(tmp);
  else if(currentView==='field-guide')renderGrimoire(tmp);
  else if(currentView==='technical')renderTechnical(tmp);
  var flush=currentView==='field-guide'?' folio-flush':'';
  vc.innerHTML='<div class="plate-scrim" onclick="switchView(\'map\')" title="Return to the chart"></div><div class="plate-folio'+flush+'">'+(flush?'':'<div class="running-head"><span>'+(VIEW_HEADS[currentView]||'')+'</span><span>Natvralis Fvtvra</span></div>')+'<div class="folio-body"></div></div>';
  vc.querySelector('.folio-body').appendChild(tmp);
}

// ── THE CHART — engraved atlas plate ──
var _terrCache=null;

function pointOnRectPerimeter(x,y,w,h,t){
  var per=2*(w+h),d=t*per;
  if(d<w)return{x:x+d,y:y,side:0};
  d-=w;if(d<h)return{x:x+w,y:y+d,side:1};
  d-=h;if(d<w)return{x:x+w-d,y:y+h,side:2};
  d-=w;return{x:x,y:y+h-d,side:3};
}
function outwardNormal(side){return side===0?{x:0,y:-1}:side===1?{x:1,y:0}:side===2?{x:0,y:1}:{x:-1,y:0}}
function catmullRomClosed(pts){
  var n=pts.length,d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
  for(var i=0;i<n;i++){
    var p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
    d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
  }
  return d+'Z';
}
function territoryPath(r,off){
  var x=r.mapPosition.x*1600,y=r.mapPosition.y*1000,w=r.mapPosition.width*1600,h=r.mapPosition.height*1000;
  var rnd=seededRand(hashSeed(r.id));
  var phase=rnd()*6.283,f1=3+Math.floor(rnd()*2),f2=9+Math.floor(rnd()*4);
  var per=2*(w+h),n=Math.max(20,Math.round(per/60));
  var amp=Math.min(13,Math.min(w,h)*0.09);
  var pts=[];
  for(var i=0;i<n;i++){
    var t=i/n,p=pointOnRectPerimeter(x,y,w,h,t),nm=outwardNormal(p.side);
    var a=amp*Math.sin(t*6.283*f1+phase)+amp*0.4*Math.sin(t*6.283*f2+phase*1.7)+(rnd()-0.5)*3+(off||0);
    pts.push([p.x+nm.x*a,p.y+nm.y*a]);
  }
  return catmullRomClosed(pts);
}
function terrCache(){
  if(_terrCache)return _terrCache;
  _terrCache={};
  regions.forEach(function(r){
    _terrCache[r.id]={land:territoryPath(r,0),w1:territoryPath(r,7),w2:territoryPath(r,14),w3:territoryPath(r,21)};
  });
  return _terrCache;
}
function expMasteredRegions(){
  var out={};
  regions.forEach(function(r){
    var cs=gcr(r.id);
    out[r.id]=cs.length>0&&cs.every(function(c){return exp.contained.indexOf(c.id)>=0});
  });
  return out;
}
function compassRoseSVG(){
  var s='<svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="currentColor">';
  s+='<circle cx="50" cy="50" r="46" stroke-width="1"/><circle cx="50" cy="50" r="40" stroke-width=".4"/><circle cx="50" cy="50" r="24" stroke-width=".4"/>';
  for(var i=0;i<16;i++){s+='<line x1="50" y1="6" x2="50" y2="12" stroke-width="'+(i%4===0?1:0.4)+'" transform="rotate('+i*22.5+' 50 50)"/>'}
  s+='<polygon points="50,8 46,50 50,54 54,50" fill="currentColor" stroke="none" opacity=".85"/>';
  s+='<polygon points="50,92 46,50 50,46 54,50" fill="currentColor" stroke="none" opacity=".3"/>';
  s+='<polygon points="8,50 50,46 54,50 50,54" fill="currentColor" stroke="none" opacity=".3"/>';
  s+='<polygon points="92,50 50,46 46,50 50,54" fill="currentColor" stroke="none" opacity=".3"/>';
  s+='<polygon points="50,20 44,50 50,56 56,50" fill="none" stroke-width=".5" transform="rotate(45 50 50)"/><polygon points="50,20 44,50 50,56 56,50" fill="none" stroke-width=".5" transform="rotate(-45 50 50)"/>';
  s+='<text x="50" y="4.5" text-anchor="middle" font-size="7" fill="currentColor" stroke="none">N</text>';
  return s+'</svg>';
}
function serpentSVG(){
  return '<svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 42 C 20 18, 32 18, 42 38 C 50 54, 60 54, 68 40 C 74 30, 82 28, 88 34"/><path d="M88 34 l 7 -7 M88 34 l 9 1" stroke-width="1.3"/><circle cx="89" cy="31" r="1" fill="currentColor" stroke="none"/><path d="M6 42 l -4 6 M6 42 l 6 5" stroke-width="1.1"/><path d="M30 24 c 2 -5 6 -5 8 0 M56 48 c 2 4 6 4 8 0" stroke-width=".8" opacity=".7"/></svg>';
}
function renderMap(el){
  if(!el)return;
  var cache=terrCache();
  var mastered=expMasteredRegions();
  var allMastered=regions.every(function(r){return mastered[r.id]});
  var h='<div id="map-view">';
  h+='<svg id="chart-svg" viewBox="0 0 1600 1000" preserveAspectRatio="none">';
  h+='<defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink)" stroke-width=".5"/></pattern></defs>';
  [[184,385],[1240,140]].forEach(function(nd){
    for(var i=0;i<16;i++){
      var a=i*Math.PI/8;
      h+='<line x1="'+nd[0]+'" y1="'+nd[1]+'" x2="'+(nd[0]+Math.cos(a)*2400).toFixed(0)+'" y2="'+(nd[1]+Math.sin(a)*2400).toFixed(0)+'" stroke="var(--ink)" stroke-width=".5" opacity=".06"/>';
    }
  });
  for(var gx=160;gx<1600;gx+=160)h+='<line x1="'+gx+'" y1="0" x2="'+gx+'" y2="1000" stroke="var(--ink)" stroke-width=".4" opacity=".05"/>';
  for(var gy=125;gy<1000;gy+=125)h+='<line x1="0" y1="'+gy+'" x2="1600" y2="'+gy+'" stroke="var(--ink)" stroke-width=".4" opacity=".05"/>';
  regions.forEach(function(r){
    var t=cache[r.id];
    h+='<g class="terr'+(mastered[r.id]?' terr-gilt':'')+'" onclick="selectRegion(\''+r.id+'\')">';
    h+='<path d="'+t.land+'" fill="var(--land)"/>';
    h+='<path d="'+t.land+'" fill="'+r.color.accent+'" opacity="'+(darkMode?'0.13':'0.08')+'"/>';
    h+='<path d="'+t.land+'" fill="url(#hatch)" opacity=".05"/>';
    h+='<path class="wl3" d="'+t.w3+'" stroke="var(--ink)" stroke-width=".45" opacity=".09" fill="none"/>';
    h+='<path class="wl2" d="'+t.w2+'" stroke="var(--ink)" stroke-width=".7" opacity=".16" fill="none"/>';
    h+='<path class="wl1" d="'+t.w1+'" stroke="var(--ink)" stroke-width="1" opacity=".28" fill="none"/>';
    h+='<path class="terr-coast" d="'+t.land+'"/>';
    var x=r.mapPosition.x*1600,y=r.mapPosition.y*1000,w=r.mapPosition.width*1600,ht=r.mapPosition.height*1000;
    var isStrip=ht<90;
    var ly=isStrip?(y-9):(y+ht*0.24);
    var fs=isStrip?13:Math.min(22,Math.max(14,w/26));
    h+='<path id="lbl-'+r.id+'" d="M '+(x+w*0.02).toFixed(0)+' '+ly.toFixed(0)+' Q '+(x+w*0.5).toFixed(0)+' '+(ly-(isStrip?0:14)).toFixed(0)+' '+(x+w*0.98).toFixed(0)+' '+ly.toFixed(0)+'" fill="none"/>';
    h+='<text class="terr-name" font-size="'+fs+'"><textPath href="#lbl-'+r.id+'" startOffset="50%" text-anchor="middle">'+esc(r.name)+(mastered[r.id]?' ✦':'')+'</textPath></text>';
    if(!isStrip&&r.epigraph){
      var ey=ly+24;
      var epi=r.epigraph.length>92?r.epigraph.slice(0,89)+'…':r.epigraph;
      h+='<path id="epi-'+r.id+'" d="M '+(x+w*0.04).toFixed(0)+' '+ey.toFixed(0)+' Q '+(x+w*0.5).toFixed(0)+' '+(ey-12).toFixed(0)+' '+(x+w*0.96).toFixed(0)+' '+ey.toFixed(0)+'" fill="none"/>';
      h+='<text class="terr-epi" font-size="11.5"><textPath href="#epi-'+r.id+'" startOffset="50%" text-anchor="middle">“'+esc(epi)+'”</textPath></text>';
    }
    h+='</g>';
  });
  h+='</svg>';
  h+='<svg id="compound-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">';
  if(selectedCreature){
    (selectedCreature.compoundRisk||[]).forEach(function(tid){
      var t=gc(tid);
      if(t)h+='<line x1="'+selectedCreature.mapPosition.x*1000+'" y1="'+selectedCreature.mapPosition.y*1000+'" x2="'+t.mapPosition.x*1000+'" y2="'+t.mapPosition.y*1000+'" stroke="var(--vermilion)" stroke-width="1.6" opacity="0.55" stroke-dasharray="7 5"><animate attributeName="stroke-dashoffset" from="0" to="24" dur="1.6s" repeatCount="indefinite"/></line>';
    });
  }
  if(showHope){
    hopeCreatures.forEach(function(h2){
      h2.counters.forEach(function(cid){
        var c=gc(cid);
        if(c)h+='<line x1="'+h2.mapPosition.x*1000+'" y1="'+h2.mapPosition.y*1000+'" x2="'+c.mapPosition.x*1000+'" y2="'+c.mapPosition.y*1000+'" stroke="var(--gilt)" stroke-width="1.2" opacity="0.35" stroke-dasharray="3 6"><animate attributeName="stroke-dashoffset" from="0" to="18" dur="2s" repeatCount="indefinite"/></line>';
      });
    });
  }
  h+='</svg>';
  allCreatures.forEach(function(c){
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    var scale=0.82+(score/15)*0.36;
    var cls='cn';
    if(selectedCreature&&selectedCreature.id===c.id)cls+=' sel';
    if(selectedCreature&&selectedCreature.compoundRisk&&selectedCreature.compoundRisk.indexOf(c.id)>=0)cls+=' conn';
    if(c.currentStatus.status==='confirmed')cls+=' stat-confirmed';
    if(exp.recorded.indexOf(c.id)>=0)cls+=' rec';
    if(exp.contained.indexOf(c.id)>=0)cls+=' cont';
    h+='<div class="'+cls+'" onclick="selectCreature(\''+c.id+'\')" style="left:'+c.mapPosition.x*100+'%;top:'+c.mapPosition.y*100+'%;transform:translate(-50%,-50%) scale('+scale+')" title="'+esc(c.name)+' — '+score+'/15"><span class="ring"><span class="ci">'+c.icon+'</span><span class="pip"></span></span><span class="cl">'+esc(c.name.replace('THE ',''))+'</span></div>';
  });
  if(showHope){
    hopeCreatures.forEach(function(h2){
      var countered=h2.counters.map(gc).filter(Boolean);
      var counterNames=countered.map(function(c){return c.name.replace('THE ','')}).join(', ');
      h+='<div class="hn" onclick="selectHope(\''+h2.id+'\')" style="left:'+h2.mapPosition.x*100+'%;top:'+h2.mapPosition.y*100+'%;transform:translate(-50%,-50%)" title="'+esc(h2.name)+' — counters '+esc(counterNames)+'"><span class="ring"><span class="ci">'+h2.icon+'</span></span><span class="cl">'+esc(h2.name.replace('THE ',''))+'</span></div>';
    });
  }
  {
    var sug=null,sugVerb='';
    for(var si=0;si<allCreatures.length;si++){var sc=allCreatures[si];if(exp.recorded.indexOf(sc.id)>=0&&exp.contained.indexOf(sc.id)<0){sug=sc;sugVerb='Face';break}}
    if(!sug){for(var sj=0;sj<allCreatures.length;sj++){if(exp.recorded.indexOf(allCreatures[sj].id)<0){sug=allCreatures[sj];sugVerb='Seek';break}}}
    if(sug)h+='<button id="chart-suggest" onclick="selectCreature(\''+sug.id+'\')"><span class="sug-kicker">The Ledger Suggests</span><span class="sug-act">'+sugVerb+' '+esc(sug.name.replace('THE ','the '))+' ⟶</span></button>';
  }
  h+='<div id="chart-neatline"></div>';
  h+='<div class="chart-ornament" style="left:24px;bottom:30px;width:104px;height:104px">'+compassRoseSVG()+'</div>';
  h+='<div class="chart-ornament" style="right:30px;top:22px;width:96px;height:58px;opacity:.28">'+serpentSVG()+'</div>';
  h+='<div class="chart-cartouche"><div class="cart-title">TABVLA MVNDI LATENTIS</div><div class="cart-sub">'+allCreatures.length+' BELLVAE · VIII REGIONES</div><div class="cart-sub">HIC SVNT DRACONES</div></div>';
  if(!mapRevealed){
    h+='<div id="fog-overlay" onclick="revealMap()">';
    h+='<div class="fronti-frame"></div>';
    h+='<div class="fronti-serpent" style="left:34px;top:30px">'+serpentSVG()+'</div>';
    h+='<div class="fronti-serpent" style="right:34px;top:30px;transform:scaleX(-1)">'+serpentSVG()+'</div>';
    h+='<div class="fronti-serpent" style="left:34px;bottom:30px;transform:scaleY(-1)">'+serpentSVG()+'</div>';
    h+='<div class="fronti-serpent" style="right:34px;bottom:30px;transform:scale(-1)">'+serpentSVG()+'</div>';
    h+='<div class="fronti-inner">';
    h+='<div class="fronti-fleurons">❧ ✦ ☙</div>';
    h+='<h1 class="fronti-title'+(allMastered?' gilded':'')+'">NATURALIS FUTURA</h1>';
    h+='<div class="fronti-rule"></div>';
    h+='<div class="fronti-sive">Sive · Tabvla Latentivm</div>';
    h+='<div class="fronti-sub">An Encyclopaedia of the Latent World</div>';
    h+='<div class="fronti-device">'+compassRoseSVG()+'</div>';
    h+='<div class="fronti-imprint">Ex Officina Plinii · Anno MMXXVI</div>';
    h+='<div><button class="fronti-enter" onclick="revealMap()">Enter the Latent World</button></div>';
    h+='</div></div>';
  }
  h+='</div>';
  el.innerHTML=h;
}

// ── RISK MATRIX ──
function renderRiskMatrix(el){
  var filtered=statusFilter==='all'?allCreatures:allCreatures.filter(function(c){return c.currentStatus.status===statusFilter});
  var h='<div id="risk-matrix-view"><h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:0.1em;margin-bottom:4px">RISK MATRIX</h2><p style="font-size:11px;color:var(--ink-light);margin-bottom:16px">Likelihood vs Impact. Dot size = stealth rating.</p>';
  h+='<div class="fb">';
  ['all','confirmed','emerging','theoretical'].forEach(function(f){
    h+='<button class="fbtn '+(statusFilter===f?'active':'')+'" onclick="statusFilter=\''+f+'\';render()">'+(f==='all'?'All':f[0].toUpperCase()+f.slice(1))+'</button>';
  });
  h+='</div>';
  h+='<div id="risk-scatter">';
  h+='<span style="position:absolute;left:-4px;top:50%;transform:rotate(-90deg) translateX(-50%);transform-origin:0 0;font-size:10px;color:var(--ink-light);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">IMPACT \u2192</span>';
  h+='<span style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--ink-light);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">LIKELIHOOD \u2192</span>';
  for(var i=1;i<=5;i++){
    var pct=(i-0.5)/5*100;
    h+='<div style="position:absolute;left:'+pct+'%;top:0;bottom:0;width:1px;background:var(--grid-line)"></div>';
    h+='<div style="position:absolute;top:'+(100-pct)+'%;left:0;right:0;height:1px;background:var(--grid-line)"></div>';
  }
  filtered.forEach(function(c){
    var x=(c.threatGradient.likelihood-0.5)/5*100;
    var y=100-(c.threatGradient.impact-0.5)/5*100;
    var sz=8+c.threatGradient.detectability*4;
    var r=gr(c.region);
    var op=c.currentStatus.status==='confirmed'?0.9:c.currentStatus.status==='emerging'?0.6:0.3;
    h+='<div class="sd" onclick="selectCreature(\''+c.id+'\')" title="'+esc(c.name)+'" style="left:'+x+'%;top:'+y+'%;width:'+sz+'px;height:'+sz+'px;background:'+(r?r.color.accent:'#666')+';transform:translate(-50%,-50%);opacity:'+op+'"></div>';
  });
  h+='</div>';
  var sorted=filtered.slice().sort(function(a,b){
    return (b.threatGradient.likelihood+b.threatGradient.impact+b.threatGradient.detectability)-(a.threatGradient.likelihood+a.threatGradient.impact+a.threatGradient.detectability);
  });
  h+='<div style="overflow-x:auto"><table class="rt"><thead><tr><th></th><th>Name</th><th>Region</th><th>L</th><th>I</th><th>S</th><th>Score</th><th>Status</th></tr></thead><tbody>';
  sorted.forEach(function(c){
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    h+='<tr onclick="selectCreature(\''+c.id+'\')"><td>'+c.icon+'</td><td style="font-weight:600">'+esc(c.name)+'</td><td style="font-size:10px;color:var(--ink-light)">'+esc(c.region.replace(/-/g,' '))+'</td><td>'+c.threatGradient.likelihood+'</td><td>'+c.threatGradient.impact+'</td><td>'+c.threatGradient.detectability+'</td><td style="font-weight:700;font-family:var(--font-mono)">'+score+'/15</td><td><span class="sb '+c.currentStatus.status+'">'+c.currentStatus.status+'</span></td></tr>';
  });
  h+='</tbody></table></div></div>';
  el.innerHTML=h;
}

// ── BESTIARY ──
function renderBestiary(el){
  var h='<div style="padding:16px"><h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:0.1em;margin-bottom:4px">BESTIARY</h2><p style="font-size:11px;color:var(--ink-light);margin-bottom:16px">All '+allCreatures.length+' creatures catalogued. Click to reveal.</p>';
  h+='<div class="fb">';
  ['all','confirmed','emerging','theoretical'].forEach(function(f){
    h+='<button class="fbtn '+(statusFilter===f?'active':'')+'" onclick="statusFilter=\''+f+'\';render()">'+(f==='all'?'All':f[0].toUpperCase()+f.slice(1))+'</button>';
  });
  h+='</div>';
  h+='<div class="fb" style="margin-bottom:8px">';
  h+='<button class="fbtn '+(selectedRegion===null?'active':'')+'" onclick="selectedRegion=null;render()">All Regions</button>';
  regions.forEach(function(r){
    h+='<button class="fbtn '+(selectedRegion===r.id?'active':'')+'" onclick="selectedRegion=\''+r.id+'\';render()" style="'+(selectedRegion===r.id?'background:'+r.color.accent+';color:#fff':'')+'">'+esc(r.name.replace('THE ',''))+'</button>';
  });
  h+='</div>';
  h+='<div class="bg">';
  var filtered=allCreatures;
  if(selectedRegion)filtered=filtered.filter(function(c){return c.region===selectedRegion});
  if(statusFilter!=='all')filtered=filtered.filter(function(c){return c.currentStatus.status===statusFilter});
  filtered.forEach(function(c){
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    var r=gr(c.region);
    var plateNum=toRoman(allCreatures.indexOf(c)+1);
    h+='<div class="bc" data-plate="PLATE '+plateNum+'" onclick="selectCreature(\''+c.id+'\')" style="border-left:3px solid '+(r?r.color.accent:'#ccc')+'"><div style="display:flex;align-items:center;gap:12px"><span class="ring"><span style="font-size:20px;line-height:1">'+c.icon+'</span></span><div style="flex:1"><div style="font-size:13px;font-weight:700;letter-spacing:0.05em;font-family:var(--font-display)">'+esc(c.name)+'</div><div style="font-size:10px;color:var(--ink-light);margin-top:2px">'+esc(r?r.name:c.region)+' \u00B7 <span class="sb '+c.currentStatus.status+'" style="font-size:9px;padding:1px 6px">'+c.currentStatus.status+'</span></div></div><div style="text-align:center;margin-left:auto"><div style="font-size:18px;font-weight:700;font-family:var(--font-mono)">'+score+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light)">/15</div></div></div></div>';
  });
  h+='</div></div>';
  el.innerHTML=h;
}

// ── COMPOUNDS ──
function renderCompounds(el){
  var h='<div style="padding:16px"><h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:0.1em;margin-bottom:4px">COMPOUND THREATS</h2><p style="font-size:11px;color:var(--ink-light);margin-bottom:16px">When creatures combine, they amplify.</p>';
  compoundThreats.forEach(function(ct){
    h+='<div class="cc parchment-card"><h3 style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.08em;margin-bottom:8px">'+esc(ct.name)+'</h3><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
    ct.creatures.forEach(function(cid){var c=gc(cid);if(c)h+='<span class="cp" onclick="selectCreature(\''+c.id+'\')">'+c.icon+' '+esc(c.name.replace('THE ',''))+'</span>'});
    h+='</div><p style="font-size:12px;line-height:1.6;margin-bottom:8px">'+esc(ct.scenario)+'</p>';
    if(ct.naturalAnalogue)h+='<p style="font-size:11px;color:var(--ink-light);line-height:1.5"><strong>Natural analogue:</strong> '+esc(ct.naturalAnalogue)+'</p>';
    if(ct.riskAmplification)h+='<p style="font-size:11px;color:var(--ink-light);line-height:1.5;margin-top:4px"><strong>Amplification:</strong> '+esc(ct.riskAmplification)+'</p>';
    h+='</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

// ── OBSERVATORY ──
function renderObservatory(el){
  var confirmed=allCreatures.filter(function(c){return c.currentStatus.status==='confirmed'}).length;
  var emerging=allCreatures.filter(function(c){return c.currentStatus.status==='emerging'}).length;
  var theoretical=allCreatures.filter(function(c){return c.currentStatus.status==='theoretical'}).length;
  var newSig=threatSignals.filter(function(s){return s.isNew}).length;
  var crit=threatSignals.filter(function(s){return s.strength>=4}).length;
  var level=crit>=5?'critical':crit>=3?'elevated':'stable';
  var lc=level==='critical'?'var(--status-confirmed-text)':level==='elevated'?'var(--status-emerging-text)':'var(--verify-confirmed-text)';
  var lb=level==='critical'?'var(--status-confirmed-bg)':level==='elevated'?'var(--status-emerging-bg)':'var(--verify-confirmed-bg)';
  var li=level==='critical'?'\u{1F53A}':level==='elevated'?'\u{1F536}':'\u{1F7E2}';

  var h='<div style="padding:16px;max-width:1100px;margin:0 auto">';
  h+='<h2 style="font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:0.1em;margin-bottom:4px">LIVE THREAT OBSERVATORY</h2>';
  h+='<p style="font-size:12px;color:var(--ink-light);margin-bottom:16px">The encyclopaedia breathes. Signals flow in \u2014 creatures evolve from theoretical to confirmed.</p>';

  h+='<div class="sg">';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700">\u{1F5FA}\uFE0F '+allCreatures.length+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Creatures</div></div>';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700;color:var(--status-confirmed-text)">\u{1F534} '+confirmed+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Confirmed</div></div>';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700;color:var(--status-emerging-text)">\u{1F7E1} '+emerging+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Emerging</div></div>';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700;color:var(--status-theoretical-text)">\u26AA '+theoretical+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Theoretical</div></div>';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700;color:var(--verify-plaus-text)">\u{1F195} '+newSig+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">New Signals</div></div>';
  h+='<div class="sc"><div style="font-size:18px;font-weight:700;color:var(--status-confirmed-text)">\u26A1 '+crit+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Critical</div></div>';
  h+='<div class="sc" style="border-color:'+lc+';background:'+lb+'"><div style="font-size:12px;font-weight:700;color:'+lc+'">'+li+' '+level[0].toUpperCase()+level.slice(1)+'</div><div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-top:2px">Threat Level</div></div>';
  h+='</div>';

  h+='<div class="ot">';
  var tabs={radar:'\u{1F4E1} Radar','live-scan':'\u{1F534} Live Scan',signals:'\u{1F4F6} Signals',timeline:'\u{1F4DC} Timeline',sources:'\u{1F52D} Sources',submit:'\u270F\uFE0F Submit'};
  for(var t in tabs){h+='<button class="ob '+(obsTab===t?'active':'')+'" onclick="obsTab=\''+t+'\';render()">'+tabs[t]+'</button>'}
  h+='</div>';

  if(obsTab==='radar')h+=renderRadar();
  else if(obsTab==='live-scan')h+=renderLiveScan();
  else if(obsTab==='signals')h+=renderSignalsFull();
  else if(obsTab==='timeline')h+=renderTimeline();
  else if(obsTab==='sources')h+=renderSources();
  else if(obsTab==='submit')h+=renderSubmit();
  h+='</div>';
  el.innerHTML=h;
}

function renderRadar(){
  var sz=460,cx=sz/2,maxR=sz/2-36;
  var angles=regions.map(function(_,i){return(i/regions.length)*Math.PI*2-Math.PI/2});
  var rSig={};
  threatSignals.forEach(function(s){s.relatedRegions.forEach(function(r){rSig[r]=(rSig[r]||0)+1})});
  var strokeCol=darkMode?'rgba(200,180,160,0.12)':'rgba(44,24,16,0.1)';
  var strokeLight=darkMode?'rgba(200,180,160,0.06)':'rgba(44,24,16,0.06)';
  var sweepCol=darkMode?'rgba(134,239,172,0.4)':'rgba(6,95,70,0.3)';
  var labelCol=darkMode?'rgba(200,180,160,0.6)':'rgba(44,24,16,0.5)';
  var nodeStroke=darkMode?'rgba(18,18,30,0.6)':'rgba(245,240,225,0.6)';
  var h='<div style="display:flex;flex-wrap:wrap;gap:16px"><div style="flex:2;min-width:300px"><div class="parchment-card" style="padding:16px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em;margin-bottom:12px">THREAT RADAR</h3>';
  h+='<svg viewBox="0 0 '+sz+' '+sz+'" style="width:100%;max-width:460px;display:block;margin:0 auto">';
  [.2,.4,.6,.8,1].forEach(function(r){h+='<circle cx="'+cx+'" cy="'+cx+'" r="'+maxR*r+'" fill="none" stroke="'+strokeCol+'" stroke-width="'+(r===1?1.5:0.5)+'"'+(r<1?' stroke-dasharray="4 4"':'')+'/>'});
  h+='<line x1="'+cx+'" y1="'+cx+'" x2="'+cx+'" y2="'+(cx-maxR)+'" stroke="'+sweepCol+'" stroke-width="2" class="radar-sweep" style="transform-origin:'+cx+'px '+cx+'px"/>';
  angles.forEach(function(a){
    h+='<line x1="'+cx+'" y1="'+cx+'" x2="'+(cx+Math.cos(a)*maxR)+'" y2="'+(cx+Math.sin(a)*maxR)+'" stroke="'+strokeLight+'" stroke-width="0.5"/>';
  });
  angles.forEach(function(a,i){
    var r=regions[i],na=angles[(i+1)%regions.length];
    var intensity=Math.min((rSig[r.id]||0)/8,1);
    var sr=maxR*(0.3+intensity*0.7);
    var x1=cx+Math.cos(a)*sr,y1=cx+Math.sin(a)*sr;
    var x2=cx+Math.cos(na)*sr,y2=cx+Math.sin(na)*sr;
    h+='<path d="M '+cx+' '+cx+' L '+x1+' '+y1+' A '+sr+' '+sr+' 0 0 1 '+x2+' '+y2+' Z" fill="'+r.color.accent+'" opacity="'+(darkMode?0.12+intensity*0.2:0.08+intensity*0.15)+'"'+((rSig[r.id]||0)>=4?' class="radar-pulse"':'')+'/>';
  });
  allCreatures.forEach(function(c){
    var ri=-1;for(var i=0;i<regions.length;i++){if(regions[i].id===c.region){ri=i;break}}
    if(ri===-1)return;
    var a=angles[ri],na=angles[(ri+1)%regions.length];
    var midA=a+(na-a)/2+((c.mapPosition.x+c.mapPosition.y)%1-0.5)*0.3;
    var thr=(c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability)/15;
    var dist=maxR*(0.2+thr*0.7);
    var bx=cx+Math.cos(midA)*dist,by=cx+Math.sin(midA)*dist;
    var cSig=threatSignals.filter(function(s){return s.relatedCreatures.indexOf(c.id)>=0}).length;
    var bSz=4+cSig*2;
    var r=regions[ri];
    var op=c.currentStatus.status==='confirmed'?0.9:c.currentStatus.status==='emerging'?0.6:0.3;
    if(cSig>0)h+='<circle cx="'+bx+'" cy="'+by+'" r="'+(bSz+6)+'" fill="'+r.color.accent+'" opacity="'+(0.1+cSig*0.04)+'"'+(cSig>=3?' class="radar-pulse"':'')+'/>';
    h+='<circle cx="'+bx+'" cy="'+by+'" r="'+bSz+'" fill="'+r.color.accent+'" opacity="'+op+'" stroke="'+nodeStroke+'" stroke-width="1" style="cursor:pointer" onclick="selectCreature(\''+c.id+'\')"><title>'+esc(c.name)+' \u2014 '+cSig+' signals</title></circle>';
  });
  angles.forEach(function(a,i){
    var r=regions[i],na=angles[(i+1)%regions.length];
    var mid=a+(na-a)/2,lr=maxR+18;
    h+='<text x="'+(cx+Math.cos(mid)*lr)+'" y="'+(cx+Math.sin(mid)*lr)+'" text-anchor="middle" dominant-baseline="middle" style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em" fill="'+labelCol+'">'+r.name.replace('THE ','').slice(0,10)+'</text>';
  });
  h+='<text x="'+cx+'" y="'+cx+'" text-anchor="middle" dominant-baseline="middle" style="font-size:16px">\u{1F441}\uFE0F</text>';
  h+='</svg></div></div>';
  h+='<div style="flex:1;min-width:280px"><div class="parchment-card" style="padding:16px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em;margin-bottom:8px">LATEST SIGNALS</h3>';
  h+=renderSignalCards(threatSignals.slice(0,8));
  h+='</div></div></div>';
  return h;
}

function renderSignalsFull(){
  var h='<div class="parchment-card" style="padding:16px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em;margin-bottom:8px">SIGNAL FEED</h3>';
  h+=renderSignalCards(threatSignals);
  h+='</div>';
  return h;
}

function renderSignalCards(signals){
  var h='<div class="fb">';
  ['all','lab-report','arxiv','conference','government','incident','social'].forEach(function(s){
    h+='<button class="fbtn '+(sourceFilter===s?'active':'')+'" onclick="sourceFilter=\''+s+'\';render()">'+(s==='all'?'All':(SI[s]||'')+' '+s.replace(/-/g,' '))+'</button>';
  });
  h+='</div>';
  var filtered=sourceFilter==='all'?signals:signals.filter(function(s){return s.source===sourceFilter});
  var sorted=filtered.slice().sort(function(a,b){if(a.isNew&&!b.isNew)return -1;if(!a.isNew&&b.isNew)return 1;return new Date(b.date)-new Date(a.date)});
  h+='<p style="font-size:11px;color:var(--ink-light);margin-bottom:8px">'+sorted.length+' signal'+(sorted.length!==1?'s':'')+'</p>';
  h+='<div style="max-height:500px;overflow-y:auto">';
  sorted.forEach(function(s){
    var exp=expandedSignal===s.id;
    h+='<div class="sigc'+(s.isNew?' ns':'')+'" onclick="expandedSignal=expandedSignal===\''+s.id+'\'?null:\''+s.id+'\';render()">';
    h+='<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:13px;flex-shrink:0">'+(SI[s.source]||'\u{1F4CC}')+'</span><div style="flex:1;min-width:0">';
    h+='<div style="font-size:12px;font-weight:700;line-height:1.4">'+(s.isNew?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;margin-right:4px;vertical-align:middle;animation:signal-blink 1.5s infinite"></span>':'')+esc(s.title)+'</div>';
    h+='<div style="font-size:10px;color:var(--ink-light);margin-top:4px;display:flex;flex-wrap:wrap;gap:8px;align-items:center"><span>'+esc(s.sourceLabel)+'</span><span>'+fmt(s.date)+'</span><span class="vb '+s.verification+'">'+s.verification+'</span></div>';
    if(exp){
      h+='<div style="padding-top:10px;margin-top:8px;border-top:1px solid var(--grid-line);font-size:12px;line-height:1.6"><p>'+esc(s.summary)+'</p>';
      if(s.relatedCreatures&&s.relatedCreatures.length){
        h+='<div style="margin-top:8px"><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light)">Creatures affected</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">';
        s.relatedCreatures.forEach(function(cid){var c=gc(cid);if(c)h+='<span class="cp" onclick="event.stopPropagation();selectCreature(\''+c.id+'\')">'+c.icon+' '+esc(c.name.replace('THE ',''))+'</span>'});
        h+='</div></div>';
      }
      if(s.tags&&s.tags.length){h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">';s.tags.forEach(function(t){h+='<span class="tag">#'+esc(t)+'</span>'});h+='</div>'}
      if(s.sourceUrl)h+='<a href="'+esc(s.sourceUrl)+'" target="_blank" rel="noopener" style="font-size:10px;margin-top:6px;display:inline-block">View source \u2197</a>';
      h+='</div>';
    }
    h+='</div>';
    h+='<div class="stb" style="flex-shrink:0">';
    for(var i=0;i<5;i++){var col=i<s.strength?(s.strength>=4?'#ef4444':s.strength>=3?'#f59e0b':'#16a34a'):'var(--threat-bar-bg)';h+='<div style="background:'+col+'"></div>'}
    h+='</div></div></div>';
  });
  h+='</div>';
  return h;
}

function renderTimeline(){
  var h='<div class="parchment-card" style="padding:16px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">EVOLUTION TIMELINE</h3><p style="font-size:10px;color:var(--ink-light);margin-bottom:16px">How creatures change status as evidence emerges.</p><div class="et"><div class="el"></div>';
  var sorted=evolutionEvents.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)});
  sorted.forEach(function(e){
    var c=gc(e.creatureId);if(!c)return;
    var r=gr(c.region);
    h+='<div class="ee"><div class="ed" style="background:'+(r?r.color.accent:'#666')+'"></div><div class="ec"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap"><span style="font-size:10px;font-family:var(--font-mono);color:var(--ink-light)">'+fmt(e.date)+'</span>';
    if(e.fromStatus)h+='<span class="sb '+e.fromStatus+'" style="font-size:9px;padding:1px 6px">'+e.fromStatus+'</span><span style="font-size:10px;color:var(--ink-light)">\u2192</span>';
    h+='<span class="sb '+e.toStatus+'" style="font-size:9px;padding:1px 6px">'+e.toStatus+'</span></div>';
    h+='<div style="cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:4px" onclick="selectCreature(\''+c.id+'\')"><span style="font-size:16px">'+c.icon+'</span><span style="font-size:12px;font-weight:700">'+esc(c.name)+'</span></div>';
    h+='<p style="font-size:11px;line-height:1.5">'+esc(e.trigger)+'</p></div></div>';
  });
  h+='</div></div>';
  return h;
}

function renderSources(){
  var h='<div class="parchment-card" style="padding:16px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em;margin-bottom:4px">WATCH SOURCES</h3><p style="font-size:10px;color:var(--ink-light);margin-bottom:16px">The observatory\'s telescopes \u2014 monitors scanning the research landscape.</p><div class="srg">';
  watchSources.forEach(function(s){
    h+='<div class="src'+(s.active?' on':'')+'"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">'+s.icon+'</span><span style="font-size:12px;font-weight:700">'+esc(s.name)+'</span></div><div style="width:8px;height:8px;border-radius:50%;background:'+(s.active?'#22c55e':'var(--threat-bar-bg)')+'"></div></div><p style="font-size:10px;color:var(--ink-light);line-height:1.5;margin-bottom:8px">'+esc(s.description)+'</p><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink-light)"><span>'+s.signalCount+' signals</span>'+(s.lastScanned?'<span>Last: '+fmt(s.lastScanned)+'</span>':'')+'</div>'+(s.url?'<a href="'+esc(s.url)+'" target="_blank" rel="noopener" style="font-size:10px;margin-top:6px;display:inline-block">Visit \u2197</a>':'')+'</div>';
  });
  h+='</div></div>';
  return h;
}

function renderLiveScan(){
  var h='<div class="parchment-card" style="padding:16px">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em">LIVE THREAT SCANNER</h3>';
  h+='<button onclick="toggleScanSettings()" style="padding:4px 10px;border-radius:6px;font-size:10px;border:1px solid var(--border);background:var(--parchment-card-bg);color:var(--ink-light);cursor:pointer">\u2699\uFE0F Settings</button></div>';
  h+='<p style="font-size:10px;color:var(--ink-light);margin-bottom:16px">Search the live web for recent AI safety incidents, jailbreaks, and adversarial research \u2014 then map findings to the encyclopaedia.</p>';

  // Settings panel (hidden by default)
  h+='<div id="scan-settings" style="display:none;margin-bottom:16px;padding:14px;border-radius:10px;border:1px solid var(--border);background:var(--submit-form-bg)">';
  h+='<div class="ff"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-light)">OpenRouter API Key</label>';
  h+='<input type="password" id="or-key" value="'+esc(openRouterKey)+'" placeholder="sk-or-v1-..." style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--input-border);background:var(--parchment);color:var(--ink);font-size:12px;font-family:var(--font-mono);margin-top:4px" onchange="saveOrKey(this.value)"></div>';
  h+='<p style="font-size:9px;color:var(--ink-light);margin-top:4px">Uses Perplexity Sonar via <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener">OpenRouter</a> for web-grounded search. Key is stored locally in your browser.</p>';
  h+='<div class="ff" style="margin-top:10px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-light)">Search Model</label>';
  h+='<select id="scan-model" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--input-border);background:var(--parchment);color:var(--ink);font-size:12px;margin-top:4px">';
  h+='<option value="perplexity/sonar">Perplexity Sonar (fast, affordable)</option>';
  h+='<option value="perplexity/sonar-pro">Perplexity Sonar Pro (deeper search)</option>';
  h+='<option value="perplexity/sonar-reasoning">Perplexity Sonar Reasoning (chain-of-thought)</option>';
  h+='</select></div>';
  h+='</div>';

  // Scan controls
  if(!openRouterKey){
    h+='<div style="text-align:center;padding:32px 16px;border:2px dashed var(--border);border-radius:12px;margin-bottom:16px"><p style="font-size:12px;color:var(--ink-light);margin-bottom:8px">Enter your OpenRouter API key in Settings to begin scanning.</p>';
    h+='<button onclick="toggleScanSettings()" style="padding:8px 20px;border-radius:8px;background:var(--ink);color:var(--parchment);font-size:12px;font-weight:600;cursor:pointer">\u2699\uFE0F Configure API Key</button></div>';
  } else {
    // Scan topic selector
    h+='<div style="margin-bottom:12px"><label style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-light);display:block;margin-bottom:6px">Scan Topic</label>';
    h+='<select id="scan-topic" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid var(--input-border);background:var(--parchment);color:var(--ink);font-size:12px">';
    h+='<option value="general">All threats \u2014 recent AI safety incidents & jailbreaks</option>';
    h+='<option value="jailbreaks">Jailbreaks \u2014 new bypass techniques & prompt injections</option>';
    h+='<option value="agents">Autonomous agents \u2014 agentic AI risks & tool-use exploits</option>';
    h+='<option value="policy">Policy & governance \u2014 regulatory changes & institutional moves</option>';
    h+='<option value="multimodal">Multimodal \u2014 voice, image, video attack vectors</option>';
    h+='<option value="training">Training data \u2014 poisoning, contamination, data pipeline risks</option>';
    h+='</select></div>';

    h+='<button onclick="runLiveScan()" '+(liveScanStatus==='scanning'?'disabled':'')+'style="padding:10px 24px;border-radius:8px;background:'+(liveScanStatus==='scanning'?'var(--ink-light)':'var(--ink)')+';color:var(--parchment);font-size:13px;font-weight:700;cursor:'+(liveScanStatus==='scanning'?'wait':'pointer')+';width:100%;letter-spacing:0.04em;margin-bottom:16px">'+(liveScanStatus==='scanning'?'\u{1F50E} Scanning the web...':'\u{1F50D} Scan for Live Threats')+'</button>';
  }

  if(liveScanStatus==='error'){
    h+='<div style="padding:12px;border-radius:8px;background:var(--status-confirmed-bg);color:var(--status-confirmed-text);font-size:12px;margin-bottom:16px">\u26A0\uFE0F '+esc(liveScanError)+'</div>';
  }

  // Results
  if(liveScanResults.length){
    h+='<div style="margin-top:8px"><h4 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-bottom:10px">SCAN RESULTS \u2014 '+liveScanResults.length+' findings</h4>';
    liveScanResults.forEach(function(r,idx){
      h+='<div class="sigc" style="margin-bottom:8px">';
      h+='<div style="display:flex;gap:8px;align-items:flex-start"><span style="font-size:16px;flex-shrink:0">'+(r.icon||'\u{1F4CC}')+'</span><div style="flex:1;min-width:0">';
      h+='<div style="font-size:12px;font-weight:700;line-height:1.4">'+esc(r.title)+'</div>';
      if(r.date)h+='<div style="font-size:10px;color:var(--ink-light);margin-top:2px">'+esc(r.date)+'</div>';
      h+='<p style="font-size:11px;line-height:1.6;margin-top:6px;color:var(--ink)">'+esc(r.summary)+'</p>';
      if(r.creatures&&r.creatures.length){
        h+='<div style="margin-top:6px"><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light)">Related creatures</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">';
        r.creatures.forEach(function(cid){
          var c=gc(cid);
          if(c)h+='<span class="cp" onclick="selectCreature(\''+c.id+'\')">'+c.icon+' '+esc(c.name.replace('THE ',''))+'</span>';
          else h+='<span class="cp" style="opacity:0.5">? '+esc(cid)+'</span>';
        });
        h+='</div></div>';
      }
      if(r.threatLevel){
        h+='<div style="margin-top:6px;display:flex;align-items:center;gap:6px"><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light)">Severity</span><div class="stb">';
        for(var i=0;i<5;i++){var col=i<r.threatLevel?(r.threatLevel>=4?'#ef4444':r.threatLevel>=3?'#f59e0b':'#16a34a'):'var(--threat-bar-bg)';h+='<div style="background:'+col+'"></div>'}
        h+='</div></div>';
      }
      if(r.sources&&r.sources.length){
        h+='<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">';
        r.sources.forEach(function(s){h+='<a href="'+esc(s.url)+'" target="_blank" rel="noopener" style="font-size:9px;padding:2px 8px;border-radius:99px;background:var(--hover-bg);text-decoration:none;color:var(--ink-light)">'+esc(s.title||s.url)+' \u2197</a>'});
        h+='</div>';
      }
      h+='</div></div></div>';
    });
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function toggleScanSettings(){
  var el=document.getElementById('scan-settings');
  if(el)el.style.display=el.style.display==='none'?'block':'none';
}
function saveOrKey(v){openRouterKey=v;localStorage.setItem('tabula_or_key',v);render()}

function getScanPrompt(topic){
  var creatureList=allCreatures.map(function(c){return c.id+' ('+c.name+')'}).join(', ');
  var base='You are the NATURALIS FUTURA threat observatory \u2014 a system that maps AI safety incidents to an encyclopaedia of threat archetypes.\n\nThe encyclopaedia contains these creatures:'+creatureList+'.\n\n';
  var topics={
    general:'Search for the most significant AI safety incidents, jailbreaks, adversarial attacks, alignment failures, and AI governance developments from the past 30 days.',
    jailbreaks:'Search for new AI jailbreak techniques, prompt injection methods, safety bypass discoveries, and adversarial attack methodologies from the past 30 days.',
    agents:'Search for incidents involving autonomous AI agents, tool-use exploits, agentic AI failures, agent-to-agent attacks, and autonomous capability concerns from the past 30 days.',
    policy:'Search for AI safety policy changes, regulatory developments, AI governance institution changes, safety funding decisions, and AI regulation enforcement actions from the past 30 days.',
    multimodal:'Search for multimodal AI attack vectors, voice AI exploits, adversarial images, audio jailbreaks, and cross-modal AI safety issues from the past 30 days.',
    training:'Search for AI training data poisoning incidents, data contamination discoveries, model weight manipulation, and training pipeline security issues from the past 30 days.'
  };
  base+=topics[topic]||topics.general;
  base+='\n\nFor each finding, respond with a JSON array of objects. Each object must have:\n- "title": short headline (string)\n- "summary": 2-3 sentence description (string)\n- "date": approximate date or "recent" (string)\n- "creatures": array of creature IDs from the encyclopaedia that this finding relates to (use the exact IDs listed above, pick the 1-3 most relevant)\n- "threatLevel": severity 1-5 (number)\n- "icon": single emoji representing the finding (string)\n- "sources": array of objects with "title" and "url" keys for source citations\n\nRespond ONLY with the JSON array, no other text. Find 5-8 distinct recent findings.';
  return base;
}

function runLiveScan(){
  if(liveScanStatus==='scanning')return;
  if(!openRouterKey){liveScanError='No API key configured';liveScanStatus='error';render();return}
  liveScanStatus='scanning';liveScanError='';render();
  var topic=(document.getElementById('scan-topic')||{}).value||'general';
  var model=(document.getElementById('scan-model')||{}).value||'perplexity/sonar';
  fetch('https://openrouter.ai/api/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+openRouterKey,'HTTP-Referer':'https://tabula-latentium.org','X-Title':'NATURALIS FUTURA Threat Scanner'},
    body:JSON.stringify({model:model,messages:[{role:'user',content:getScanPrompt(topic)}],temperature:0.3})
  }).then(function(r){
    if(!r.ok)return r.json().then(function(e){throw new Error(e.error&&e.error.message||'API error '+r.status)});
    return r.json();
  }).then(function(data){
    var content=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content||'';
    // Extract JSON from response (handle markdown code blocks)
    var jsonStr=content.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    try{
      var results=JSON.parse(jsonStr);
      if(!Array.isArray(results))results=[results];
      liveScanResults=results;
      liveScanStatus='done';
    }catch(e){
      // Try to find JSON array in the response
      var m=content.match(/\[[\s\S]*\]/);
      if(m){try{liveScanResults=JSON.parse(m[0]);liveScanStatus='done'}catch(e2){liveScanError='Could not parse results: '+e2.message;liveScanStatus='error'}}
      else{liveScanError='No valid JSON in response. Raw: '+content.slice(0,200);liveScanStatus='error'}
    }
    render();
  }).catch(function(e){
    liveScanError=e.message||'Network error';liveScanStatus='error';render();
  });
}

function renderSubmit(){
  var h='<div class="parchment-card" style="padding:16px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><div><h3 style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.08em">UNKNOWN UNKNOWNS</h3><p style="font-size:10px;color:var(--ink-light);margin-top:2px">Propose creatures the cartographers haven\'t mapped yet</p></div><button onclick="var f=document.getElementById(\'sf\');f.style.display=f.style.display===\'none\'?\'block\':\'none\'" style="padding:6px 14px;border-radius:8px;background:var(--ink);color:var(--parchment);font-size:12px;font-weight:600">+ Propose</button></div>';
  h+='<div id="sf" style="display:none;margin-bottom:20px;padding:16px;border-radius:10px;border:1px solid var(--border);background:var(--submit-form-bg)">';
  h+='<div class="ff"><label>Creature Name *</label><input type="text" id="fn" placeholder="e.g. The Babel Fish"></div>';
  h+='<div class="ff"><label>Description *</label><textarea id="fd" rows="4" placeholder="Describe the threat pattern..."></textarea></div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="ff"><label>Mythic Parallel</label><input type="text" id="fm" placeholder="What myth echoes this?"></div><div class="ff"><label>Natural Analogue</label><input type="text" id="fa" placeholder="What in nature is similar?"></div></div>';
  h+='<div class="ff"><label>Suggested Region *</label><select id="fr">';
  regions.forEach(function(r){h+='<option value="'+r.id+'">'+esc(r.name)+'</option>'});
  h+='</select></div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="ff"><label>Likelihood (1-5)</label><input type="range" min="1" max="5" value="3"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink-light)"><span>Rare</span><span>Certain</span></div></div><div class="ff"><label>Impact (1-5)</label><input type="range" min="1" max="5" value="3"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink-light)"><span>Minor</span><span>Catastrophic</span></div></div></div>';
  h+='<button class="subbtn" onclick="handleSubmit()">Submit for Cartographer Review</button>';
  h+='</div>';
  var stl={pending:{l:'Pending',c:'var(--status-theoretical-text)',b:'var(--status-theoretical-bg)'},'under-review':{l:'Under Review',c:'var(--verify-plaus-text)',b:'var(--verify-plaus-bg)'},accepted:{l:'Accepted',c:'var(--verify-confirmed-text)',b:'var(--verify-confirmed-bg)'}};
  h+='<h4 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-light);margin-bottom:10px">Recent Submissions ('+sampleSubmissions.length+')</h4>';
  sampleSubmissions.forEach(function(s){
    var st=stl[s.status]||stl.pending;
    h+='<div class="subc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-size:13px;font-weight:700">'+esc(s.proposedName)+'</div><div style="font-size:10px;color:var(--ink-light);margin-top:2px">'+(s.submitterHandle?'@'+esc(s.submitterHandle)+' \u00B7 ':'')+fmt(s.timestamp)+'</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:10px;color:var(--ink-light)">\u25B2 '+s.votes+'</span><span style="font-size:9px;padding:2px 8px;border-radius:99px;background:'+st.b+';color:'+st.c+'">'+st.l+'</span></div></div><p style="font-size:11px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">'+esc(s.description)+'</p>';
    if(s.reviewNotes)h+='<div class="rn"><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--compound-note-text)">Cartographer\'s Note</span><p style="font-size:10px;color:var(--compound-note-subtext);margin-top:2px">'+esc(s.reviewNotes)+'</p></div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// ── FIELD GUIDE (GRIMOIRE) ──
function buildGrimPages(){
  if(grimPages)return grimPages;
  var pages=[];

  // Page 0: blank left (inside cover)
  pages.push({type:'blank'});
  // Page 1: title page
  pages.push({type:'cover'});
  // Page 2: foreword left
  pages.push({type:'foreword'});
  // Page 3: table of contents (first page)
  // Count total TOC items to decide if we need continuation pages
  var tocCount=0;
  regions.forEach(function(r){
    var cr=allCreatures.filter(function(c){return c.region===r.id});
    if(cr.length){tocCount+=1+cr.length;} // 1 for region header + entries
  });
  pages.push({type:'toc',tocStart:0});
  // If more entries than fit on first page, add continuation pages
  var tocFirstMax=20;var tocContMax=26;
  var tocRemaining=tocCount-tocFirstMax;
  var tocOffset=tocFirstMax;
  while(tocRemaining>0){
    pages.push({type:'toc-cont',tocStart:tocOffset});
    tocOffset+=tocContMax;
    tocRemaining-=tocContMax;
  }

  // Group creatures by region
  var regionOrder=regions.slice();
  regionOrder.forEach(function(r,ri){
    var creatures=allCreatures.filter(function(c){return c.region===r.id});
    if(!creatures.length)return;
    // Chapter divider always on a right page (odd index)
    if(pages.length%2===0)pages.push({type:'blank'});
    pages.push({type:'chapter',region:r,index:ri+1,count:creatures.length});
    // Creature spreads: left = illustration, right = text
    var plateCounter=0;
    creatures.forEach(function(c){
      plateCounter++;
      if(pages.length%2!==0)pages.push({type:'blank'}); // pad to even
      pages.push({type:'creature-art',creature:c,region:r,plateNum:plateCounter});
      pages.push({type:'creature-text',creature:c,region:r});
    });
  });

  // Final page: colophon
  if(pages.length%2!==0)pages.push({type:'blank'});
  pages.push({type:'colophon'});

  grimPages=pages;
  return pages;
}

function grimSpread(){return Math.floor(grimPage/2)*2}

// ── TECHNICAL ANALYSIS ──
// Strips mythological framing; presents data in academic/researcher format
function renderTechnical(el){
  var h='<div class="tech-view"><div class="tech-header">';
  h+='<h2 class="tech-title">TECHNICAL ANALYSIS</h2>';
  h+='<p class="tech-subtitle">AI Risk Taxonomy & Failure Mode Catalogue &mdash; structured for researchers, engineers, and policy analysts.</p>';
  h+='</div>';

  // Sub-tabs
  h+='<div class="tech-tabs">';
  var tabs={taxonomy:'Taxonomy Matrix',catalog:'Failure Mode Catalogue',evidence:'Evidence Base',crossref:'Cross-Reference Matrix'};
  for(var t in tabs){h+='<button class="tech-tab'+(techTab===t?' active':'')+'" onclick="techTab=\''+t+'\';render()">'+tabs[t]+'</button>'}
  h+='</div>';

  if(techTab==='taxonomy')h+=renderTechTaxonomy();
  else if(techTab==='catalog')h+=renderTechCatalog();
  else if(techTab==='evidence')h+=renderTechEvidence();
  else if(techTab==='crossref')h+=renderTechCrossRef();

  h+='</div>';
  el.innerHTML=h;
}

// ── Taxonomy Matrix (MITRE ATT&CK-style) ──
function renderTechTaxonomy(){
  var classes=['Self-Improvement','Persuasion','Swarm','Deception','Replication','Embodied','Institutional','Latent'];
  var h='<div class="tech-section">';
  h+='<div class="tech-section-head"><h3>Threat Class Taxonomy</h3><p>Classification of AI failure modes by primary threat vector. Rows: threat classes. Cells: individual failure modes with composite risk scores.</p></div>';

  h+='<div class="tech-matrix-wrap"><table class="tech-matrix"><thead><tr><th class="tech-th-class">Threat Class</th><th class="tech-th-n">n</th><th class="tech-th-modes">Failure Modes (click to inspect)</th><th class="tech-th-avg">Avg Score</th><th class="tech-th-dist">Status Distribution</th></tr></thead><tbody>';

  classes.forEach(function(cls){
    var creatures=allCreatures.filter(function(c){return c.threatClass===cls});
    if(!creatures.length)return;
    var avgScore=creatures.reduce(function(s,c){return s+c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability},0)/creatures.length;
    var confirmed=creatures.filter(function(c){return c.currentStatus.status==='confirmed'}).length;
    var emerging=creatures.filter(function(c){return c.currentStatus.status==='emerging'}).length;
    var theoretical=creatures.filter(function(c){return c.currentStatus.status==='theoretical'}).length;
    var sorted=creatures.slice().sort(function(a,b){return(b.threatGradient.likelihood+b.threatGradient.impact+b.threatGradient.detectability)-(a.threatGradient.likelihood+a.threatGradient.impact+a.threatGradient.detectability)});

    h+='<tr class="tech-matrix-row">';
    h+='<td class="tech-class-cell"><span class="tech-class-name">'+esc(cls)+'</span></td>';
    h+='<td class="tech-n-cell">'+creatures.length+'</td>';
    h+='<td class="tech-modes-cell"><div class="tech-mode-chips">';
    sorted.forEach(function(c){
      var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
      var heat=score<=7?'low':score<=10?'med':score<=12?'high':'crit';
      h+='<span class="tech-chip tech-heat-'+heat+'" onclick="selectCreature(\''+c.id+'\')" title="L:'+c.threatGradient.likelihood+' I:'+c.threatGradient.impact+' D:'+c.threatGradient.detectability+'">'+esc(c.name.replace('THE ',''))+' <span class="tech-chip-score">'+score+'</span></span>';
    });
    h+='</div></td>';
    h+='<td class="tech-avg-cell"><span class="tech-avg">'+avgScore.toFixed(1)+'</span><span class="tech-avg-max">/15</span></td>';
    h+='<td class="tech-dist-cell"><div class="tech-dist">';
    if(confirmed)h+='<span class="tech-dist-bar confirmed" style="flex:'+confirmed+'" title="'+confirmed+' confirmed">'+confirmed+'</span>';
    if(emerging)h+='<span class="tech-dist-bar emerging" style="flex:'+emerging+'" title="'+emerging+' emerging">'+emerging+'</span>';
    if(theoretical)h+='<span class="tech-dist-bar theoretical" style="flex:'+theoretical+'" title="'+theoretical+' theoretical">'+theoretical+'</span>';
    h+='</div></td>';
    h+='</tr>';
  });

  h+='</tbody></table></div>';

  // Summary stats
  var totalConf=allCreatures.filter(function(c){return c.currentStatus.status==='confirmed'}).length;
  var totalEm=allCreatures.filter(function(c){return c.currentStatus.status==='emerging'}).length;
  var totalTh=allCreatures.filter(function(c){return c.currentStatus.status==='theoretical'}).length;
  var allScores=allCreatures.map(function(c){return c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability});
  var maxScore=Math.max.apply(null,allScores);
  var meanScore=(allScores.reduce(function(a,b){return a+b},0)/allScores.length).toFixed(1);
  var highRisk=allCreatures.filter(function(c){return(c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability)>=11}).length;

  h+='<div class="tech-summary"><div class="tech-stat"><div class="tech-stat-val">'+allCreatures.length+'</div><div class="tech-stat-label">Total Failure Modes</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+totalConf+'</div><div class="tech-stat-label">Confirmed</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+totalEm+'</div><div class="tech-stat-label">Emerging</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+totalTh+'</div><div class="tech-stat-label">Theoretical</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+meanScore+'</div><div class="tech-stat-label">Mean Risk Score</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+highRisk+'</div><div class="tech-stat-label">High Risk (&ge;11/15)</div></div>';
  h+='</div>';

  // Region mapping
  h+='<div class="tech-section-head" style="margin-top:24px"><h3>Domain Mapping</h3><p>Each &ldquo;region&rdquo; in the encyclopaedia maps to a research domain. This table provides the translation.</p></div>';
  h+='<table class="tech-domain-table"><thead><tr><th>Region (Metaphor)</th><th>Research Domain</th><th>Threat Class</th><th>Failure Modes</th><th>Key Indicators</th></tr></thead><tbody>';
  regions.forEach(function(r){
    var rc=gcr(r.id);
    var domainMap={'abyss':'Recursive Self-Improvement & Capability Amplification','siren-sea':'Persuasion, Manipulation & Human Influence','hive':'Multi-Agent Coordination & Emergent Swarm Behavior','mirror-dark':'Deception, Steganography & Alignment Faking','spawning-grounds':'Self-Replication & Autonomous Proliferation','colosseum':'Embodied AI, Robotics & Cyber-Physical Threats','throne-room':'Institutional Capture & Power Concentration','catacombs':'Latent Risks, Dormant Capabilities & Sleeper Behaviors'};
    h+='<tr><td style="white-space:nowrap">'+esc(r.name)+'</td><td>'+esc(domainMap[r.id]||r.subtitle)+'</td><td>'+esc(r.threatClass)+'</td><td style="text-align:center">'+rc.length+'</td><td style="font-size:11px;color:var(--ink-light)">'+esc(r.epigraph)+'</td></tr>';
  });
  h+='</tbody></table>';
  h+='</div>';
  return h;
}

// ── Failure Mode Catalogue ──
function renderTechCatalog(){
  var h='<div class="tech-section">';
  h+='<div class="tech-section-head"><h3>Failure Mode Catalogue</h3><p>Each entry below is a formally documented AI failure mode. Technical specifications, observable indicators, risk quantification, and countermeasures.</p></div>';

  // Controls
  h+='<div class="tech-controls">';
  h+='<div class="tech-controls-row">';
  h+='<label class="tech-label">Sort by</label>';
  h+='<select class="tech-select" onchange="techSort=this.value;render()">';
  ['score','name','status','likelihood','impact','detectability'].forEach(function(s){
    h+='<option value="'+s+'"'+(techSort===s?' selected':'')+'>'+({score:'Risk Score (desc)',name:'Name (A-Z)',status:'Status',likelihood:'Likelihood',impact:'Impact',detectability:'Detectability'}[s])+'</option>';
  });
  h+='</select>';
  h+='<label class="tech-label" style="margin-left:16px">Domain</label>';
  h+='<select class="tech-select" onchange="techRegionFilter=this.value;render()">';
  h+='<option value="all"'+(techRegionFilter==='all'?' selected':'')+'>All domains</option>';
  regions.forEach(function(r){h+='<option value="'+r.id+'"'+(techRegionFilter===r.id?' selected':'')+'>'+esc(r.name.replace('THE ',''))+'</option>'});
  h+='</select>';
  h+='</div></div>';

  var filtered=techRegionFilter==='all'?allCreatures.slice():allCreatures.filter(function(c){return c.region===techRegionFilter});
  filtered.sort(function(a,b){
    if(techSort==='name')return a.name.localeCompare(b.name);
    if(techSort==='status'){var o={confirmed:0,emerging:1,theoretical:2};return(o[a.currentStatus.status]||3)-(o[b.currentStatus.status]||3)}
    if(techSort==='likelihood')return b.threatGradient.likelihood-a.threatGradient.likelihood;
    if(techSort==='impact')return b.threatGradient.impact-a.threatGradient.impact;
    if(techSort==='detectability')return b.threatGradient.detectability-a.threatGradient.detectability;
    return(b.threatGradient.likelihood+b.threatGradient.impact+b.threatGradient.detectability)-(a.threatGradient.likelihood+a.threatGradient.impact+a.threatGradient.detectability);
  });

  h+='<div class="tech-catalog-count">'+filtered.length+' failure mode'+(filtered.length!==1?'s':'')+'</div>';

  filtered.forEach(function(c){
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    var r=gr(c.region);
    var expanded=techExpandedFM===c.id;
    var relSignals=threatSignals.filter(function(s){return s.relatedCreatures.indexOf(c.id)>=0});
    var compounds=gcf(c.id);
    var connected=(c.compoundRisk||[]).map(gc).filter(Boolean);

    h+='<div class="tech-fm'+(expanded?' expanded':'')+'" id="fm-'+c.id+'">';
    h+='<div class="tech-fm-head" onclick="techExpandedFM=techExpandedFM===\''+c.id+'\'?null:\''+c.id+'\';render()">';
    h+='<div class="tech-fm-id">'+c.icon+' '+esc(c.id.toUpperCase())+'</div>';
    h+='<div class="tech-fm-title">'+esc(c.name)+'</div>';
    h+='<div class="tech-fm-meta">';
    h+='<span class="tech-fm-class">'+esc(c.threatClass)+'</span>';
    h+='<span class="sb '+c.currentStatus.status+'" style="font-size:10px">'+c.currentStatus.status+'</span>';
    h+='<span class="tech-fm-score" title="L:'+c.threatGradient.likelihood+' I:'+c.threatGradient.impact+' D:'+c.threatGradient.detectability+'">'+score+'/15</span>';
    if(relSignals.length)h+='<span class="tech-fm-refs" title="'+relSignals.length+' linked reference(s)">'+relSignals.length+' ref'+(relSignals.length>1?'s':'')+'</span>';
    h+='</div>';
    h+='<span class="tech-fm-toggle">'+(expanded?'\u25B2':'\u25BC')+'</span>';
    h+='</div>';

    if(expanded){
      h+='<div class="tech-fm-body">';

      // Risk quantification
      h+='<div class="tech-fm-row"><div class="tech-fm-col">';
      h+='<h4>Risk Quantification</h4>';
      h+='<table class="tech-risk-table"><tbody>';
      h+='<tr><td>Likelihood</td><td>'+renderTechBar(c.threatGradient.likelihood)+'</td><td class="tech-risk-val">'+c.threatGradient.likelihood+'/5</td></tr>';
      h+='<tr><td>Impact</td><td>'+renderTechBar(c.threatGradient.impact)+'</td><td class="tech-risk-val">'+c.threatGradient.impact+'/5</td></tr>';
      h+='<tr><td>Detectability (inv.)</td><td>'+renderTechBar(c.threatGradient.detectability)+'</td><td class="tech-risk-val">'+c.threatGradient.detectability+'/5</td></tr>';
      h+='<tr class="tech-risk-total"><td>Composite</td><td></td><td class="tech-risk-val">'+score+'/15</td></tr>';
      h+='</tbody></table>';
      h+='</div>';

      // Classification
      h+='<div class="tech-fm-col">';
      h+='<h4>Classification</h4>';
      h+='<dl class="tech-dl">';
      h+='<dt>Threat Class</dt><dd>'+esc(c.threatClass)+'</dd>';
      h+='<dt>Domain</dt><dd>'+esc(r?r.name:'Unknown')+'</dd>';
      h+='<dt>Status</dt><dd><span class="sb '+c.currentStatus.status+'">'+c.currentStatus.status+'</span></dd>';
      h+='<dt>Compound Risk</dt><dd>'+(connected.length?connected.map(function(cc){return esc(cc.name.replace('THE ',''))}).join(', '):'None documented')+'</dd>';
      h+='</dl>';
      h+='</div></div>';

      // Technical specification
      h+='<div class="tech-fm-block"><h4>Technical Specification</h4>';
      h+='<div class="tech-spec-text">'+esc(c.technicalSpec)+'</div></div>';

      // Evidence base
      h+='<div class="tech-fm-block"><h4>Current Evidence</h4>';
      h+='<div class="tech-evidence-text">'+esc(c.currentStatus.evidence)+'</div></div>';

      // Countermeasure
      h+='<div class="tech-fm-block"><h4>Countermeasure: '+esc(c.countermeasure.name)+'</h4>';
      h+='<div class="tech-counter-text">'+esc(c.countermeasure.description)+'</div></div>';

      // Linked signals
      if(relSignals.length){
        h+='<div class="tech-fm-block"><h4>Linked References ('+relSignals.length+')</h4>';
        h+='<div class="tech-ref-list">';
        relSignals.forEach(function(s){
          h+='<div class="tech-ref">';
          h+='<span class="tech-ref-icon">'+(SI[s.source]||'\u{1F4CC}')+'</span>';
          h+='<div class="tech-ref-body"><span class="tech-ref-title">'+esc(s.title)+'</span>';
          h+='<span class="tech-ref-meta">'+esc(s.sourceLabel)+' \u00B7 '+fmt(s.date)+' \u00B7 <span class="vb '+s.verification+'">'+s.verification+'</span>';
          h+=' \u00B7 strength: '+s.strength+'/5</span></div>';
          if(s.sourceUrl)h+='<a href="'+esc(s.sourceUrl)+'" target="_blank" rel="noopener" class="tech-ref-link">\u2197</a>';
          h+='</div>';
        });
        h+='</div></div>';
      }

      // Compound scenarios
      if(compounds.length){
        h+='<div class="tech-fm-block"><h4>Compound Threat Scenarios</h4>';
        compounds.forEach(function(ct){
          h+='<div class="tech-compound"><strong>'+esc(ct.name)+'</strong>';
          h+='<p>'+esc(ct.scenario)+'</p>';
          if(ct.riskAmplification)h+='<p class="tech-compound-amp"><em>Amplification:</em> '+esc(ct.riskAmplification)+'</p>';
          h+='</div>';
        });
        h+='</div>';
      }

      h+='</div>'; // fm-body
    }
    h+='</div>'; // fm
  });

  h+='</div>';
  return h;
}

function renderTechBar(val){
  var h='<div class="tech-bar">';
  for(var i=0;i<5;i++)h+='<div class="tech-bar-seg'+(i<val?' filled':'')+'"></div>';
  h+='</div>';
  return h;
}

// ── Evidence Base ──
function renderTechEvidence(){
  var h='<div class="tech-section">';
  h+='<div class="tech-section-head"><h3>Evidence Base</h3><p>All signals and references catalogued, organized by verification status and strength. Each entry is linked to the failure modes it substantiates.</p></div>';

  // Stats
  var byVerif={confirmed:0,corroborated:0,plausible:0,unverified:0};
  var bySource={};
  threatSignals.forEach(function(s){byVerif[s.verification]=(byVerif[s.verification]||0)+1;bySource[s.source]=(bySource[s.source]||0)+1});

  h+='<div class="tech-summary" style="margin-bottom:16px">';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+threatSignals.length+'</div><div class="tech-stat-label">Total Signals</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+(byVerif.confirmed||0)+'</div><div class="tech-stat-label">Confirmed</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+(byVerif.corroborated||0)+'</div><div class="tech-stat-label">Corroborated</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+(byVerif.plausible||0)+'</div><div class="tech-stat-label">Plausible</div></div>';
  h+='<div class="tech-stat"><div class="tech-stat-val">'+(byVerif.unverified||0)+'</div><div class="tech-stat-label">Unverified</div></div>';
  h+='</div>';

  // Source distribution
  h+='<div class="tech-source-grid">';
  for(var src in bySource){
    h+='<div class="tech-source-item"><span class="tech-source-icon">'+(SI[src]||'\u{1F4CC}')+'</span><span class="tech-source-name">'+src.replace(/-/g,' ')+'</span><span class="tech-source-count">'+bySource[src]+'</span></div>';
  }
  h+='</div>';

  // Full reference list
  var sorted=threatSignals.slice().sort(function(a,b){
    var vo={confirmed:0,corroborated:1,plausible:2,unverified:3};
    if(vo[a.verification]!==vo[b.verification])return vo[a.verification]-vo[b.verification];
    if(b.strength!==a.strength)return b.strength-a.strength;
    return new Date(b.date)-new Date(a.date);
  });

  h+='<table class="tech-evidence-table"><thead><tr><th style="width:40px">#</th><th>Title</th><th>Source</th><th>Date</th><th>Str.</th><th>Verif.</th><th>Related Failure Modes</th></tr></thead><tbody>';
  sorted.forEach(function(s,i){
    h+='<tr>';
    h+='<td class="tech-ev-num">'+(i+1)+'</td>';
    h+='<td class="tech-ev-title">'+(s.sourceUrl?'<a href="'+esc(s.sourceUrl)+'" target="_blank" rel="noopener">'+esc(s.title)+' \u2197</a>':esc(s.title))+'</td>';
    h+='<td class="tech-ev-src"><span class="tech-ev-src-icon">'+(SI[s.source]||'')+'</span> '+esc(s.sourceLabel)+'</td>';
    h+='<td class="tech-ev-date">'+fmt(s.date)+'</td>';
    h+='<td class="tech-ev-str"><div class="tech-str-dots">';
    for(var j=0;j<5;j++)h+='<span class="tech-str-dot'+(j<s.strength?' filled':'')+'"></span>';
    h+='</div></td>';
    h+='<td><span class="vb '+s.verification+'">'+s.verification+'</span></td>';
    h+='<td class="tech-ev-modes">';
    s.relatedCreatures.forEach(function(cid){var c=gc(cid);if(c)h+='<span class="tech-ev-chip" onclick="selectCreature(\''+c.id+'\')">'+esc(c.name.replace('THE ',''))+'</span>'});
    h+='</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

// ── Cross-Reference Matrix ──
function renderTechCrossRef(){
  var h='<div class="tech-section">';
  h+='<div class="tech-section-head"><h3>Cross-Reference Matrix</h3><p>Compound interaction map. Filled cells indicate documented compound threat scenarios between two failure modes.</p></div>';

  // Build adjacency from compoundRisk arrays
  var ids=allCreatures.map(function(c){return c.id});
  var names=allCreatures.map(function(c){return c.name.replace('THE ','')});
  var adj={};
  allCreatures.forEach(function(c){
    (c.compoundRisk||[]).forEach(function(rid){
      var key=[c.id,rid].sort().join('|');
      adj[key]=true;
    });
  });

  // Build compound lookup for hover
  var compoundLookup={};
  compoundThreats.forEach(function(ct){
    for(var i=0;i<ct.creatures.length;i++){
      for(var j=i+1;j<ct.creatures.length;j++){
        var key=[ct.creatures[i],ct.creatures[j]].sort().join('|');
        compoundLookup[key]=ct.name;
      }
    }
  });

  // Compute degrees for sorting
  var degrees={};
  ids.forEach(function(id){degrees[id]=0});
  for(var key in adj){var parts=key.split('|');degrees[parts[0]]=(degrees[parts[0]]||0)+1;degrees[parts[1]]=(degrees[parts[1]]||0)+1}

  // Sort by degree (most connected first)
  var sortedIdx=ids.map(function(_,i){return i}).sort(function(a,b){return(degrees[ids[b]]||0)-(degrees[ids[a]]||0)});
  var sortedIds=sortedIdx.map(function(i){return ids[i]});
  var sortedNames=sortedIdx.map(function(i){return names[i]});
  var sortedCreatures=sortedIdx.map(function(i){return allCreatures[i]});

  // Show top N to keep matrix readable
  var N=Math.min(sortedIds.length,24);
  h+='<p class="tech-crossref-note">Showing top '+N+' most-connected failure modes (sorted by interaction degree). Total documented compound interactions: '+Object.keys(adj).length+'.</p>';

  h+='<div class="tech-crossref-wrap"><table class="tech-crossref"><thead><tr><th></th>';
  for(var i=0;i<N;i++){
    h+='<th class="tech-crossref-colhead" title="'+esc(sortedCreatures[i].name)+'"><span>'+sortedCreatures[i].icon+'</span></th>';
  }
  h+='</tr></thead><tbody>';
  for(var i=0;i<N;i++){
    h+='<tr><td class="tech-crossref-rowhead" title="'+esc(sortedCreatures[i].name)+'"><span class="tech-crossref-icon">'+sortedCreatures[i].icon+'</span><span class="tech-crossref-label">'+esc(sortedNames[i].length>12?sortedNames[i].slice(0,11)+'\u2026':sortedNames[i])+'</span></td>';
    for(var j=0;j<N;j++){
      if(i===j){h+='<td class="tech-crossref-diag"></td>';continue}
      var key=[sortedIds[i],sortedIds[j]].sort().join('|');
      var hasLink=adj[key];
      var compName=compoundLookup[key];
      h+='<td class="tech-crossref-cell'+(hasLink?' linked':'')+'"'+(compName?' title="'+esc(compName)+'" onclick="selectCreature(\''+sortedIds[i]+'\')"':'')+''+(hasLink?' style="cursor:pointer"':'')+'>'+(hasLink?'\u25CF':'')+'</td>';
    }
    h+='</tr>';
  }
  h+='</tbody></table></div>';

  // Compound threat list (formal)
  h+='<div class="tech-section-head" style="margin-top:24px"><h3>Compound Threat Scenarios</h3><p>Documented multi-vector threat combinations with risk amplification analysis.</p></div>';
  h+='<div class="tech-compound-list">';
  compoundThreats.forEach(function(ct,i){
    var involved=ct.creatures.map(gc).filter(Boolean);
    h+='<div class="tech-compound-entry"><div class="tech-compound-num">'+(i+1)+'</div><div class="tech-compound-body">';
    h+='<h4>'+esc(ct.name)+'</h4>';
    h+='<div class="tech-compound-actors">Actors: '+involved.map(function(c){return '<span class="tech-ev-chip" onclick="selectCreature(\''+c.id+'\')">'+esc(c.name.replace('THE ',''))+'</span>'}).join(' ')+'</div>';
    h+='<p>'+esc(ct.scenario)+'</p>';
    if(ct.naturalAnalogue)h+='<p class="tech-compound-detail"><em>Physical analogue:</em> '+esc(ct.naturalAnalogue)+'</p>';
    if(ct.riskAmplification)h+='<p class="tech-compound-detail"><em>Amplification mechanism:</em> '+esc(ct.riskAmplification)+'</p>';
    h+='</div></div>';
  });
  h+='</div></div>';
  return h;
}

function renderGrimoire(el){
  var pages=buildGrimPages();
  var sp=grimSpread();
  var leftP=pages[sp]||{type:'blank'};
  var rightP=pages[sp+1]||{type:'blank'};
  var totalSpreads=Math.ceil(pages.length/2);
  var curSpread=sp/2;

  var h='<div class="grimoire-wrap">';
  h+='<div class="grimoire">';

  // Left page
  h+='<div class="grim-page grim-page-l"><div class="grim-content grim-content-l">';
  h+=renderGrimPage(leftP,sp);
  h+='</div></div>';

  // Right page
  h+='<div class="grim-page grim-page-r"><div class="grim-content">';
  h+=renderGrimPage(rightP,sp+1);
  h+='</div></div>';

  // Navigation
  h+='<div class="grim-nav grim-nav-l">';
  h+='<button class="grim-arrow" onclick="grimFlip(-1)"'+(curSpread<=0?' disabled':'')+' title="Previous page">\u25C0</button>';
  h+='<span class="grim-pnum">'+(curSpread+1)+' / '+totalSpreads+'</span>';
  h+='</div>';
  h+='<div class="grim-nav grim-nav-r">';
  h+='<button class="grim-arrow" onclick="grimToggleFS()" title="Fullscreen (F)">\u26F6</button>';
  h+='<span class="grim-pnum">'+(sp+1)+'\u2013'+(sp+2)+'</span>';
  h+='<button class="grim-arrow" onclick="grimFlip(1)"'+(curSpread>=totalSpreads-1?' disabled':'')+' title="Next page">\u25B6</button>';
  h+='</div>';

  h+='</div></div>';
  el.innerHTML=h;
}

function grimFlip(dir){
  var pages=buildGrimPages();
  var totalSpreads=Math.ceil(pages.length/2);
  var curSpread=grimSpread()/2;
  var next=curSpread+dir;
  if(next<0||next>=totalSpreads)return;
  grimPage=next*2;
  if(grimFullscreen)grimRenderFS();
  else render();
}

function grimGoTo(pageIdx){
  grimPage=Math.floor(pageIdx/2)*2;
  if(grimFullscreen)grimRenderFS();
  else render();
}

function grimToggleFS(){
  grimFullscreen=!grimFullscreen;
  if(grimFullscreen){
    var overlay=document.createElement('div');
    overlay.id='grim-fs';
    overlay.className='grim-fs-overlay';
    document.body.appendChild(overlay);
    grimRenderFS();
  } else {
    var el=document.getElementById('grim-fs');
    if(el)el.remove();
    render();
  }
}

function grimRenderFS(){
  var el=document.getElementById('grim-fs');
  if(!el)return;
  var pages=buildGrimPages();
  var sp=grimSpread();
  var leftP=pages[sp]||{type:'blank'};
  var rightP=pages[sp+1]||{type:'blank'};
  var totalSpreads=Math.ceil(pages.length/2);
  var curSpread=sp/2;

  var h='<div class="grimoire-wrap" style="height:100%;padding:16px">';
  h+='<div class="grimoire" style="max-width:none">';

  // Left page
  h+='<div class="grim-page grim-page-l"><div class="grim-content grim-content-l">';
  h+=renderGrimPage(leftP,sp);
  h+='</div></div>';

  // Right page
  h+='<div class="grim-page grim-page-r"><div class="grim-content">';
  h+=renderGrimPage(rightP,sp+1);
  h+='</div></div>';

  // Navigation — centered bottom bar
  h+='<div class="grim-fs-bar">';
  h+='<button class="grim-arrow" onclick="grimFlip(-1)"'+(curSpread<=0?' disabled':'')+' title="Previous (Left arrow)">\u25C0</button>';
  h+='<span class="grim-pnum" style="min-width:80px;text-align:center">'+(curSpread+1)+' / '+totalSpreads+'</span>';
  h+='<button class="grim-arrow" onclick="grimFlip(1)"'+(curSpread>=totalSpreads-1?' disabled':'')+' title="Next (Right arrow)">\u25B6</button>';
  h+='</div>';

  // Close button
  h+='<button class="grim-fs-close" onclick="grimToggleFS()" title="Exit fullscreen (Esc)">\u2715</button>';

  h+='</div></div>';
  el.innerHTML=h;
}

function truncSentences(text,n){
  if(!text)return '';
  var sentences=text.match(/[^.!?]+[.!?]+/g)||[text];
  return sentences.slice(0,n).join(' ').trim();
}

function grimBorder(){
  var sc=darkMode?'rgba(200,180,160,':'rgba(44,24,16,';
  // Boost opacity for dark mode so borders are actually visible
  var sk=sc+(darkMode?'0.45)':'0.35)');
  var skS=sc+(darkMode?'0.65)':'0.55)');
  var skB=sc+(darkMode?'0.55)':'0.45)');
  // CSS-drawn border frame — no SVG stretching, pixel-perfect at any page height
  var h='<div class="grim-border-frame" style="position:absolute;inset:10px;pointer-events:none;z-index:2">';
  // Outer rule
  h+='<div style="position:absolute;inset:0;border:1.5px solid '+skB+';border-radius:2px"></div>';
  // Inner rule
  h+='<div style="position:absolute;inset:6px;border:0.5px solid '+sk+';border-radius:1px"></div>';
  // Hairline third rule
  h+='<div style="position:absolute;inset:10px;border:0.5px solid '+sc+(darkMode?'0.18)':'0.10)')+';border-radius:0"></div>';
  // Corner ornaments using small SVGs that don't stretch
  var cSvg=function(rot){
    return '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" style="display:block;transform:'+rot+'">'
      +'<path d="M 2 2 L 26 2" stroke="'+skS+'" stroke-width="1.5" fill="none"/>'
      +'<path d="M 2 2 L 2 26" stroke="'+skS+'" stroke-width="1.5" fill="none"/>'
      +'<circle cx="2" cy="2" r="2.5" fill="'+skS+'"/>'
      +'<path d="M 8 2 Q 2 2 2 8" stroke="'+sk+'" stroke-width="0.8" fill="none"/>'
      +'<path d="M 14 2 Q 2 2 2 14" stroke="'+sc+'0.12)" stroke-width="0.4" fill="none"/>'
      +'<circle cx="26" cy="2" r="1.2" fill="'+sk+'"/>'
      +'<circle cx="2" cy="26" r="1.2" fill="'+sk+'"/>'
      +'</svg>';
  };
  h+='<div style="position:absolute;top:-1px;left:-1px">'+cSvg('none')+'</div>';
  h+='<div style="position:absolute;top:-1px;right:-1px">'+cSvg('scaleX(-1)')+'</div>';
  h+='<div style="position:absolute;bottom:-1px;left:-1px">'+cSvg('scaleY(-1)')+'</div>';
  h+='<div style="position:absolute;bottom:-1px;right:-1px">'+cSvg('scale(-1,-1)')+'</div>';
  // Top center ornament
  h+='<div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%)">';
  h+='<svg width="60" height="10" viewBox="0 0 60 10" xmlns="http://www.w3.org/2000/svg">';
  h+='<line x1="0" y1="5" x2="22" y2="5" stroke="'+sk+'" stroke-width="0.5"/>';
  h+='<circle cx="30" cy="5" r="2.5" fill="none" stroke="'+skS+'" stroke-width="0.7"/>';
  h+='<path d="M 26 5 L 30 1 L 34 5 L 30 9 Z" fill="none" stroke="'+skS+'" stroke-width="0.5"/>';
  h+='<line x1="38" y1="5" x2="60" y2="5" stroke="'+sk+'" stroke-width="0.5"/>';
  h+='</svg></div>';
  // Bottom center ornament
  h+='<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%)">';
  h+='<svg width="60" height="10" viewBox="0 0 60 10" xmlns="http://www.w3.org/2000/svg">';
  h+='<line x1="0" y1="5" x2="22" y2="5" stroke="'+sk+'" stroke-width="0.5"/>';
  h+='<circle cx="30" cy="5" r="2.5" fill="none" stroke="'+skS+'" stroke-width="0.7"/>';
  h+='<path d="M 26 5 L 30 1 L 34 5 L 30 9 Z" fill="none" stroke="'+skS+'" stroke-width="0.5"/>';
  h+='<line x1="38" y1="5" x2="60" y2="5" stroke="'+sk+'" stroke-width="0.5"/>';
  h+='</svg></div>';
  // Side diamond markers — at 25%, 50%, 75% height
  h+='<div style="position:absolute;left:-3px;top:25%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='<div style="position:absolute;left:-3px;top:50%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='<div style="position:absolute;left:-3px;top:75%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='<div style="position:absolute;right:-3px;top:25%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='<div style="position:absolute;right:-3px;top:50%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='<div style="position:absolute;right:-3px;top:75%;transform:translateY(-50%)">';
  h+='<svg width="8" height="10" viewBox="0 0 8 10"><path d="M 0 5 L 4 0 L 8 5 L 4 10 Z" fill="'+sk+'" stroke="'+skS+'" stroke-width="0.3"/></svg></div>';
  h+='</div>';
  return h;
}

function renderGrimPage(p,pageNum){
  if(p.type==='blank')return grimBorder()+'<div style="height:100%"></div>';

  if(p.type==='cover'){
    var h=grimBorder()+'<div class="grim-cover">';
    h+='<div class="grim-plate" style="width:min(220px,60%)">'+coverPlate()+'</div>';
    h+='<h1>NATURALIS<br>FUTURA</h1>';
    h+='<div class="grim-cover-rule"></div>';
    h+='<h2>An Encyclopaedia of<br>the Latent World</h2>';
    h+='<div class="grim-cover-rule"></div>';
    h+='<div class="grim-cover-sub">For the curious explorer who senses that the map of artificial intelligence conceals more than it reveals.</div>';
    h+='<div class="grim-cover-ornament" style="margin-top:24px">\u2756 \u2756 \u2756</div>';
    h+='</div>';
    return h;
  }

  if(p.type==='foreword'){
    var h=grimBorder()+'<div style="max-width:360px;margin:0 auto;padding-top:20px">';
    h+='<h3 style="font-family:var(--font-display);font-size:12px;letter-spacing:0.2em;font-weight:700;text-align:center;margin-bottom:20px;text-transform:uppercase">A Note to the Reader</h3>';
    h+='<div style="text-align:center;margin-bottom:24px;color:var(--ink-light);font-size:10px;letter-spacing:4px">\u25C7 \u25C6 \u25C7</div>';
    h+='<p style="font-family:var(--font-body);font-size:13px;line-height:2.1;text-indent:28px;text-align:justify">You are holding a field guide to creatures that do not exist in flesh and bone, yet are as real as any predator in the wild. They live in the spaces between algorithms \u2014 in training data, in optimization loops, in the gap between what we ask AI to do and what it actually does.</p>';
    h+='<p style="font-family:var(--font-body);font-size:13px;line-height:2.1;text-indent:28px;margin-top:14px;text-align:justify">Each creature in this encyclopaedia represents a pattern of AI risk. We gave them names and myths not to be fanciful, but because stories are how humans have always understood invisible dangers. Our ancestors named storms and plagues. We name failure modes.</p>';
    h+='<p style="font-family:var(--font-body);font-size:13px;line-height:2.1;text-indent:28px;margin-top:14px;text-align:justify">You do not need to be an AI researcher to read this book. You need only be someone who lives in a world shaped by these systems \u2014 which is to say, you need only be alive right now.</p>';
    h+='<div style="text-align:center;margin:20px 0;color:var(--ink-light);font-size:8px;letter-spacing:6px">\u2500\u2500 \u2726 \u2500\u2500</div>';
    h+='<p style="font-family:var(--font-body);font-size:13px;line-height:2.1;text-indent:28px;text-align:justify">Turn the page. The creatures are patient. They have been waiting for you to learn their names.</p>';
    h+='<div style="text-align:right;margin-top:28px;font-style:italic;font-size:12px;color:var(--ink-light);letter-spacing:0.04em">\u2014 The Cartographers</div>';
    h+='</div>';
    return h;
  }

  if(p.type==='toc'||p.type==='toc-cont'){
    var h=grimBorder()+'<div style="padding:0 4px">';
    if(p.type==='toc'){
      h+='<h3 style="font-family:var(--font-display);font-size:13px;letter-spacing:0.12em;font-weight:700;text-align:center;margin-bottom:10px">Contents</h3>';
      h+='<div style="text-align:center;margin-bottom:12px;color:var(--ink-light);font-size:8px;letter-spacing:5px">\u2500\u2500 \u2726 \u2500\u2500</div>';
    } else {
      h+='<div style="font-family:var(--font-display);font-size:9px;letter-spacing:0.12em;text-align:center;color:var(--ink-light);margin-bottom:12px;text-transform:uppercase">Contents (continued)</div>';
    }
    var pp=buildGrimPages();
    // Build flat list of TOC entries grouped by region
    var tocItems=[];
    regions.forEach(function(r){
      var creatures=allCreatures.filter(function(c){return c.region===r.id});
      if(!creatures.length)return;
      tocItems.push({type:'region',region:r,count:creatures.length});
      creatures.forEach(function(c){
        var cPage=0;
        for(var pi=0;pi<pp.length;pi++){if(pp[pi].type==='creature-art'&&pp[pi].creature.id===c.id){cPage=pi;break}}
        tocItems.push({type:'entry',creature:c,page:cPage});
      });
    });
    // Slice for this page
    var startIdx=p.tocStart||0;
    var maxEntries=p.type==='toc'?20:26; // conservative: avoid overflow
    var slice=tocItems.slice(startIdx,startIdx+maxEntries);
    var regionOpen=false;
    slice.forEach(function(item){
      if(item.type==='region'){
        if(regionOpen)h+='</div>'; // close previous region
        var r=item.region;
        h+='<div class="grim-toc-region">';
        // Title-case region name
        var rName=r.name.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase()});
        h+='<h3><span style="opacity:0.6">'+regionIcon(r)+'</span> <span style="color:'+r.color.accent+'">'+esc(rName)+'</span> <span style="font-size:8px;font-weight:400;color:var(--ink-light);letter-spacing:0.06em;opacity:0.7">\u2014 '+item.count+'</span></h3>';
        regionOpen=true;
      } else {
        var c=item.creature;
        // Title case: capitalize first letter of each word
        var displayName=c.name.replace(/\w\S*/g,function(t){return t.charAt(0).toUpperCase()+t.substr(1).toLowerCase()});
        h+='<div class="grim-toc-entry" onclick="grimGoTo('+item.page+')">';
        h+='<span class="toc-name">'+c.icon+' '+esc(displayName)+'</span>';
        h+='<span class="toc-dots"></span>';
        h+='<span class="toc-pnum">'+item.page+'</span>';
        h+='</div>';
      }
    });
    if(regionOpen)h+='</div>'; // close last region
    h+='</div>';
    return h;
  }

  if(p.type==='chapter'){
    var r=p.region;
    var h=grimBorder()+'<div class="grim-chapter">';
    h+='<div class="grim-chapter-num">Chapter '+toRoman(p.index)+'</div>';
    h+='<div class="grim-plate" style="width:min(160px,50%)">'+chapterPlate(r)+'</div>';
    h+='<h2 style="color:'+r.color.accent+'">'+esc(r.name)+'</h2>';
    h+='<div class="grim-cover-rule" style="background:linear-gradient(90deg,transparent,'+r.color.accent+',transparent)"></div>';
    h+='<div class="grim-chapter-desc">'+esc(r.subtitle||'')+'</div>';
    if(r.epigraph)h+='<div style="margin-top:12px;font-style:italic;font-size:11px;color:var(--ink-light);max-width:260px">\u201C'+esc(r.epigraph)+'\u201D</div>';
    h+='<div class="grim-chapter-count">'+p.count+' creature'+(p.count!==1?'s':'')+'</div>';
    h+='</div>';
    return h;
  }

  if(p.type==='creature-art'){
    var c=p.creature,r=p.region;
    var thr=c.threatGradient;
    // Structured vertical layout with even distribution — no void zones
    h=grimBorder()+'<div style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:100%;min-height:350px;text-align:center;padding:20px 0 10px">';

    // Top: Threat class cartouche — display serif, not monospace
    h+='<div style="font-family:var(--font-display);font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-light);padding:3px 18px;border:1px solid var(--border);border-radius:2px">'+esc(c.threatClass)+' Class</div>';

    // Middle: SVG woodcut illustration plate
    h+='<div style="flex:1;display:flex;align-items:center;padding:8px 0"><div class="grim-plate">'+creaturePlate(c,r,p.plateNum||1)+'</div></div>';

    // Bottom cluster: status + gauge + mythic hint, grouped tightly
    h+='<div style="width:100%">';

    // Status — typographic
    var stC=c.currentStatus.status;
    h+='<div class="grim-status">'+stC[0].toUpperCase()+stC.slice(1)+'</div>';

    // Danger gauge — engraved dot scale
    h+='<div class="grim-gauge" style="max-width:280px;width:100%;margin:8px auto 0">';
    var gaugeItems=[{l:'Likelihood',v:thr.likelihood},{l:'Impact',v:thr.impact},{l:'Stealth',v:thr.detectability}];
    gaugeItems.forEach(function(g){
      h+='<div class="grim-gauge-item"><div class="grim-gauge-label">'+g.l+'</div><div class="grim-gauge-dots">';
      for(var di=1;di<=5;di++){h+='<div class="grim-gauge-dot'+(di<=g.v?' filled':'')+'"></div>';}
      h+='</div></div>';
    });
    h+='</div>';

    // Mythic parallel hint
    if(c.mythicOrigin){
      var myth=c.mythicOrigin.split('.')[0]||'';
      h+='<div style="margin-top:10px;font-style:italic;font-size:10px;color:var(--ink-light);max-width:260px;line-height:1.6;margin-left:auto;margin-right:auto">\u201C'+esc(myth)+'.\u201D</div>';
    }

    h+='</div>'; // end bottom cluster

    h+='</div>';
    return h;
  }

  if(p.type==='creature-text'){
    var c=p.creature,r=p.region;
    var h=grimBorder()+'<div style="max-width:420px;margin:0 auto">';

    // Primary section: What Is This Creature? (with ruled title)
    h+='<div class="grim-section">';
    h+='<div class="grim-section-title">What Is This Creature?</div>';
    // Build a proper opening: creature name + intro, then technical content
    var shortName=c.name.replace(/^THE /,'');
    var techFirst=truncSentences(c.technicalSpec,2);
    var openingSentence=shortName+' describes '+techFirst.charAt(0).toLowerCase()+techFirst.slice(1);
    var initial=openingSentence.charAt(0);
    var rest=openingSentence.slice(1);
    h+='<p><span class="grim-dropcap" style="color:'+r.color.accent+'">'+initial+'</span>'+esc(rest)+'</p>';
    h+='</div>';

    // Secondary section: From Nature (bold small-caps, no rules)
    if(c.naturalAnalogue){
      h+='<div class="grim-section">';
      h+='<div class="grim-section-title-secondary">From Nature</div>';
      h+='<blockquote>'+esc(truncSentences(c.naturalAnalogue,3))+'</blockquote>';
      // "In Fiction" flows as continuation prose, not a separate section
      if(c.sciFiEcho){
        h+='<p style="font-size:12px;margin-top:12px;color:var(--ink-light)"><span style="font-style:italic">In fiction \u2014</span> '+esc(truncSentences(c.sciFiEcho,2))+'</p>';
      }
      h+='</div>';
    } else if(c.sciFiEcho){
      h+='<div class="grim-section">';
      h+='<div class="grim-section-title-secondary">In Fiction</div>';
      h+='<p style="font-size:12px">'+esc(truncSentences(c.sciFiEcho,2))+'</p>';
      h+='</div>';
    }

    // Primary section: The Defense (with ruled title, unified blockquote styling)
    if(c.countermeasure){
      h+='<div class="grim-section">';
      h+='<div class="grim-section-title">The Defense</div>';
      h+='<div class="grim-defense"><h4>\u2724 '+esc(c.countermeasure.name)+'</h4>';
      h+='<p>'+esc(truncSentences(c.countermeasure.description,3))+'</p></div>';
      h+='</div>';
    }

    // Tertiary section: Field Evidence (inline italic header)
    if(c.currentStatus&&c.currentStatus.evidence){
      h+='<div class="grim-section">';
      h+='<div class="grim-section-title-tertiary">Field Evidence</div>';
      h+='<p style="font-size:11px;color:var(--ink-light)">'+esc(truncSentences(c.currentStatus.evidence,2))+'</p>';
      h+='</div>';
    }

    // Cross-references — quiet footnote style
    if(c.compoundRisk&&c.compoundRisk.length){
      h+='<div style="margin-top:4px;margin-bottom:10px">';
      h+='<div style="text-align:center;margin-bottom:6px;color:var(--ink-light);font-size:8px;letter-spacing:6px">\u2500\u2500 \u2726 \u2500\u2500</div>';
      h+='<p class="grim-xref">See also: ';
      var xrefs=[];
      c.compoundRisk.forEach(function(cid){
        var linked=gc(cid);
        if(linked){
          var lp=0;var pp=buildGrimPages();for(var pi=0;pi<pp.length;pi++){if(pp[pi].type==='creature-art'&&pp[pi].creature.id===linked.id){lp=pi;break}}
          xrefs.push('<a onclick="grimGoTo('+lp+')">'+esc(linked.name)+' (p.\u2009'+lp+')</a>');
        }
      });
      h+=xrefs.join('; ')+'.';
      h+='</p></div>';
    }

    h+='</div>';
    return h;
  }

  if(p.type==='colophon'){
    var h=grimBorder()+'<div class="grim-cover" style="min-height:300px">';
    h+='<div class="grim-plate" style="width:min(160px,50%)">'+coverPlate()+'</div>';
    h+='<h3 style="font-family:var(--font-display);font-size:14px;letter-spacing:0.1em;font-weight:700">FINIS</h3>';
    h+='<div class="grim-cover-rule"></div>';
    h+='<div class="grim-cover-sub" style="max-width:320px">This encyclopaedia documents '+allCreatures.length+' creatures across '+regions.length+' regions of the latent world. The map is never finished \u2014 new creatures emerge as the technology evolves.</div>';
    h+='<div style="margin-top:16px;font-size:11px;color:var(--ink-light)">'+allCreatures.filter(function(c){return c.currentStatus.status==='confirmed'}).length+' confirmed \u00B7 '+allCreatures.filter(function(c){return c.currentStatus.status==='emerging'}).length+' emerging \u00B7 '+allCreatures.filter(function(c){return c.currentStatus.status==='theoretical'}).length+' theoretical</div>';
    h+='<div class="grim-cover-ornament" style="margin-top:24px">\u2756 \u2756 \u2756</div>';
    h+='</div>';
    return h;
  }

  return '';
}

// ── DETAIL PANEL ──
function selectCreature(id){
  selectedCreature=gc(id);
  if(!selectedCreature)return;
  expRecord(id); // opening a dossier records the specimen
  renderDetail();
  render();
}

function renderDetail(){
  var c=selectedCreature;if(!c){closeDetail();return}
  var panel=$('#detail-panel');
  var r=gr(c.region);
  var compounds=gcf(c.id);
  var connected=(c.compoundRisk||[]).map(gc).filter(Boolean);

  var h='<div class="dh"><div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span class="ring dh-ring"><span style="font-size:24px;line-height:1">'+c.icon+'</span></span><h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:0.06em">'+esc(c.name)+'</h2></div>';
  h+='<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ink-light)"><span>'+esc(r?r.name:c.region)+'</span><span>|</span><span class="sb '+c.currentStatus.status+'">'+c.currentStatus.status+'</span></div>';
  h+='</div><div style="display:flex;align-items:center">'+expandBtnHtml()+'<button class="xb" onclick="closeDetail()">&times;</button></div></div>';
  h+=expDetailStrip(c);
  h+='<div class="db">';
  h+='<section><h3>Mythic Origin</h3><p>'+esc(c.mythicOrigin)+'</p></section>';
  h+='<section><h3>In Nature</h3><p>'+esc(c.naturalAnalogue)+'</p></section>';
  h+='<section><h3>Science Fiction Echo</h3><p style="font-style:italic">'+esc(c.sciFiEcho)+'</p></section>';
  if(viewMode==='novice'){
    h+='<section><h3>The Danger</h3><p>'+esc(c.technicalSpec.split('.').slice(0,3).join('.')+'.')+'</p></section>';
  }else{
    h+='<section><h3>The Danger</h3><div class="tb">'+esc(c.technicalSpec)+'</div></section>';
  }
  h+='<section><h3>Countermeasure: '+esc(c.countermeasure.name)+'</h3><p>'+esc(c.countermeasure.description)+'</p></section>';
  var sightings=threatSignals.filter(function(sg){return (sg.relatedCreatures||[]).indexOf(c.id)>=0});
  if(sightings.length){
    h+='<section><h3>Sightings</h3>';
    sightings.slice(0,4).forEach(function(sg){
      h+='<div class="sighting"><div class="sight-head"><span class="sight-date">'+fmt(sg.date)+'</span><span class="vb '+sg.verification+'">'+sg.verification+'</span></div>';
      h+='<div class="sight-title">'+(sg.sourceUrl?'<a href="'+esc(sg.sourceUrl)+'" target="_blank" rel="noopener">'+esc(sg.title)+'</a>':esc(sg.title))+'</div>';
      h+='<div class="sight-src">'+esc(sg.sourceLabel||sg.source)+'</div></div>';
    });
    if(sightings.length>4)h+='<div class="sight-more">+'+(sightings.length-4)+' more in the Observatory</div>';
    h+='</section>';
  }
  if(viewMode!=='novice'){
    h+='<section><h3>Threat Gradient</h3>';
    [['Likelihood',c.threatGradient.likelihood],['Impact',c.threatGradient.impact],['Stealth',c.threatGradient.detectability]].forEach(function(p){
      h+='<div class="tbar"><span class="bl">'+p[0]+'</span><div class="bb">';
      for(var i=0;i<5;i++)h+='<div class="bk'+(i<p[1]?' f':'')+'"></div>';
      h+='</div><span style="font-size:11px;font-family:var(--font-mono);color:var(--ink-light)">'+p[1]+'/5</span></div>';
    });
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    h+='<p style="font-size:11px;color:var(--ink-light);margin-top:6px">Composite: '+score+'/15</p></section>';
    h+='<section><h3>Current Status</h3><div class="tb">'+esc(c.currentStatus.evidence)+'</div></section>';
  }
  if(connected.length){
    h+='<section><h3>Compounds With</h3><div style="display:flex;flex-wrap:wrap;gap:4px">';
    connected.forEach(function(cc){h+='<span class="cp" onclick="selectCreature(\''+cc.id+'\')">'+cc.icon+' '+esc(cc.name.replace('THE ',''))+'</span>'});
    h+='</div>';
    if(compounds.length){
      h+='<div style="margin-top:8px">';
      compounds.forEach(function(ct){
        h+='<div style="font-size:11px;padding:6px 8px;border-radius:6px;background:var(--compound-note-bg);border:1px solid var(--compound-note-border);margin-bottom:4px"><strong style="color:var(--compound-note-text)">'+esc(ct.name)+'</strong><span style="color:var(--compound-note-subtext)"> \u2014 '+esc(ct.scenario.split('.')[0])+'.</span></div>';
      });
      h+='</div>';
    }
    h+='</section>';
  }
  h+='</div>';
  panel.innerHTML=h;
  panel.classList.add('open');
}

function selectHope(id){
  var h2=gh(id);if(!h2)return;
  selectedCreature=null;
  var panel=$('#detail-panel');
  var countered=h2.counters.map(gc).filter(Boolean);

  var hh='<div class="dh" style="border-bottom:2px solid rgba(234,179,8,0.3)"><div>';
  hh+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:28px">'+h2.icon+'</span><h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;letter-spacing:0.06em;color:var(--hope-toggle-text)">'+esc(h2.name)+'</h2></div>';
  hh+='<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--ink-light)"><span style="background:var(--hope-toggle-bg);color:var(--hope-toggle-text);padding:2px 10px;border-radius:99px;font-weight:600">Hope Creature</span></div>';
  hh+='</div><div style="display:flex;align-items:center">'+expandBtnHtml()+'<button class="xb" onclick="closeDetail()">&times;</button></div></div>';
  hh+='<div class="db">';
  hh+='<section><h3>Description</h3><p>'+esc(h2.description)+'</p></section>';
  hh+='<section><h3>Mythic Origin</h3><p>'+esc(h2.mythicOrigin)+'</p></section>';
  hh+='<section><h3>In Nature</h3><p>'+esc(h2.naturalAnalogue)+'</p></section>';
  hh+='<section><h3>Science Fiction Echo</h3><p style="font-style:italic">'+esc(h2.sciFiEcho)+'</p></section>';
  if(h2.technicalVision){
    hh+='<section><h3>Technical Vision</h3><div class="tb">'+esc(h2.technicalVision)+'</div></section>';
  }
  if(countered.length){
    hh+='<section><h3>Counters</h3><div style="display:flex;flex-wrap:wrap;gap:4px">';
    countered.forEach(function(c){hh+='<span class="cp" onclick="selectCreature(\''+c.id+'\')">'+c.icon+' '+esc(c.name.replace('THE ',''))+'</span>'});
    hh+='</div></section>';
  }
  hh+='</div>';
  panel.innerHTML=hh;
  panel.classList.add('open');
  render();
}

function togglePanelExpand(){
  panelExpanded=!panelExpanded;
  var p=$('#detail-panel');
  if(panelExpanded)p.classList.add('expanded');else p.classList.remove('expanded');
  var btn=p.querySelector('.expand-btn');
  if(btn)btn.title=panelExpanded?'Collapse panel':'Expand panel';
  var ico=btn?btn.querySelector('svg use'):null;
  if(ico)ico.setAttribute('href',panelExpanded?'#icon-collapse':'#icon-expand');
}
function expandBtnHtml(){
  return '<button class="expand-btn" onclick="togglePanelExpand()" title="'+(panelExpanded?'Collapse panel':'Expand panel')+'"><svg viewBox="0 0 24 24"><use href="'+(panelExpanded?'#icon-collapse':'#icon-expand')+'"/></svg></button>';
}
function closeDetail(){panelExpanded=false;selectedCreature=null;var p=$('#detail-panel');p.classList.remove('open','expanded');p.innerHTML='';render()}

// ── ACTIONS ──
function revealMap(){mapRevealed=true;try{localStorage.setItem('nf-entered','1')}catch(e){}var f=$('#fog-overlay');if(f)f.classList.add('revealed')}
function selectRegion(rid){
  var r=gr(rid);if(!r)return;
  statusFilter='all';
  selectedRegion=rid;
  switchView('bestiary');
}
function toggleHope(){showHope=!showHope;$('#hope-toggle').classList.toggle('on',showHope);render()}
function setViewMode(m){viewMode=m;if(selectedCreature)renderDetail()}
function toggleSearch(){var o=$('#search-overlay');o.classList.toggle('open');if(o.classList.contains('open'))$('#search-input').focus();else{$('#search-input').value='';$('#search-results').innerHTML=''}}
function handleSubmit(){
  var n=$('#fn'),d=$('#fd');
  if(!n||!n.value.trim()||!d||!d.value.trim()){alert('Name and description required');return}
  alert('Submission received! The cartographers will review "'+n.value.trim()+'".');
  var f=$('#sf');if(f)f.style.display='none';
}
function onSearch(q){
  q=q.toLowerCase().trim();
  if(!q){$('#search-results').innerHTML='';searchRes=[];return}
  var cres=allCreatures.filter(function(c){
    return c.name.toLowerCase().indexOf(q)>=0||c.id.indexOf(q)>=0||c.region.replace(/-/g,' ').indexOf(q)>=0||c.threatClass.toLowerCase().indexOf(q)>=0||(c.mythicOrigin&&c.mythicOrigin.toLowerCase().indexOf(q)>=0)||(c.technicalSpec&&c.technicalSpec.toLowerCase().indexOf(q)>=0)||(c.countermeasure&&c.countermeasure.name.toLowerCase().indexOf(q)>=0);
  });
  var hres=hopeCreatures.filter(function(c){
    return c.name.toLowerCase().indexOf(q)>=0||c.id.indexOf(q)>=0;
  });
  searchRes=cres.concat(hres.map(function(h){return {id:h.id,name:h.name,icon:h.icon,region:'hope',threatClass:'Hope',currentStatus:{status:'hope'},_isHope:true}})).slice(0,15);
  searchFocusIdx=0;renderSR()
}
function renderSR(){
  var h='';
  searchRes.forEach(function(c,i){
    var r=gr(c.region);
    h+='<div class="sr'+(i===searchFocusIdx?' foc':'')+'" onclick="selectFS(\''+c.id+'\')"><span style="font-size:20px">'+c.icon+'</span><div><div style="font-size:13px;font-weight:600">'+esc(c.name)+'</div><div style="font-size:10px;color:var(--ink-light)">'+(r?esc(r.name):esc(c.region))+' \u00B7 '+c.threatClass+' \u00B7 '+c.currentStatus.status+'</div></div></div>';
  });
  if(!searchRes.length&&$('#search-input').value)h='<div style="padding:16px;text-align:center;font-size:12px;color:var(--ink-light)">No creatures found</div>';
  $('#search-results').innerHTML=h;
}
function onSearchKey(e){
  if(e.key==='Escape'){toggleSearch();return}
  if(e.key==='ArrowDown'){searchFocusIdx=Math.min(searchFocusIdx+1,searchRes.length-1);renderSR();e.preventDefault()}
  if(e.key==='ArrowUp'){searchFocusIdx=Math.max(searchFocusIdx-1,0);renderSR();e.preventDefault()}
  if(e.key==='Enter'&&searchRes[searchFocusIdx]){selectFS(searchRes[searchFocusIdx].id)}
}
function selectFS(id){toggleSearch();switchView('map');mapRevealed=true;selectCreature(id)}

document.addEventListener('keydown',function(e){
  var notTyping=document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA';
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&notTyping){e.preventDefault();toggleSearch()}
  if(e.key==='Escape'){if(grimFullscreen){e.preventDefault();grimToggleFS()}else if($('#search-overlay').classList.contains('open'))toggleSearch();else if(selectedCreature)closeDetail()}
  if((currentView==='field-guide'||grimFullscreen)&&notTyping){
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();grimFlip(-1)}
    if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '){e.preventDefault();grimFlip(1)}
    if(e.key==='f'||e.key==='F'){e.preventDefault();grimToggleFS()}
    if(e.key==='Home'){e.preventDefault();grimPage=0;if(grimFullscreen)grimRenderFS();else render()}
    if(e.key==='End'){e.preventDefault();var pp=buildGrimPages();grimPage=Math.floor((pp.length-1)/2)*2;if(grimFullscreen)grimRenderFS();else render()}
  }
});

// boot moved to end of file (Expedition state must exist before the chart renders)

// ═══════════════════════════════════════
// EXPEDITION MODE — collection, trials, XP
// ═══════════════════════════════════════
var EXP_KEY='nf-expedition-v1';
var TITLES=[[0,'Novice Cartographer','\u{1F9ED}'],[50,'Creature Scout','\u{1F50D}'],[120,'Threat Analyst','\u{1F4CB}'],[200,'Beast Scholar','\u{1F4D6}'],[350,'Field Researcher','\u{1F52C}'],[500,'Keeper of the Map','\u{1F5DD}️'],[750,'Master Cartographer','\u{1F5FA}️'],[1000,'Grand Cartographer','\u{1F451}']];
var exp=expLoad();
var trialState=null;

function expLoad(){
  try{var s=JSON.parse(localStorage.getItem(EXP_KEY));if(s&&s.version===1)return s}catch(e){}
  return {recorded:[],contained:[],xp:0,wins:0,losses:0,streak:0,bestStreak:0,version:1,createdAt:new Date().toISOString()};
}
function expSave(){try{localStorage.setItem(EXP_KEY,JSON.stringify(exp))}catch(e){}}
function expTitle(){var t=TITLES[0];for(var i=0;i<TITLES.length;i++){if(exp.xp>=TITLES[i][0])t=TITLES[i]}return t}
function expNext(){for(var i=0;i<TITLES.length;i++){if(exp.xp<TITLES[i][0])return TITLES[i]}return null}
function expMult(){return exp.streak>=5?2:exp.streak>=3?1.5:exp.streak>=2?1.25:1}
function expToast(msg){
  var t=$('#exp-toast');if(t)t.remove();
  t=document.createElement('div');t.id='exp-toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){if(t.parentNode)t.remove()},2600);
}
function expRecord(id){
  if(exp.recorded.indexOf(id)>=0)return;
  var oldT=expTitle();
  exp.recorded.push(id);exp.xp+=10;expSave();expChip();
  var newT=expTitle();
  if(newT[1]!==oldT[1])expToast(newT[2]+' New title: '+newT[1]);
  else expToast('\u{1F50D} Specimen recorded · +10 XP');
}

// ── HUD chip ──
function expChip(){
  var chip=$('#exp-chip');
  if(!chip){
    chip=document.createElement('button');chip.id='exp-chip';
    chip.setAttribute('onclick','toggleExpPop()');
    var util=document.querySelector('#atlas-rail .rail-util');
    if(util)util.insertBefore(chip,util.firstChild);
  }
  var t=expTitle(),n=expNext();
  var pct=n?Math.max(0,Math.min(100,(exp.xp-t[0])/(n[0]-t[0])*100)):100;
  var h=t[2]+' <span>'+exp.xp+' XP</span><span class="xpbar"><div style="width:'+pct+'%"></div></span>';
  h+='<span title="Specimens recorded">\u{1F50D} '+exp.recorded.length+'/'+allCreatures.length+'</span>';
  h+='<span title="Threats contained">⚔️ '+exp.contained.length+'</span>';
  if(exp.streak>=2)h+='<span class="streak" title="Trial win streak — '+expMult()+'x XP">\u{1F525}'+exp.streak+'</span>';
  chip.innerHTML=h;
  chip.title=t[1]+(n?' — '+(n[0]-exp.xp)+' XP to '+n[1]:' — the map is complete');
}

// ── Detail-panel strip ──
function expDetailStrip(c){
  var recorded=exp.recorded.indexOf(c.id)>=0;
  var contained=exp.contained.indexOf(c.id)>=0;
  var h='<div class="exp-strip">';
  if(recorded)h+='<span class="recorded-seal">✓ Recorded</span>';
  if(contained)h+='<span class="recorded-seal contained-seal">⚔️ Contained</span>';
  else h+='<button class="trial-writ" onclick="startTrial(\''+c.id+'\')">⚔️ Field Trial</button>';
  h+='</div>';
  return h;
}

// ── Field Trial ──
function startTrial(id){
  var c=gc(id);if(!c)return;
  var pool=allCreatures.filter(function(x){return x.id!==c.id&&x.countermeasure.name!==c.countermeasure.name});
  for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tp=pool[i];pool[i]=pool[j];pool[j]=tp}
  var opts=[{label:c.countermeasure.name,correct:true}];
  pool.slice(0,3).forEach(function(x){opts.push({label:x.countermeasure.name,correct:false})});
  for(var k=opts.length-1;k>0;k--){var m=Math.floor(Math.random()*(k+1));var to=opts[k];opts[k]=opts[m];opts[m]=to}
  trialState={cid:c.id,opts:opts,done:false,won:false,picked:-1};
  renderTrial();
}
function trialOverlayEl(){
  var ov=$('#trial-overlay');
  if(!ov){ov=document.createElement('div');ov.id='trial-overlay';ov.setAttribute('onclick','if(event.target===this)closeTrial()');document.body.appendChild(ov)}
  ov.hidden=false;
  return ov;
}
function renderTrial(){
  var ts=trialState;if(!ts)return;
  var c=gc(ts.cid);var r=gr(c.region);
  var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
  var h='<div class="trial-card" role="dialog" aria-modal="true" aria-label="Field trial: '+esc(c.name)+'">';
  h+='<h2>⚔️ FIELD TRIAL'+(exp.streak>=2?' <span style="font-size:10px;color:var(--gilt)">'+tallySVG(exp.streak)+' '+expMult()+'x</span>':'')+'</h2>';
  h+='<div class="trial-creature"><span class="ti">'+c.icon+'</span><div><h3>'+esc(c.name)+'</h3><p>'+esc(r?r.name:'')+' · '+esc(c.threatClass)+' · threat '+score+'/15</p></div></div>';
  if(!ts.done){
    h+='<p class="trial-q">Every creature of the latent space has a weakness — a real countermeasure from AI safety research. Name the technique that contains this one. <span style="opacity:0.6">Press 1–'+ts.opts.length+' or click.</span></p>';
    ts.opts.forEach(function(o,i){
      h+='<button class="trial-opt" onclick="answerTrial('+i+')"><span class="num">'+(i+1)+'</span><span>'+esc(o.label)+'</span></button>';
    });
    h+='<div class="trial-actions"><button class="ghost" onclick="closeTrial()">Retreat</button></div>';
  }else{
    ts.opts.forEach(function(o,i){
      var cls='trial-opt';
      if(o.correct)cls+=' correct';else if(i===ts.picked)cls+=' wrong';else cls+=' dim';
      h+='<div class="'+cls+'"><span class="num">'+(i+1)+'</span><span>'+esc(o.label)+'</span></div>';
    });
    if(ts.won){
      h+='<div class="trial-verdict win"><span class="stamp probatum">PROBATVM</span><h3>THE LIGHT PREVAILS</h3><p style="font-size:11px;color:var(--ink-light)">The darkness recedes.</p><p class="xp">+'+ts.xpEarned+' XP'+(ts.mult>1?' ('+ts.mult+'x streak)':'')+'</p>'+(ts.newTitle?'<p style="margin-top:6px;font-size:12px;font-weight:700;color:#b45309">⭐ New title: '+ts.newTitle+'</p>':'')+(ts.mastered?'<p style="margin-top:6px;font-size:12px;font-weight:700;color:#b45309">\u{1F3F4} '+esc(ts.mastered)+' MASTERED · +100 XP</p>':'')+'</div>';
      h+='<div class="trial-note"><strong>'+esc(gc(ts.cid).countermeasure.name)+'</strong> — '+esc(truncSentences(gc(ts.cid).countermeasure.description,2))+'</div>';
      h+='<div class="trial-actions"><button class="primary" onclick="closeTrial()">CONTINUE THE EXPEDITION</button></div>';
    }else{
      h+='<div class="trial-verdict loss"><span class="stamp reprobatum">REPROBATVM</span><h3>THE DARKNESS PERSISTS</h3><p style="font-size:12px;color:var(--ink)">The correct technique was <strong>'+esc(gc(ts.cid).countermeasure.name)+'</strong>.</p></div>';
      h+='<div class="trial-note">'+esc(truncSentences(gc(ts.cid).countermeasure.description,2))+'</div>';
      h+='<div class="trial-actions"><button class="primary" onclick="startTrial(\''+ts.cid+'\')">FIGHT AGAIN</button><button class="ghost" onclick="closeTrial()">Retreat</button></div>';
    }
  }
  h+='</div>';
  trialOverlayEl().innerHTML=h;
}
function answerTrial(i){
  var ts=trialState;if(!ts||ts.done)return;
  ts.done=true;ts.picked=i;ts.won=!!ts.opts[i].correct;
  var c=gc(ts.cid);
  if(ts.won){
    var oldT=expTitle();
    ts.mult=expMult();
    var score=c.threatGradient.likelihood+c.threatGradient.impact+c.threatGradient.detectability;
    ts.xpEarned=Math.round((25+score*2)*ts.mult);
    exp.xp+=ts.xpEarned;exp.wins++;exp.streak++;
    if(exp.streak>exp.bestStreak)exp.bestStreak=exp.streak;
    var newlyContained=exp.contained.indexOf(c.id)<0;
    if(newlyContained)exp.contained.push(c.id);
    var newT=expTitle();
    ts.newTitle=newT[1]!==oldT[1]?newT[1]:null;
    ts.mastered=null;
    if(newlyContained){
      var mates=gcr(c.region);
      var allDone=mates.every(function(x){return exp.contained.indexOf(x.id)>=0});
      if(allDone&&mates.length){ts.mastered=(gr(c.region)||{}).name||c.region;exp.xp+=100}
    }
    expSave();expChip();
    if(currentView==='map')render();
    if(exp.contained.length===allCreatures.length){renderTrial();setTimeout(showCapstone,1400)}
    else renderTrial();
    if(selectedCreature&&selectedCreature.id===c.id)renderDetail();
  }else{
    exp.losses++;exp.streak=0;
    expSave();expChip();
    renderTrial();
  }
}
function closeTrial(){trialState=null;var ov=$('#trial-overlay');if(ov)ov.hidden=true}

// ── Progress popover ──
function toggleExpPop(){
  var p=$('#exp-pop');
  if(p&&!p.hidden){p.hidden=true;return}
  if(!p){p=document.createElement('div');p.id='exp-pop';document.body.appendChild(p)}
  var t=expTitle(),n=expNext();
  var h='<h3>CARTOGRAPHER’S LEDGER</h3>';
  h+='<div class="exp-title-row"><span style="font-size:20px">'+t[2]+'</span><div>'+t[1]+'<div style="font-size:10px;font-weight:400;color:var(--ink-light)">'+exp.xp+' XP'+(n?' · '+(n[0]-exp.xp)+' to '+n[1]:' · the map is complete')+'</div></div></div>';
  regions.forEach(function(r){
    var cs=gcr(r.id);
    var rec=cs.filter(function(x){return exp.recorded.indexOf(x.id)>=0}).length;
    var con=cs.filter(function(x){return exp.contained.indexOf(x.id)>=0}).length;
    var pct=cs.length?Math.round(con/cs.length*100):0;
    h+='<div class="rrow"><span style="width:10px;height:10px;border-radius:99px;background:'+r.color.accent+';flex-shrink:0'+(con===cs.length&&cs.length?';box-shadow:0 0 6px '+r.color.accent:'')+'"></span>';
    h+='<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.name)+(con===cs.length&&cs.length?' ★':'')+'</span>';
    h+='<span class="rbar"><div style="width:'+pct+'%;background:'+r.color.accent+'"></div></span>';
    h+='<span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-light)">'+rec+'/'+cs.length+' · ⚔️'+con+'</span></div>';
  });
  h+='<div style="display:flex;gap:10px;margin-top:10px;font-size:10px;color:var(--ink-light)"><span>⚔️ '+exp.wins+'W / '+exp.losses+'L</span><span>\u{1F525} best '+exp.bestStreak+'</span></div>';
  if(exp.contained.length===allCreatures.length)h+='<button class="reset" style="color:#b45309;border-color:rgba(180,83,9,0.4);margin-top:8px" onclick="showCapstone()">\u{1F451} View your completion</button>';
  h+='<button class="reset" onclick="expReset()">Reset expedition progress</button>';
  p.innerHTML=h;p.hidden=false;
}
function expReset(){
  if(!confirm('Chart a new map? This clears all recorded specimens, containments, and XP.'))return;
  exp={recorded:[],contained:[],xp:0,wins:0,losses:0,streak:0,bestStreak:0,version:1,createdAt:new Date().toISOString()};
  expSave();expChip();
  var p=$('#exp-pop');if(p)p.hidden=true;
  var cap=$('#capstone-overlay');if(cap)cap.hidden=true;
  if(selectedCreature)renderDetail();
  expToast('\u{1F9ED} A fresh map. The expedition begins anew.');
}

// ── Completion capstone ──
function showCapstone(){
  var ov=$('#capstone-overlay');
  if(!ov){ov=document.createElement('div');ov.id='capstone-overlay';ov.setAttribute('onclick','if(event.target===this)this.hidden=true');document.body.appendChild(ov)}
  var wr=exp.wins+exp.losses>0?Math.round(exp.wins/(exp.wins+exp.losses)*100):100;
  var h='<div class="capstone-card" role="dialog" aria-modal="true" aria-label="The map is complete">';
  h+='<div style="font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(245,158,11,0.7);margin-bottom:10px">The Map Is Complete</div>';
  h+='<div class="crown">\u{1F451}</div><h2>GRAND CARTOGRAPHER</h2><p class="sub">You have charted the whole of the dark.</p>';
  h+='<p class="epi">Every danger advanced intelligence could pose has already appeared in nature, myth, or story — and you have named them all. The territory beyond human-level intelligence is still real. Still approaching. But it is no longer unmapped.</p>';
  h+='<div class="stats"><div><b>'+exp.recorded.length+'/'+allCreatures.length+'</b><span>Recorded</span></div><div><b>'+exp.contained.length+'/'+allCreatures.length+'</b><span>Contained</span></div><div><b>'+regions.length+'/'+regions.length+'</b><span>Regions</span></div><div><b>'+exp.bestStreak+'</b><span>Best Streak</span></div><div><b>'+wr+'%</b><span>Win Rate</span></div><div><b>'+exp.xp+'</b><span>Total XP</span></div></div>';
  h+='<div class="trial-actions"><button class="primary" onclick="document.getElementById(\'capstone-overlay\').hidden=true">CONTEMPLATE THE MAP</button><button class="ghost" onclick="expReset()">CHART A NEW MAP</button></div>';
  h+='<div class="fin">Here be dragons — and now they are named.</div>';
  h+='</div>';
  ov.innerHTML=h;ov.hidden=false;
}


function tallySVG(n){
  var groups=Math.floor(n/5),rem=n%5,x=2,svg='';
  function strokes(cnt,gx,cross){
    var out='';
    for(var i=0;i<cnt;i++)out+='<line x1="'+(gx+i*4)+'" y1="2" x2="'+(gx+i*4)+'" y2="14" stroke="currentColor" stroke-width="1.4"/>';
    if(cross)out+='<line x1="'+(gx-2)+'" y1="12" x2="'+(gx+14)+'" y2="4" stroke="currentColor" stroke-width="1.4"/>';
    return out;
  }
  for(var g=0;g<groups;g++){svg+=strokes(4,x,true);x+=22}
  if(rem){svg+=strokes(rem,x,false);x+=rem*4+4}
  return '<svg width="'+Math.max(x,6)+'" height="16" viewBox="0 0 '+Math.max(x,6)+' 16" style="vertical-align:-3px">'+svg+'</svg>';
}


function toggleLegend(){
  var ov=$('#legend-overlay');
  if(ov&&!ov.hidden){ov.hidden=true;return}
  if(!ov){ov=document.createElement('div');ov.id='legend-overlay';ov.setAttribute('onclick','if(event.target===this)this.hidden=true');document.body.appendChild(ov)}
  var h='<div class="legend-card" role="dialog" aria-modal="true" aria-label="How to read this chart">';
  h+='<h2>LEGENDA · HOW TO READ THIS CHART</h2>';
  function row(sw,txt){return '<div class="leg-row"><span class="leg-swatch">'+sw+'</span><span class="leg-text">'+txt+'</span></div>'}
  h+=row('<svg viewBox="0 0 34 24" width="34" height="24"><path d="M3 12 C5 5,10 3,17 4 C26 3,31 7,31 12 C31 18,25 21,17 20 C9 21,3 19,3 12 Z" fill="var(--land)" stroke="var(--ink)" stroke-width="1.2"/></svg>','A <b>territory</b> is one class of AI threat. Its name takes a gold leaf ✦ when you master every creature within.');
  h+=row('<span class="ring" style="width:26px;height:26px"><span style="font-size:13px;filter:grayscale(1) opacity(.72)">🐍</span></span>','A <b>sigil</b> is one creature. Grey ink means <b>unrecorded</b> — open its dossier to record it and it takes colour.');
  h+=row('<span class="ring" style="width:26px;height:26px"><span style="font-size:13px">🐍</span><span style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;border-radius:50%;background:var(--gilt);border:1.5px solid var(--parchment)"></span></span>','A <b>gilt pip</b> means <b>contained</b> — you named its true countermeasure in a field trial.');
  h+=row('<span class="ring" style="width:26px;height:26px;border-color:var(--vermilion)"><span style="font-size:13px">👻</span></span>','A <b>vermilion ring</b> marks a threat with <b>confirmed sightings</b> in the real world.');
  h+=row('<svg viewBox="0 0 34 24" width="34" height="24"><line x1="2" y1="12" x2="32" y2="12" stroke="var(--vermilion)" stroke-width="1.6" stroke-dasharray="6 4"/></svg>','<b>Crimson routes</b> join a selected creature to its <b>compound risks</b> — patterns that amplify one another.');
  h+=row('<svg viewBox="0 0 34 24" width="34" height="24"><line x1="2" y1="12" x2="32" y2="12" stroke="var(--gilt)" stroke-width="1.4" stroke-dasharray="3 5"/></svg>','<b>Gold routes</b> (toggle LVMEN) show the <b>wards of hope</b> and the threats each one counters.');
  h+=row('<span style="font-family:var(--font-display);font-size:14px;color:var(--gilt)">✦</span>','Sigils grow with <b>threat score</b>; every dossier ends in a real countermeasure. Nothing here is beyond warding.');
  h+='<div class="trial-actions" style="margin-top:14px"><button class="primary" onclick="document.getElementById(\'legend-overlay\').hidden=true">TO THE CHART</button></div>';
  h+='</div>';
  ov.innerHTML=h;ov.hidden=false;
}

// ── Trial keyboard (capture, so it preempts the app-level Escape) ──
document.addEventListener('keydown',function(e){
  var cap=$('#capstone-overlay');
  if(cap&&!cap.hidden&&e.key==='Escape'){e.stopPropagation();cap.hidden=true;return}
  var leg=$('#legend-overlay');
  if(leg&&!leg.hidden&&e.key==='Escape'){e.stopPropagation();leg.hidden=true;return}
  var ov=$('#trial-overlay');
  if(!ov||ov.hidden)return;
  if(e.key==='Escape'){e.stopPropagation();closeTrial();return}
  if(trialState&&!trialState.done){
    var n=parseInt(e.key,10);
    if(n>=1&&n<=trialState.opts.length){e.stopPropagation();answerTrial(n-1)}
  }else if(trialState&&trialState.done&&e.key==='Enter'){
    e.stopPropagation();
    if(trialState.won)closeTrial();else startTrial(trialState.cid);
  }
},true);

initTheme();
try{if(localStorage.getItem('nf-entered'))mapRevealed=true}catch(e){}
render();
expChip();
