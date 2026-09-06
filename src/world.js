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
 for(let row=0;row<2;row++)for(let col=0;col<4;col++){
  const cx=10+20*col,cy=5+10*row,w=rng.int(6,12),h=rng.int(4,6),r={id:l.rooms.length,x:cx-Math.floor(w/2),y:cy-Math.floor(h/2),w,h,cx,cy,lit:depth<4||rng.next()<.7,doors:[]};l.rooms.push(r);
  for(let y=r.y;y<r.y+h;y++)for(let x=r.x;x<r.x+w;x++)put(x,y,'floor',{room:r.id});
 }
 // A randomized spanning tree of grid neighbors, with occasional extra loops.
 const plannedShop=branch==='Mines'&&depth===3||branch==='Dungeons'&&depth>1&&depth<20&&(depth===2||rng.next()<.18);const edges=[];for(let i=0;i<8;i++){if(i%4<3)edges.push([i,i+1]);if(i<4)edges.push([i,i+4]);}
 const parent=Array.from({length:8},(_,i)=>i),root=i=>parent[i]===i?i:parent[i]=root(parent[i]);
 for(const [a,b]of rng.shuffle(edges.filter(([a,b])=>!plannedShop||a!==2&&b!==2||a===1&&b===2))){
  const ra=root(a),rb=root(b);if(ra===rb&&rng.next()>.18)continue;parent[ra]=rb;
  const r=l.rooms[a],s=l.rooms[b],dx=Math.sign(s.cx-r.cx),dy=Math.sign(s.cy-r.cy);
  for(let x=r.cx,y=r.cy;x!==s.cx||y!==s.cy;x+=dx,y+=dy)if(tile(x,y).type==='rock')put(x,y,'corridor');
  for(const room of [r,s]){
   const toward=room===r?1:-1,x=dx?(toward>0?room.x+room.w:room.x-1):room.cx,y=dy?(toward>0?room.y+room.h:room.y-1):room.cy;
   put(x,y,rng.next()<.2?'openDoor':depth>1&&rng.next()<.06?'secret':'door',{axis:dx?'x':'y',locked:rng.next()<.15,doorRoom:room.id});room.doors.push({x,y});
  }
 }
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(tile(x,y).type==='rock'&&N.DIRS.some(([dx,dy])=>!['rock','wall'].includes(tile(x+dx,y+dy)?.type||'rock')))put(x,y,'wall');
 l.up=center(l.rooms[0]);l.down=center(l.rooms[7]);put(l.up.x,l.up.y,'up');put(l.down.x,l.down.y,'down');
 const clear=p=>tile(p.x,p.y).type==='floor'&&!l.items.some(o=>N.distance(o,p)===0)&&!l.monsters.some(o=>N.distance(o,p)===0)&&!l.traps.some(o=>N.distance(o,p)===0)&&!l.boulders.some(o=>N.distance(o,p)===0)&&!cardinal.some(([dx,dy])=>['door','secret','openDoor'].includes(tile(p.x+dx,p.y+dy)?.type));
 const available=r=>rng.pick(l.tiles.flat().filter(t=>t.room===r.id&&clear(t)&&N.distance(t,l.up)>2));
 const feature=(type,r,extra={})=>{let p=available(r);if(p)put(p.x,p.y,type,{facing:rng.int(0,3),...extra});return p;};
 const item=(name,category,r,extra={})=>{let p=available(r);if(p)l.items.push({x:p.x,y:p.y,item:g.createItem(name,category,extra)});};
 // Shops use leaf rooms: a single real entrance and an unobstructed guard square.
 const shopRoom=plannedShop?l.rooms.find(r=>r.id!==0&&r.id!==7&&r.doors.length===1):null;
 if(shopRoom){
  shopRoom.shop=true;shopRoom.lit=true;const door=shopRoom.doors[0],entrance={x:door.x+Math.sign(shopRoom.cx-door.x),y:door.y+Math.sign(shopRoom.cy-door.y)},home={x:entrance.x+Math.sign(shopRoom.cx-entrance.x),y:entrance.y+Math.sign(shopRoom.cy-entrance.y)},id=branch+':'+depth+':'+shopRoom.id;
  put(door.x,door.y,'openDoor',{locked:false});l.shops.push({id,room:shopRoom.id,door,entrance,home,debit:0,credit:0});
  l.monsters.push(g.makeMonster(N.monsterDef('shopkeeper'),home.x,home.y,{peaceful:true,shopkeeper:true,shopId:id,name:branch==='Mines'?'Izchak':'Asidonhopo'}));
  for(let n=0;n<7;n++){const p=available(shopRoom);if(p&&N.distance(p,entrance)>1){const it=g.randomItem();Object.assign(it,{unpaid:true,shopId:id,price:Math.max(5,Math.ceil(g.def(it).cost*1.33))});l.items.push({x:p.x,y:p.y,item:it});}}
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
 // Encounters cannot spawn on the arrival stair or its immediate neighbors.
 const opening=available(l.rooms[0]);if(opening&&depth===1&&branch==='Dungeons')l.monsters.push(g.makeMonster(N.monsterDef('goblin'),opening.x,opening.y));
 for(const [target,parentDepth]of [['Mines',3],['Sokoban',7],['Quest',14]])if(branch==='Dungeons'&&depth===parentDepth){const p=feature('branch',l.rooms[1],{destination:target});l.branchStair={x:p.x,y:p.y};}
 if(branch==='Mines'&&depth===3){const altar=feature('altar',l.rooms[4],{align:rng.pick(['Lawful','Neutral','Chaotic']),temple:true});l.rooms[4].temple=true;const p=available(l.rooms[4]);if(p&&altar)l.monsters.push(g.makeMonster(N.monsterDef('aligned priest'),p.x,p.y,{peaceful:true,priest:true,align:altar.align}));}
 if(branch==='Mines'&&depth===8){put(l.down.x,l.down.y,'floor');item('luckstone','gem',l.rooms[7],{buc:0});}
 if(branch==='Quest'){const q=N.questData[g.player.role];if(depth===1){const p=available(l.rooms[0]);if(p)l.monsters.push(g.makeMonster(N.monsterDef(q.leader),p.x,p.y,{questLeader:true,peaceful:true}));}if(depth===3){put(l.down.x,l.down.y,'floor');const p=available(l.rooms[7]);if(p)l.monsters.push(g.makeMonster(N.monsterDef(q.nemesis),p.x,p.y,{questBoss:true}));}}
 if(branch==='Dungeons'&&depth===22){const p=available(l.rooms[7]);if(p)l.monsters.push(g.makeMonster(N.monsterDef('Medusa'),p.x,p.y));}
 if(branch==='Dungeons'&&depth===25){feature('throne',l.rooms[7]);item('wishing','wand',l.rooms[7],{charges:3,known:false,buc:0});}
 if(branch==='Dungeons'&&depth===27){const p=available(l.rooms[7]);if(p)l.monsters.push(g.makeMonster(N.monsterDef('Vlad the Impaler'),p.x,p.y,{lootSpec:[{name:'Candelabrum of Invocation',category:'tool',extra:{candles:0}}]}));item('wax candle','tool',l.rooms[6],{count:7,buc:0});}
 if(branch==='Dungeons'&&depth===29){const p=available(l.rooms[7]);if(p)l.monsters.push(g.makeMonster(N.monsterDef('Wizard of Yendor'),p.x,p.y,{lootSpec:[{name:'Book of the Dead',category:'spellbook'}]}));}
 if(branch==='Dungeons'&&depth===30){put(l.down.x,l.down.y,'floor',{invocation:true});l.invocation={...l.down};}
 if(branch==='Dungeons'&&depth===31){put(l.down.x,l.down.y,'altar',{align:'Unaligned',highAltar:true});const p=available(l.rooms[7]);if(p)l.monsters.push(g.makeMonster(N.monsterDef('high priest'),p.x,p.y,{lootSpec:[{name:'Amulet of Yendor',category:'amulet'}]}));}
 if(branch==='Sokoban')return sokoban(g,l);
 if(['Earth','Air','Fire','Water','Astral'].includes(branch)){
  put(l.up.x,l.up.y,'floor');const next={Earth:'Air',Air:'Fire',Fire:'Water',Water:'Astral'}[branch];
  put(l.down.x,l.down.y,next?'portal':'floor',{destination:next});
  if(branch==='Astral')for(const [i,align]of ['Lawful','Neutral','Chaotic'].entries())feature('altar',l.rooms[5+i],{align,highAltar:true});
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
