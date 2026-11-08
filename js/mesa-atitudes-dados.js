// Exclusive stances for real-time combat. Turn combat deliberately returns Normal.
export const MODOS_RT={
 normal:{nome:'Normal',icone:'⚖️',ataque:0,defesa:0,velocidade:1,intervalo:1,reserva:1,podeAtacar:true},
 defesa:{nome:'Defesa total',icone:'🛡️',ataque:0,defesa:40,velocidade:.6,intervalo:1,reserva:2,podeAtacar:false},
 ataque:{nome:'Ataque total',icone:'⚔️',ataque:15,defesa:-25,velocidade:1,intervalo:.65,reserva:1,podeAtacar:true},
 fuga:{nome:'Recuo / Fuga',icone:'💨',ataque:0,defesa:15,velocidade:1.6,intervalo:1,reserva:1.5,podeAtacar:false}
};
export function perfilRT(actor,rt,map){const m=actor?.modoRT;if(!rt?.ativo||rt.mapId!==map?.mapId||(map.combat?.active&&map.combat.session!=='rt')||!m||m.mapa!==rt.mapId||m.sessao!==rt.iniciadoEm)return MODOS_RT.normal;return MODOS_RT[m.modo]||MODOS_RT.normal;}
export function exigirAtaqueRT(actor,rt,map){const p=perfilRT(actor,rt,map);if(!p.podeAtacar)throw Error(p.nome+': ataques bloqueados. Volte ao modo Normal ou Ataque total.');return p;}
export function mudarModoRT({actor={},rt,map,modo,agora=Date.now()}){if(!Object.hasOwn(MODOS_RT,modo))throw Error('Modo de combate inválido.');if(!rt?.ativo||rt.mapId!==map?.mapId||map.combat?.active)throw Error('Os modos são exclusivos do combate em tempo real.');if(rt.pausado)throw Error('Combate pausado pelo mestre.');if(actor.combateLab?.morto||actor.combateLab?.inconsciente)throw Error('O personagem precisa estar consciente.');if(actor.modoRT?.sessao===rt.iniciadoEm&&agora-Number(actor.modoRT.em||0)<1000)throw Error('Aguarde um segundo antes de trocar de modo.');return {...actor,modoRT:{modo,mapa:rt.mapId,sessao:rt.iniciadoEm,em:agora}};}
// Non-offensive powers remain usable. Unclassified powers directed at someone else are treated as offensive.
export const psiOfensivoRT=(power,actorId,targetId)=>power!=='cura_psi'&&(['grito_psiquico','impulso','banimento_caotico','influenciar_mente','controlar_mente'].includes(power)||!!targetId&&targetId!==actorId);
