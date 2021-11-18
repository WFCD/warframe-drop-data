'use strict';

const { hash, parseChance } = require('./utils');

module.exports = function ($) {
  const table = $('#miscItems').next('table');

  const tbody = table.children()['0'];

  let enemy = null;

  const enemies = [];

  for (const tr of tbody.children) {
    const elem = tr.children[0];
    const text = $(elem).text();

    if (elem.name === 'th' && tr.children.length === 2) {
      if (enemy) {
        enemies.push(enemy);
      }

      let itemdropchance = $(tr.children[1]).text();

      itemdropchance = itemdropchance.split(':')[1].split('%')[0].trim();

      enemy = {
        _id: hash(text), enemyName: text, enemyItemDropChance: Number(itemdropchance), items: [],
      };
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[2];
      const chance = parseChance($(chanceElem).text());

      const itemName = $(tr.children[1]).text();

      enemy.items.push({
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
