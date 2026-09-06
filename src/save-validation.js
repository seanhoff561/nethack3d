/* Validate an imported run before replacing the active game or touching storage. */
(() => {
'use strict';
const N=globalThis.NH,restore=N.Game.restore;
N.Game.restore=function(text){
 if(typeof text!=='string'||text.length>24000000)throw Error('Invalid save size.');
 const d=JSON.parse(text),fail=()=>{throw Error('Invalid save data.');};
 if(!d||d.version!==1||!d.player||!d.levels)throw Error('Incompatible save file.');
 let nodes=0;const inspect=(v,depth=0)=>{if(++nodes>2000000||depth>20)fail();if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))fail();inspect(v[k],depth+1);}}};inspect(d);
 const p=d.player,ids=new Set(),int=(n,min=0,max=100000000)=>Number.isInteger(n)&&n>=min&&n<=max,point=q=>q&&int(q.x,0,79)&&int(q.y,0,20),id=n=>{if(!int(n,1)||ids.has(n))fail();ids.add(n);};
 if(typeof d.seed!=='string'||d.seed.length>200||!int(d.uid)||!int(d.depth,1,40)||!Object.hasOwn(N.branches,d.branch)||d.depth>N.branches[d.branch].max||!int(d.rng?.state,0,4294967295))fail();
 if(!N.roleChoices[p.role]?.includes(p.race)||!N.characterAlignments(p.role,p.race).includes(p.align)||!point(p)||!int(p.level,1,30)||!int(p.maxHp,1)||!int(p.maxPw)||!int(p.gold)||!int(p.xp)||p.pw<0||p.pw>p.maxPw||p.hp>p.maxHp)fail();
 if(!Array.isArray(p.properties)||p.properties.some(s=>typeof s!=='string'||s.length>50)||!p.status||Array.isArray(p.status)||Object.values(p.status).some(n=>!int(n,0))||!Array.isArray(p.spells)||p.spells.some(s=>!N.lookup(s.name,'spellbook')||!int(s.knowledge,0,20000)))fail();
 if(!Array.isArray(d.messages)||d.messages.length>250||d.messages.some(m=>typeof m.text!=='string'||m.text.length>5000||!int(m.turn,1)))fail();
 const item=(i,depth=0)=>{if(!i||depth>8||!N.lookup(i.name,i.category)&&!(i.name==='corpse'&&N.monsterDef(i.corpse)))fail();id(i.id);if(!int(i.count,1,1000000)||![-1,0,1].includes(i.buc)||!Number.isFinite(i.enchant)||Math.abs(i.enchant)>100||!Number.isFinite(i.charges)||i.charges<0||i.charges>1000000)fail();if(i.unpaid&&(!Number.isFinite(i.price)||i.price<0))fail();if(i.contents){if(!Array.isArray(i.contents)||i.contents.length>1000||!N.lookup(i.name,i.category)?.container)fail();i.contents.forEach(j=>item(j,depth+1));}};
 if(!Array.isArray(p.inventory)||p.inventory.length>52)fail();p.inventory.forEach(i=>item(i));const letters=p.inventory.map(i=>i.letter);if(letters.some(s=>typeof s!=='string'||!/^[a-zA-Z]$/.test(s))||new Set(letters).size!==letters.length)fail();
 if(!p.equipment||Array.isArray(p.equipment)||Object.values(p.equipment).some(id=>!p.inventory.some(i=>i.id===id)))fail();
 if(Object.keys(d.levels).length>60)fail();for(const [key,l]of Object.entries(d.levels)){
  if(!l||key!==l.branch+':'+l.depth||!N.branches[l.branch]||!int(l.depth,1,N.branches[l.branch].max)||!point(l.up)||!point(l.down)||!Array.isArray(l.items)||!Array.isArray(l.monsters)||!Array.isArray(l.boulders)||!Array.isArray(l.traps)||!Array.isArray(l.rooms)||!l.engravings)fail();
  for(const o of l.items){if(!point(o))fail();item(o.item);}for(const m of l.monsters){id(m.id);if(!Number.isFinite(m.energy)||!Number.isFinite(m.maxHp)||m.maxHp<1||!point(m))fail();}for(const b of l.boulders){id(b.id);if(!point(b))fail();}for(const t of l.traps)if(!point(t)||typeof t.type!=='string')fail();
  for(const r of l.rooms)if(!point(r)||!int(r.w,1,78)||!int(r.h,1,19)||r.x+r.w>79||r.y+r.h>20)fail();
  if(l.shops){if(!Array.isArray(l.shops))fail();for(const s of l.shops)if(typeof s.id!=='string'||!point(s.door)||!point(s.entrance)||!point(s.home)||!Number.isFinite(s.debit)||s.debit<0)fail();}
 }
 if([...ids].some(n=>n>d.uid))fail();return restore.call(this,text);
};
})();
