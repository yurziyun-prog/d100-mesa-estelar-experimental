export function ocupadoNoArrasto(estado,id){const lista=estado?.lista||{};return !!lista[id]||Object.values(lista).some(v=>(v.ajudantes||[]).includes(id));}
