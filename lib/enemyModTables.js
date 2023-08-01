import { hash, checkUniqueHash, parseChance } from './utils.js';

export default ($) => {
  const table = $('#modByAvatar').next('table');
  const tbody = table.children()['0'];

  let enemy = null;
  const enemies = [];

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th' && tr.children.length === 2) {
      if (enemy) {
        if (checkUniqueHash(enemies, enemy, ['enemyName', 'ememyModDropChance', 'mods'])) { enemies.push(enemy); }
      }

      let moddropchance = $(tr.children[1]).text();
      moddropchance = moddropchance.slice('Mod Drop Chance: '.length, moddropchance.length - 1);

      enemy = {
        _id: hash(text),
        enemyName: text,
        ememyModDropChance: moddropchance,
        enemyModDropChance: moddropchance,
        mods: [],
      };
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[2];
      const chance = parseChance($(chanceElem).text());
      const modName = $(tr.children[1]).text();

      if (chance !== null) {
        enemy.mods.push({
          _id: hash(modName),
          modName,
          rarity: chance.rarity,
          chance: Number(chance.chance),
        });
      }
    }
  }

  // Push the remaining item
  if (checkUniqueHash(enemies, enemy, ['enemyName', 'ememyModDropChance', 'mods'])) { enemies.push(enemy); }

  return enemies;
};
