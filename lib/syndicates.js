'use strict';

const path = require('path');

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const { hash } = require('./utils');
const readJson = require('./readJson');

const rankRegex = /Rank \d[:]? /i;
function parseRank(rank) {
  return rank.replace(rankRegex, '');
}

function parsePlace(syndicate, section, rank) {
  let syndicateWithSection = syndicate;
  if (section) {
    syndicateWithSection += ` (${section})`;
  }
  return [syndicateWithSection, rank].filter(Boolean).join(', ');
}

function parseStanding(standing) {
  return Number(standing.replace(' ', '').replace(',', ''));
}

/**
 * @typedef {Object} DefaultSyndicateMapperResult
 * @property {_id} _id Unique hash of the item
 * @property {string} item The name of the item
 * @property {number} chance The dropchance of the item
 * @property {string} rarity The rarity of the item
 * @property {string} place The location where the item drops
 * @property {number} standing The amount of standing this item costs
 */

/**
 * Default mapper, maps the most syndicate ware lists.
 * @param {module:cheerio/CheerioAPI} $ cheerio interface
 * @param {string} element Current element
 * @param {string} syndicate Name of the Syndicate
 * @param {string} [section] Section title - potentially empty
 * @returns {DefaultSyndicateMapperResult}
 */
function defaultMapper($, element, syndicate, section) {
  // Name is mostly located within an "a" tag, sometimes within a "strong" instead.
  const name = $(element).find('div:last-child a span').text() || $(element).find('div:last-child strong span').text();
  const standing = parseStanding($(element).find('p span').text());

  // Sometimes the rank information is in the fourth div, so fallback to that.
  // In that case the third div seems to be empty.
  const rank = parseRank($(element).find('div:nth-of-type(3)').text() || $(element).find('div:nth-of-type(4)').text());
  return {
    _id: hash(name),
    item: name,
    chance: 100,
    rarity: 'Common',
    place: parsePlace(syndicate, section, rank),
    standing,
  };
}

/**
 * @typedef {Object} GallerySyndicateMapperResult
 * @property {_id} _id Unique hash of the item
 * @property {string} item The name of the item
 * @property {number} chance The dropchance of the item
 * @property {string} rarity The rarity of the item
 * @property {string} place The location where the item drops
 * @property {number} cost The cost of the item (credits or tokens)
 */

/**
 * Some syndicate pages display ware lists as a gallery, for example "Grandmother" for Entrati.
 * @param {module:cheerio/CheerioAPI} $ cheerio interface
 * @param {string} element Current element
 * @param {string} syndicate Name of the Syndicate
 * @param {string} [section] Section title - potentially empty
 * @returns {GallerySyndicateMapperResult}
 */
function galleryMapper($, element, syndicate, section) {
  // Text contains something like "Deimos Vault Scene50  Grandmother Token"
  const text = $(element).find('.lightbox-caption').text();

  // Search for the first index of a numeric value.
  const numberIndex = text.search(/(?=\d)/g);

  // Split the text and extract the name from it.
  const name = text.slice(0, numberIndex);

  // The remainder contains the cost information.
  // Remove any unicode and make sure there are no duplicate spaces.
  const cost = Number(text.slice(numberIndex).replace(/[^\\x00-\x7F]/g, ' ').replace('  ', ' ').replace(' Grandmother Token', ''));
  return {
    _id: hash(name),
    item: name,
    chance: 100,
    rarity: 'Common',
    place: parsePlace(syndicate, section),
    cost,
  };
}

/**
 * @typedef {Object} ArchimedeanSyndicateMapperResult
 * @property {_id} _id Unique hash of the item
 * @property {string} item The name of the item
 * @property {number} chance The dropchance of the item
 * @property {string} rarity The rarity of the item
 * @property {string} place The location where the item drops
 * @property {number} standing The amount of standing this item costs
 */

/**
 * Custom mapper for the Archimedean vendor for The Holdfasts.
 * @param {module:cheerio/CheerioAPI} $ cheerio interface
 * @param {string} element Current element
 * @param {string} syndicate Name of the Syndicate
 * @param {string} [section] Section title - potentially empty
 * @returns {ArchimedeanSyndicateMapperResult}
 */
function archimedeanMapper($, element, syndicate, section) {
  const name = $(element).find('div:nth-of-type(3) > a > span').text();
  const standing = parseStanding($(element).find('div:nth-of-type(1) > div > a > span').text());
  return {
    _id: hash(name),
    item: name,
    chance: 100,
    rarity: 'Common',
    place: parsePlace(syndicate, section),
    standing,
  };
}

