// Local Mesa Estelar js/mesa-uso-itens.js (v190): one level, per-group cooldown.
export const FATIGUE_LEVELS = ['Fresh', 'Winded', 'Tired', 'Wearied', 'Exhausted', 'Debilitated', 'Incapacitated', 'Semi-Conscious', 'Comatose'];
export const FOOD_WAIT = {
  cafe: 600000,
  agua: 120000,
  comida: 180000,
  estimulante: 300000
};
export const FOOD = {
  apple: 'comida',
  ration: 'comida',
  water: 'agua',
  beer: 'agua',
  coffee: 'cafe'
};
export const FOOD_ITEMS = {
  ration: {
    name: 'Refeição de viagem',
    litres: .5,
    icon: '🍲'
  },
  water: {
    name: 'Água potável',
    litres: .5,
    icon: '💧'
  },
  beer: {
    name: 'Cerveja da Última Bateria',
    litres: .4,
    icon: '🍺'
  },
  coffee: {
    name: 'Café',
    litres: .3,
    icon: '☕'
  }
};
export function nutritionResult({
  type,
  fatigue,
  maxFatigue,
  hp,
  lastUse = {},
  now = Date.now()
}) {
  const group = FOOD[type];
  if (!group || hp <= 0) return {
    ok: false,
    reason: 'Um personagem morto não pode comer ou beber.'
  };
  if (lastUse[group] !== undefined && now - lastUse[group] < FOOD_WAIT[group]) return {
    ok: false,
    reason: 'Consumo recente: aguarde ' + Math.ceil((FOOD_WAIT[group] - (now - lastUse[group])) / 1000) + ' s.'
  };
  if (fatigue >= maxFatigue) return {
    ok: false,
    reason: 'Já está descansado.'
  };
  const level = Math.min(8, Math.max(1, Math.ceil((1 - fatigue / maxFatigue) * 8)));
  return {
    ok: true,
    fatigue: maxFatigue * (1 - (level - 1) / 8),
    level: FATIGUE_LEVELS[level - 1],
    lastUse: {
      ...lastUse,
      [group]: now
    }
  };
}
