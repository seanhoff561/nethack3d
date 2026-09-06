/* Seeded architecture and branch content. Room walls are never corridor routes. */
(() => {
'use strict';
const N=globalThis.NH,cardinal=[[1,0],[-1,0],[0,1],[0,-1]];
N.branches={Dungeons:{name:'The Dungeons of Doom',max:31},Mines:{name:'The Gnomish Mines',max:8,parent:3},Sokoban:{name:'Sokoban',max:4,parent:7},Quest:{name:'The Quest',max:3,parent:14},Earth:{name:'The Plane of Earth',max:1},Air:{name:'The Plane of Air',max:1},Fire:{name:'The Plane of Fire',max:1},Water:{name:'The Plane of Water',max:1},Astral:{name:'The Astral Plane',max:1}};
N.themes={
 Dungeons:{name:'Dungeons of Doom',stone:0xa2a197,floor:0x838b86,cloth:0x7b3437,fog:0x0b1114,light:0xb6d4e1},
 Mines:{name:'Gnomish Mines',stone:0x9c7753,floor:0x736450,cloth:0x546847,fog:0x17130e,light:0xe5bf86},
 Minetown:{name:'Minetown',stone:0xc0a279,floor:0x8b7960,cloth:0x9d7045,fog:0x171a14,light:0xf1d5a4},
 Sokoban:{name:'Sokoban',stone:0x7d9b8c,floor:0xb6b293,cloth:0x42746e,fog:0x101b19,light:0xc7e7d5},
 Quest:{name:'The Quest',stone:0x9a88ae,floor:0x7b728d,cloth:0x765599,fog:0x191322,light:0xd6c5ed},
 Medusa:{name:"Medusa's Island",stone:0x80a092,floor:0x687e6b,cloth:0x438777,fog:0x0d201f,light:0xaedace},
 Castle:{name:'The Castle',stone:0x9ba8bb,floor:0x67748b,cloth:0x93334c,fog:0x101827,light:0xc6d8f5},
 Gehennom:{name:'Gehennom',stone:0x725052,floor:0x504349,cloth:0x9f4135,fog:0x200e12,light:0xf18b69},
 Earth:{name:'The Plane of Earth',stone:0x947048,floor:0x786340,cloth:0x765c30,fog:0x1e170e,light:0xe0c08b},
 Air:{name:'The Plane of Air',stone:0xb6c7d8,floor:0x829eb4,cloth:0xd2e3f4,fog:0x253b50,light:0xe4f4ff},
 Fire:{name:'The Plane of Fire',stone:0x954b38,floor:0x603b31,cloth:0xe08135,fog:0x2b1009,light:0xffad63},
 Water:{name:'The Plane of Water',stone:0x4f8c9f,floor:0x41697e,cloth:0x6dcdc7,fog:0x08212e,light:0x8bdde8},
 Astral:{name:'The Astral Plane',stone:0xd8caa0,floor:0xb7b6a0,cloth:0xefcf80,fog:0x272734,light:0xffeed0}
};
N.themeFor=(branch,depth)=>branch==='Mines'?(depth===3?'Minetown':'Mines'):branch==='Dungeons'?(depth===22?'Medusa':depth===25?'Castle':depth>=26?'Gehennom':'Dungeons'):branch;
N.generateLevel=function(g,depth,branch){
 const rng=g.rng,W=80,H=21;
 const l={width:W,height:H,depth,branch,theme:N.themeFor(branch,depth),rooms:[],monsters:[],items:[],traps:[],boulders:[],engravings:{},shops:[],tiles:Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>({x,y,type:'rock',seen:false,visible:false})))};
 const tile=(x,y)=>l.tiles[y]?.[x],put=(x,y,type,extra={})=>Object.assign(tile(x,y),{type,...extra});
 const center=r=>({x:r.cx,y:r.cy});
 const safeRoom=n=>l.rooms[Math.min(Math.max(0,n),l.rooms.length-1)];
  // NetHack's ordinary levels are room-and-corridor layouts made from a
  // handful of compact rectangles. A few larger rooms are retained, but
  // most rooms stay small enough to leave the tunnels visually prominent.
  const target=rng.next()<.08?4:rng.next()<.08?11:rng.int(5,10),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const wallifyRoom=r=>{for(let yy=r.y-1;yy<=r.y+r.h;yy++)for(let xx=r.x-1;xx<=r.x+r.w;xx++)if(tile(xx,yy)?.type==='rock')put(xx,yy,'wall',{roomWall:true});};
 for(let tries=0;tries<900&&l.rooms.length<target;tries++){
   const compact=rng.next()<.84,w=compact?rng.int(2,9):rng.int(10,13),h=compact?rng.int(3,6):rng.int(7,8),x=rng.int(2,W-w-2),y=rng.int(2,H-h-2),r={id:l.rooms.length,x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2),lit:depth<4||rng.next()<.7,doors:[]};
   if(l.rooms.every(a=>r.x+r.w+2<a.x||a.x+a.w+2<r.x||r.y+r.h+2<a.y||a.y+a.h+2<r.y)){l.rooms.push(r);for(let yy=r.y;yy<r.y+r.h;yy++)for(let xx=r.x;xx<r.x+r.w;xx++)put(xx,yy,'floor',{room:r.id});wallifyRoom(r);}
 }
 // Connect every room to its nearest earlier room, then add a few loops.
  const edges=[];for(let i=1;i<l.rooms.length;i++){const r=l.rooms[i],ordered=l.rooms.slice(0,i).sort((a,b)=>(Math.abs(a.cx-r.cx)+Math.abs(a.cy-r.cy))-(Math.abs(b.cx-r.cx)+Math.abs(b.cy-r.cy)));edges.push([i,ordered[0].id]);if(i>2&&rng.next()<.18&&ordered[1])edges.push([i,ordered[1].id]);}
  const connect=(r,s)=>{const horizontal=Math.abs(s.cx-r.cx)>=Math.abs(s.cy-r.cy);let sx,sy,ex,ey;
   if(horizontal){const right=s.cx>r.cx;sx=right?r.x+r.w:r.x-1;ex=right?s.x-1:s.x+s.w;sy=clamp(r.cy+rng.int(-Math.floor(r.h/3),Math.floor(r.h/3)),r.y,r.y+r.h-1);ey=clamp(s.cy+rng.int(-Math.floor(s.h/3),Math.floor(s.h/3)),s.y,s.y+s.h-1);}
   else{const below=s.cy>r.cy;sy=below?r.y+r.h:r.y-1;ey=below?s.y-1:s.y+s.h;sx=clamp(r.cx+rng.int(-Math.floor(r.w/3),Math.floor(r.w/3)),r.x,r.x+r.w-1);ex=clamp(s.cx+rng.int(-Math.floor(s.w/3),Math.floor(s.w/3)),s.x,s.x+s.w-1);}
   const route=(start,end)=>{const key=p=>p.x+','+p.y,goal=key(end),prev=new Map([[key(start),null]]),queue=[start];for(let i=0;i<queue.length&&!prev.has(goal);i++){const p=queue[i];for(const [dx,dy]of rng.shuffle(cardinal)){const x=p.x+dx,y=p.y+dy,t=tile(x,y),k=x+','+y;if(!t||prev.has(k)||(t.roomWall&&k!==goal)||(t.type==='floor'&&t.room!==r.id&&t.room!==s.id))continue;prev.set(k,p);queue.push({x,y});if(k===goal)break;}}if(!prev.has(goal))return [start,end];const path=[];for(let p=end;p;p=prev.get(key(p)))path.push(p);return path.reverse();};
   const carve=(x,y)=>{if(tile(x,y)?.type==='rock'||tile(x,y)?.type==='wall')put(x,y,'corridor');};for(const p of route({x:sx,y:sy},{x:ex,y:ey}))carve(p.x,p.y);
   const putDoor=(p,room)=>{const q=tile(p.x,p.y),adjacent=N.DIRS.some(([dx,dy])=>['door','openDoor','secret'].includes(tile(p.x+dx,p.y+dy)?.type));if(adjacent){if(q?.type==='rock'||q?.type==='wall')put(p.x,p.y,'corridor');return false;}if(!q||!['rock','wall','corridor'].includes(q.type))return false;put(p.x,p.y,rng.next()<.12?'openDoor':depth>1&&rng.next()<.05?'secret':'door',{axis:horizontal?'x':'y',locked:rng.next()<.15,doorRoom:room,roomWall:false});return true;};
   const doorA={x:sx,y:sy},doorB={x:ex,y:ey};if(putDoor(doorA,r.id))r.doors.push(doorA);if(putDoor(doorB,s.id))s.doors.push(doorB);
  };
 for(const [a,b]of edges)connect(l.rooms[a],l.rooms[b]);
  // Keep tunnels one tile wide even where two winding routes cross.
  for(let pass=0;pass<2;pass++)for(let y=1;y<H-2;y++)for(let x=1;x<W-2;x++){const q=[tile(x,y),tile(x+1,y),tile(x,y+1),tile(x+1,y+1)];if(q.every(t=>t.type==='corridor'))q[3].type='floor';}
  const walkable=t=>t&&!['rock','wall'].includes(t.type),reachable=()=>{const start={x:l.rooms[0].cx,y:l.rooms[0].cy},out=new Set([`${start.x},${start.y}`]),q=[start];for(let i=0;i<q.length;i++){const a=q[i];for(const [dx,dy]of cardinal){const x=a.x+dx,y=a.y+dy,t=tile(x,y),k=`${x},${y}`;if(!walkable(t)||out.has(k))continue;out.add(k);q.push({x,y});}}return out;};
  let reach=reachable();for(const r of l.rooms)if(!reach.has(`${r.cx},${r.cy}`)){let x=r.cx,y=r.cy;while(x!==l.rooms[0].cx||y!==l.rooms[0].cy){if(tile(x,y)?.type==='rock'||tile(x,y)?.type==='wall')put(x,y,'corridor');if(x!==l.rooms[0].cx)x+=Math.sign(l.rooms[0].cx-x);else y+=Math.sign(l.rooms[0].cy-y);}reach=reachable();}
  for(const r of l.rooms)r.doors=r.doors.filter(p=>['door','openDoor','secret'].includes(tile(p.x,p.y).type));
  for(const r of l.rooms)for(const p of r.doors){const t=tile(p.x,p.y);if(t.axis==='x'){for(const dy of [-1,1]){const side=tile(p.x,p.y+dy);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}else{for(const dx of [-1,1]){const side=tile(p.x+dx,p.y);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}}reach=reachable();
  // Door jambs can seal a winding route when another room sits beside it.
  // Bridge any room left outside the connected component through its existing
  // doorway, preferring open stone and only cutting a second wall as a last resort.
  const bridge=(r)=>{const door=r.doors[0],start=door?{x:door.x+Math.sign(door.x-r.cx),y:door.y+Math.sign(door.y-r.cy)}:{x:r.cx,y:r.cy},key=p=>p.x+','+p.y;let open=[{p:start,c:0}],prev=new Map([[key(start),null]]),cost=new Map([[key(start),0]]),goal=null;while(open.length&&!goal){open.sort((a,b)=>a.c-b.c);const {p,c}=open.shift(),k=key(p);if(reach.has(k)&&k!==key(start)){goal=p;break;}for(const [dx,dy]of cardinal){const x=p.x+dx,y=p.y+dy,t=tile(x,y),nk=x+','+y;if(!t)continue;const next=c+(t.roomWall?18:t.type==='rock'?3:t.type==='wall'?5:t.type==='floor'&&t.room!==r.id?50:1);if(next>=(cost.get(nk)??Infinity))continue;cost.set(nk,next);prev.set(nk,p);open.push({p:{x,y},c:next});}}if(!goal){goal={x:l.rooms[0].cx,y:l.rooms[0].cy};prev.set(key(goal),null);let x=start.x,y=start.y;while(x!==goal.x||y!==goal.y){const next={x:x+(x===goal.x?0:Math.sign(goal.x-x)),y:y+(x===goal.x?Math.sign(goal.y-y):0)};prev.set(key(next),{x,y});x=next.x;y=next.y;}}let path=[];for(let p=goal;p;p=prev.get(key(p)))path.push(p);for(const p of path)if(tile(p.x,p.y)?.type==='rock'||tile(p.x,p.y)?.type==='wall')put(p.x,p.y,'corridor');reach=reachable();};
  for(const r of l.rooms)if(!reach.has(`${r.cx},${r.cy}`))bridge(r);
   for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(tile(x,y).type==='rock'&&N.DIRS.some(([dx,dy])=>walkable(tile(x+dx,y+dy))))put(x,y,'wall');
   for(const r of l.rooms)for(const p of r.doors){const t=tile(p.x,p.y);if(t.axis==='x'){for(const dy of [-1,1]){const side=tile(p.x,p.y+dy);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}else{for(const dx of [-1,1]){const side=tile(p.x+dx,p.y);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}}
  for(let x=0;x<W;x++){put(x,0,'wall');put(x,H-1,'wall');}for(let y=0;y<H;y++){put(0,y,'wall');put(W-1,y,'wall');}
  reach=reachable();for(const r of l.rooms)if(!reach.has(`${r.cx},${r.cy}`)){let x=r.cx,y=r.cy;while(x!==l.rooms[0].cx||y!==l.rooms[0].cy){if(tile(x,y)?.type==='rock'||tile(x,y)?.type==='wall')put(x,y,'corridor');if(x!==l.rooms[0].cx)x+=Math.sign(l.rooms[0].cx-x);else y+=Math.sign(l.rooms[0].cy-y);}reach=reachable();}
  for(let pass=0;pass<2;pass++)for(let y=1;y<H-2;y++)for(let x=1;x<W-2;x++){const q=[tile(x,y),tile(x+1,y),tile(x,y+1),tile(x+1,y+1)];if(q.every(t=>t.type==='corridor'))q[3].type='floor';}
   for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(tile(x,y).type==='rock'&&N.DIRS.some(([dx,dy])=>walkable(tile(x+dx,y+dy))))put(x,y,'wall');
   for(const r of l.rooms)for(const p of r.doors){const t=tile(p.x,p.y);if(t.axis==='x'){for(const dy of [-1,1]){const side=tile(p.x,p.y+dy);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}else{for(const dx of [-1,1]){const side=tile(p.x+dx,p.y);if(side&&!['door','openDoor','secret'].includes(side.type))side.type='wall';}}}
  l.up=center(l.rooms[0]);l.down=center(l.rooms[l.rooms.length-1]);put(l.up.x,l.up.y,'up');put(l.down.x,l.down.y,'down');
 const clear=p=>tile(p.x,p.y).type==='floor'&&!l.items.some(o=>N.distance(o,p)===0)&&!l.monsters.some(o=>N.distance(o,p)===0)&&!l.traps.some(o=>N.distance(o,p)===0)&&!l.boulders.some(o=>N.distance(o,p)===0)&&!cardinal.some(([dx,dy])=>['door','secret','openDoor'].includes(tile(p.x+dx,p.y+dy)?.type));
 const available=r=>rng.pick(l.tiles.flat().filter(t=>t.room===r.id&&clear(t)&&N.distance(t,l.up)>2));
 const feature=(type,r,extra={})=>{let p=available(r);if(p)put(p.x,p.y,type,{facing:rng.int(0,3),...extra});return p;};
 const item=(name,category,r,extra={})=>{let p=available(r);if(p)l.items.push({x:p.x,y:p.y,item:g.createItem(name,category,extra)});};
 // Shops use leaf rooms: a single real entrance and an unobstructed guard square.
 const plannedShop=branch==='Mines'&&depth===3||branch==='Dungeons'&&depth>=2&&depth<=21&&rng.next()<Math.min(1,3/depth);
 const shopRoom=plannedShop?(l.rooms.find(r=>r.id!==0&&r.id!==l.rooms.length-1&&r.doors.length===1)||l.rooms.find(r=>r.id!==0&&r.id!==l.rooms.length-1&&r.doors.length)):null;
 if(shopRoom){
  shopRoom.shop=true;shopRoom.lit=true;const door=shopRoom.doors[0],axis=tile(door.x,door.y).axis,entrance=axis==='x'?{x:door.x+Math.sign(shopRoom.cx-door.x),y:door.y}:{x:door.x,y:door.y+Math.sign(shopRoom.cy-door.y)},home=axis==='x'?{x:entrance.x+Math.sign(shopRoom.cx-entrance.x),y:entrance.y}:{x:entrance.x,y:entrance.y+Math.sign(shopRoom.cy-entrance.y)},id=branch+':'+depth+':'+shopRoom.id;
  put(door.x,door.y,'openDoor',{locked:false});l.shops.push({id,room:shopRoom.id,door,entrance,home,debit:0,credit:0});
  l.monsters.push(g.makeMonster(N.monsterDef('shopkeeper'),home.x,home.y,{peaceful:true,shopkeeper:true,shopId:id,name:branch==='Mines'?'Izchak':'Asidonhopo'}));
  const shopTypes=[['general',42],['armor',14],['book',10],['liquor',10],['weapons',5],['food',5],['jeweler',3],['apparel',3],['hardware',3],['rare books',3],['health food',2]];shopRoom.shopType=rng.weighted(shopTypes,x=>x[1])[0];for(let n=0;n<rng.int(5,12);n++){const p=available(shopRoom);if(p&&N.distance(p,entrance)>1){const it=g.shopItem(shopRoom.shopType);Object.assign(it,{unpaid:true,shopId:id,price:Math.max(5,Math.ceil(g.def(it).cost*1.33))});l.items.push({x:p.x,y:p.y,item:it});}}
 }
 for(const r of l.rooms){
  if(r.shop)continue;
  if(branch==='Dungeons'&&rng.int(1,60)===1)feature('altar',r,{align:rng.pick(['Lawful','Neutral','Chaotic'])});
  if(rng.int(1,10)===1)feature('fountain',r);
  if(rng.int(1,60)===1)feature('sink',r);
  if(depth>1&&rng.int(1,25)===1)feature('grave',r);
  for(let n=0,count=rng.int(0,2);n<count;n++){let p=available(r);if(p)l.items.push({x:p.x,y:p.y,item:g.randomItem()});}
  if(r.id!==0){
   for(let n=0,count=rng.int(0,Math.min(4,1+Math.ceil(depth/8)));n<count;n++){let p=available(r);if(p){const mine=branch==='Mines'&&rng.next()<.65,def=mine?N.monsterDef(rng.pick(depth<4?['gnome','dwarf']:['gnome lord','dwarf','gnomish wizard'])):g.randomMonster(branch==='Mines'?depth+3:branch==='Quest'?depth+12:depth);const peaceful=mine&&['Dwarf','Gnome'].includes(g.player.race);l.monsters.push(g.makeMonster(def,p.x,p.y,{peaceful}));}}
   if(rng.next()<.23){let p=available(r);if(p)l.traps.push({x:p.x,y:p.y,type:rng.pick(['pit','arrow','dart','bear trap','sleeping gas','teleport','web',...(depth>8?['fire','rust','trapdoor']:[])]),seen:false});}
 }
 }
 // A throne room is a level feature, not a throne sprinkled through every room.
 if(depth>=5&&!shopRoom&&rng.int(1,6)===1){const throneRoom=rng.pick(l.rooms.slice(1));const throne=feature('throne',throneRoom,{court:true});if(throne)for(let n=0;n<rng.int(2,5);n++){const p=available(throneRoom);if(p){const d=g.randomMonster(depth+3);l.monsters.push(g.makeMonster(d,p.x,p.y,{peaceful:rng.next()<.35,court:true}));}}}
 // Encounters cannot spawn on the arrival stair or its immediate neighbors.
 const opening=available(l.rooms[0]);if(opening&&depth===1&&branch==='Dungeons')l.monsters.push(g.makeMonster(N.monsterDef('goblin'),opening.x,opening.y));
 for(const [target,parentDepth]of [['Mines',3],['Sokoban',7],['Quest',14]])if(branch==='Dungeons'&&depth===parentDepth){const p=feature('branch',l.rooms[1],{destination:target});l.branchStair={x:p.x,y:p.y};}
 if(branch==='Mines'&&depth===3){const temple=safeRoom(4);const altar=feature('altar',temple,{align:rng.pick(['Lawful','Neutral','Chaotic']),temple:true});temple.temple=true;const p=available(temple);if(p&&altar)l.monsters.push(g.makeMonster(N.monsterDef('aligned priest'),p.x,p.y,{peaceful:true,priest:true,align:altar.align}));}
 if(branch==='Mines'&&depth===8){put(l.down.x,l.down.y,'floor');item('luckstone','gem',safeRoom(7),{buc:0});}
 if(branch==='Quest'){const q=N.questData[g.player.role];if(depth===1){const p=available(l.rooms[0]);if(p)l.monsters.push(g.makeMonster(N.monsterDef(q.leader),p.x,p.y,{questLeader:true,peaceful:true}));}if(depth===3){put(l.down.x,l.down.y,'floor');const p=available(safeRoom(7));if(p)l.monsters.push(g.makeMonster(N.monsterDef(q.nemesis),p.x,p.y,{questBoss:true}));}}
 if(branch==='Dungeons'&&depth===22){const p=available(safeRoom(7));if(p)l.monsters.push(g.makeMonster(N.monsterDef('Medusa'),p.x,p.y));}
 if(branch==='Dungeons'&&depth===25){feature('throne',safeRoom(7));item('wishing','wand',safeRoom(7),{charges:3,known:false,buc:0});}
 if(branch==='Dungeons'&&depth===27){const p=available(safeRoom(7));if(p)l.monsters.push(g.makeMonster(N.monsterDef('Vlad the Impaler'),p.x,p.y,{lootSpec:[{name:'Candelabrum of Invocation',category:'tool',extra:{candles:0}}]}));item('wax candle','tool',safeRoom(6),{count:7,buc:0});}
 if(branch==='Dungeons'&&depth===29){const p=available(safeRoom(7));if(p)l.monsters.push(g.makeMonster(N.monsterDef('Wizard of Yendor'),p.x,p.y,{lootSpec:[{name:'Book of the Dead',category:'spellbook'}]}));}
 if(branch==='Dungeons'&&depth===30){put(l.down.x,l.down.y,'floor',{invocation:true});l.invocation={...l.down};}
 if(branch==='Dungeons'&&depth===31){put(l.down.x,l.down.y,'altar',{align:'Unaligned',highAltar:true});const p=available(safeRoom(7));if(p)l.monsters.push(g.makeMonster(N.monsterDef('high priest'),p.x,p.y,{lootSpec:[{name:'Amulet of Yendor',category:'amulet'}]}));}
 if(branch==='Sokoban')return sokoban(g,l);
 if(['Earth','Air','Fire','Water','Astral'].includes(branch)){
  put(l.up.x,l.up.y,'floor');const next={Earth:'Air',Air:'Fire',Fire:'Water',Water:'Astral'}[branch];
  put(l.down.x,l.down.y,next?'portal':'floor',{destination:next});
  if(branch==='Astral')for(const [i,align]of ['Lawful','Neutral','Chaotic'].entries())feature('altar',safeRoom(l.rooms.length-3+i),{align,highAltar:true});
  for(const r of l.rooms.slice(1)){const p=available(r);if(p)l.monsters.push(g.makeMonster(N.monsterDef(branch==='Astral'?'Angel':branch.toLowerCase()+' elemental'),p.x,p.y));}
 }
 return l;
};
function sokoban(g,l){
 // Four original, solvable warehouse layouts. Push each stone east into its pit.
 // Upper/lower bypasses let the player reposition without diagonal pushes.
 for(const t of l.tiles.flat())Object.assign(t,{type:'rock',room:undefined});
 l.rooms=[];l.monsters=[];l.items=[];l.traps=[];l.boulders=[];l.shops=[];l.noTeleport=true;l.noDig=true;
 const count=l.depth+2,x0=28,y0=3;
 for(let y=y0;y<=17;y++)for(let x=x0;x<=50;x++)if(y===y0||y===17||x===x0||x===50)l.tiles[y][x].type='wall';
 for(let y=4;y<17;y++)for(let x=29;x<50;x++)l.tiles[y][x].type='floor';
 for(let n=0;n<count;n++){const y=5+n*2;l.boulders.push({id:++g.uid,x:33,y});l.traps.push({x:44,y,type:'pit',seen:true,sokoban:true});for(let x=34;x<44;x++)if(y+1<17)l.tiles[y+1][x].type='wall';}
 l.up={x:30,y:4};l.down={x:48,y:16};l.tiles[4][30].type='up';l.tiles[16][48].type='down';l.puzzle={remaining:count,solved:false};
 l.items.push({x:30,y:16,item:g.createItem('food ration','food',{count:2,buc:0})});
 return l;
}
})();