/**
 * @typedef {Object} OperationalSupplySyndicateMapperResult
 * @property {_id} _id Unique hash of the item
 * @property {string} item The name of the item
 * @property {number} chance The dropchance of the item
 * @property {string} rarity The rarity of the item
 * @property {string} place The location where the item drops
 * @property {number} standing The amount of standing this item costs
 * @property {number} cost The cost of the item (credits or tokens)
 */

/**
 * Custom mapper for the Operational Supply syndicate.
 * @param {module:cheerio/CheerioAPI} $ cheerio interface
 * @param {string} element Current element
 * @param {string} syndicate Name of the Syndicate
 * @param {string} [section] Section title - potentially empty
 * @returns {OperationalSupplySyndicateMapperResult}
 */
function operationalSupplyMapper($, element, syndicate, section) {
  const name = $(element).find('div:last-child a span').text();
  // We remove any unicode and Standing/Credits phrasing from the text.
  const standing = parseStanding($(element).find('> div:nth-of-type(1) > div:nth-of-type(1) .sortkey').text().replace(/[^\\x00-\x7F]/g, ' ')
    .replace(' Standing', ''));
  const credits = parseStanding($(element).find('> div:nth-of-type(1) > div:nth-of-type(2) .sortkey').text().replace(/[^\\x00-\x7F]/g, ' ')
    .replace(' Credits', ''));
  const rank = parseRank($(element).find('> div:nth-of-type(2)').text());
  return {
    _id: hash(name),
    item: name,
    chance: 100,
    rarity: 'Common',
    place: parsePlace(syndicate, section, rank),
    standing,
    cost: credits,
  };
}
/**
 * @typedef {Object} SyndicateSection
 * @property {string} [title] Indicates the name of the specific vendor
 * @property {string} selector jQuery selector used to find the elements you want to map
 * @property {SyndicateMapper} [mapper] Used to map these elements. If not provided,
 * a default mapped is used.
 */
/**
 * @typedef {Object} SyndicateConfig
 * @property {string} name Name of the Syndicate (should match the wiki)
 * @property {string} url The wiki url of the syndicate
 * @property {SyndicateSection[]} sections These will be parsed and mapped into json data
 */

