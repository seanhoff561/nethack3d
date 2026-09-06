/* Corpse and tin consequences.  Effects are intentionally data-driven so
 * adding a monster to catalog.js automatically gives it its resistances. */
(() => {
 'use strict';
 const N=globalThis.NH,P=N.Game.prototype,oldEat=P.eat;
 const has=(p,k)=>p.properties.includes(k)||p.status[k];
 const add=(g,k,msg)=>{if(!g.player.properties.includes(k)){g.player.properties.push(k);g.log(msg,'good');}};
 const raceOf=d=>d.flags.includes('M2_ELF')?'elf':d.flags.includes('M2_DWARF')?'dwarf':d.flags.includes('M2_ORC')?'orc':d.flags.includes('M2_GNOME')?'gnome':d.flags.includes('M2_HUMAN')?'human':null;
 P.corpseEffects=function(d,item){
  const p=this.player,name=d.name.toLowerCase(),flags=d.flags||'';
  if(d.family==='COCKATRICE'&&!has(p,'MR_STONE')){this.damage(p.hp,'eating a petrifying corpse');return false;}
  if(/M1_POIS/.test(flags)&&!has(p,'MR_POISON'))this.damage(this.rng.dice(1,6),'poisonous food');
  if(/M1_ACID/.test(flags)&&!has(p,'MR_ACID'))this.damage(this.rng.dice(1,6),'acidic food');
  if(item.age&&this.turn-item.age>50){p.status.sickness=20;this.damage(this.rng.dice(1,8),'rotten food');this.log('Ecch! That corpse was tainted!','warning');}
  // Species-specific intrinsics and immediate corpse effects.
  if(name==='wraith'){p.xp+=200;this.checkLevel();this.log('You feel more experienced.','good');}
  if(name==='nurse'){p.hp=p.maxHp;this.log('You feel completely healed.','good');}
  if(name==='lizard'){delete p.status.petrifying;delete p.status.confusion;delete p.status.stun;this.log('Your mind clears.','good');}
  if(name==='newt'){p.pw=Math.min(p.maxPw,p.pw+this.rng.int(1,4));this.log('You feel a little more energetic.','good');}
  if(name==='floating eye')add(this,'telepathy','You acquire telepathy.');
  if(name==='stalker')add(this,'invisibility','You become invisible.');
  if(name==='tengu'){add(this,'MR_POISON','You acquire poison resistance.');add(this,'teleport control','You acquire teleport control.');}
  if(d.family==='GIANT'||name==='cyclops'||name==='lord surtur'){p.stats[0]=Math.min(25,p.stats[0]+1);this.log('You feel stronger.','good');}
  const species=raceOf(d);if(species&&species===String(p.race).toLowerCase()&&p.role!=='Caveman'){p.luck--;this.log('You feel guilty about eating your own kind.','warning');}
  const conveys=[...(d.conveys||[])];if(flags.includes('M2_ELF')&&!conveys.includes('MR_SLEEP'))conveys.push('MR_SLEEP');
  for(const prop of conveys){let chance=prop==='MR_POISON'&&d.family==='ANT'?.5:prop==='MR_STONE'?1:Math.min(1,Math.max(.15,d.level/15));if(this.rng.next()<chance)add(this,prop,`You acquire ${prop.replace('MR_','').toLowerCase()} resistance.`);}
  if(name==='chameleon'||name==='doppelganger')add(this,'polymorph control','You feel in control of your body.');
  return true;
 };
 P.eat=function(i){
  const d=(i&&i.corpse&&N.monsterDef(i.corpse))||(i&&i.tinMonster&&N.monsterDef(i.tinMonster));
  if(d)this.corpseEffects(d,i);
  return oldEat.call(this,i);
 };
})();
