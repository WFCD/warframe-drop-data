import { hash, checkUniqueHash, parseChance } from './utils.js';

export default ($) => {
  const table = $('#modByDrop').next('table');
  const tbody = table.children()['0'];

  let mod = null;
  const mods = [];

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th' && tr.children.length === 1) {
      if (mod) {
        mods.push(mod);
      }

      mod = { _id: hash(text), modName: text, enemies: [] };
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[2];
      const chance = parseChance($(chanceElem).text());
      let enemyModDropChance = $(tr.children[1]).text();
      enemyModDropChance = Number(enemyModDropChance.slice(0, enemyModDropChance.length - 1));

      const enemy = {
        _id: hash(text),
        enemyName: text,
        enemyModDropChance,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      };

      if (checkUniqueHash(mod?.enemies, enemy, ['enemyName', 'enemyModDropChance', 'chance'])) { mod?.enemies.push(enemy); }
    }
  }

  // Push the remaining item
  mods.push(mod);

  return mods;
};
