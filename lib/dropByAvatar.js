import { hash, parseChance } from './utils.js';

export default ($, key) => {
  const table = $(`#${key}`).next('table');
  const tbody = table.children()['0'];

  let source = null;
  const sources = [];
  let baseChance = null;

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th' && tr.children.length > 0) {
      if (source) {
        sources.push(source);
      }

      const strippedChance = $(tr.children[1]).text().split(':')[1].split('%')[0].trim();

      baseChance = Number.parseFloat(strippedChance, 10) / 100;

      source = { _id: hash(text), source: text, items: [] };
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const itemChance = parseChance($(tr.children[2]).text());
      const item = $(tr.children[1]).text();

      const fractional = ((Number.parseFloat(itemChance.chance, 10) / 100) * baseChance);

      const chance = Number.parseFloat(fractional * 100, 10).toFixed(2);

      source.items.push({
        _id: hash(item),
        item,
        rarity: itemChance.rarity,
        chance: Number(chance),
      });
    }
  }

  // Push the remaining item
  sources.push(source);

  return sources;
};
