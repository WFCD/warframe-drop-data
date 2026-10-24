import * as cheerio from 'cheerio';

import { hash } from './utils.js';
import readJson from './readJson.js';

const rankRegex = /Rank\s+\d+\s*:?\s*/i;
function parseRank(rank) {
  return rank.replace(rankRegex, '').trim();
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
 * @param {cheerio.CheerioAPI} $ cheerio interface
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
 * @typedef {Object} OfferBoxSyndicateMapperResult
 * @property {_id} _id Unique hash of the item
 * @property {string} item The name of the item
 * @property {number} chance The dropchance of the item
 * @property {string} rarity The rarity of the item
 * @property {string} place The location where the item drops
 * @property {number} standing The amount of standing this item costs
 */

/**
 * Mapper for `.synOfferBox` offering cards.
 * @param {cheerio.CheerioAPI} $ cheerio interface
 * @param {string} element Current element
 * @param {string} syndicate Name of the Syndicate
 * @param {string} [section] Section title - potentially empty
 * @returns {OfferBoxSyndicateMapperResult}
 */
function offerBoxMapper($, element, syndicate, section) {
  const name = $(element).find('.synOfferBoxName').text().replace(/\s+/g, ' ').trim();
  const standing = parseStanding(
    $(element)
      .find('.synOfferBoxPrice')
      .text()
      .replace(/[^\d,]/g, '')
  );
  const rank = parseRank($(element).find('.synOfferBoxRank').text().replace(/\s+/g, ' ').trim());
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
 * Offering cards that follow a heading, up to the next heading of the same or higher level.
 * @param {cheerio.CheerioAPI} $ cheerio interface
 * @param {string} headingId Heading element id
 * @returns {Array<*>} Offer box elements
 */
function boxesAfterHeading($, headingId) {
  const heading = $(`[id="${headingId}"]`).first();
  if (!heading.length) return [];

  const level = Number(String(heading.prop('tagName') || '').replace(/\D/g, ''));
  const boxes = [];
  let sibling = heading.parent().next();

  while (sibling.length) {
    if (sibling.hasClass('mw-heading')) {
      const nextHeading = sibling.find('h1, h2, h3, h4, h5, h6').first();
      const nextLevel = Number(String(nextHeading.prop('tagName') || '').replace(/\D/g, ''));
      if (nextLevel && nextLevel <= level) break;
    }

    boxes.push(...sibling.find('.synOfferBox').addBack('.synOfferBox').toArray());
    sibling = sibling.next();
  }

  return boxes;
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
  const standing = parseStanding(
    $(element)
      .find('> div:nth-of-type(1) > div:nth-of-type(1) .sortkey')
      .text()
      .replace(/[^\\x00-\x7F]/g, ' ')
      .replace(' Standing', '')
  );
  const credits = parseStanding(
    $(element)
      .find('> div:nth-of-type(1) > div:nth-of-type(2) .sortkey')
      .text()
      .replace(/[^\\x00-\x7F]/g, ' ')
      .replace(' Credits', '')
  );
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
 * @property {string} [headingId] MediaWiki heading id. Cards after it are offerings
 * @property {string} [selector] jQuery selector used to find the elements you want to map
 * @property {SyndicateMapper} [mapper] Used to map these elements. If not provided,
 * a default mapper is used.
 */
/**
 * @typedef {Object} SyndicateConfig
 * @property {string} name Name of the Syndicate (should match the wiki)
 * @property {string} fandomWikiPage The Fandom wiki page name of the syndicate
 * @property {SyndicateSection[]} sections These will be parsed and mapped into json data
 */

/** @type {Array<SyndicateConfig>} */
const SYNDICATES = [
  {
    name: 'Steel Meridian',
    fandomWikiPage: 'Steel_Meridian',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Arbiters of Hexis',
    fandomWikiPage: 'Arbiters_of_Hexis',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Cephalon Suda',
    fandomWikiPage: 'Cephalon_Suda',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'The Perrin Sequence',
    fandomWikiPage: 'The_Perrin_Sequence',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Red Veil',
    fandomWikiPage: 'Red_Veil',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'New Loka',
    fandomWikiPage: 'New_Loka',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Conclave',
    fandomWikiPage: 'Conclave',
    sections: [{ selector: '.flex-container > div' }],
  },
  {
    name: 'Cephalon Simaris',
    fandomWikiPage: 'Cephalon_Simaris',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Ostron',
    fandomWikiPage: 'Ostron',
    sections: [
      { title: 'Hok', headingId: 'Hok' },
      { title: 'Old Man Suumbaat', headingId: 'Old_Man_Suumbaat' },
      { title: 'Fisher Hai-Luk', headingId: 'Fisher_Hai-Luk' },
      { title: 'Master Teasonai', headingId: 'Master_Teasonai' },
    ],
  },
  {
    name: 'The Quills',
    fandomWikiPage: 'The_Quills',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Solaris United',
    fandomWikiPage: 'Solaris_United',
    sections: [
      { title: 'Rude Zuud', headingId: 'Rude_Zuud' },
      { title: 'Legs', headingId: 'Legs' },
      { title: 'The Business', headingId: 'The_Business' },
      { title: 'Smokefinger', headingId: 'Smokefinger' },
    ],
  },
  {
    name: 'Vox Solaris',
    fandomWikiPage: 'Vox_Solaris_(Syndicate)',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Ventkids',
    fandomWikiPage: 'Ventkids',
    sections: [{ headingId: 'Offerings' }],
  },
  {
    name: 'Entrati',
    fandomWikiPage: 'Entrati',
    sections: [
      { title: 'Father', headingId: 'Father' },
      { title: 'Daughter', headingId: 'Daughter' },
      { title: 'Son', headingId: 'Son' },
      { title: 'Otak', headingId: 'Otak' },
    ],
  },
  {
    name: 'NecraLoid',
    fandomWikiPage: 'Necraloid',
    sections: [{ title: 'Loid', headingId: 'Loid' }],
  },
  {
    name: 'The Holdfasts',
    fandomWikiPage: 'The_Holdfasts',
    sections: [
      { title: 'Hombask', headingId: 'Dormizone_Items' },
      { title: 'Hombask', headingId: 'Voidshells_and_Scenes' },
      { title: 'Cavalero', headingId: 'Cavalero' },
    ],
  },
  {
    name: "Kahl's Garrison",
    fandomWikiPage: "Kahl's_Garrison",
    sections: [{ title: 'Chipper', headingId: 'Chipper' }],
  },
  {
    name: 'Operational Supply',
    fandomWikiPage: 'Operational_Supply',
    sections: [{ selector: '.flex-container > div', mapper: operationalSupplyMapper }],
  },
];

const previousSyndicatesUrl = new URL('../data/syndicates.json', import.meta.url);

/**
 * Rows saved from the last scrape for one syndicate.
 * @param {string} name Syndicate name
 * @returns {Promise<Array<Object>>}
 */
async function previousSyndicateRows(name) {
  const previousBuild = await readJson(previousSyndicatesUrl);
  return previousBuild.syndicates?.[name] ?? [];
}

export default async () => {
  const scraped = {};
  await Promise.all(
    SYNDICATES.map(async (syndicate) => {
      let data;
      try {
        // Fetch page for this syndicate.
        const page = encodeURIComponent(syndicate.fandomWikiPage);
        const apiUrl = `https://wiki.warframe.com/api.php?action=parse&page=${page}&prop=text&format=json`;
        data = await fetch(apiUrl)
          .then((res) => res.json())
          .then((json) => json.parse.text['*']);
      } catch {
        // If something goes wrong we reuse data from a previous build.
        scraped[syndicate.name] = await previousSyndicateRows(syndicate.name);
        return;
      }

      const $ = cheerio.load(data);
      scraped[syndicate.name] = [];

      // Loop defined sections for this syndicate.
      syndicate.sections.forEach((section) => {
        const mapper = section.mapper ?? (section.headingId ? offerBoxMapper : defaultMapper);
        const elements = section.headingId ? boxesAfterHeading($, section.headingId) : $(section.selector).toArray();
        scraped[syndicate.name] = [
          ...scraped[syndicate.name],
          ...elements.map((element) => mapper($, element, syndicate.name, section.title ?? '')),
        ];
      });

      if (scraped[syndicate.name].length === 0) {
        const previous = await previousSyndicateRows(syndicate.name);
        if (previous.length) scraped[syndicate.name] = previous;
      }
    })
  );

  const syndicates = {};
  SYNDICATES.forEach((syndicate) => {
    syndicates[syndicate.name] = scraped[syndicate.name];
  });
  return syndicates;
};
