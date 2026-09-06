/* Object effects dispatch explicitly: utility magic never falls into damage. */
(() => {
'use strict';
const N=globalThis.NH,P=N.Game.prototype,oldMagic=P.magic,oldApply=P.apply,oldZap=P.zap,oldHas=P.has,oldEquip=P.equip,oldAttack=P.attack;
P.has=function(prop){if(prop==='blindness'&&this.player.equipment.eyes){const i=this.player.inventory.find(i=>i.id===this.player.equipment.eyes);if(i?.name==='blindfold')return true;}return oldHas.call(this,prop);};
P.magic=function(name,dir=null,buc=0,source='spell'){
 const p=this.player;
 if(name==='blank paper'){this.log('The paper is blank.');return;}
 if(name==='oil'){this.log('The oily liquid leaves a bitter taste.');p.nutrition+=10;return;}
 if(name==='charging'){const i=p.inventory.find(i=>i.category==='wand'&&i.name!=='wishing')||p.inventory.find(i=>i.category==='tool'&&i.charges!==undefined);if(i){i.charges=buc<0?0:Math.min(20,i.charges+(buc>0?8:4));this.log(`Your ${i.name} ${buc<0?'flickers and goes dark':'glows with renewed power'}.`);}return;}
 if(name==='confuse monster'&&!dir){p.status.confusingTouch=30;this.log('Your hands begin to glow.');return;}
 if(name==='polymorph'&&!dir){if(this.has('unchanging')){this.log('You feel momentarily different.');return;}const forms=['wolf','giant spider','troll'];p.form=this.rng.pick(forms);p.status.polymorphed=100;p.status.protection=100;this.log(`You take the form of a ${p.form}.`);return;}
 if(name==='restore ability'){p.stats=p.stats.map((v,i)=>Math.max(v,p.baseStats[i]));this.log('Your weakened attributes recover.');return;}
 if(name==='gain ability'){const indices=buc>0?[0,1,2,3,4,5]:[this.rng.int(0,5)];for(const i of indices)p.stats[i]=Math.min(N.races[p.race].max[i],p.stats[i]+(buc<0?-1:1));this.log(buc<0?'You feel diminished.':'You feel more capable.');return;}
 if(name==='jumping'){if(!dir||this.encumbrance){this.log('You cannot jump under these conditions.');return;}const dest={x:p.x+dir[0]*2,y:p.y+dir[1]*2};if(this.passable(dest.x,dest.y)&&this.lineOfSight(p.x,p.y,dest.x,dest.y)&&!this.monsterAt(dest.x,dest.y)){p.x=dest.x;p.y=dest.y;this.log('You leap through the air.');const trap=this.level.traps.find(t=>N.distance(t,p)===0);if(trap)this.triggerTrap(trap);}return;}
 if(dir&&['healing','extra healing','cure sickness'].includes(name))return this.ray(name,dir,source);
 if(name==='make invisible'&&!dir){p.status.invisibility=100;return;}
 return oldMagic.call(this,name,dir,buc,source);
};
P.ray=function(name,[dx,dy],source){
 const p=this.player,points=[],utility=new Set(['opening','knock','locking','wizard lock','probing','cancellation','polymorph','teleportation','teleport away','make invisible','invisibility','slow monster','speed monster','confuse monster','nothing','healing','extra healing','stone to flesh','undead turning','turn undead','drain life']);
 let x=p.x,y=p.y;for(let step=0;step<8;step++){
  x+=dx;y+=dy;const t=this.tile(x,y);if(!t)break;
  if(['digging','dig'].includes(name)){if(this.level.noDig){this.log('The walls resist your magic.');break;}if(x===0||x===79||y===0||y===20)break;if(['wall','rock','secret','door'].includes(t.type)){t.type='corridor';delete t.room;}points.push({x,y});continue;}
  if(['opening','knock'].includes(name)&&['door','secret'].includes(t.type)){t.type='openDoor';t.locked=false;this.log('The door swings open.');break;}
  if(['locking','wizard lock'].includes(name)&&['openDoor','door'].includes(t.type)&&!this.monsterAt(x,y)&&!this.level.boulders.some(b=>N.distance(b,t)===0)){t.type='door';t.locked=true;this.log('The door seals shut.');break;}
  if(this.blockedSight(x,y))break;points.push({x,y});
  const boulder=this.level.boulders.find(b=>b.x===x&&b.y===y);if(boulder&&['striking','force bolt','stone to flesh'].includes(name)){if(this.level.puzzle){this.log('The puzzle stones resist destruction.');break;}this.level.boulders=this.level.boulders.filter(b=>b!==boulder);this.log(name==='stone to flesh'?'The boulder becomes a heap of meat.':'The boulder shatters.');if(name==='stone to flesh')this.level.items.push({x,y,item:this.createItem('meatball','food',{count:5})});break;}
  const m=this.monsterAt(x,y);if(!m)continue;const d=N.monsterDef(m.kind),undead=/UNDEAD/.test(d.flags)||['ZOMBIE','MUMMY','WRAITH','VAMPIRE','LICH','GHOST'].includes(d.family);
  if(['opening','knock','locking','wizard lock','nothing'].includes(name)){this.log('Nothing happens to the creature.');continue;}
  if(name==='probing'){this.log(`${m.kind}: HP ${m.hp}/${m.maxHp}, AC ${d.ac}, level ${d.level}.`);continue;}
  if(['healing','extra healing'].includes(name)){m.hp=Math.min(m.maxHp,m.hp+this.rng.dice(name==='healing'?6:12,4));this.log(`The ${m.kind}'s wounds close.`);continue;}
  if(name==='make invisible'||name==='invisibility'){m.invisible=true;this.log(`The ${m.kind} fades from view.`);continue;}
  if(name==='speed monster'){m.hasted=100;this.log(`The ${m.kind} moves faster.`);continue;}
  if(name==='slow monster'){m.slowed=100;this.log(`The ${m.kind} slows down.`);continue;}
  if(name==='confuse monster'){m.confused=20;continue;}
  if(name==='cancellation'){m.cancelled=true;m.hasted=0;m.invisible=false;this.log(`The ${m.kind}'s magic is cancelled.`);continue;}
  if(name==='polymorph'){if(d.generation.includes('G_UNIQ')){this.log('The creature resists transformation.');continue;}const next=this.randomMonster(this.depth+5);m.kind=next.name;m.hp=m.maxHp=Math.max(4,next.level*5);continue;}
  if(['teleportation','teleport away'].includes(name)){if(this.level.noTeleport){this.log('A mysterious force prevents teleportation.');continue;}const dest=this.rng.pick(this.level.tiles.flat().filter(t=>this.passable(t.x,t.y)&&!['water','lava'].includes(t.type)&&!this.monsterAt(t.x,t.y)&&N.distance(t,p)>0));if(dest){m.x=dest.x;m.y=dest.y;}continue;}
  if(name==='stone to flesh'){if(m.kind==='stone golem'){m.kind='flesh golem';m.hp=m.maxHp=Math.min(40,m.hp);}else this.log('The creature looks momentarily fleshy.');continue;}
  if(['undead turning','turn undead'].includes(name)&&!undead)continue;
  if(name==='sleep'){if(!d.resists.includes('MR_SLEEP')){m.asleep=this.rng.int(4,12);this.log(`The ${m.kind} falls asleep.`);}else this.log(`The ${m.kind} resists sleep.`);continue;}
  const resist={fire:'MR_FIRE',fireball:'MR_FIRE',cold:'MR_COLD','cone of cold':'MR_COLD',lightning:'MR_ELEC','magic missile':'MR_MAGIC','drain life':'MR_DRAIN'}[name];
  if(resist&&d.resists.includes(resist)||['death','finger of death'].includes(name)&&(undead||/DEMON/.test(d.flags)||d.resists.includes('MR_MAGIC'))){this.log(`The ${m.kind} resists!`);continue;}
  if(!utility.has(name)&&['silver dragon','baby silver dragon'].includes(m.kind)){this.log('The ray reflects from shining scales!','warning');if(!this.has('reflection'))this.damage(this.rng.dice(2,6),'a reflected ray');break;}
  const damage=['death','finger of death'].includes(name)?m.hp:this.rng.dice(['striking','force bolt','drain life'].includes(name)?2:3,6);m.hp-=damage;if(m.peaceful)m.peaceful=false;if(name==='drain life')p.hp=Math.min(p.maxHp,p.hp+Math.floor(damage/2));this.log(`The ${name} strikes the ${m.kind} for ${damage}.`,'combat');this.emit('hit',{x,y,value:damage});if(m.hp<=0)this.kill(m);if(['striking','force bolt'].includes(name))break;
 }this.emit('beam',{points,name});
};
P.zap=function(i,dir){if(i.unpaid&&i.charges>0){const s=this.findShop(i.shopId)?.shop;if(s)s.debit+=Math.max(1,Math.ceil(i.price/10));}return oldZap.call(this,i,dir);};
P.attack=function(m,bonus=0){const penalties={'':0,Burdened:1,Stressed:3,Strained:5,Overtaxed:7,Overloaded:9};let weapon=this.player.inventory.find(i=>i.id===this.player.equipment.weapon);const hp=m.hp;oldAttack.call(this,m,bonus-(penalties[this.encumbrance]||0));if(m.hp<hp&&m.hp>0){if(this.player.status.confusingTouch){m.confused=15;delete this.player.status.confusingTouch;this.log('Your glowing hands confuse the creature.');}if(weapon?.artifact==='Excalibur'){const n=this.rng.int(1,10);m.hp-=n;this.log(`Excalibur strikes for ${n} additional damage.`,'combat');if(m.hp<=0)this.kill(m);}}};
P.equip=function(i,slot){if(['blindfold','lenses','towel'].includes(i.name))slot='eyes';const p=this.player,twoHanded=['two-handed sword','battle-axe','dwarvish mattock','quarterstaff','bow','yumi','crossbow'].includes(i.name);if(slot==='weapon'&&twoHanded&&p.equipment.shield){this.log('Remove your shield before wielding a two-handed weapon.');return false;}if(this.def(i).slot==='shield'){const w=p.inventory.find(i=>i.id===p.equipment.weapon);if(w&&['two-handed sword','battle-axe','dwarvish mattock','quarterstaff','bow','yumi','crossbow'].includes(w.name)){this.log('Your weapon needs both hands.');return false;}}return oldEquip.call(this,i,slot);};
P.apply=function(i,dir=[0,0],target){
 const p=this.player,name=i.name,at={x:p.x+dir[0],y:p.y+dir[1]},m=this.monsterAt(at.x,at.y),near=this.level.monsters.filter(m=>N.distance(m,p)<=6),charged=()=>{if(i.charges<=0){this.log(`The ${name} is depleted.`);return false;}i.charges--;if(i.unpaid){const s=this.findShop(i.shopId)?.shop;if(s)s.debit+=Math.max(1,Math.ceil(i.price/10));}return true;};
 if(i.contents){this.emit('container',{id:i.id});return false;}
 if(name==='Bell of Opening'){if(i.buc<0){this.log('The cursed bell gives a discordant clang.');this.endTurn();return true;}this.progress.bellTurn=this.turn;for(const t of this.level.tiles.flat())if(N.distance(t,p)<5&&t.type==='secret')t.type='door';this.log('The Bell of Opening rings with an unsettling shrill sound.');}
 else if(name==='Candelabrum of Invocation'){if(i.buc<0){this.log('The cursed candles refuse to light.');return false;}let needed=7-(i.candles||0);for(const c of [...p.inventory].filter(j=>['wax candle','tallow candle'].includes(j.name))){while(needed>0&&p.inventory.includes(c)){this.consume(c);needed--;i.candles=(i.candles||0)+1;}}i.lit=!i.lit;if(i.lit)p.status.light=500;this.log(`The candelabrum holds ${i.candles||0} candles, ${i.lit?'burning brightly':'unlit'}.`);}
 else if(['blindfold','lenses'].includes(name))return p.equipment.eyes===i.id?this.unequip(i):this.equip(i,'eyes');
 else if(name==='pick-axe'&&this.level.noDig){this.log('The walls are too hard to dig.');return false;}
 else if(name==='unicorn horn'){if(i.buc<0){p.status.confusion=20;this.log('The cursed horn makes your head spin.','warning');}else{for(const k of ['sickness','blindness','confusion','hallucination'])delete p.status[k];p.stats=p.stats.map((v,k)=>Math.max(v,p.baseStats[k]));this.log('You feel restored.');}}
 else if(name==='stethoscope'){this.log(m?`${m.name||m.kind}: ${m.hp}/${m.maxHp} HP, AC ${N.monsterDef(m.kind).ac}.`:'You hear no heartbeat in that direction.');return true;}
 else if(name==='mirror'){if(m?.kind==='Medusa'&&!m.cancelled){m.hp=0;this.log('Medusa meets her own reflected gaze!','good');this.kill(m);}else if(m&&!m.tame){m.fleeing=8;this.log(`The ${m.kind} recoils from its reflection.`);}else this.log('You examine the polished mirror.');}
 else if(name==='tin whistle'||name==='bell'||name==='bugle'){near.forEach(m=>m.asleep=0);this.log('Your call wakes nearby creatures.');}
 else if(name==='leash'){if(!m?.tame){this.log('There is no tame creature there.');return false;}m.leashed=!m.leashed;this.log(`${m.name||m.kind} is ${m.leashed?'attached to':'released from'} the leash.`);}
 else if(name==='saddle'){if(!m?.tame||!['UNICORN','QUADRUPED'].includes(N.monsterDef(m.kind).family)){this.log('That creature cannot carry a saddle.');return false;}m.saddled=true;this.log(`You saddle ${m.name||m.kind}.`);}
 else if(name==='grappling hook'){const o=this.level.items.find(o=>N.distance(o,at)===0);if(o){o.x=p.x;o.y=p.y;this.log('You pull the object toward you.');}else this.log('The hook finds no purchase.');}
 else if(name==='tinning kit'){const o=this.level.items.find(o=>N.distance(o,p)===0&&o.item.corpse);if(!o){this.log('Stand over a corpse to preserve it.');return false;}if(!charged())return false;this.level.items=this.level.items.filter(j=>j!==o);this.level.items.push({x:p.x,y:p.y,item:this.createItem('tin','food',{known:true,nutrition:o.item.nutrition||100,tinMonster:o.item.corpse})});this.log('You preserve the corpse in a tin.');}
 else if(name==='tin opener'){this.log('Keep it in your inventory to open tins quickly when eating.');return false;}
 else if(name==='can of grease'){if(!target){this.emit('toolTarget',{id:i.id,operation:'grease'});return false;}if(!charged())return false;target.greased=true;this.log(`You grease your ${target.name}.`);}
 else if(name==='magic marker'){if(!target){this.emit('write',{id:i.id});return false;}const d=N.lookup(target.name,target.category),blank=p.inventory.find(j=>j.category===target.category&&j.name==='blank paper');if(!d||!blank||!this.identified[target.category+':'+target.name]){this.log('You need matching blank paper and knowledge of the text.');return false;}if(i.charges<8){this.log('The marker is too dry.');return false;}i.charges-=8;this.consume(blank);const written=this.createItem(d.name,d.category,{buc:i.buc,known:true});if(!this.addItem(written))this.level.items.push({x:p.x,y:p.y,item:written});this.log(`You write ${d.category} of ${d.name}.`);}
 else if(name==='crystal ball'){if(!charged())return false;if(this.rng.int(1,20)>p.stats[3]){p.status.confusion=10;this.log('Clouded visions confuse you.');}else this.magic('clairvoyance');}
 else if(name==='figurine'){const spot=N.DIRS.map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y));if(!spot)return false;this.spawn(i.monster||'kitten',spot.x,spot.y,{tame:i.buc>=0,peaceful:i.buc>=0});this.consume(i);this.log('The figurine comes to life.');}
 else if(name==='bag of tricks'){if(!charged())return false;this.magic('create monster');}
 else if(name==='horn of plenty'){if(!charged())return false;const food=this.createItem(this.rng.pick(['food ration','apple','cram ration']),'food',{buc:i.buc});this.level.items.push({x:p.x,y:p.y,item:food});this.log('Food spills from the horn!','loot');}
 else if(name==='fire horn'||name==='frost horn'){if(!charged())return false;this.ray(name==='fire horn'?'fire':'cold',dir,'tool');}
 else if(['wooden flute','magic flute','wooden harp','magic harp','tooled horn','leather drum','drum of earthquake'].includes(name)){
  if(name.startsWith('magic')||name==='drum of earthquake'){if(!charged())return false;}
  if(name==='magic flute'){near.filter(m=>!N.monsterDef(m.kind).resists.includes('MR_SLEEP')).forEach(m=>m.asleep=8);this.log('A soothing melody lulls nearby creatures to sleep.');}
  else if(name==='magic harp'){near.filter(m=>!N.monsterDef(m.kind).generation.includes('G_UNIQ')&&!m.shopkeeper).forEach(m=>{m.tame=true;m.peaceful=true;});this.log('The music charms nearby creatures.');}
  else if(name==='drum of earthquake'){if(this.level.noDig){this.log('The puzzle floor does not yield.');}else{for(const m of near){m.hp-=this.rng.dice(2,6);if(m.hp<=0)this.kill(m);}this.log('The dungeon shakes beneath the thunderous drum.');}}
  else {near.forEach(m=>{m.asleep=0;if(!m.tame)m.fleeing=5;});this.log('Music echoes through the dungeon.');}
 }
 else if(name==='land mine'||name==='beartrap'){if(this.level.traps.some(t=>N.distance(t,p)===0)){this.log('There is already a trap here.');return false;}this.level.traps.push({x:p.x,y:p.y,type:name==='beartrap'?'bear trap':'land mine',seen:true,playerSet:true});this.consume(i);this.log('You set the trap carefully.');}
 else return oldApply.call(this,i,dir);
 this.endTurn();return true;
};
P.throwItem=function(i,[dx,dy]){
 const p=this.player,slot=Object.keys(p.equipment).find(k=>p.equipment[k]===i.id);if(slot&&slot!=='quiver'){this.log('Remove or unwield that object before throwing it.');return false;}let x=p.x,y=p.y,hit=null;
 for(let n=0;n<7;n++){if(!this.passable(x+dx,y+dy))break;x+=dx;y+=dy;hit=this.monsterAt(x,y);if(hit)break;}
 const potion=i.category==='potion';if(hit){
  if(i.category==='food'&&['DOG','FELINE'].includes(N.monsterDef(hit.kind).family)){hit.tame=true;hit.peaceful=true;this.log(`The ${hit.kind} accepts your food.`);this.consume(i);this.endTurn();return;}
  if(potion){if(['healing','extra healing','full healing'].includes(i.name))hit.hp=Math.min(hit.maxHp,hit.hp+20);else if(['sleeping','paralysis'].includes(i.name))hit.asleep=6;else if(i.name==='confusion')hit.confused=15;else if(i.name==='invisibility')hit.invisible=true;else if(['acid','sickness','oil'].includes(i.name)){hit.hp-=this.rng.dice(2,6);if(hit.hp<=0)this.kill(hit);}this.log(`The potion shatters against the ${hit.kind}.`);}
  else {const launcher=p.inventory.find(j=>j.id===p.equipment.weapon),matches=launcher&&(/bow|yumi/.test(launcher.name)&&/arrow|ya/.test(i.name)||launcher.name==='crossbow'&&i.name==='crossbow bolt'),bonus=matches?2+(p.role==='Ranger'||p.role==='Samurai'?1:0):0;const damage=Math.max(1,this.rng.dice(1,this.def(i).damage||2)+(i.enchant||0)+bonus);hit.hp-=damage;if(hit.peaceful&&!hit.tame)hit.peaceful=false;this.log(`Your ${i.name} hits the ${hit.kind} for ${damage}.`,'combat');this.emit('hit',{x,y,value:damage});if(hit.hp<=0)this.kill(hit);}
 }
 if(potion){this.consume(i);if(!hit)this.log('The potion shatters on the floor.');}
 else{const thrown={...i,id:++this.uid,count:1};delete thrown.letter;if(i.unpaid&&this.shopFor({x,y})?.id!==i.shopId){this.chargeUsage(i);thrown.unpaid=false;delete thrown.shopId;}i.count--;if(i.count<=0){p.inventory=p.inventory.filter(j=>j!==i);for(const k of Object.keys(p.equipment))if(p.equipment[k]===i.id)delete p.equipment[k];}this.level.items.push({x,y,item:thrown});}
 this.emit('beam',{points:[{x:p.x,y:p.y},{x,y}],name:'throw'});this.endTurn();return true;
};
})();
