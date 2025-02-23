import { hash, parseChance } from './utils.js';

export default ($) => {
  const table = $('#blueprintByAvatar').next('table');
  const tbody = table.children()['0'];

  let enemy;
  const enemies = [];

  for (const tr of tbody.children.filter((etr) => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th' && tr.children.length === 2) {
      if (enemy) {
        enemies.push(enemy);
      }

      let itemdropchance = $(tr.children[1]).text();
      itemdropchance = parseChance(itemdropchance.split(':')[1].trim().split('%')[0].trim());

      // blueprintDropChance and mods are legacy, should be removed ASAP...
      enemy = {
        _id: hash(text),
        enemyName: text,
        enemyItemDropChance: itemdropchance,
        blueprintDropChance: itemdropchance,
        items: [],
        mods: [],
      };
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[2];
      const chance = parseChance($(chanceElem).text());
      const itemName = $(tr.children[1]).text();

      // Legacy, should be removed ASAP...
      enemy?.mods.push({
        _id: hash(itemName),
        modName: itemName,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });

      enemy?.items.push({
        _id: hash(itemName),
        itemName,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });
    }
  }

  // Push the remaining item
  enemies.push(enemy);

  return enemies;
};
