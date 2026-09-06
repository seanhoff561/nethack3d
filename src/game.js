/* A standalone turn-based JavaScript simulation. Rendering never advances time. */
(() => {
'use strict';
const N=globalThis.NH;
class RNG {
 constructor(seed){this.state=(typeof seed==='number'?seed:[...String(seed)].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619),2166136261))>>>0;}
 next(){let t=this.state+=0x6D2B79F5;this.state>>>=0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
 int(a,b){return a+Math.floor(this.next()*(b-a+1));}
 pick(a){return a[this.int(0,a.length-1)];}
 dice(n,s){let v=0;for(let i=0;i<n;i++)v+=this.int(1,Math.max(1,s));return v;}
 shuffle(a){a=[...a];for(let i=a.length-1;i;i--){let j=this.int(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
 weighted(a,fn){const sum=a.reduce((s,x)=>s+fn(x),0);let r=this.next()*sum;return a.find(x=>(r-=fn(x))<0)||a.at(-1);}
}
const DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const PROPS={FIRE_RES:'MR_FIRE',COLD_RES:'MR_COLD',SLEEP_RES:'MR_SLEEP',DISINT_RES:'MR_DISINT',SHOCK_RES:'MR_ELEC',POISON_RES:'MR_POISON',ACID_RES:'MR_ACID',STONE_RES:'MR_STONE',ANTIMAGIC:'magic resistance',REFLECTING:'reflection',FAST:'speed',INVIS:'invisibility',SEE_INVIS:'see invisible',LEVITATION:'levitation',WWALKING:'water walking',REGENERATION:'regeneration',TELEPAT:'telepathy',STEALTH:'stealth',SEARCHING:'searching',FREE_ACTION:'free action',SLOW_DIGESTION:'slow digestion'};
const roles={
 Valkyrie:{hp:16,pw:1,align:'Neutral',stats:[18,12,18,8,8,10],gear:[['long sword','weapon',1],['dagger','weapon'],['small shield','armor',3],['food ration','food']],props:['MR_COLD','stealth'],rank:'Stripling'},
 Wizard:{hp:10,pw:8,align:'Neutral',stats:[10,12,12,18,12,11],gear:[['quarterstaff','weapon',1],['cloak of magic resistance','armor'],['force bolt','spellbook'],['healing','spellbook'],['magic missile','wand'],['healing','potion',0,2],['food ration','food']],spells:['force bolt','healing'],rank:'Evoker'},
 Barbarian:{hp:16,pw:1,align:'Neutral',stats:[18,16,18,7,7,6],gear:[['two-handed sword','weapon'],['axe','weapon'],['ring mail','armor'],['food ration','food']],props:['MR_POISON'],rank:'Plunderer'},
 Archeologist:{hp:11,pw:1,align:'Lawful',stats:[12,10,12,16,16,9],gear:[['bullwhip','weapon',2],['leather jacket','armor'],['fedora','armor'],['pick-axe','tool'],['food ration','food',0,3],['sack','tool'],['touchstone','gem']],props:['stealth','speed'],rank:'Digger'},
 Caveman:{hp:14,pw:1,align:'Neutral',stats:[18,12,18,8,8,8],gear:[['club','weapon',1],['sling','weapon'],['flint','gem',0,15],['leather armor','armor']],rank:'Troglodyte'},
 Healer:{hp:11,pw:8,align:'Neutral',stats:[10,10,13,13,17,16],gear:[['scalpel','weapon'],['leather gloves','armor',1],['stethoscope','tool'],['healing','potion',0,4],['extra healing','potion',0,4],['sleep','wand'],['healing','spellbook'],['apple','food',0,5]],spells:['healing','extra healing'],props:['MR_POISON'],rank:'Rhizotomist',gold:1200},
 Knight:{hp:14,pw:4,align:'Lawful',stats:[16,10,14,8,14,17],gear:[['long sword','weapon'],['lance','weapon'],['ring mail','armor'],['helmet','armor'],['small shield','armor'],['leather gloves','armor'],['apple','food',0,10],['carrot','food',0,10]],rank:'Gallant'},
 Monk:{hp:14,pw:5,align:'Neutral',stats:[17,16,12,8,14,8],gear:[['leather gloves','armor',2],['robe','armor',1],['healing','potion',0,3],['food ration','food',0,3],['apple','food',0,5],['healing','spellbook']],spells:['healing'],props:['speed','MR_SLEEP'],rank:'Candidate'},
 Priest:{hp:12,pw:8,align:'Lawful',stats:[14,10,12,10,18,10],gear:[['mace','weapon',1],['robe','armor'],['small shield','armor'],['water','potion',0,4],['clove of garlic','food'],['healing','spellbook']],spells:['healing'],rank:'Aspirant'},
 Ranger:{hp:13,pw:1,align:'Neutral',stats:[15,18,14,10,12,8],gear:[['dagger','weapon',1],['bow','weapon',1],['arrow','weapon',2,50],['cloak of displacement','armor',2],['cram ration','food',0,4]],props:['searching'],rank:'Tenderfoot'},
 Rogue:{hp:12,pw:1,align:'Chaotic',stats:[15,18,13,10,10,9],gear:[['short sword','weapon'],['dagger','weapon',0,10],['leather armor','armor',1],['sickness','potion'],['lock pick','tool'],['sack','tool']],props:['stealth'],rank:'Footpad'},
 Samurai:{hp:15,pw:1,align:'Lawful',stats:[18,16,17,8,8,7],gear:[['katana','weapon'],['short sword','weapon'],['yumi','weapon'],['ya','weapon',0,35],['splint mail','armor']],props:['speed'],rank:'Hatamoto'},
 Tourist:{hp:10,pw:1,align:'Neutral',stats:[10,10,12,12,10,18],gear:[['dart','weapon',2,30],['food ration','food',0,6],['extra healing','potion',0,2],['magic mapping','scroll',0,4],['Hawaiian shirt','armor'],['expensive camera','tool'],['credit card','tool']],rank:'Rambler',gold:650}
};
const lookup=(name,cat)=>N.ITEMS.find(i=>i.name===name&&(!cat||i.category===cat));
const monsterDef=name=>N.MONSTERS.find(m=>m.name===name);
const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
class Game {
 constructor(seed='YENDOR',role='Knight',name='Arthur',options={}){
  this.version=1;this.seed=String(seed);this.rng=new RNG(seed);this.uid=0;this.turn=1;this.depth=1;this.branch='Dungeons';this.levels={};this.messages=[];this.events=[];this.identified={};this.appearances={};this.genocided=[];this.dead=false;this.won=false;this.prayerTurn=-1000;this.autopickup=true;this.autoOpenDoors=true;this.explore=false;this.conduct={kills:0,food:0,prayers:0};
  for(const cat of ['potion','scroll','wand','ring','spellbook','amulet']){let defs=N.ITEMS.filter(i=>i.category===cat&&i.appearance&&!(cat==='potion'&&i.name==='water')),shuffled=this.rng.shuffle(defs.map(i=>i.appearance));defs.forEach((d,i)=>this.appearances[cat+':'+d.name]=shuffled[i]);}this.appearances['potion:water']='clear';
  const r=roles[role]||roles.Knight;
  this.player={id:0,x:0,y:0,hp:r.hp,maxHp:r.hp,pw:r.pw,maxPw:r.pw,role:roles[role]?role:'Knight',name:name.slice(0,24)||'Arthur',race:'Human',align:r.align,stats:[...r.stats],rank:r.rank,xp:0,level:1,gold:r.gold||0,nutrition:900,inventory:[],equipment:{},properties:[...(r.props||[])],status:{},spells:(r.spells||[]).map(n=>({name:n,knowledge:20000})),luck:0,facing:[0,1]};
  for(const [n,c,en=0,count=1]of r.gear){let it=this.createItem(n,c,{enchant:en,count,known:true,buc:0,bucKnown:true});this.addItem(it);if(c==='weapon'&&!this.player.equipment.weapon)this.player.equipment.weapon=it.id;if(c==='armor')this.player.equipment[lookup(n,c)?.slot||'body']=it.id;}
  this.configureCharacter(options);this.getLevel();const p=this.level.up;this.player.x=p.x;this.player.y=p.y;
  const petTile=DIRS.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(p=>this.passable(p.x,p.y));if(petTile)this.spawn(role==='Knight'?'pony':role==='Wizard'?'kitten':'little dog',petTile.x,petTile.y,{tame:true,name:'Hachi'});
  this.log(`Welcome, ${this.player.name}. You are a ${this.player.align.toLowerCase()} ${this.player.race.toLowerCase()} ${this.player.role.toLowerCase()}.`,'story');this.log('You enter the Dungeons of Doom. Hachi follows at your heels.','story');this.updateVision();
 }
 get key(){return this.branch+':'+this.depth;}
 get level(){return this.levels[this.key];}
 get wornIds(){return [...new Set(Object.entries(this.player.equipment).filter(([slot])=>!['weapon','swap','quiver'].includes(slot)).map(([,id])=>id))];}
 get ac(){let ac=10;for(const id of this.wornIds){let i=this.player.inventory.find(i=>i.id===id),d=i&&this.def(i);if(d?.category==='armor')ac-=d.ac+(i.enchant||0);if(d?.name==='protection')ac-=i.enchant||0;}if(this.player.role==='Monk'&&!this.player.equipment.body)ac-=2+Math.floor(this.player.level/3);return ac-(this.player.status.protection?2:0);}
 get hunger(){let n=this.player.nutrition;return n>1000?'Satiated':n>150?'Not hungry':n>50?'Hungry':n>0?'Weak':'Fainting';}
 get weight(){return this.player.inventory.reduce((w,i)=>w+(this.def(i).weight||0)*i.count,0)+Math.floor(this.player.gold/100);}
 get capacity(){return Math.min(1000,25*(this.player.stats[0]+this.player.stats[2])+50);}
 get encumbrance(){return this.weight>this.capacity*3?'Overloaded':this.weight>this.capacity*2?'Overtaxed':this.weight>this.capacity*1.5?'Strained':this.weight>this.capacity*1.25?'Stressed':this.weight>this.capacity?'Burdened':'';}
 def(i){return lookup(i.name,i.category)||{name:i.name,category:i.category,weight:i.weight||0,cost:0};}
 has(prop){return this.player.properties.includes(prop)||!!this.player.status[prop]||this.wornIds.some(id=>{let i=this.player.inventory.find(i=>i.id===id);return i&&PROPS[this.def(i).property]===prop;});}
 log(text,type='normal'){this.messages.push({turn:this.turn,text,type});if(this.messages.length>250)this.messages.shift();}
 emit(type,data={}){this.events.push({type,...data});}
 createItem(name,category,extra={}){let d=lookup(name,category);return{id:++this.uid,name,category:category||d?.category||'tool',count:1,enchant:0,buc:this.rng.next()<.1?-1:0,bucKnown:false,known:d?.known||false,charges:category==='wand'?this.rng.int(4,8):0,...extra};}
 label(i){let d=this.def(i),known=i.known||this.identified[i.category+':'+i.name]||d.known,appearance=this.appearances[i.category+':'+i.name]||d.appearance;let name=i.name;
  if(known&&['potion','scroll','wand','ring','spellbook'].includes(i.category))name=i.category+' of '+i.name;
  else if(!known&&appearance){name=i.category==='scroll'?'scroll labeled '+appearance:appearance+' '+(i.category==='gem'?'gem':i.category==='armor'?d.slot:i.category);}
  if(i.corpse)name=i.corpse+' corpse';if(i.named)name+=' called '+i.named;
  if(known&&['weapon','armor'].includes(i.category))name=(i.enchant>=0?'+':'')+i.enchant+' '+name;
  if(i.bucKnown)name=(i.buc===1?'blessed ':i.buc===-1?'cursed ':'uncursed ')+name;
  return(i.count>1?i.count+' × ':'')+name;
 }
 addItem(i){let old=this.player.inventory.find(j=>j.name===i.name&&j.category===i.category&&j.buc===i.buc&&j.enchant===i.enchant&&j.known===i.known&&!i.unpaid&&!j.unpaid&&!i.corpse&&!i.artifact&&!j.artifact&&!i.contents&&!j.contents&&i.named===j.named&&i.bucKnown===j.bucKnown&&i.diluted===j.diluted&&i.tinMonster===j.tinMonster&&['food','potion','scroll','gem'].includes(i.category));if(old){old.count+=i.count;return old;}let letters='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',used=this.player.inventory.map(i=>i.letter);i.letter=letters.split('').find(c=>!used.includes(c));if(!i.letter)return null;this.player.inventory.push(i);return i;}
 consume(i){if(--i.count<=0){this.player.inventory=this.player.inventory.filter(j=>j.id!==i.id);for(const k in this.player.equipment)if(this.player.equipment[k]===i.id)delete this.player.equipment[k];}}
 identify(i){i.known=true;this.identified[i.category+':'+i.name]=true;}
 tile(x,y){return this.level.tiles[y]?.[x];}
 passable(x,y){let t=this.tile(x,y);return !!t&&!['rock','wall','secret','door','bars','tree'].includes(t.type)&&!this.level.boulders.some(b=>b.x===x&&b.y===y);}
 blockedSight(x,y){let t=this.tile(x,y);return !t||['rock','wall','secret','door','tree'].includes(t.type);}
 lineOfSight(x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;for(let i=0;i<100;i++){if(x0===x1&&y0===y1)return true;const e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}if(x0===x1&&y0===y1)return true;if(this.blockedSight(x0,y0))return false;}return false;}
 updateVision(){const p=this.player,l=this.level;let room=l.rooms.find(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h);for(let row of l.tiles)for(let t of row){t.visible=false;if(this.has('blindness')&&distance(p,t)>1)continue;const radius=this.has('light')?13:8;if(distance(p,t)<=radius||(room?.lit&&t.room===room.id)){if(this.lineOfSight(p.x,p.y,t.x,t.y)){t.visible=true;t.seen=true;}}}}
 getLevel(){if(!this.levels[this.key])this.levels[this.key]=this.generate(this.depth,this.branch);return this.level;}
 generate(depth,branch){return N.generateLevel(this,depth,branch);}
 randomItem(){const cats=['food','weapon','armor','potion','scroll','wand','ring','gem','tool','spellbook'];const cat=this.rng.weighted(cats,c=>({food:20,weapon:10,armor:10,potion:16,scroll:16,wand:4,ring:3,gem:8,tool:8,spellbook:5})[c]);const defs=N.ITEMS.filter(i=>i.category===cat&&i.prob>0);let d=this.rng.weighted(defs,d=>d.prob);return this.createItem(d.name,d.category,{count:d.ammo?this.rng.int(3,10):1});}
 randomMonster(depth){let defs=N.MONSTERS.filter(m=>m.frequency>0&&!/G_NOGEN|G_UNIQ|G_HELL/.test(m.generation)&&m.difficulty<=Math.max(2,Math.floor((depth+(this.player?.level||1))/2)+1)&&m.difficulty>=Math.floor(depth/6)&&!this.genocided.includes(m.name));return this.rng.weighted(defs,m=>m.frequency)||monsterDef('jackal');}
 makeMonster(d,x,y,extra={}){const hp=Math.max(1,this.rng.dice(Math.max(1,d.level),d.level?8:4));return{id:++this.uid,kind:d.name,x,y,hp,maxHp:hp,energy:0,asleep:0,facing:[0,1],...extra};}
 spawn(name,x,y,extra){let d=monsterDef(name)||this.randomMonster(this.depth);let m=this.makeMonster(d,x,y,extra);this.level.monsters.push(m);return m;}
 monsterAt(x,y){return this.level.monsters.find(m=>m.hp>0&&m.x===x&&m.y===y);}
 move(dx,dy,mode='normal'){
  if(this.dead||this.won)return false;let p=this.player;if(this.weight>this.capacity*3){this.log('You are carrying too much to move.','warning');return false;}
  if(p.status.trapped){p.status.trapped--;this.log(p.status.trapped?'You struggle to free yourself.':'You finally pull free.');this.endTurn();return true;}
  if(this.has('confusion')&&this.rng.next()<.5)[dx,dy]=this.rng.pick(DIRS);let x=p.x+dx,y=p.y+dy,t=this.tile(x,y);p.facing=[dx,dy];
  if(!t)return false;if(dx&&dy&&(['door','openDoor'].includes(t.type)||['door','openDoor'].includes(this.tile(p.x,p.y).type))){this.log('You cannot move diagonally through a doorway.');return false;}
  if(dx&&dy&&!this.passable(p.x+dx,p.y)&&!this.passable(p.x,p.y+dy))return false;
  const m=this.monsterAt(x,y);if(m){if(mode==='safe')return false;if(m.tame){[m.x,m.y]=[p.x,p.y];p.x=x;p.y=y;this.log(`You swap places with ${m.name||m.kind}.`);this.endTurn();return true;}if(m.peaceful&&mode!=='fight'){this.log(`The ${m.kind} is peaceful. Use F + direction to attack deliberately.`);return false;}this.attack(m);this.endTurn();return true;}
  if(mode==='fight'){this.log('You swing at empty air.');this.endTurn();return true;}
  let b=this.level.boulders.find(b=>b.x===x&&b.y===y);if(b){if(dx&&dy){this.log('The boulder will not move diagonally.');return false;}if(!this.passable(x+dx,y+dy)||this.monsterAt(x+dx,y+dy)){this.log('The boulder will not move.');return false;}b.x+=dx;b.y+=dy;const trap=this.level.traps.find(t=>distance(t,b)===0&&t.type==='pit');if(trap){this.level.traps=this.level.traps.filter(t=>t!==trap);this.level.boulders=this.level.boulders.filter(j=>j!==b);this.log('The boulder fills the pit.');}else this.log('With great effort you move the boulder.');this.emit('stone');}
  if(t.type==='door'&&this.autoOpenDoors&&!t.locked&&(!dx||!dy)){t.type='openDoor';this.log('The door opens as you walk through.');this.emit('door');}
  if(!this.passable(x,y)){if(t.type==='door')this.log('The door is closed. [o] Open · [k] Kick');return false;}
  if(['water','lava'].includes(t.type)&&!this.has('levitation')&&!this.has('water walking')){this.log('You stop at the edge. Crossing requires levitation or water walking.','warning');return false;}
  p.x=x;p.y=y;this.emit('step');if(mode!=='safe'&&this.autopickup)this.pickup(true);let trap=this.level.traps.find(t=>distance(t,p)===0);if(trap&&!this.has('levitation'))this.triggerTrap(trap);this.look();this.endTurn();return true;
 }
 attack(m,bonus=0){let p=this.player,d=monsterDef(m.kind),weapon=p.inventory.find(i=>i.id===p.equipment.weapon),w=weapon?this.def(weapon):null;if(m.peaceful){m.peaceful=false;p.luck-=2;}delete this.level.engravings[p.x+','+p.y];
  let tohit=1+p.level+d.ac+(weapon?.enchant||0)+(w?.hit||0)+(this.attribute(0)>=18?6:this.attribute(0)>=16?3:0)+(this.attribute(1)>=18?4:this.attribute(1)>=16?2:0)+bonus;if(this.rng.int(1,20)>tohit){this.log(`You miss the ${m.kind}.`);this.emit('miss',{x:m.x,y:m.y});return;}
  let sides=w?.damage||(p.role==='Monk'?8:2);let damage=this.rng.dice(1,sides)+(weapon?.enchant||0)+(this.attribute(0)>=18?2:this.attribute(0)>=16?1:0);if(w?.name==='two-handed sword')damage+=this.rng.dice(1,6);damage=Math.max(1,damage);m.hp-=damage;this.log(`You hit the ${m.kind} for ${damage}.`,'combat');this.emit('hit',{x:m.x,y:m.y,value:damage,id:m.id});if(m.hp<=0)this.kill(m);else{let passive=d.attacks.find(a=>a.type==='NONE');if(passive)this.applyAttackEffect(passive,d);}
 }
 kill(m,pet=false){m.hp=0;let d=monsterDef(m.kind);this.log(`${pet?'Hachi kills':'You kill'} the ${m.kind}!`,'good');this.emit('kill',{x:m.x,y:m.y});if(!pet){this.conduct.kills++;this.player.xp+=Math.max(1,d.level*d.level+1+(10-d.ac));this.checkLevel();}if(!/G_NOCORPSE/.test(d.generation)&&this.rng.next()<.65)this.level.items.push({x:m.x,y:m.y,item:this.createItem('corpse','food',{corpse:m.kind,age:this.turn,nutrition:d.nutrition,weight:d.weight,known:true})});this.level.monsters=this.level.monsters.filter(i=>i.hp>0);}
 checkLevel(){const p=this.player;const threshold=p.level<10?10*2**p.level:10000*(p.level-8);if(p.xp>=threshold&&p.level<30){p.level++;let hp=this.rng.int(4,10);p.maxHp+=hp;p.hp+=hp;p.maxPw+=this.rng.int(2,5);p.pw=p.maxPw;this.log(`Welcome to experience level ${p.level}!`,'good');this.emit('levelup');if(p.role==='Valkyrie'&&p.level>=7&&!p.properties.includes('speed'))p.properties.push('speed');}}
 damage(n,cause){this.player.hp-=Math.max(0,n);this.emit('hurt',{value:n,x:this.player.x,y:this.player.y});if(this.player.hp<=0){const life=this.player.inventory.find(i=>i.name==='amulet of life saving'&&Object.values(this.player.equipment).includes(i.id));if(life){this.consume(life);this.player.hp=this.player.maxHp;this.player.nutrition=900;this.player.status={};this.log('Your amulet glows, then crumbles. You return to life!','good');}else{this.dead=true;this.deathCause=cause;this.log(`You die from ${cause}.`,'danger');this.emit('death');}}}
 applyAttackEffect(a,d){let map={FIRE:'MR_FIRE',COLD:'MR_COLD',ELEC:'MR_ELEC',DRST:'MR_POISON',ACID:'MR_ACID',SLEE:'MR_SLEEP',STON:'MR_STONE'};if(map[a.effect]&&this.has(map[a.effect])){this.log(`You resist the ${d.name}'s attack.`);return;}let n=this.rng.dice(a.dice,a.sides);if(a.effect==='SLEE'||a.effect==='PLYS'){if(!this.has('free action'))this.player.status.paralysis=this.rng.int(2,4);}else if(a.effect==='STON')this.player.status.petrifying=5;else if(a.effect==='DRST'&&this.rng.next()<.3){this.player.stats[0]=Math.max(3,this.player.stats[0]-1);this.log('You feel weaker.','warning');}else if(a.effect==='CONF')this.player.status.confusion=10;else if(a.effect==='BLND')this.player.status.blindness=10;else if(a.effect==='DRLI'){this.player.maxHp=Math.max(1,this.player.maxHp-2);this.player.level=Math.max(1,this.player.level-1);}else if(a.effect==='RUST'){const armor=this.player.inventory.find(i=>i.id===this.player.equipment.body);if(armor)armor.enchant=Math.max(-3,armor.enchant-1);}this.damage(n,d.name);}
 monsterTurn(){const p=this.player;for(let m of [...this.level.monsters]){if(this.dead)break;if(m.hp<=0)continue;if(m.asleep>0){m.asleep--;continue;}const d=monsterDef(m.kind);m.energy+=(d.speed||0)*(m.hasted>0?1.5:1)*(m.slowed>0?.5:1)/((this.has('speed')?1.5:1)*({'':1,Burdened:.75,Stressed:.5,Strained:.25,Overtaxed:.125,Overloaded:1}[this.encumbrance]));let acts=Math.min(8,Math.floor(m.energy/12));m.energy%=12;
  for(let act=0;act<acts;act++){if(m.tame){let enemy=this.level.monsters.find(e=>!e.tame&&!e.peaceful&&distance(m,e)<=1);if(enemy){let n=this.rng.dice(1,6);enemy.hp-=n;this.log(`${m.name||m.kind} bites the ${enemy.kind}.`,'combat');this.emit('hit',{x:enemy.x,y:enemy.y,value:n});if(enemy.hp<=0)this.kill(enemy,true);continue;}
   let food=this.level.items.find(o=>distance(o,m)<=1&&o.item.category==='food'&&(o.item.corpse||o.item.name==='tripe ration'));if(food){this.level.items=this.level.items.filter(o=>o!==food);m.hp=Math.min(m.maxHp,m.hp+3);continue;}if(distance(m,p)<2)continue;
  }else if(m.peaceful)continue;
  if(!m.tame&&distance(m,p)<=1&&!(m.fleeing>0)){if(this.level.engravings[p.x+','+p.y]==='Elbereth'&&!/HUMAN|ELF|ANGEL/.test(d.family)&&this.rng.next()<.7){this.log(`The ${m.kind} turns away from the engraving.`);continue;}for(let a of d.attacks.filter(a=>a.type!=='NONE'&&!(m.cancelled&&a.effect!=='PHYS'))){if(this.dead)break;if(this.rng.int(1,20)<=10+this.ac+d.level-(this.has('displacement')?2:0)){this.log(`The ${m.kind} ${a.type==='BITE'?'bites':'hits'}!`,'danger');this.applyAttackEffect(a,d);}else this.log(`The ${m.kind} misses.`);}continue;}
  if(!m.tame&&(distance(m,p)>14||!this.lineOfSight(m.x,m.y,p.x,p.y)&&distance(m,p)>5))continue;
  let candidates=DIRS.map(([dx,dy])=>({x:m.x+dx,y:m.y+dy,dx,dy})).filter(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y)&&distance(t,p)>0&&!(t.dx&&t.dy&&(!this.passable(m.x+t.dx,m.y)&&!this.passable(m.x,m.y+t.dy)))&&!(t.dx&&t.dy&&['door','openDoor'].includes(this.tile(t.x,t.y).type)));
  candidates.sort((a,b)=>(distance(a,p)-distance(b,p))*(m.fleeing>0?-1:1));if(m.confused>0){m.confused--;candidates=this.rng.shuffle(candidates);}let next=candidates[0];if(next){m.x=next.x;m.y=next.y;m.facing=[next.dx,next.dy];}
  }
 }}
 endTurn(){if(this.dead||this.won)return;this.turn++;const p=this.player;p.nutrition-=this.has('slow digestion')?(this.turn%20===0?1:0):1;if(this.encumbrance)p.nutrition--;for(let s of p.spells)s.knowledge=Math.max(0,s.knowledge-1);
  for(let k of Object.keys(p.status)){if(k==='trapped')continue;if(--p.status[k]<=0){delete p.status[k];if(k==='polymorphed')delete p.form;if(k==='sickness'){this.damage(p.hp,'terminal illness');return;}if(k==='petrifying'){this.damage(p.hp,'petrification');return;}this.log(`Your ${k} wears off.`);}}
  if(p.nutrition<-(200+20*p.stats[2])){this.damage(p.hp,'starvation');return;}if(p.nutrition<=0&&this.turn%5===0){p.status.paralysis=2;this.log('You faint from lack of food.','danger');}
  if(this.turn%Math.max(3,22-p.level*2)===0||this.has('regeneration'))p.hp=Math.min(p.maxHp,p.hp+1);if(this.turn%10===0)p.pw=Math.min(p.maxPw,p.pw+1);
  this.monsterTurn();if(this.has('searching'))this.search(true);this.level.items=this.level.items.filter(o=>!o.item.corpse||this.turn-o.item.age<250);this.updateVision();
  if(this.turn%90===0&&this.level.monsters.length<30){let t=this.rng.pick(this.level.tiles.flat().filter(t=>t.type==='floor'&&!t.visible&&!this.monsterAt(t.x,t.y)));if(t)this.spawn(null,t.x,t.y);}
 }
 wait(){this.endTurn();}
 pickup(auto=false){let p=this.player,list=this.level.items.filter(o=>distance(o,p)===0);if(auto)list=list.filter(o=>o.item.category==='gold');if(!list.length){if(!auto)this.log('There is nothing here to pick up.');return false;}for(let o of list){let i=o.item;if(i.category==='gold')p.gold+=i.count;else if(!this.addItem(i)){this.log('Your knapsack cannot hold any more item slots.');continue;}this.level.items=this.level.items.filter(j=>j!==o);this.log(`You pick up ${i.category==='gold'?i.count+' gold pieces':this.label(i)}.`,'loot');if(i.unpaid)this.log(`You owe ${i.price} gold pieces for this item.`,'warning');this.emit('pickup');}if(!auto)this.endTurn();return true;}
 drop(i){if(Object.values(this.player.equipment).includes(i.id)){this.log('Remove or unwield that item first.');return false;}this.player.inventory=this.player.inventory.filter(j=>j!==i);let t=this.tile(this.player.x,this.player.y);if(t.type==='altar'){i.bucKnown=true;this.log(`The ${i.name} ${i.buc===1?'shines amber':i.buc===-1?'glows black':'lands quietly'} on the altar.`);}this.level.items.push({x:this.player.x,y:this.player.y,item:i});this.log(`You drop ${this.label(i)}.`);this.endTurn();return true;}
 look(){let t=this.tile(this.player.x,this.player.y);if(!['floor','corridor','openDoor'].includes(t.type))this.log(`You see ${ {up:'a staircase leading up',down:'a staircase leading down',branch:'stairs to the Gnomish Mines',fountain:'a bubbling fountain',altar:'an ancient altar',grave:'a weathered grave',sink:'a stone sink',throne:'an opulent throne'}[t.type]||t.type} here.`);let items=this.level.items.filter(o=>distance(o,this.player)===0);if(items.length)this.log('At your feet: '+items.map(o=>this.label(o.item)).join(', ')+'.','loot');let e=this.level.engravings[this.player.x+','+this.player.y];if(e)this.log(`Written in the dust: “${e}”.`);}
 door(dx,dy,action='open'){let p=this.player,t=this.tile(p.x+dx,p.y+dy);if(!t||!['door','openDoor','secret'].includes(t.type)){this.log('There is no door in that direction.');return false;}if(dx&&dy){this.log('You cannot reach the door diagonally.');return false;}
  if(action==='kick'){if(t.type==='openDoor'){this.log('You kick at the open doorway.');return false;}if(this.rng.int(1,20)<p.stats[0]){t.type='openDoor';t.locked=false;this.log('The door crashes open!');this.emit('stone');}else{this.log('WHAMMM! The door holds.');this.emit('hit',{x:t.x,y:t.y});}this.endTurn();return true;}
  if(action==='unlock'){t.locked=false;this.log('You succeed in unlocking the door.');this.endTurn();return true;}
  if(action==='open'){if(t.type==='openDoor'){this.log('This door is already open.');return false;}if(t.locked){this.log('This door is locked. Apply a key or kick it.');this.endTurn();return true;}t.type='openDoor';this.log('The door opens.');}
  else{if(t.type!=='openDoor'){this.log('This door is already closed.');return false;}if(this.monsterAt(t.x,t.y)||this.level.items.some(o=>distance(o,t)===0)){this.log('Something is in the way.');return false;}t.type='door';this.log('The door closes.');}this.emit('door');this.endTurn();return true;
 }
 search(passive=false){let found=false;for(const [dx,dy] of [[0,0],...DIRS]){let t=this.tile(this.player.x+dx,this.player.y+dy);if(t?.type==='secret'&&this.rng.next()<.15){t.type='door';this.log('You find a hidden door!','good');found=true;}let trap=this.level.traps.find(t=>t.x===this.player.x+dx&&t.y===this.player.y+dy&&!t.seen);if(trap&&this.rng.next()<.15){trap.seen=true;this.log(`You discover a ${trap.type}!`,'warning');found=true;}}if(!passive){if(!found)this.log('You search the surroundings.');this.endTurn();}}
 triggerTrap(t){t.seen=true;this.log(`You trigger a ${t.type}!`,'danger');this.emit('trap',{x:t.x,y:t.y});switch(t.type){case'land mine':this.level.traps=this.level.traps.filter(j=>j!==t);this.damage(this.rng.dice(3,6),'a land mine');break;case'pit':this.damage(this.rng.dice(1,6),'a pit');this.player.status.trapped=3;break;case'bear trap':this.damage(this.rng.dice(2,4),'a bear trap');this.player.status.trapped=5;break;case'web':this.player.status.trapped=4;break;case'sleeping gas':if(!this.has('MR_SLEEP'))this.player.status.paralysis=4;break;case'teleport':this.teleport();break;case'fire':if(!this.has('MR_FIRE'))this.damage(this.rng.dice(2,4),'a fire trap');break;case'rust':{let i=this.player.inventory.find(i=>i.id===this.player.equipment.body);if(i)i.enchant--;break;}case'trapdoor':this.stairs(1,true);break;default:this.damage(this.rng.dice(1,6),'a '+t.type+' trap');}}
 teleport(){const t=this.rng.pick(this.level.tiles.flat().filter(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y)&&!['water','lava'].includes(t.type)));if(t){this.player.x=t.x;this.player.y=t.y;this.log('You materialize somewhere else.');this.emit('magic',{x:t.x,y:t.y});this.updateVision();}}
 stairs(dir,forced=false){let t=this.tile(this.player.x,this.player.y);if(this.has('levitation')){this.log('You are floating above the stairs.');return false;}if(!forced&&!(dir===1&&['down','branch'].includes(t.type)||dir===-1&&t.type==='up')){this.log(`There are no stairs ${dir===1?'down':'up'} here.`);return false;}
  if(this.depth===1&&this.branch==='Dungeons'&&dir===-1){if(this.player.inventory.some(i=>i.name==='Amulet of Yendor')){this.won=true;this.log('You escape with the Amulet of Yendor!','good');this.emit('victory');}else this.log('Your journey has only just begun. The Amulet lies below.');return false;}
  const fromBranch=this.branch,pets=this.level.monsters.filter(m=>m.tame&&distance(m,this.player)<=2);this.level.monsters=this.level.monsters.filter(m=>!pets.includes(m));
  if(t.type==='branch'&&dir===1){this.branch='Mines';this.depth=1;}else if(this.branch==='Mines'&&this.depth===1&&dir===-1){this.branch='Dungeons';this.depth=3;}else this.depth+=dir;
  this.getLevel();let dest=dir===1?this.level.up:this.level.down;if(fromBranch==='Mines'&&this.branch==='Dungeons'&&this.depth===3&&dir===-1)dest=this.level.branchStair||dest;
  this.player.x=dest.x;this.player.y=dest.y;for(let m of pets){let pos=DIRS.map(([dx,dy])=>({x:dest.x+dx,y:dest.y+dy})).find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y));if(pos){m.x=pos.x;m.y=pos.y;this.level.monsters.push(m);}}
  this.log(`You ${dir>0?'descend':'climb'} to ${this.branch==='Mines'?'the Gnomish Mines':'the Dungeons of Doom'}, level ${this.depth}.`,'story');this.emit('stairs');if(!forced)this.endTurn();else this.updateVision();return true;
 }
 equip(i,slot){let d=this.def(i);slot=slot||(i.category==='weapon'?'weapon':i.category==='armor'?d.slot:i.category==='ring'?(!this.player.equipment.leftRing?'leftRing':'rightRing'):'amulet');let old=this.player.inventory.find(i=>i.id===this.player.equipment[slot]);if(old?.buc===-1){old.bucKnown=true;this.log(`Your ${old.name} is cursed and will not come off!`,'warning');return false;}if(i.category==='armor'&&slot==='body'&&this.player.equipment.cloak){this.log('Take off your cloak first.');return false;}this.player.equipment[slot]=i.id;this.log(`You ${slot==='weapon'?'wield':'put on'} ${this.label(i)}.`);if(i.buc<0){i.bucKnown=true;this.log('It feels deathly cold.','warning');}this.endTurn();return true;}
 unequip(i){let slot=Object.keys(this.player.equipment).find(k=>this.player.equipment[k]===i.id);if(!slot)return false;if(i.buc===-1){i.bucKnown=true;this.log('It is cursed! You cannot remove it.','warning');return false;}if(slot==='body'&&this.player.equipment.cloak){this.log('Take off your cloak first.');return false;}delete this.player.equipment[slot];this.log(`You remove ${this.label(i)}.`);this.endTurn();return true;}
 eat(i){if(i.category!=='food'){this.log('You cannot eat that.');return false;}let p=this.player;if(p.nutrition>1500){this.log('You are too full to eat safely.','warning');return false;}
  const nutrition=i.nutrition||this.def(i).nutrition||100;p.nutrition+=nutrition;this.conduct.food++;this.log(`You eat ${i.corpse?'the '+i.corpse+' corpse':'the '+i.name}.`);if(i.name==='carrot')delete p.status.blindness;this.consume(i);this.emit('eat');for(let n=0;n<Math.max(1,this.def(i).delay||1)&&!this.dead;n++)this.endTurn();return true;
 }
 quaff(i){if(i.category!=='potion')return false;this.identify(i);this.log(`You drink a potion of ${i.name}.`);this.magic(i.name,null,i.buc,'potion');this.consume(i);this.endTurn();return true;}
 read(i){if(this.has('blindness')){this.log('You cannot read while blind.');return false;}if(i.category==='spellbook'){let d=this.def(i);if(!d.level){this.log('The pages are blank.');return false;}if(!this.player.spells.some(s=>s.name===i.name))this.player.spells.push({name:i.name,knowledge:20000});else this.player.spells.find(s=>s.name===i.name).knowledge=20000;this.identify(i);this.log(`You learn ${i.name}. [Z] to cast.`,'good');for(let n=0;n<Math.max(1,d.delay)&&!this.dead;n++)this.endTurn();return true;}if(i.category!=='scroll')return false;this.identify(i);this.log(`You read a scroll of ${i.name}.`);this.magic(i.name,null,i.buc,'scroll');this.consume(i);this.endTurn();return true;}
 magic(name,dir=null,buc=0,source='spell'){
  const p=this.player;this.emit('magic',{x:p.x,y:p.y});
  if(['healing','extra healing','full healing','cure sickness'].includes(name)){p.hp=Math.min(p.maxHp,p.hp+(name==='healing'?this.rng.dice(6,4):name==='extra healing'?this.rng.dice(6,8):p.maxHp));delete p.status.sickness;delete p.status.blindness;this.log('A warm light mends your wounds.','good');}
  else if(['gain energy'].includes(name)){p.pw=p.maxPw;this.log('Magical energy flows through you.','good');}
  else if(name==='gain level'){p.xp=10*2**p.level;this.checkLevel();}
  else if(['gain ability','restore ability'].includes(name)){p.stats=p.stats.map(v=>Math.min(18,v+1));this.log('You feel capable.','good');}
  else if(['fruit juice','booze','water'].includes(name)){p.nutrition+=name==='water'?0:100;if(name==='booze')p.status.confusion=10;if(name==='water'&&buc>0){delete p.status.sickness;this.log('You feel purified.');}}
  else if(['sickness','acid'].includes(name)){this.damage(this.rng.dice(2,6),'a potion of '+name);}
  else if(['confusion','blindness','paralysis','hallucination','levitation','invisibility','speed','see invisible'].includes(name)){p.status[name]=this.rng.int(30,80);this.log(`You feel the effects of ${name}.`);}
  else if(name==='sleeping'){if(!this.has('MR_SLEEP'))p.status.paralysis=5;}
  else if(name==='haste self'){p.status.speed=80;}
  else if(name==='cure blindness'){delete p.status.blindness;}
  else if(['light','clairvoyance'].includes(name)){p.status.light=150;this.log('The dungeon is illuminated.');}
  else if(name==='magic mapping'){this.level.tiles.flat().filter(t=>t.type!=='rock').forEach(t=>t.seen=true);this.log('A map coalesces in your mind.','good');}
  else if(['monster detection','detect monsters','object detection','detect treasure','gold detection','food detection','detect food','detect unseen','secret door detection'].includes(name)){p.status.detection=100;this.level.traps.forEach(t=>t.seen=true);if(name==='secret door detection')this.level.tiles.flat().filter(t=>t.type==='secret').forEach(t=>t.type='door');this.log('You sense hidden presences in the dungeon.');}
  else if(name==='identify'){const unknown=p.inventory.filter(i=>!i.known);let count=buc===1?unknown.length:this.rng.int(1,3);unknown.slice(0,count).forEach(i=>{this.identify(i);i.bucKnown=true;this.log(`Identified: ${this.label(i)}.`,'good');});if(!unknown.length)this.log('You already recognize everything you carry.');}
  else if(name==='remove curse'){p.inventory.filter(i=>buc>0||Object.values(p.equipment).includes(i.id)).forEach(i=>{if(i.buc<0)i.buc=0;});this.log('You feel as if someone is helping you.');}
  else if(name==='enchant weapon'||name==='enchant armor'){const i=p.inventory.find(i=>i.id===p.equipment[name==='enchant weapon'?'weapon':'body']);if(i){i.enchant+=buc<0?-1:buc>0?2:1;this.log(`Your ${i.name} glows ${buc<0?'black':'silver'}.`,'good');}else this.log('Your skin tingles.');}
  else if(name==='destroy armor'){let i=p.inventory.find(i=>i.id===p.equipment.body);if(i){i.count=1;this.consume(i);this.log('Your armor crumbles to dust!','danger');}}
  else if(name==='charging'){p.inventory.filter(i=>i.category==='wand').forEach(i=>i.charges+=this.rng.int(1,4));this.log('Your wands hum with new energy.');}
  else if(['teleportation','teleport away'].includes(name)&&!dir)this.teleport();
  else if(['create monster','create familiar'].includes(name)){let t=DIRS.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y));if(t)this.spawn(name==='create familiar'?'kitten':null,t.x,t.y,{tame:name==='create familiar'});}
  else if(['taming','charm monster'].includes(name)){this.level.monsters.filter(m=>distance(m,p)<5&&!monsterDef(m.kind).generation.includes('G_UNIQ')).forEach(m=>{m.tame=true;m.peaceful=true;});this.log('The creatures around you become friendly.');}
  else if(['scare monster','cause fear'].includes(name)){this.level.monsters.filter(m=>distance(m,p)<8).forEach(m=>m.asleep=8);this.log('The nearby monsters freeze in fear.');}
  else if(name==='protection'){p.status.protection=100;this.log('A golden haze surrounds you.');}
  else if(name==='amnesia'){this.level.tiles.flat().forEach(t=>t.seen=t.visible);p.spells.forEach(s=>s.knowledge=Math.floor(s.knowledge/2));this.log('Your memories grow hazy.');}
  else if(name==='earth'){for(const [dx,dy] of DIRS){let t=this.tile(p.x+dx,p.y+dy);if(t?.type==='floor'&&!this.monsterAt(t.x,t.y))this.level.boulders.push({x:t.x,y:t.y,id:++this.uid});}this.log('Boulders crash down around you!');}
  else if(name==='enlightenment'){this.log(`You are ${this.hunger.toLowerCase()}; your armor class is ${this.ac}. Properties: ${p.properties.join(', ')||'none'}.`);}
  else if(name==='punishment'){p.status.trapped=10;this.log('A heavy chain binds your legs.','warning');}
  else if(['genocide','wishing'].includes(name)){this.emit(name);}
  else if(dir){this.ray(name,dir,source);}
  else if(name==='fire'||name==='stinking cloud'){this.level.monsters.filter(m=>distance(m,p)<=3).forEach(m=>{m.hp-=this.rng.dice(3,6);if(m.hp<=0)this.kill(m);});}
  else {this.log(`The ${name} effect dissipates into the dungeon air.`);}
 }
 ray(name,[dx,dy],source){let p=this.player,x=p.x,y=p.y,bounces=0,beam=[];for(let step=0;step<8;step++){x+=dx;y+=dy;let t=this.tile(x,y);if(!t)break;if(name==='digging'||name==='dig'){if(['wall','rock','secret','door'].includes(t.type)&&x>0&&x<79&&y>0&&y<20)t.type='corridor';beam.push({x,y});continue;}if(this.blockedSight(x,y)){if(['opening','knock'].includes(name)&&t.type==='door'){t.type='openDoor';t.locked=false;}else if(name==='locking'||name==='wizard lock'){t.type='door';t.locked=true;}else if(['fire','cold','lightning','magic missile','sleep','death'].includes(name)&&bounces++<2){dx=-dx;dy=-dy;}else break;continue;}beam.push({x,y});let m=this.monsterAt(x,y);if(!m)continue;let d=monsterDef(m.kind);
   if(['sleep','slow monster','confuse monster'].includes(name)){m.asleep=6;this.log(`The ${m.kind} is subdued.`);}
   else if(name==='teleportation'||name==='teleport away'){let t=this.rng.pick(this.level.tiles.flat().filter(t=>t.type==='floor'&&!this.monsterAt(t.x,t.y)&&distance(t,p)>0));m.x=t.x;m.y=t.y;}
   else if(name==='probing'){this.log(`${m.kind}: HP ${m.hp}/${m.maxHp}, AC ${d.ac}, level ${d.level}.`);}
   else if(name==='polymorph'){let next=this.randomMonster(this.depth+5);m.kind=next.name;m.hp=m.maxHp=Math.max(4,next.level*5);}
   else if(name==='nothing')this.log('Nothing happens.');
   else {let res={fire:'MR_FIRE',fireball:'MR_FIRE',cold:'MR_COLD','cone of cold':'MR_COLD',lightning:'MR_ELEC','magic missile':'MR_MAGIC'}[name];if(res&&d.resists.includes(res)){this.log(`The ${m.kind} resists!`);continue;}let damage=name==='death'||name==='finger of death'?100:this.rng.dice(name==='force bolt'||name==='striking'?2:3,6);m.hp-=damage;this.log(`The ${name} strikes the ${m.kind} for ${damage}.`,'combat');this.emit('hit',{x,y,value:damage});if(m.hp<=0)this.kill(m);}if(source==='throw'||name==='force bolt'||name==='striking')break;
  }this.emit('beam',{points:beam,name});}
 zap(i,dir){if(i.charges<=0){this.log('Nothing happens. The wand seems empty.');this.endTurn();return false;}i.charges--;this.identify(i);this.magic(i.name,dir,i.buc,'wand');this.endTurn();return true;}
 cast(spell,dir){const d=lookup(spell.name,'spellbook'),p=this.player,cost=(d?.level||1)*5;if(!spell.knowledge){this.log('You have forgotten this spell.');return false;}if(p.pw<cost){this.log(`You need ${cost} power to cast ${spell.name}.`,'warning');return false;}p.pw-=cost;p.nutrition-=cost;this.magic(spell.name,dir,0,'spell');this.endTurn();return true;}
 throwItem(i,[dx,dy]){let p=this.player,x=p.x,y=p.y;for(let n=0;n<6;n++){if(!this.passable(x+dx,y+dy))break;x+=dx;y+=dy;let m=this.monsterAt(x,y);if(m){if(i.category==='food'&&['DOG','FELINE'].includes(monsterDef(m.kind).family)){m.tame=true;m.peaceful=true;this.log(`The ${m.kind} accepts your food.`);this.consume(i);this.endTurn();return;}let damage=this.rng.dice(1,this.def(i).damage||2)+(i.enchant||0);m.hp-=Math.max(1,damage);this.log(`Your ${i.name} hits the ${m.kind}.`,'combat');this.emit('hit',{x,y,value:damage});if(m.hp<=0)this.kill(m);break;}}
  const thrown={...i,id:++this.uid,count:1};this.consume(i);this.level.items.push({x,y,item:thrown});this.emit('beam',{points:[{x:p.x,y:p.y},{x,y}],name:'throw'});this.endTurn();}
 apply(i,dir){if(['skeleton key','lock pick','credit card'].includes(i.name))return this.door(...dir,'unlock');if(i.name==='pick-axe'){const t=this.tile(this.player.x+dir[0],this.player.y+dir[1]);if(t&&['wall','rock','secret'].includes(t.type)&&t.x>0&&t.x<79&&t.y>0&&t.y<20){t.type='corridor';this.log('You cut through the rock.');this.emit('stone');}else this.log('There is nothing to dig here.');}
  else if(/lamp|lantern|candle/.test(i.name)){this.player.status.light=200;this.log('Your light casts a warm glow.');}
  else if(i.name==='unicorn horn'){['sickness','blindness','confusion','hallucination'].forEach(k=>delete this.player.status[k]);this.log('You feel restored.');}
  else if(i.name.includes('whistle')){for(let m of this.level.monsters.filter(m=>m.tame)){let t=DIRS.map(([dx,dy])=>({x:this.player.x+dx,y:this.player.y+dy})).find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y));if(t){m.x=t.x;m.y=t.y;}}this.log('You produce a high-pitched whistle.');}
  else if(i.name==='stethoscope')this.log('Your heartbeat is steady.');
  else if(i.name==='expensive camera'){this.level.monsters.filter(m=>distance(m,this.player)<6).forEach(m=>m.asleep=4);this.log('A blinding flash lights the room.');this.emit('magic',{x:this.player.x,y:this.player.y});}
  else if(i.name==='towel'){delete this.player.status.blindness;this.log('You wipe your face.');}
  else {this.log(`You apply ${i.name}, but nothing obvious happens.`);this.endTurn();return true;}this.endTurn();return true;
 }
 pray(){let p=this.player;this.conduct.prayers++;if(this.turn-this.prayerTurn<300){p.luck--;this.log('You feel that your god is displeased.','warning');}else{p.hp=p.maxHp;p.nutrition=Math.max(p.nutrition,900);p.status={};this.log('A divine presence surrounds you. You feel restored.','good');this.emit('levelup');}this.prayerTurn=this.turn;for(let i=0;i<3&&!this.dead;i++)this.endTurn();}
 engrave(text){this.level.engravings[this.player.x+','+this.player.y]=text.slice(0,80);this.log(`You write “${text.slice(0,80)}” in the dust.`);this.endTurn();}
 drinkFountain(){let t=this.tile(this.player.x,this.player.y);if(t.type!=='fountain'){this.log('There is no fountain here.');return false;}let r=this.rng.int(0,9);if(r<4){this.player.nutrition+=50;this.log('The cool water refreshes you.');}else if(r<6){this.player.hp=Math.min(this.player.maxHp,this.player.hp+4);this.log('You feel a little better.');}else if(r<8){this.damage(this.rng.dice(1,6),'foul fountain water');this.log('The water tastes foul!','warning');}else{this.log('The fountain dries up.');t.type='floor';}this.endTurn();return true;}
 pay(){let shop=this.level.monsters.find(m=>m.shopkeeper&&distance(m,this.player)<8);if(!shop){this.log('There is no shopkeeper nearby.');return false;}let items=this.player.inventory.filter(i=>i.unpaid),cost=items.reduce((s,i)=>s+i.price*i.count,0);if(!cost){this.log('You do not owe anything.');return false;}if(this.player.gold<cost){this.log(`You owe ${cost} gold, but have only ${this.player.gold}.`,'warning');return false;}this.player.gold-=cost;items.forEach(i=>i.unpaid=false);this.log(`You pay ${cost} gold. Thank you for shopping!`);this.endTurn();return true;}
 serialize(){return JSON.stringify({...this,rng:{state:this.rng.state},events:[]});}
 static restore(text){
  if(typeof text!=='string'||text.length>24000000)throw Error('Invalid save size.');
  let d=JSON.parse(text);if(d.version!==1||!d.player||!d.levels||!d.rng||!Number.isFinite(d.rng.state))throw Error('Incompatible save file.');
  if(['__proto__','prototype','constructor'].some(k=>Object.hasOwn(d,k))||!roles[d.player.role]||!Number.isInteger(d.turn)||d.turn<1||!Object.hasOwn(N.branches,d.branch)||!Number.isInteger(d.depth))throw Error('Invalid save metadata.');
  const p=d.player,l=d.levels[d.branch+':'+d.depth];
  if(!l||!Array.isArray(p.inventory)||p.inventory.length>52||!Array.isArray(p.stats)||p.stats.length!==6||!p.stats.every(Number.isFinite)||!['hp','maxHp','pw','maxPw','x','y','level','nutrition','gold','xp'].every(k=>Number.isFinite(p[k]))||typeof p.name!=='string'||p.name.length>24)throw Error('Invalid character state.');
  const types=new Set(['rock','wall','secret','floor','corridor','up','down','branch','door','openDoor','fountain','altar','grave','sink','throne','water','lava','bars','tree','portal']);
  for(let level of Object.values(d.levels)){
   if(!Array.isArray(level.tiles)||level.tiles.length!==21||level.tiles.some(row=>!Array.isArray(row)||row.length!==80)||!['rooms','monsters','items','traps','boulders'].every(k=>Array.isArray(level[k])))throw Error('Invalid dungeon state.');
   for(let y=0;y<21;y++)for(let x=0;x<80;x++){let t=level.tiles[y][x];if(!t||t.x!==x||t.y!==y||!types.has(t.type))throw Error('Invalid terrain in save.');}
   for(let m of level.monsters)if(!monsterDef(m.kind)||!Number.isFinite(m.hp)||!Number.isInteger(m.x)||!Number.isInteger(m.y)||!level.tiles[m.y]?.[m.x])throw Error('Invalid monster state.');
  }
  if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||!l.tiles[p.y]?.[p.x])throw Error('Invalid player position.');
  if(d.autoOpenDoors===undefined)d.autoOpenDoors=true;
  let game=Object.assign(Object.create(Game.prototype),d);game.rng=new RNG(d.rng.state);game.events=[];game.migrate();game.updateVision();return game;
 }
}
N.RNG=RNG;N.Game=Game;N.DIRS=DIRS;N.roles=roles;N.lookup=lookup;N.monsterDef=monsterDef;N.distance=distance;
})();
