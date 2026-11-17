import {state as s} from '../core/state.js';
import assets from './combatente-assets.json';
const images=new Map();
export function drawAvatar(){
 const look=s.looks[s.role];if(look.avatar!=='combatente')return false;
 if(s.godMode()&&['invisible','ethereal'].includes(s.godPresence))return true;
 const face=s.screenVector(s.player.faceX,s.player.faceY),view=Math.abs(face[0])>Math.abs(face[1])*.8?'lado':face[1]<0?'costas':'frente',action=s.walking||s.player.walkBlend>.2?'andar':'parado',key=action+'_'+view,meta=assets[key];
 let img=images.get(key);if(!img){img=new Image();img.src=meta.data;images.set(key,img);}if(!img.complete||!img.naturalWidth)return false;
 const f=Math.floor((performance.now()/1000%meta.dur)/meta.dur*meta.quadros),fw=img.naturalWidth/meta.quadros,fh=img.naturalHeight,p=s.P(s.player.x,s.player.z,s.player.elevation+s.player.jumpY),u=s.scale*s.zoom,size=u*2.65,c=s.ctx;
 c.save();if(s.godMode()&&s.godPresence==='translucent')c.globalAlpha=.35;c.fillStyle='#14211e66';c.beginPath();c.ellipse(p[0],p[1],u*.23,u*.075,0,0,7);c.fill();c.translate(p[0],p[1]);if(view==='lado'&&face[0]>0)c.scale(-1,1);c.drawImage(img,f*fw,0,fw,fh,-size/2,-size*.87,size,size);c.restore();return true;
}
export function installAvatarOptions(){
 const panel=document.getElementById('appearancePanel'),row=document.createElement('label');row.textContent='Modelo visual ';const select=document.createElement('select');select.id='avatarModel';for(const [id,name] of [['original','Orla — personalizável'],['combatente','Combatente 3D — casaco e rifle']]){const o=new Option(name,id);select.append(o);}row.append(select);panel.append(row);
 select.onchange=()=>{s.looks[s.role].avatar=select.value;s.saveGame();};const sync=s.syncLookInputs;s.syncLookInputs=()=>{sync();select.value=s.looks[s.role].avatar||'original';};
 const presets=document.createElement('div');presets.textContent='Trajes: ';for(const [name,outfit,pants,hair] of [['Explorador','#867456','#3b4149','#49372b'],['Retrofuturista','#293b4c','#242a36','#b9b6aa'],['Nobre espacial','#612d42','#29212f','#dad5bc'],['Engenheiro','#b77f43','#34454b','#28272a']]){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>{Object.assign(s.looks[s.role],{avatar:'original',outfit,pants,hair});s.syncLookInputs();s.saveGame();};presets.append(b);}panel.append(presets);s.syncLookInputs();
}