/** @type {Array<SyndicateConfig>} */
const SYNDICATES = [
  {
    name: 'Steel Meridian',
    url: 'https://warframe.fandom.com/wiki/Steel_Meridian',
    sections: [
      { selector: '#mw-customcollapsible-SteelMeridian > div > div' },
    ],
  },
  {
    name: 'Arbiters of Hexis',
    url: 'https://warframe.fandom.com/wiki/Arbiters_of_Hexis',
    sections: [
      { selector: '#mw-customcollapsible-ArbitersofHexis > div > div' },
    ],
  },
  {
    name: 'Cephalon Suda',
    url: 'https://warframe.fandom.com/wiki/Cephalon_Suda',
    sections: [
      { selector: '#mw-customcollapsible-CephalonSuda > div > div' },
    ],
  },
  {
    name: 'The Perrin Sequence',
    url: 'https://warframe.fandom.com/wiki/The_Perrin_Sequence',
    sections: [
      { selector: '#mw-customcollapsible-ThePerrinSequence > div > div' },
    ],
  },
  {
    name: 'Red Veil',
    url: 'https://warframe.fandom.com/wiki/Red_Veil',
    sections: [
      { selector: '#mw-customcollapsible-RedVeil > div > div' },
    ],
  },
  {
    name: 'New Loka',
    url: 'https://warframe.fandom.com/wiki/New_Loka',
    sections: [
      { selector: '#mw-customcollapsible-NewLoka > div > div' },
    ],
  },
  {
    name: 'Conclave',
    url: 'https://warframe.fandom.com/wiki/Conclave',
    sections: [
      { selector: '.flex-container > div' },
    ],
  },
  {
    name: 'Cephalon Simaris',
    url: 'https://warframe.fandom.com/wiki/Cephalon_Simaris',
    sections: [
      { selector: '#mw-customcollapsible-Simaris > div > div' },
    ],
  },
  {
    name: 'Ostron',
    url: 'https://warframe.fandom.com/wiki/Ostron',
    sections: [
      { title: 'Hok', selector: '#mw-customcollapsible-Hok > div > div' },
      { title: 'Old Man Suumbaat', selector: '#mw-customcollapsible-Suumbaat > div > div' },
      { title: 'Fisher Hai-Luk', selector: '#mw-customcollapsible-Hai-Luk > div > div' },
      { title: 'Master Teasonai', selector: '#mw-customcollapsible-BeastmasterWares > div > div' },
    ],
  },
  {
    name: 'The Quills',
    url: 'https://warframe.fandom.com/wiki/The_Quills',
    sections: [
      { selector: '#mw-customcollapsible-Onkko > div > div' },
    ],
  },
  {
    name: 'Solaris United',
    url: 'https://warframe.fandom.com/wiki/Solaris_United',
    sections: [
      { title: 'Rude Zuud', selector: '#mw-customcollapsible-Zuud > div > div' },
      { title: 'Legs', selector: '#mw-customcollapsible-Legs > div > div' },
      { title: 'The Business', selector: '#mw-customcollapsible-Biz > div > div' },
      { title: 'Smokefinger', selector: '#mw-customcollapsible-Smoke > div > div' },
    ],
  },
  {
    name: 'Vox Solaris',
    url: 'https://warframe.fandom.com/wiki/Vox_Solaris_(Syndicate)',
    sections: [
      { selector: '#mw-customcollapsible-LittleDuck > div > div' },
    ],
  },
  {
    name: 'Ventkids',
    url: 'https://warframe.fandom.com/wiki/Ventkids',
    sections: [
      { selector: '#mw-customcollapsible-Ventkids > div > div' },
    ],
  },
  {
    name: 'Entrati',
    url: 'https://warframe.fandom.com/wiki/Entrati',
    sections: [
      { title: 'Father', selector: '#mw-customcollapsible-Father > div > div' },
      { title: 'Daughter', selector: '#mw-customcollapsible-Daughter > div > div' },
      { title: 'Son', selector: '#mw-customcollapsible-Son > div > div' },
      { title: 'Otak', selector: '.flex-container:eq(3) > div' },
      { title: 'Grandmother', selector: '#mw-customcollapsible-Grandmother #gallery-1 > div', mapper: galleryMapper },
    ],
  },
  {
    name: 'NecraLoid',
    url: 'https://warframe.fandom.com/wiki/Necraloid',
    sections: [
      { title: 'Loid', selector: '#mw-customcollapsible-Loid > div > div' },
    ],
  },
  {
    name: 'The Holdfasts',
    url: 'https://warframe.fandom.com/wiki/The_Holdfasts',
    sections: [
      { title: 'Archimedean', selector: '#mw-customcollapsible-Yonta #gallery-0 > div', mapper: galleryMapper },
      { title: 'Archimedean', selector: '#mw-customcollapsible-Yonta > p + div, #mw-customcollapsible-Yonta > p + div ~ div', mapper: archimedeanMapper },
      { title: 'Hombask', selector: '#mw-customcollapsible-HombaskOfferings1 > div > div, #mw-customcollapsible-HombaskOfferings2 > div > div' },
      { title: 'Cavalero', selector: '#mw-customcollapsible-Cavalero > div > div' },
    ],
  },
  {
    name: "Kahl's Garrison",
    url: 'https://warframe.fandom.com/wiki/Kahl%27s_Garrison',
    sections: [
      { title: 'Chipper', selector: '#mw-customcollapsible-Chipper > div > div' },
    ],
  },
  {
    name: 'Operational Supply',
    url: 'https://warframe.fandom.com/wiki/Operational_Supply',
    sections: [
      { selector: '.flex-container > div', mapper: operationalSupplyMapper },
    ],
  },
];

module.exports = async function () {
  const syndicates = {};
  await Promise.all(
    SYNDICATES.map(async (syndicate) => {
      let data;
      try {
        // Fetch page for this syndicate.
        data = await fetch(syndicate.url).then(res => res.text());
      } catch {
        // If something goes wrong we reuse data from a previous build.
        const previousBuild = await readJson(path.resolve(__dirname, '../data/syndicates.json'));
        syndicates[syndicate.name] = previousBuild.syndicates[syndicate.name];
        return;
      }

      const $ = cheerio.load(data);
      syndicates[syndicate.name] = [];

      // Loop defined sections for this syndicate.
      syndicate.sections.forEach((section) => {
        // See if a mapper is defined for this section, else use the default one.
        const mapper = section.mapper ?? defaultMapper;
        // Combine existing data with new one.
        syndicates[syndicate.name] = [
          ...syndicates[syndicate.name],
          ...$(section.selector)
            .map((_, element) => mapper($, element, syndicate.name, section.title ?? ''))
            .toArray(),
        ];
      });
      return undefined;
    }),
  );

  return syndicates;
};
