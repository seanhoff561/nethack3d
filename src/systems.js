/* Cross-system rules: identity, inventory, shops, conditions and progression. */
(() => {
'use strict';
const N=globalThis.NH,P=N.Game.prototype,base={};
for(const k of ['move','endTurn','monsterTurn','consume','drop','createItem','checkLevel','has','apply','magic','read','zap','throwItem','attack','pray','teleport'])base[k]=P[k];
const aligned=['Lawful','Neutral','Chaotic'];
N.races={Human:{alignments:aligned,max:[18,18,18,18,18,18]},Elf:{alignments:['Chaotic'],max:[18,18,16,20,20,18]},Dwarf:{alignments:['Lawful'],max:[18,20,20,16,16,16]},Gnome:{alignments:['Neutral'],max:[18,18,18,19,18,18]},Orc:{alignments:['Chaotic'],max:[18,18,18,16,16,16]}};
N.roleChoices={Archeologist:['Human','Dwarf','Gnome'],Barbarian:['Human','Orc'],Caveman:['Human','Dwarf','Gnome'],Healer:['Human','Gnome'],Knight:['Human'],Monk:['Human'],Priest:['Human','Elf'],Ranger:['Human','Elf','Gnome','Orc'],Rogue:['Human','Orc'],Samurai:['Human'],Tourist:['Human'],Valkyrie:['Human','Dwarf'],Wizard:['Human','Elf','Gnome','Orc']};
N.roleAlignments={Archeologist:['Lawful','Neutral'],Barbarian:['Neutral','Chaotic'],Caveman:['Lawful','Neutral'],Healer:['Neutral'],Knight:['Lawful'],Monk:aligned,Priest:aligned,Ranger:['Neutral','Chaotic'],Rogue:['Chaotic'],Samurai:['Lawful'],Tourist:['Neutral'],Valkyrie:['Lawful','Neutral'],Wizard:['Neutral','Chaotic']};
N.genders=['Female','Male','Nonbinary'];
N.characterAlignments=(role,race)=>N.roleAlignments[role].filter(a=>N.races[race].alignments.includes(a));
N.defaults={numberPad:true,autoOpenDoors:true,autopickup:true,sortInventory:true,pauseOnHunger:true,pauseOnBurden:true,pauseOnLowHP:true,sound:true,quality:'high'};
N.parseConfig=text=>{let d=JSON.parse(text);if(!d||Array.isArray(d)||typeof d!=='object')throw Error('The configuration must be a JSON object.');const out={...N.defaults};for(const [k,v]of Object.entries(d)){if(!Object.hasOwn(out,k))throw Error('Unknown option: '+k);if(k==='quality'?!['high','low'].includes(v):typeof v!=='boolean')throw Error('Invalid value for '+k);out[k]=v;}return out;};
P.configureCharacter=function(options={}){
 const p=this.player,race=options.race||'Human';if(!N.roleChoices[p.role].includes(race))throw Error('That race cannot follow this calling.');
 p.race=race;p.gender=N.genders.includes(options.gender)?options.gender:p.role==='Valkyrie'?'Female':'Male';
 const choices=N.characterAlignments(p.role,race);p.align=choices.includes(options.align)?options.align:choices.includes(p.align)?p.align:choices[0];p.stats=p.stats.map((v,i)=>Math.min(v,N.races[race].max[i]));
 if(race==='Orc'&&!p.properties.includes('MR_POISON'))p.properties.push('MR_POISON');if(race!=='Human')p.properties.push('infravision');
 p.baseStats=[...p.stats];p.alignmentRecord=10;this.progress={};this.alerts=[];this.conditionState={hunger:this.hunger,burden:this.encumbrance,lowHP:false};
 // Ammunition is ready immediately; roles retain different starting strengths.
 const ammo=p.inventory.find(i=>N.lookup(i.name,i.category)?.ammo||['dart','ya'].includes(i.name));if(ammo)p.equipment.quiver=ammo.id;
 if(p.role==='Healer')p.maxPw=p.pw=15;
 if(p.role==='Priest')for(const i of p.inventory)if(i.name==='water')i.buc=1;
};
P.migrate=function(){
 const p=this.player;delete p.orientation;p.gender||='Unspecified';p.baseStats||=[...p.stats];p.alignmentRecord??=10;this.progress||={};this.alerts||=[];this.conditionState||={hunger:this.hunger,burden:this.encumbrance,lowHP:false};
 for(const l of Object.values(this.levels)){l.shops||=[];l.theme||=N.themeFor(l.branch,l.depth);for(const t of l.tiles.flat())if(t.type==='altar'){t.align||='Neutral';t.facing??=0;}}
};
P.allInventory=function(items=this.player.inventory){return items.flatMap(i=>[i,...this.allInventory(i.contents||[])]);};
P.itemWeight=function(i){let contents=(i.contents||[]).reduce((s,j)=>s+this.itemWeight(j),0);if(i.name==='bag of holding')contents=Math.ceil(contents*(i.buc<0?2:i.buc>0?.25:.5));return (i.corpse?i.weight||0:this.def(i).weight||0)*i.count+contents;};
Object.defineProperty(P,'weight',{get(){return this.player.inventory.reduce((s,i)=>s+this.itemWeight(i),0)+Math.floor((this.player.gold+50)/100);}});
Object.defineProperty(P,'encumbrance',{get(){const r=this.weight/this.capacity;return r>=3?'Overloaded':r>=2.5?'Overtaxed':r>=2?'Strained':r>=1.5?'Stressed':r>1?'Burdened':'';}});
P.sortedInventory=function(items=this.player.inventory){const cats=['weapon','armor','amulet','ring','tool','food','potion','scroll','spellbook','wand','gem'];return [...items].sort((a,b)=>cats.indexOf(a.category)-cats.indexOf(b.category)||this.label(a).localeCompare(this.label(b))||a.id-b.id);};
P.shopItem=function(type='general'){
 const cats={general:['weapon','armor','food','potion','scroll','wand','ring','gem','tool','spellbook','amulet'],armor:['armor','weapon'],book:['scroll','spellbook'],liquor:['potion'],weapons:['weapon','armor'],food:['food'],jeweler:['ring','gem','amulet'],apparel:['wand','tool','armor'],hardware:['tool'], 'rare books':['spellbook','scroll'],'health food':['food','potion','scroll']};
 const cat=this.rng.pick(cats[type]||cats.general),defs=N.ITEMS.filter(i=>i.category===cat&&i.prob>0&&i.name!=='Amulet of Yendor');if(!defs.length)return this.randomItem();const d=this.rng.weighted(defs,x=>x.prob);return this.createItem(d.name,d.category,{count:d.ammo?this.rng.int(3,10):1});
};
P.createItem=function(name,category,extra={}){const i=base.createItem.call(this,name,category,extra);if(this.def(i).container&&!['bag of tricks'].includes(name))i.contents=extra.contents||[];if(/horn|camera|marker|tinning kit|grease|bag of tricks|magic flute|magic harp|crystal ball/.test(name)&&extra.charges===undefined)i.charges=this.rng.int(4,12);return i;};
P.shopFor=function(p=this.player,l=this.level){const room=l.rooms.find(r=>r.shop&&p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h);return room&&l.shops?.find(s=>s.room===room.id);};
P.findShop=function(id){for(const l of Object.values(this.levels)){const shop=l.shops?.find(s=>s.id===id);if(shop)return {shop,level:l,keeper:l.monsters.find(m=>m.shopId===id&&m.shopkeeper&&m.hp>0)};}return null;};
P.shopDebt=function(s){return (s.debit||0)+this.allInventory().filter(i=>i.unpaid&&i.shopId===s.id).reduce((sum,i)=>sum+(i.price||0)*i.count,0);};
P.chargeUsage=function(i,count=1){if(!i.unpaid)return;const s=this.findShop(i.shopId)?.shop;if(s)s.debit+=(i.price||0)*count;};
P.consume=function(i){this.chargeUsage(i);return base.consume.call(this,i);};
P.updateShopkeepers=function(){
 for(const s of this.level.shops||[]){const m=this.level.monsters.find(m=>m.shopId===s.id&&m.shopkeeper&&m.hp>0);if(!m||!m.peaceful)continue;
  const inside=this.shopFor()?.id===s.id,restricted=this.has('invisibility')||this.player.inventory.some(i=>['pick-axe','dwarvish mattock'].includes(i.name));
  const target=(inside&&this.shopDebt(s)>0||!inside&&restricted)?s.entrance:s.home;
  if(N.distance(m,target)===0)continue;const next=N.DIRS.map(([dx,dy])=>({x:m.x+dx,y:m.y+dy,dx,dy})).filter(p=>this.passable(p.x,p.y)&&!this.monsterAt(p.x,p.y)&&N.distance(p,this.player)>0&&this.shopFor(p)?.id===s.id).sort((a,b)=>N.distance(a,target)-N.distance(b,target))[0];
  if(next){m.x=next.x;m.y=next.y;m.facing=[next.dx,next.dy];}
 }
};
P.move=function(dx,dy,mode='normal'){
 if(this.player.status.paralysis){this.log('You cannot move!','warning');this.endTurn();return false;}
 if(this.encumbrance==='Overloaded'){this.log('You are carrying too much to move.','warning');return false;}
 const p=this.player,from=this.shopFor(),to=this.shopFor({x:p.x+dx,y:p.y+dy});
 if(from&&!to&&this.shopDebt(from)>0){const keeper=this.findShop(from.id)?.keeper;if(keeper?.peaceful&&N.distance(keeper,from.entrance)<=1){this.log(`${keeper.name||'The shopkeeper'} blocks the exit. You owe ${this.shopDebt(from)} gold. [p] Pay or return the goods.`,'warning');this.updateShopkeepers();return false;}}
 if(to&&!from&&(this.has('invisibility')||p.inventory.some(i=>['pick-axe','dwarvish mattock'].includes(i.name)))&&this.findShop(to.id)?.keeper?.peaceful){this.log('The shopkeeper blocks entry. Put away your digging tools and become visible.','warning');return false;}
 const result=base.move.call(this,dx,dy,mode);if(result&&from&&this.shopFor()?.id!==from.id)this.checkTheft(from);return result;
};
P.checkTheft=function(s){if(!s||!this.shopDebt(s))return;const m=this.findShop(s.id)?.keeper;if(m?.peaceful){m.peaceful=false;this.log(`${m.name||'The shopkeeper'} shouts: Thief! Your bill is ${this.shopDebt(s)} gold!`,'danger');}};
P.pay=function(){
 const s=this.shopFor()||(this.level.shops||[]).find(s=>N.distance(this.findShop(s.id)?.keeper||{x:-100,y:-100},this.player)<=2);if(!s||!this.findShop(s.id)?.keeper){this.log('There is no shopkeeper within reach.');return false;}
 const cost=Math.max(0,this.shopDebt(s)-(s.credit||0));if(!this.shopDebt(s)){this.log('Your account is settled.');return false;}if(this.player.gold<cost){this.log(`You owe ${cost} gold, but have only ${this.player.gold}.`,'warning');return false;}
 this.player.gold-=cost;s.credit=Math.max(0,(s.credit||0)-this.shopDebt(s));s.debit=0;this.allInventory().filter(i=>i.shopId===s.id).forEach(i=>{i.unpaid=false;delete i.shopId;});this.findShop(s.id).keeper.peaceful=true;this.log(`You pay ${cost} gold. Thank you for shopping!`,'good');this.endTurn();return true;
};
P.drop=function(i){if(i.name==='loadstone'&&i.buc<0){i.bucKnown=true;this.log('The cursed loadstone will not leave your pack.','warning');return false;}const result=base.drop.call(this,i);if(result&&i.unpaid&&this.shopFor()?.id===i.shopId)this.log('The merchandise is returned; you no longer owe for it.');return result;};
P.teleport=function(){if(this.level.noTeleport){this.log('A mysterious force prevents teleportation.');return false;}const s=this.shopFor();base.teleport.call(this);if(s&&this.shopFor()?.id!==s.id)this.checkTheft(s);};
P.monsterTurn=function(){this.updateShopkeepers();for(const m of this.level.monsters){if(m.slowed>0)m.slowed--;if(m.fleeing>0)m.fleeing--;}
 base.monsterTurn.call(this);
};
P.endTurn=function(){if(this.dead||this.won)return;const before=this.conditionState||{hunger:this.hunger,burden:this.encumbrance,lowHP:false};base.endTurn.call(this);
 const after={hunger:this.hunger,burden:this.encumbrance,lowHP:this.player.hp<=Math.ceil(this.player.maxHp*.25)};
 if(before.hunger!==after.hunger&&['Hungry','Weak','Fainting'].includes(after.hunger))this.alerts.push({kind:'hunger',title:'You are '+after.hunger.toLowerCase(),text:'Your nutrition is running low. Eat something or seek divine aid.'});
 if(before.burden!==after.burden&&after.burden)this.alerts.push({kind:'burden',title:'You are '+after.burden.toLowerCase(),text:`You carry ${this.weight} weight; your comfortable limit is ${this.capacity}. Drop items or use a bag of holding.`});
 if(!before.lowHP&&after.lowHP&&!this.dead)this.alerts.push({kind:'lowHP',title:'Your health is critical',text:'Retreat, heal, or ask your deity for help.'});
 this.conditionState=after;
 if(this.player.race==='Elf'&&this.player.level>=4&&!this.player.properties.includes('MR_SLEEP'))this.player.properties.push('MR_SLEEP');
 if(this.level.puzzle&&!this.level.puzzle.solved){const remaining=this.level.traps.filter(t=>t.sokoban).length;this.level.puzzle.remaining=remaining;if(!remaining){this.level.puzzle.solved=true;this.log('The last pit is filled. The staircase is now accessible!','good');if(this.depth===4){const bag=this.rng.next()<.5,reward=this.createItem(bag?'bag of holding':'amulet of reflection',bag?'tool':'amulet',{buc:0,known:true});this.level.items.push({...this.level.down,item:reward});}}}
};
P.stairs=function(dir,forced=false){
 const p=this.player,t=this.tile(p.x,p.y);if(!forced&&this.has('levitation')){this.log('You are floating above the stairs.');return false;}
 if(!forced&&!(dir===1&&['down','branch','portal'].includes(t.type)||dir===-1&&t.type==='up')){this.log('There are no usable stairs here.');return false;}
 if(this.level.puzzle&&!this.level.puzzle.solved&&dir===1){this.log('Fill every pit with a boulder to open the way.');return false;}
 if(t.destination==='Quest'&&p.level<14){this.log('Your quest leader asks you to return at experience level 14.','warning');return false;}
 if(this.branch==='Dungeons'&&this.depth===1&&dir===-1){if(!this.allInventory().some(i=>i.name==='Amulet of Yendor')){this.log('The Amulet of Yendor still lies below.');return false;}return this.changeLevel('Earth',1,null,forced);}
 if(t.type==='portal')return this.changeLevel(t.destination,1,null,forced);
 if(dir===1&&t.type==='branch')return this.changeLevel(t.destination||'Mines',1,null,forced);
 if(dir===-1&&this.depth===1&&N.branches[this.branch]?.parent){const depth=N.branches[this.branch].parent;return this.changeLevel('Dungeons',depth,'branch',forced);}
 const depth=this.depth+dir;if(depth<1||depth>N.branches[this.branch].max){this.log('You have reached the end of this branch.');return false;}
 return this.changeLevel(this.branch,depth,dir<0?'down':'up',forced);
};
P.changeLevel=function(branch,depth,arrival,forced=false){
 const old=this.level,shop=this.shopFor(),pets=old.monsters.filter(m=>m.tame&&N.distance(m,this.player)<=2);this.checkTheft(shop);this.branch=branch;this.depth=depth;this.getLevel();
 const dest=arrival==='branch'?this.level.branchStair:arrival==='down'?this.level.down:this.level.up;if(!dest)throw Error('Missing arrival staircase.');
 const occupant=this.monsterAt(dest.x,dest.y);if(occupant){const safe=this.level.tiles.flat().find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y)&&N.distance(t,dest)>1);if(safe){occupant.x=safe.x;occupant.y=safe.y;}}
 this.player.x=dest.x;this.player.y=dest.y;
 for(const pet of pets){const spot=N.DIRS.map(([dx,dy])=>({x:dest.x+dx,y:dest.y+dy})).find(t=>this.passable(t.x,t.y)&&!this.monsterAt(t.x,t.y));if(spot){old.monsters=old.monsters.filter(m=>m!==pet);Object.assign(pet,spot);this.level.monsters.push(pet);}}
 this.log(`You arrive in ${N.themes[this.level.theme]?.name||branch}, level ${depth}.`,'story');this.emit('stairs');if(!forced)this.endTurn();else this.updateVision();return true;
};
P.offer=function(i){const t=this.tile(this.player.x,this.player.y);if(t.type!=='altar'){this.log('There is no altar here.');return false;}
 if(i.name==='Amulet of Yendor'){if(this.branch==='Astral'&&t.highAltar&&t.align===this.player.align){this.consume(i);this.won=true;this.log('Your deity accepts the Amulet of Yendor. You ascend to demigodhood!','good');this.emit('victory');return true;}this.log('The Amulet must be offered at your own high altar on the Astral Plane.');return false;}
 if(!i.corpse){this.log('That is not a suitable sacrifice.');return false;}if(this.turn-i.age>50){this.log('Your deity rejects this stale offering.');return false;}
 this.consume(i);if(t.align!==this.player.align){if(!t.highAltar&&this.rng.int(1,20)<=this.player.level){t.align=this.player.align;this.log('The altar is converted to your alignment!','good');}else{this.player.luck--;this.log('The opposing deity rejects your claim.','warning');}}else{this.prayerTurn-=100;this.player.luck=Math.min(13,this.player.luck+1);this.player.alignmentRecord++;this.log('Your sacrifice is consumed in divine flame.','good');}this.emit('magic',{x:t.x,y:t.y});this.endTurn();return true;
};
P.pray=function(){const t=this.tile(this.player.x,this.player.y);if(t.type==='altar'&&t.align!==this.player.align){this.log('You invoke an opposing deity and incur its anger.','danger');this.player.luck-=2;this.damage(this.rng.dice(2,6),'divine wrath');this.prayerTurn=this.turn;this.endTurn();return;}
 const accepted=this.turn-this.prayerTurn>=300;base.pray.call(this);if(accepted&&t.type==='altar')for(const o of this.level.items.filter(o=>N.distance(o,this.player)===0&&o.item.name==='water')){o.item.buc=1;o.item.bucKnown=true;this.log('The water on the altar shines with a holy light.','good');}
};
P.invoke=function(){const p=this.player,t=this.tile(p.x,p.y),inv=this.allInventory(),bell=inv.find(i=>i.name==='Bell of Opening'),cand=inv.find(i=>i.name==='Candelabrum of Invocation');if(!t.invocation||!bell||bell.buc<0||!cand||cand.buc<0||!inv.some(i=>i.name==='Book of the Dead'&&i.buc>=0)||cand.candles<7||!cand.lit||!this.progress.bellTurn||this.turn-this.progress.bellTurn>5){this.log('The ritual needs the vibrating square, seven lit candles, and the recently rung Bell of Opening.','warning');return false;}
 if(this.progress.invoked){this.log('The invocation has already opened the sanctum.');return false;}this.progress.invoked=true;t.type='down';this.log('The floor opens into a stairway to Moloch’s Sanctum. The Amulet’s guardian awaits below.','story');this.endTurn();return true;
};
P.read=function(i){if(i.name==='Book of the Dead')return this.invoke();if(i.name==='novel'){this.log('You spend a few quiet moments reading a story.');this.endTurn();return true;}return base.read.call(this,i);};
P.storeItem=function(container,i){if(!container.contents||i===container||this.allInventory(i.contents||[]).includes(container)){this.log('That cannot go in this container.');return false;}if(Object.values(this.player.equipment).includes(i.id)){this.log('Remove that item first.');return false;}if(i.name==='bag of holding'||i.name==='bag of tricks'){this.log('Magical bags cannot safely be nested.','warning');return false;}this.player.inventory=this.player.inventory.filter(j=>j!==i);delete i.letter;container.contents.push(i);this.log(`You put ${this.label(i)} into the ${container.name}.`);this.endTurn();return true;};
P.takeItem=function(container,i){if(!container.contents?.includes(i))return false;const added=this.addItem(i);if(!added){this.log('Your pack has no free item letters.');return false;}container.contents=container.contents.filter(j=>j!==i);this.log(`You take ${this.label(i)} from the ${container.name}.`);this.endTurn();return true;};
P.dip=function(i,liquid){if(liquid?.name==='water'){if(i===liquid)return false;const sign=liquid.buc;if(sign){i.buc=sign>0?(i.buc<0?0:1):(i.buc>0?0:-1);i.bucKnown=true;this.log(`Your ${i.name} glows ${sign>0?'amber':'black'}.`);}else{if(i.category==='scroll'&&i.name!=='blank paper')i.name='blank paper';if(i.category==='potion'&&i.name!=='water'){if(i.diluted)i.name='water';else i.diluted=true;}this.log(`You wet your ${i.name}.`);}this.consume(liquid);this.endTurn();return true;}
 if(this.tile(this.player.x,this.player.y).type!=='fountain'){this.log('Choose a potion of water or stand on a fountain.');return false;}if(i.name==='long sword'&&this.player.level>=5&&this.player.align==='Lawful'&&!this.progress.excalibur&&this.rng.int(1,6)===1){i.artifact='Excalibur';i.named='Excalibur';i.buc=1;i.bucKnown=true;i.erosionproof=true;this.progress.excalibur=true;this.tile(this.player.x,this.player.y).type='floor';this.log('A hand rises from the water and blesses Excalibur!','good');}else this.log('Water drips from the object.');this.endTurn();return true;
};
})();
