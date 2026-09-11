export class Chunk{
constructor(cx,cz,size,height){this.cx=cx;this.cz=cz;this.size=size;this.height=height;this.blocks=new Uint8Array(size*size*height)}
i(x,y,z){return x+sizeFix(this.size)*(z+this.size*y)}
get(x,y,z){if(x<0||z<0||x>=this.size||z>=this.size||y<0||y>=this.height)return 0;return this.blocks[this.i(x,y,z)]}
set(x,y,z,b){if(x>=0&&z>=0&&x<this.size&&z<this.size&&y>=0&&y<this.height)this.blocks[this.i(x,y,z)]=b}
}
function sizeFix(v){return v}
