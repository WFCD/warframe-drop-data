'use strict';

const { hash, parseRelic, parseChance } = require('./utils');

module.exports = function ($) {
  const table = $('#relicRewards').next('table');
  const tbody = table.children()['0'];

  let relic = null;
  const relics = [];

  for (const tr of tbody.children.filter(etr => etr?.children?.length)) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th') {
      if (relic) {
        relics.push(relic);
      }

      const tmp = parseRelic(text);

      if (tmp) {
        relic = tmp;
        relic._id = hash(`${relic.tier}_${relic.relicName}_${relic.state}`);
      }
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[1];
      const chance = parseChance($(chanceElem).text());

      relic?.rewards.push({
        _id: hash(text),
        itemName: text,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      });
    }
  }

  if (relic.relicName) {
    // Push the remaining item
    relics.push(relic);
  }

  return relics;
};
