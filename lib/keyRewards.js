import {
  hash, parseRotation, parseChance,
} from './utils.js';

export default ($) => {
  const table = $('#keyRewards').next('table');

  const tbody = table.children()['0'];

  let rotation = null;

  const keys = [];
  let key = null;

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th') {
      const tmp = parseRotation(text);

      if (tmp) {
        rotation = tmp;
      } else {
        if (key) {
          keys.push(key);
        }

        key = { _id: hash(text), keyName: text, rewards: { A: [], B: [], C: [] } };
      }
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[1];
      const chance = parseChance($(chanceElem).text());

      key?.rewards[rotation].push({
        _id: hash(text),
        itemName: text,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });
    }
  }

  // Push the remaining item
  keys.push(key);

  return keys;
};
