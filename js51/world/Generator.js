import {BLOCK} from './Block.js';
function hash(x,z,s){let n=(x*374761393+z*668265263+s*1442695041)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296}
function smooth(x,z,s){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);const a=hash(xi,zi,s),b=hash(xi+1,zi,s),c=hash(xi,zi+1,s),d=hash(xi+1,zi+1,s);return a+(b-a)*u+((c+(d-c)*u)-(a+(b-a)*u))*v}
export class Generator{
 constructor(seed){this.seed=seed|0}
 height(x,z){const a=smooth(x*.018,z*.018,this.seed),b=smooth(x*.055,z*.055,this.seed+71),c=smooth(x*.16,z*.16,this.seed+311);return Math.max(4,Math.min(90,Math.floor(38+a*34+b*10+c*3)))}
 biome(x,z,h){const t=smooth(x*.006,z*.006,this.seed+1000),m=smooth(x*.008,z*.008,this.seed+2000);if(h>72)return'snow';if(t<.23&&m>.5)return'desert';if(t>.78)return'forest';if(m<.18)return'swamp';return'plains'}
 get(x,y,z,seaLevel=45){return this.getWithHeight(x,y,z,this.height(x,z),seaLevel)}
 getWithHeight(x,y,z,h,seaLevel=45){const sea=seaLevel,b=this.biome(x,z,h);if(y===0)return BLOCK.BEDROCK;if(y>h)return y<=sea?BLOCK.WATER:BLOCK.AIR;if(b==='snow'&&y>=h-1)return BLOCK.SNOW;if(b==='desert'&&y>=h-2)return BLOCK.SAND;if(b==='swamp'&&y===h)return BLOCK.MOSS;if(y===h)return BLOCK.GRASS;if(y>h-4)return b==='swamp'?BLOCK.MOSS:BLOCK.DIRT;if(y<32&&hash(x*3+y,z*5-y,this.seed+99)>.975)return BLOCK.IRON;if(y<58&&hash(x*7+y,z*3-y,this.seed+77)>.94)return BLOCK.COAL;if(y<18&&hash(x+y*2,z-y*3,this.seed+51)>.985)return BLOCK.GRAVEL;if(y<h-5&&y>5&&smooth(x*.07+y*.01,z*.07-y*.01,this.seed+9)<.12)return BLOCK.AIR;return BLOCK.STONE}
 tree(x,y,z,api){const h=4+(hash(x,z,this.seed+800)*3|0);for(let i=0;i<h;i++)api.setBlock(x,y+i,z,BLOCK.LOG);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=0;dy<=2;dy++){if(Math.abs(dx)+Math.abs(dz)+dy>4)continue;if(api.getBlock?.(x+dx,y+h-2+dy,z+dz)===BLOCK.AIR||!api.getBlock)api.setBlock(x+dx,y+h-2+dy,z+dz,BLOCK.LEAVES)}}
}
