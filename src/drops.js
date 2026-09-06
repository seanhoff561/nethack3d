/* NetHack-style monster loot: ordinary corpses remain common, while rare
 * monsters have the characteristic special drops described by the wiki. */
(() => {
 'use strict';
 const N=globalThis.NH,P=N.Game.prototype,oldKill=P.kill;
 const smallAllowed=new Set(['food ration','leash','figurine']);
 const dragonScales={gray:'gray dragon scales',silver:'silver dragon scales',red:'red dragon scales',white:'white dragon scales',orange:'orange dragon scales',black:'black dragon scales',blue:'blue dragon scales',green:'green dragon scales',yellow:'yellow dragon scales'};
 const canHaveCorpse=d=>d&&!/G_NOCORPSE/.test(d.generation)&&d.nutrition>0;
 const add=(g,name,category,x,y,extra={})=>{if(N.lookup(name,category))g.level.items.push({x,y,item:g.createItem(name,category,extra)});};
 P.kill=function(m,pet=false){
  const d=N.monsterDef(m.kind),x=m.x,y=m.y,already=m.lootDropped;
  oldKill.call(this,m,pet);
  if(pet||!d||already||!canHaveCorpse(d))return;
  m.lootDropped=true;
  // One in six ordinary player kills produces an additional random object.
  if(this.rng.int(1,6)===1){
   let drop=null;
   for(let n=0;n<12&&!drop;n++){
    const candidate=this.randomItem(),def=this.def(candidate);
    if(d.weight<=3&&!smallAllowed.has(candidate.name)&&def.weight>3)continue;
    drop=candidate;
   }
   if(drop)this.level.items.push({x,y,item:drop});
  }
  // Dragons shed scales; unicorns yield a horn.  These are separate from the
  // ordinary one-in-six object roll and therefore remain meaningful finds.
  if(d.family==='DRAGON'&&!/^baby /.test(d.name)&&this.rng.int(1,3)===1){
   const color=Object.keys(dragonScales).find(c=>d.name.toLowerCase().startsWith(c));
   if(color)add(this,dragonScales[color],'armor',x,y,{known:true,buc:0});
  }
  if(d.family==='UNICORN'&&this.rng.int(1,2)===1)add(this,'unicorn horn','tool',x,y,{known:true,buc:0});
  if(d.name==='long worm'&&this.rng.int(1,3)===1)add(this,'worm tooth','weapon',x,y,{known:true,buc:0});
 };
})();
