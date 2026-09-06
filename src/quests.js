/* Role-specific quest rewards and the Bell/Book/Candelabrum progression. */
(() => {
'use strict';
const N=globalThis.NH,P=N.Game.prototype,oldKill=P.kill,oldHas=P.has,oldDamage=P.damage;
N.questData={
 Archeologist:{leader:'Lord Carnarvon',nemesis:'Minion of Huhetotl',artifact:'The Orb of Detection',base:'crystal ball',category:'tool',carry:['magic resistance','telepathy'],invoke:'invisibility'},
 Barbarian:{leader:'Pelias',nemesis:'Thoth Amon',artifact:'The Heart of Ahriman',base:'luckstone',category:'gem',carry:['stealth'],invoke:'levitation'},
 Caveman:{leader:'Shaman Karnov',nemesis:'Chromatic Dragon',artifact:'The Sceptre of Might',base:'mace',category:'weapon',worn:['magic resistance'],invoke:'conflict'},
 Healer:{leader:'Hippocrates',nemesis:'Cyclops',artifact:'The Staff of Aesculapius',base:'quarterstaff',category:'weapon',worn:['regeneration','drain resistance'],invoke:'healing'},
 Knight:{leader:'King Arthur',nemesis:'Ixoth',artifact:'The Magic Mirror of Merlin',base:'mirror',category:'tool',carry:['magic resistance','telepathy']},
 Monk:{leader:'Grand Master',nemesis:'Master Kaen',artifact:'The Eyes of the Overworld',base:'lenses',category:'tool',worn:['magic resistance'],invoke:'enlightenment'},
 Priest:{leader:'Arch Priest',nemesis:'Nalzok',artifact:'The Mitre of Holiness',base:'helm of brilliance',category:'armor',carry:['MR_FIRE'],invoke:'gain energy'},
 Ranger:{leader:'Orion',nemesis:'Scorpius',artifact:'The Longbow of Diana',base:'bow',category:'weapon',carry:['telepathy'],worn:['reflection'],invoke:'arrows'},
 Rogue:{leader:'Master of Thieves',nemesis:'Master Assassin',artifact:'The Master Key of Thievery',base:'skeleton key',category:'tool',carry:['warning','teleport control','half physical damage'],invoke:'untrap'},
 Samurai:{leader:'Lord Sato',nemesis:'Ashikaga Takauji',artifact:'The Tsurugi of Muramasa',base:'tsurugi',category:'weapon'},
 Tourist:{leader:'Twoflower',nemesis:'Master of Thieves',artifact:'The Platinum Yendorian Express Card',base:'credit card',category:'tool',carry:['magic resistance','telepathy'],invoke:'charging'},
 Valkyrie:{leader:'Norn',nemesis:'Lord Surtur',artifact:'The Orb of Fate',base:'crystal ball',category:'tool',carry:['warning','half physical damage'],invoke:'teleportation'},
 Wizard:{leader:'Neferet the Green',nemesis:'Dark One',artifact:'The Eye of the Aethiopica',base:'amulet of ESP',category:'amulet',worn:['magic resistance','telepathy'],carry:['energy regeneration'],invoke:'branchport'}
};
P.kill=function(m,pet=false){const already=m.questLootDropped;m.questLootDropped=true;oldKill.call(this,m,pet);if(already)return;if(m.questBoss){const q=N.questData[this.player.role];this.level.items.push({x:m.x,y:m.y,item:this.createItem(q.base,q.category,{artifact:q.artifact,named:q.artifact,questRole:this.player.role,known:true,buc:1,bucKnown:true})},{x:m.x,y:m.y,item:this.createItem('Bell of Opening','tool',{known:true,buc:0,charges:3})});this.progress.questComplete=true;this.log('Your nemesis falls. The Bell and your quest artifact are recovered!','story');}
 for(const spec of m.lootSpec||[])this.level.items.push({x:m.x,y:m.y,item:this.createItem(spec.name,spec.category,{known:true,buc:0,...spec.extra})});
};
P.has=function(prop){const p=this.player,q=N.questData[p.role],artifact=p.inventory.find(i=>i.artifact===q?.artifact),equipped=artifact&&Object.values(p.equipment).includes(artifact.id);if(artifact&&(q.carry||[]).includes(prop)||equipped&&(q.worn||[]).includes(prop))return true;if(prop==='blindness'&&equipped&&p.role==='Monk')return false;return oldHas.call(this,prop);};
P.damage=function(n,cause){if(this.has('half physical damage')&&!/starvation|petrif|illness|divine/.test(cause))n=Math.ceil(n/2);return oldDamage.call(this,n,cause);};
P.invokeArtifact=function(i){const q=N.questData[this.player.role];if(i.artifact!==q.artifact){this.log('The artifact does not answer your call.');return false;}if(i.invokedAt&&this.turn-i.invokedAt<100){this.log('The artifact needs time to recover its power.');return false;}if(!q.invoke){this.log('This artifact grants its power while carried or equipped.');return false;}i.invokedAt=this.turn;
 if(['invisibility','levitation','conflict'].includes(q.invoke)){if(this.player.status[q.invoke])delete this.player.status[q.invoke];else this.player.status[q.invoke]=150;this.log('The artifact surrounds you with power.');}
 else if(q.invoke==='arrows'){const arrows=this.createItem('arrow','weapon',{count:this.rng.int(10,30),buc:0});if(!this.addItem(arrows))this.level.items.push({x:this.player.x,y:this.player.y,item:arrows});this.log('A bundle of arrows appears.');}
 else if(q.invoke==='untrap'){this.level.traps=this.level.traps.filter(t=>N.distance(t,this.player)>1);this.log('Nearby traps fall harmlessly apart.');}
 else if(q.invoke==='branchport'){this.emit('branchport');return true;}
 else this.magic(q.invoke);this.endTurn();return true;
};
P.chat=function(){const m=this.level.monsters.find(m=>N.distance(m,this.player)<=1);if(!m){this.log('Nobody is close enough to talk to.');return false;}
 if(m.questLeader){const q=N.questData[this.player.role];this.log(this.progress.questComplete?`${m.kind} thanks you for recovering ${q.artifact}.`:`${m.kind} asks you to defeat ${q.nemesis} and reclaim ${q.artifact}.`,'story');}
 else if(m.shopkeeper){const s=this.findShop(m.shopId)?.shop;this.log(s?`${m.name||m.kind}: Your outstanding bill is ${this.shopDebt(s)} gold. [p] Pay.`:'Welcome to my shop.');}
 else if(m.priest)this.log(`The priest tends a ${m.align.toLowerCase()} altar. Drop items to learn their blessings; pray here with water on the altar to bless it.`);
 else this.log(m.tame?`${m.name||m.kind} greets you happily.`:`The ${m.kind} watches you quietly.`);this.endTurn();return true;
};
})();
