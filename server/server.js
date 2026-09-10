import http from 'node:http';
import {WebSocketServer} from 'ws';
import {readFile,writeFile} from 'node:fs/promises';
import {createReadStream,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
const dir=path.dirname(fileURLToPath(import.meta.url));
const dataFile=path.join(dir,'world-state.json');
const root=path.resolve(dir,'..');
const port=Number(process.env.PORT||8080);const players=new Map();const blocks=new Map();let nextId=1;let worldSeed=null;let hostId=null;
try{const saved=JSON.parse(await readFile(dataFile,'utf8'));worldSeed=saved.seed??null;for(const b of saved.blocks||[])blocks.set(`${b.x},${b.y},${b.z}`,b)}catch{}
let saveTimer=0;function persistSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>writeFile(dataFile,JSON.stringify({version:2,seed:worldSeed,blocks:[...blocks.values()]})).catch(()=>{}),250)}
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,`http://${req.headers.host}`);if(u.pathname==='/health'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({ok:true,players:players.size,host:!!hostId,seed:worldSeed}))}let file=path.normalize(path.join(root,u.pathname==='/'?'index.html':u.pathname));if(!file.startsWith(root)||!existsSync(file)){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');createReadStream(file).pipe(res)});
const wss=new WebSocketServer({server,path:'/ws'});
function send(ws,m){if(ws.readyState===1)ws.send(JSON.stringify(m))}function broadcast(m,except){for(const p of players.values())if(p.ws!==except)send(p.ws,m)}
wss.on('connection',ws=>{const id=String(nextId++);const p={id,name:`Игрок_${id}`,x:0,y:50,z:0,ry:0,ws,host:false};players.set(id,p);send(ws,{type:'server_info',players:players.size,host:!!hostId,seed:worldSeed});
ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
if(m.type==='join'){p.name=String(m.name||p.name).slice(0,20);p.host=!!m.host;if(m.seed!=null&&worldSeed==null)worldSeed=Number(m.seed);if(p.host&&!hostId)hostId=id;send(ws,{type:'welcome',id,name:p.name,players:[...players.values()].map(({ws,...q})=>q),blocks:[...blocks.values()],seed:worldSeed});broadcast({type:'player_join',player:{id,name:p.name,x:p.x,y:p.y,z:p.z,ry:p.ry,host:p.host}},ws);return}
if(m.type==='host_snapshot'&&p.host&&p.id===hostId){worldSeed=Number(m.seed)||worldSeed;blocks.clear();for(const b of m.blocks||[]){const x=b.x|0,y=b.y|0,z=b.z|0,id=b.id|0;if(id!==0)blocks.set(`${x},${y},${z}`,{x,y,z,id})}persistSoon();broadcast({type:'world_snapshot',blocks:[...blocks.values()],seed:worldSeed},ws);return}
if(m.type==='state'){Object.assign(p,{x:Number(m.x)||0,y:Number(m.y)||0,z:Number(m.z)||0,ry:Number(m.ry)||0});broadcast({type:'state',id:p.id,name:p.name,x:p.x,y:p.y,z:p.z,ry:p.ry},ws);return}
if(m.type==='block'){const b={x:m.x|0,y:m.y|0,z:m.z|0,id:m.id|0};const k=`${b.x},${b.y},${b.z}`;if(b.id===0)blocks.delete(k);else blocks.set(k,b);persistSoon();broadcast({type:'block',...b},ws);return}
if(m.type==='chat'){const text=String(m.text||'').slice(0,120);if(text)broadcast({type:'chat',id:p.id,name:p.name,text})}});
ws.on('close',()=>{const wasHost=id===hostId;players.delete(id);if(wasHost){hostId=null;broadcast({type:'host_left'})}broadcast({type:'player_leave',id})})});
server.listen(port,'0.0.0.0',()=>{console.log(`Voxel Survival LAN server: http://localhost:${port}`);for(const nets of Object.values(os.networkInterfaces()))for(const n of nets||[])if(n.family==='IPv4'&&!n.internal)console.log(`LAN: http://${n.address}:${port}`);});
