/* Distinct silhouettes, clothing and equipment for all thirteen callings. */
(() => {
'use strict';
const N=globalThis.NH;
N.roleAppearance={
 Archeologist:{color:0xa78350,hat:'fedora',weapon:'whip',pack:true},Barbarian:{color:0x936348,hat:'horns',weapon:'axe',fur:true},Caveman:{color:0x816d4b,weapon:'club',fur:true},Healer:{color:0xe3d7b6,hat:'cap',weapon:'staff',robe:true,medicine:true},Knight:{color:0x597499,hat:'visor',weapon:'lance',shield:true,armored:true},Monk:{color:0xc17935,robe:true,beads:true},Priest:{color:0xd3cab6,hat:'mitre',weapon:'mace',robe:true,holy:true},Ranger:{color:0x567552,hat:'hood',weapon:'bow',quiver:true},Rogue:{color:0x565564,hat:'hood',weapon:'daggers',mask:true},Samurai:{color:0x963e3b,hat:'kabuto',weapon:'katana',armored:true},Tourist:{color:0x56a4a0,hat:'sunhat',weapon:'camera',pack:true,flowers:true},Valkyrie:{color:0x527c99,hat:'wings',weapon:'sword',shield:true,armored:true},Wizard:{color:0x655495,hat:'pointed',weapon:'staff',robe:true,book:true}
};
N.buildHero=function(r,p){
 const T=globalThis.THREE,a=N.roleAppearance[p.role],g=new T.Group(),body=new T.Group(),limbs=[];g.add(body);
 const cloth=r.material(a.color),dark=r.material(new T.Color(a.color).multiplyScalar(.55)),skin=r.material(p.race==='Orc'?0x86916a:p.race==='Dwarf'?0xb79276:p.race==='Elf'?0xd4bda0:0xc5a388),hair=r.material(p.race==='Elf'?0xd0b675:p.race==='Dwarf'?0x865032:0x493b32),armor=a.armored?r.mats.metal:cloth;
 const mesh=(geo,mat,pos,scale,rot)=>r.mesh(geo,mat,body,pos,scale,rot);
 for(const s of [-1,1]){const leg=new T.Group();leg.position.set(s*.115,.43,0);body.add(leg);r.mesh('cyl',dark,leg,[0,-.12,0],[.074,.29,.075]);r.mesh('box','leather',leg,[0,-.31,.05],[.15,.13,.22]);limbs.push(leg);}
 mesh('sphere',armor,[0,.73,0],[.22,.28,.15]);if(a.robe)mesh('cone',cloth,[0,.52,0],[.31,.78,.26]);if(a.fur){mesh('sphere','leather',[0,.48,0],[.24,.15,.17]);for(let n=0;n<7;n++)mesh('ico','leather',[(n-3)*.062,.9,0],[.08,.09,.19]);}
 mesh('box','leather',[0,.54,.01],[.4,.07,.29]);mesh('box','gold',[0,.54,.17],[.065,.06,.03]);mesh('cyl',skin,[0,1,0],[.064,.12,.065]);mesh('sphere',skin,[0,1.14,.01],[.135,.17,.13]);
 if(p.role!=='Monk'){mesh('sphere',hair,[0,1.21,-.055],[.14,.12,.1]);if(p.gender==='Female')mesh('cyl',hair,[.1,1.05,-.13],[.045,.34,.045],[0,0,.13]);}
 if(p.race==='Dwarf'&&p.gender==='Male')mesh('cone',hair,[0,1,.1],[.11,.32,.08],[0,0,Math.PI]);
 if(['Elf','Orc'].includes(p.race))for(let s of [-1,1])mesh('cone',skin,[s*.16,1.14,0],[.04,.17,.05],[0,0,-s*1.2]);
 for(let s of [-1,1])mesh('sphere','black',[s*.05,1.17,.13],[.015,.012,.009]);
 if(a.mask)mesh('box',dark,[0,1.10,.132],[.22,.075,.025]);
 if(a.hat==='hood')mesh('sphere',dark,[0,1.24,-.025],[.19,.18,.16]);
 if(['fedora','sunhat','cap'].includes(a.hat)){mesh('cyl',a.hat==='sunhat'?'bone':dark,[0,1.29,0],[.17,.12,.15]);if(a.hat!=='cap')mesh('cyl',cloth,[0,1.24,0],[a.hat==='sunhat'?.3:.24,.03,.23]);}
 if(a.hat==='pointed'){mesh('cone',dark,[0,1.46,-.02],[.22,.48,.22]);mesh('cyl',cloth,[0,1.25,0],[.26,.025,.23]);mesh('sphere','gold',[.025,1.4,.16],[.035,.035,.02]);}
 if(a.hat==='mitre'){mesh('cone','bone',[0,1.4,0],[.18,.39,.1]);mesh('box','gold',[0,1.38,.07],[.025,.23,.018]);}
 if(['visor','wings','horns','kabuto'].includes(a.hat)){mesh('sphere',armor,[0,1.26,0],[.17,.12,.155]);if(a.hat==='visor'){mesh('box','metal',[0,1.15,.14],[.26,.18,.03]);for(let s of [-1,1])mesh('box','black',[s*.06,1.19,.159],[.08,.018,.01]);}
  if(a.hat==='wings')for(let s of [-1,1])for(let n=0;n<3;n++)mesh('box','bone',[s*(.18+n*.028),1.30+n*.04,0],[.055,.18-n*.025,.05],[0,0,-s*.45]);
  if(a.hat==='horns')for(let s of [-1,1])mesh('cone','bone',[s*.21,1.37,0],[.055,.24,.06],[0,0,-s*.55]);
  if(a.hat==='kabuto'){mesh('torus','gold',[0,1.38,.12],[.19,.19,.19]);for(let s of [-1,1])mesh('box',cloth,[s*.17,1.15,0],[.1,.23,.22]);}
 }
 for(let s of [-1,1]){const arm=new T.Group();arm.position.set(s*.25,.87,0);body.add(arm);r.mesh('sphere',armor,arm,[0,0,0],[.1,.1,.12]);r.mesh('cyl',cloth,arm,[s*.015,-.15,0],[.07,.29,.075],[0,0,s*.12]);r.mesh('sphere',skin,arm,[s*.035,-.31,.04],[.065,.064,.06]);limbs.push(arm);}
 const right=limbs[3],left=limbs[2];g.userData.weapon=right;
 const held=(geo,mat,pos,scale,rot)=>r.mesh(geo,mat,right,pos,scale,rot);
 if(['sword','katana','daggers'].includes(a.weapon)){held('box','metal',[.03,-.05,.1],[.045,a.weapon==='daggers'?.30:.7,.022],[0,0,a.weapon==='katana'?-.2:0]);held('box','gold',[.03,-.29,.1],[.18,.03,.055]);if(a.weapon==='daggers')r.mesh('box','metal',left,[0,-.13,.1],[.045,.38,.022]);}
 if(['staff','lance','mace','club','axe'].includes(a.weapon)){held('cyl','wood',[.04,-.05,.10],[a.weapon==='club'?.055:.027,a.weapon==='lance'?1.7:.95,.027]);if(a.weapon==='staff')held('sphere','rune',[.04,.45,.1],[.08,.085,.08]);if(a.weapon==='mace')held('ico','metal',[.04,.37,.1],[.12,.13,.12]);if(a.weapon==='club')held('ico','wood',[.04,.29,.1],[.1,.24,.1]);if(a.weapon==='lance')held('cone','metal',[.04,.88,.1],[.045,.25,.045]);if(a.weapon==='axe')held('box','metal',[.08,.31,.1],[.37,.25,.055]);}
 if(a.weapon==='bow'){const curve=new T.QuadraticBezierCurve3(new T.Vector3(0,-.62,.10),new T.Vector3(0,-.2,.4),new T.Vector3(0,.23,.1));r.mesh(new T.TubeGeometry(curve,14,.024,6,false),'wood',left);r.rod([0,-.62,.1],[0,.23,.1],.005,'bone',left);}
 if(a.weapon==='whip'){const curve=new T.CatmullRomCurve3([new T.Vector3(.04,-.3,.1),new T.Vector3(.2,-.5,.25),new T.Vector3(.3,-.75,.22),new T.Vector3(.44,-.80,0)]);held(new T.TubeGeometry(curve,18,.015,5,false),'leather');}
 if(a.weapon==='camera'){mesh('box','black',[0,.73,.2],[.28,.16,.13]);mesh('cyl','metal',[0,.73,.29],[.065,.07,.065],[Math.PI/2,0,0]);}
 if(a.shield){r.mesh('cyl',cloth,left,[-.07,-.2,.13],[.25,.055,.25],[Math.PI/2,0,0]);r.mesh('sphere','gold',left,[-.07,-.2,.18],[.075,.075,.03]);}
 if(a.pack)mesh('box','leather',[0,.73,-.24],[.33,.39,.17]);if(a.quiver){mesh('cyl','leather',[-.16,.78,-.2],[.075,.45,.075],[0,0,-.2]);for(let n=0;n<4;n++)mesh('box','bone',[-.2+n*.03,1.08,-.21],[.012,.33,.012]);}
 if(a.book){mesh('box','leather',[.18,.53,.19],[.18,.22,.06]);mesh('box','gold',[.18,.53,.225],[.12,.02,.01]);}
 if(a.holy){mesh('box','gold',[0,.83,.16],[.02,.2,.02]);mesh('box','gold',[0,.86,.16],[.11,.02,.02]);}
 if(a.medicine){mesh('box','bone',[.27,.51,.05],[.18,.21,.16]);mesh('box',cloth,[.27,.51,.14],[.025,.12,.01]);}
 if(a.beads)for(let n=0;n<10;n++){let angle=n*Math.PI/9;mesh('sphere','wood',[Math.cos(angle)*.13,.89-Math.sin(angle)*.14,.155],[.024,.024,.024]);}
 if(a.flowers)for(let n=0;n<5;n++)mesh('sphere','bone',[Math.sin(n*3)*.14,.66+n*.047,.152],[.036,.03,.01]);
 if(a.armored&&p.role==='Samurai')for(let n=0;n<4;n++)mesh('box',cloth,[0,.63+n*.065,.16],[.38,.045,.035]);
 const scale=p.race==='Dwarf'?.8:p.race==='Gnome'?.7:p.race==='Elf'?1.05:1;g.scale.set(scale,scale,scale);g.userData.body=body;g.userData.limbs=limbs;g.userData.role=p.role;return g;
};
})();
