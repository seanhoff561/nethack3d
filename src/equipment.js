/* Equipment properties, role growth and ranged monster behavior. */
(() => {
'use strict';
const N=globalThis.NH,P=N.Game.prototype,oldHas=P.has,oldEquip=P.equip,oldTurn=P.endTurn,oldMonsterTurn=P.monsterTurn;
const properties={DISPLACED:'displacement',FIXED_ABIL:'sustain ability',FUMBLING:'fumbling',HUNGER:'hunger',AGGRAVATE_MONSTER:'aggravate monster',CONFLICT:'conflict',WARNING:'warning',TELEPORT:'teleportation',TELEPORT_CONTROL:'teleport control',POLYMORPH:'polymorph',POLYMORPH_CONTROL:'polymorph control',PROT_FROM_SHAPE_CHANGERS:'protection from shape changers',SLEEPY:'sleepy',STRANGLED:'strangulation',MAGICAL_BREATHING:'magical breathing',UNCHANGING:'unchanging',JUMPING:'jumping',CLAIRVOYANT:'clairvoyance'};
P.has=function(prop){if(prop==='invisibility'&&this.wornIds.some(id=>this.player.inventory.find(i=>i.id===id)?.name==='mummy wrapping'))return false;return oldHas.call(this,prop)||this.wornIds.some(id=>{const i=this.player.inventory.find(i=>i.id===id);return i&&properties[this.def(i).property]===prop;});};
P.attribute=function(index){let value=this.player.stats[index];for(const id of this.wornIds){const i=this.player.inventory.find(i=>i.id===id);if(!i)continue;if(i.name==='gauntlets of power'&&index===0)return 25;if(i.name==='dunce cap'&&[3,4].includes(index))return 6;if(i.name==='gain strength'&&index===0||i.name==='gain constitution'&&index===2||i.name==='adornment'&&index===5||i.name==='gauntlets of dexterity'&&index===1||i.name==='helm of brilliance'&&[3,4].includes(index))value+=i.enchant||0;}return Math.max(3,value);};
Object.defineProperty(P,'capacity',{get(){return Math.min(1000,25*(this.attribute(0)+this.attribute(2))+50);}});
P.equip=function(i,slot){const result=oldEquip.call(this,i,slot);if(!result)return result;if(i.name==='helm of opposite alignment'){this.player.originalAlign||=this.player.align;this.player.align=this.player.align==='Lawful'?'Chaotic':'Lawful';i.buc=-1;this.log('Your allegiance shifts to an opposing deity.','warning');}return result;};
const oldUnequip=P.unequip;P.unequip=function(i){const result=oldUnequip.call(this,i);if(result&&i.name==='helm of opposite alignment'&&this.player.originalAlign){this.player.align=this.player.originalAlign;delete this.player.originalAlign;}return result;};
P.checkLevel=function(){const p=this.player;let threshold=p.level<10?10*2**p.level:10000*(p.level-8);if(p.xp<threshold||p.level>=30)return;p.level++;const warrior=['Valkyrie','Barbarian','Caveman','Knight','Samurai'].includes(p.role),caster=['Wizard','Healer','Priest'].includes(p.role),hp=this.rng.int(warrior?6:4,warrior?12:8)+Math.max(0,Math.floor((p.stats[2]-14)/2));p.maxHp+=hp;p.hp+=hp;p.maxPw+=this.rng.int(caster?4:1,caster?8:4);p.pw=p.maxPw;this.log(`Welcome to experience level ${p.level}!`,'good');this.emit('levelup');if(p.role==='Valkyrie'&&p.level>=7&&!p.properties.includes('speed'))p.properties.push('speed');};
P.swapWeapons=function(){const p=this.player,w=p.inventory.find(i=>i.id===p.equipment.weapon);if(w?.buc<0){w.bucKnown=true;this.log('Your cursed weapon is welded to your hand.','warning');return false;}const swap=p.inventory.find(i=>i.id===p.equipment.swap),two=swap&&['two-handed sword','quarterstaff','battle-axe','dwarvish mattock','bow','yumi','crossbow'].includes(swap.name);if(two&&p.equipment.shield){this.log('Remove your shield first.');return false;}[p.equipment.weapon,p.equipment.swap]=[p.equipment.swap,p.equipment.weapon];for(const slot of ['weapon','swap'])if(p.equipment[slot]===undefined)delete p.equipment[slot];this.log('You swap weapons.');this.endTurn();return true;};
P.endTurn=function(){const wasDead=this.dead;oldTurn.call(this);if(wasDead||this.dead||this.won)return;const p=this.player;
 if(this.has('hunger'))p.nutrition-=4;
 if(this.has('energy regeneration')&&this.turn%3===0)p.pw=Math.min(p.maxPw,p.pw+2);
 if(this.has('sleepy')&&!this.has('MR_SLEEP')&&this.turn%40===0){p.status.paralysis=3;this.log('Your amulet sends you into a deep sleep.','warning');}
 if(this.has('strangulation')){p.choking=(p.choking||0)+1;if(p.choking===1)this.log('Your amulet tightens around your throat!','danger');if(p.choking>=6)this.damage(p.hp,'strangulation');}else p.choking=0;
 if(this.has('polymorph')&&!this.has('unchanging')&&this.turn%100===0)this.magic('polymorph');
 if(this.has('teleportation')&&this.turn%85===0)this.teleport();
};
P.monsterTurn=function(){
 const p=this.player;for(const m of [...this.level.monsters]){
  if(m.hp<=0||m.asleep>0||m.tame||m.peaceful||m.cancelled||this.dead)continue;const d=N.monsterDef(m.kind),dist=N.distance(m,p);
  if(this.has('conflict')){const other=this.level.monsters.find(o=>o!==m&&N.distance(m,o)<=1);if(other){other.hp-=this.rng.dice(1,6);if(other.hp<=0)this.kill(other,true);m.asleep=1;continue;}}
  if(dist<2||dist>7||!this.lineOfSight(m.x,m.y,p.x,p.y)||this.turn%3!==0)continue;
  const attack=d.attacks.find(a=>['BREA','SPIT','GAZE','MAGC'].includes(a.type));if(!attack)continue;
  if(attack.type==='GAZE'&&this.has('blindness'))continue;
  if(this.has('reflection')&&['BREA','GAZE'].includes(attack.type)){this.log(`The ${m.kind}'s attack reflects away!`,'good');if(attack.effect==='STON'&&!d.resists.includes('MR_STONE')){m.hp=0;this.kill(m);}m.asleep=1;continue;}
  this.log(`The ${m.kind} ${attack.type==='BREA'?'breathes a blast':attack.type==='GAZE'?'fixes its gaze on you':'attacks from afar'}!`,'danger');this.emit('beam',{points:[{x:m.x,y:m.y},{x:p.x,y:p.y}],name:attack.effect.toLowerCase()});if(attack.type==='MAGC'&&this.has('magic resistance'))this.log('Your magic resistance shields you.');else if(!attack.dice&&!attack.sides)this.damage(this.rng.dice(2,6),m.kind+' magic');else this.applyAttackEffect(attack,d);m.asleep=1;
 }oldMonsterTurn.call(this);
};
})();
