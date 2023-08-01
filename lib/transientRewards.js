import { hash, parseRotation, parseChance } from './utils.js';

export default ($) => {
  const table = $('#transientRewards').next('table');
  const tbody = table.children()['0'];

  let transient = null;
  const transients = [];
  let rotation = null;

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th') {
      const tmp = parseRotation(text);

      if (tmp) {
        rotation = tmp;
      } else {
        if (transient) {
          transients.push(transient);
        }

        transient = { _id: hash(text), objectiveName: text, rewards: [] };
      }
    }

    if (elem.attribs.class === 'blank-row') {
      rotation = null;
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[1];
      const chance = parseChance($(chanceElem).text());

      transient?.rewards.push({
        _id: hash(text),
        rotation,
        itemName: text,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });
    }
  }

  // Push the remaining item
  transients.push(transient);

  return transients;
};
