import {
  hash, parseChance,
} from './utils.js';

export default ($) => {
  const table = $('#sortieRewards').next('table');

  const tbody = table.children()['0'];

  const rewards = [];

  for (const tr of tbody.children) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[1];
      const chance = parseChance($(chanceElem).text());

      rewards.push({
        _id: hash(text),
        itemName: text,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });
    }
  }

  return rewards;
};
