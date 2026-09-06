// Extract immutable content facts from the NetHack 3.6.6 release sources.
// Run with Node.js. Generated data remains under the NetHack General Public License.
const fs = require('node:fs');
const clean = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*#if 0\b[\s\S]*?^\s*#endif/gm, '').replace(/^\s*#ifdef (CHARON|MAIL)\b[\s\S]*?^\s*#endif/gm, '');
function split(s) {
  let out=[], start=0, depth=0, quote=false;
  for(let i=0;i<s.length;i++) { const c=s[i]; if(c==='"' && s[i-1]!=='\\')quote=!quote; if(quote)continue; if(c==='(')depth++; if(c===')')depth--; if(c===','&&!depth){out.push(s.slice(start,i).trim()); start=i+1;} }
  out.push(s.slice(start).trim()); return out;
}
function calls(s, names,first='\\s*"') {
  const re=new RegExp('\\b('+names.join('|')+')\\('+first,'g'); let m, out=[];
  while((m=re.exec(s))) { let start=s.indexOf('(',m.index)+1, i=start, depth=1, q=false; for(;i<s.length;i++){if(s[i]==='"'&&s[i-1]!=='\\')q=!q;if(q)continue;if(s[i]==='(')depth++;if(s[i]===')'&&!--depth)break;} out.push([m[1],split(s.slice(start,i))]); re.lastIndex=i+1; } return out;
}
const str=s=>s?.startsWith('"') ? JSON.parse(s) : null;
const num=s=>Number(s)||0;
const monsters=calls(clean(fs.readFileSync('reference/monst.c','utf8')),['MON']).map(([,a])=>{
 const stats=split(a[2].slice(4,-1)).map(num), size=split(a[5].slice(4,-1));
 return {name:str(a[0]),family:a[1].slice(2),level:stats[0],speed:stats[1],ac:stats[2],mr:stats[3],alignment:stats[4],generation:a[3],frequency:num(a[3].match(/\b[1-7]\b/)?.[0]),attacks:[...a[4].matchAll(/ATTK\((\w+),\s*(\w+),\s*(\d+),\s*(\d+)\)/g)].map(m=>({type:m[1].slice(3),effect:m[2].slice(3),dice:+m[3],sides:+m[4]})),weight:num(size[0]),nutrition:num(size[1]),size:size[3]?.slice(3),resists:a[6].match(/MR_\w+/g)||[],conveys:a[7].match(/MR_\w+/g)||[],flags:a.slice(8,11).join(' '),difficulty:num(a[11]),color:a[12]};
}).filter(m=>m.name);
const names=['WEAPON','PROJECTILE','BOW','ARMOR','DRGN_ARMR','HELM','CLOAK','SHIELD','GLOVES','BOOTS','RING','AMULET','TOOL','CONTAINER','WEPTOOL','FOOD','POTION','SCROLL','SPELL','WAND','GEM','ROCK','COIN'];
const items=calls(clean(fs.readFileSync('reference/objects.c','utf8')),names).map(([macro,a])=>{
 let o={name:str(a[0]),appearance:str(a[1]),category:macro.toLowerCase(),weight:10,cost:0,prob:0}; const n=i=>num(a[i]);
 if(['WEAPON','WEPTOOL'].includes(macro))Object.assign(o,{category:macro==='WEPTOOL'?'tool':'weapon',known:!!n(2),prob:n(5),weight:n(6),cost:n(7),damage:n(8),largeDamage:n(9),hit:n(10),twoHanded:!!n(4)});
 if(macro==='PROJECTILE')Object.assign(o,{category:'weapon',known:!!n(2),prob:n(3),weight:n(4),cost:n(5),damage:n(6),largeDamage:n(7),hit:n(8),ammo:true});
 if(macro==='BOW')Object.assign(o,{category:'weapon',known:!!n(2),prob:n(3),weight:n(4),cost:n(5),damage:2,launcher:true});
 if(['ARMOR','HELM','CLOAK','SHIELD','GLOVES','BOOTS'].includes(macro)){const shift=['ARMOR','SHIELD'].includes(macro)?1:0;Object.assign(o,{category:'armor',slot:macro==='ARMOR'?'body':macro.toLowerCase(),known:!!n(2),property:a[4+shift],prob:n(5+shift),delay:n(6+shift),weight:n(7+shift),cost:n(8+shift),ac:10-n(9+shift)});}
 if(macro==='DRGN_ARMR')Object.assign(o,{category:'armor',slot:'body',appearance:null,known:true,property:a[2],cost:n(3),ac:10-n(4),prob:0,weight:40});
 if(macro==='ARMOR'&&/shirt/.test(o.name))o.slot='shirt';
 if(macro==='RING')Object.assign(o,{property:a[2],cost:n(3),prob:30,weight:3});
 if(macro==='AMULET')Object.assign(o,{property:a[2],prob:n(3),cost:150,weight:20});
 if(['TOOL','CONTAINER'].includes(macro)){let k=macro==='TOOL'?1:0;Object.assign(o,{category:'tool',container:!k,known:!!n(2),prob:n(5+k),weight:n(6+k),cost:n(7+k)});}
 if(macro==='FOOD')Object.assign(o,{appearance:null,known:true,prob:n(1),delay:n(2),weight:n(3),nutrition:n(6),cost:Math.round(n(6)/20)});
 if(macro==='POTION')Object.assign(o,{property:a[3],prob:n(4),cost:n(5),weight:20});
 if(macro==='SCROLL')Object.assign(o,{prob:n(3),cost:n(4),weight:5});
 if(macro==='SPELL')Object.assign(o,{category:'spellbook',school:a[2].replace('P_','').toLowerCase(),prob:n(3),delay:n(4),level:n(5),cost:n(5)*100,weight:50,direction:a[7]});
 if(macro==='WAND')Object.assign(o,{prob:n(2),cost:n(3),direction:a[5],weight:7});
 if(macro==='GEM')Object.assign(o,{prob:n(2),weight:n(3),cost:n(4)});
 if(macro==='ROCK')Object.assign(o,{category:'gem',known:!!n(2),prob:n(3),weight:n(4),cost:n(5),damage:n(6)});
 if(macro==='COIN')Object.assign(o,{category:'gold',appearance:null,known:true,prob:n(1),weight:.01,cost:n(3)});
 return o;
});
for(const [,a] of calls(clean(fs.readFileSync('reference/objects.c','utf8')),['OBJECT'],'\\s*OBJ\\(\\s*"')){
 const info=split(a[0].slice(4,-1)),bits=split(a[1].slice(5,-1)),name=str(info[0]);if(name==='strange object')continue;
 const category=({AMULET_CLASS:'amulet',TOOL_CLASS:'tool',FOOD_CLASS:'food',SPBOOK_CLASS:'spellbook',ROCK_CLASS:'rock',BALL_CLASS:'ball',CHAIN_CLASS:'chain',VENOM_CLASS:'venom'})[a[3]]||'tool';
 items.push({name,appearance:str(info[1]),category,known:!!num(bits[0]),property:a[2],prob:num(a[4]),delay:num(a[5]),weight:num(a[6]),cost:num(a[7]),damage:num(a[8]),largeDamage:num(a[9]),nutrition:num(a[12]),unique:!!num(bits[6])});
}
fs.writeFileSync('src/catalog.js',`/* Content derived from NetHack 3.6.6; see reference/NetHack-LICENSE.txt.\n * Modified 2026-09-06: extracted JavaScript data by tools/import-data.cjs.\n * Original monster data: Stichting Mathematisch Centrum (1985), Michael Allison (2006).\n * Original object data: Mike Threepoint (1989).\n * This is content data, not the original game engine. */\nglobalThis.NH = globalThis.NH || {};\nNH.MONSTERS = ${JSON.stringify(monsters)};\nNH.ITEMS = ${JSON.stringify(items)};\n`);
console.log(`Imported ${monsters.length} monsters and ${items.length} objects.`);
