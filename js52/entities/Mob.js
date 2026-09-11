import {Zombie} from "./Zombie.js";
import {INFO} from "../world/Block.js";
export class MobManager{
 constructor(scene,world,quality={}){this.scene=scene;this.world=world;this.mobs=[];this.max=quality.maxMobs||20}
 spawn(x,y,z){if(this.mobs.length>=this.max)return null;const m=new Zombie(this.scene,this.world,x,y,z);this.mobs.push(m);return m}
 update(dt,player){let hurt=false;for(const m of this.mobs)if(m.alive)hurt|=!!m.update(dt,player);for(let i=this.mobs.length-1;i>=0;i--)if(!this.mobs[i].alive){this.mobs[i].dispose?.();this.mobs.splice(i,1)}return hurt}
 attack(player){const weapon=player.inventory?.selectedItem?.(),item=weapon?.id?player.inventory.slots[player.inventory.selected]:null;let best=null,bd=3.5;for(const m of this.mobs)if(m.alive){const d=m.pos.distanceTo(player.pos);if(d<bd){bd=d;best=m}}if(!best)return{hit:false,dead:false};let damage=5;if(item?.id)damage=INFO[item.id]?.damage||damage;const dead=best.hit(damage);return{hit:true,dead}}
}
