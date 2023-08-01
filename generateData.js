import crypto from 'node:crypto';
import { dirname, resolve } from 'node:path';
import {
  writeFileSync, mkdirSync, readFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as cheerio from 'cheerio';
import ProgressBar from 'progress';

import { formatSiteData } from './lib/utils.js';

import missionRewards from './lib/missionRewards.js';
import relics from './lib/relics.js';
import transientRewards from './lib/transientRewards.js';
import modLocations from './lib/modLocations.js';
import enemyModTables from './lib/enemyModTables.js';
import blueprintLocations from './lib/blueprintLocations.js';
import enemyBlueprintTables from './lib/enemyBlueprintTables.js';
import sortieRewards from './lib/sortieRewards.js';
import keyRewards from './lib/keyRewards.js';
import bountyRewards from './lib/bountyRewards.js';
import syndicates from './lib/syndicates.js';
import dropByAvatar from './lib/dropByAvatar.js';

import infoJson from './data/info.json' assert {type: 'json'};

import 'colors';

const mappers = {
  missionRewards,
  relics,
  transientRewards,
  modLocations,
  enemyModTables,
  blueprintLocations,
  enemyBlueprintTables,
  sortieRewards,
  keyRewards,
  bountyRewards,
  syndicates,
  dropByAvatar,
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const initProgress = (total) => {
  if (process.env.CI !== 'true') {
    return new ProgressBar(
      `Writing: ${'['.green}:bar${']'.green} ${':current'.grey}/${':total'.green} ${':file'.bgGreen} (${':elapsed'.cyan}s/${':eta'.cyan}s)`,
      {
        incomplete: '-'.red,
        complete: '='.cyan,
        width: 10,
        total: total || 0,
      },
    );
  }
  return {
    tick: ({ file }) => console.log(`Writing... ${file}`),
    interrupt: console.log,
  };
};

let bar;

const writeData = (data, key, format) => {
  // console.log(`Writing... /data/${key}.json`)
  bar.tick({ file: `/data/${key}.json` });

  const body = {};
  body[key] = data[key];

  const bodyStr = JSON.stringify(body, null, format);

  writeFileSync(resolve(__dirname, 'data', `${key}.json`), bodyStr);
};

const config = {
  jsonMinify: (process.argv.indexOf('-expand') > -1) || true,
  forceRegeneration: (process.argv.indexOf('-force') > -1),
  dropDataUrl: 'https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html',
};

console.log('### Warframe Drop Data'.cyan);
console.log(`${'Requesting Drop Data'.grey} from ${config.dropDataUrl.cyan}...`);

function trymkdir(dir) {
  try {
    mkdirSync(dir);
  } catch (ex) {
    // directory already exists, probably
  }
}

fetch(config.dropDataUrl)
  .then(async (res) => {
    const body = await res.text();

    const resFmt = `Response: ${res.status} - ${res.statusText}\n`;
    console.log(res.ok ? resFmt.green : resFmt.red);

    const hash = crypto.createHash('md5').update(body, 'utf8').digest('hex');

    console.log(`${'Response hash:'.grey} ${hash}`);

    let oldHash = null;

    if (infoJson) {
      oldHash = infoJson.hash;

      console.log(`${'Old hash found:'.grey} ${oldHash}`);
    }

    if (!config.forceRegeneration) {
      if (hash === oldHash) {
        // nothing new, close
        console.log('Data hasn\'t changed, exit process.'.grey);
        writeFileSync('.build_status', 'halt');
        process.exit(0);
      }
    }

    const $ = cheerio.load(body);

    const data = {
      missionRewards: mappers.missionRewards($),
      relics: mappers.relics($),
      transientRewards: mappers.transientRewards($),
      modLocations: mappers.modLocations($),
      enemyModTables: mappers.enemyModTables($),
      blueprintLocations: mappers.blueprintLocations($),
      enemyBlueprintTables: mappers.enemyBlueprintTables($),
      sortieRewards: mappers.sortieRewards($),
      keyRewards: mappers.keyRewards($),
      cetusBountyRewards: mappers.bountyRewards($, 'cetusRewards'),
      solarisBountyRewards: mappers.bountyRewards($, 'solarisRewards'),
      deimosRewards: mappers.bountyRewards($, 'deimosRewards'),
      zarimanRewards: mappers.bountyRewards($, 'zarimanRewards'),
      syndicates: await mappers.syndicates(),

      // drops by avatar
      resourceByAvatar: mappers.dropByAvatar($, 'resourceByAvatar', 'Resource Drop Chance'),
      sigilByAvatar: mappers.dropByAvatar($, 'sigilByAvatar', 'Sigil Drop Chance'),
      additionalItemByAvatar: mappers.dropByAvatar($, 'additionalItemByAvatar', 'Additional Item Drop Chance'),
    };

    // generate relics structure
    const relicStruct = {};

    for (const relic of data.relics) {
      trymkdir(resolve(__dirname, 'data', 'relics'));
      trymkdir(resolve(__dirname, 'data', 'relics', `${relic.tier}`));

      if (!relicStruct[relic.tier]) {
        relicStruct[relic.tier] = {};
      }

      if (!relicStruct[relic.tier][relic.relicName]) {
        relicStruct[relic.tier][relic.relicName] = {
          tier: relic.tier,
          name: relic.relicName,
          rewards: {
            Intact: [],
            Exceptional: [],
            Flawless: [],
            Radiant: [],
          },
        };
      }

      relicStruct[relic.tier][relic.relicName].rewards[relic.state] = relic.rewards;
    }

    const dataKeys = Number(Object.keys(data).length);

    // calculate mission key length
    let missionKeys = 0;
    Object.keys(data.missionRewards).forEach((planet) => {
      missionKeys += Object.keys(data.missionRewards[planet]).length;
    });

    // calculate relic keys length
    let relicKeys = 0;
    Object.keys(relicStruct).forEach((tier) => {
      relicKeys += Object.keys(relicStruct[tier]).length;
    });

    const totalKeys = dataKeys + 5 // builds + hash + all + all.slim + info
      + missionKeys
      + relicKeys;

    bar = initProgress(totalKeys);

    const dropSiteData = formatSiteData(data);

    const date = new Date(res.headers.get('last-modified')).getTime();

    const info = {
      hash,
      timestamp: (new Date().getTime()),
      modified: date,
    };

    trymkdir(resolve(__dirname, 'data'));

    const jsonFormat = config.jsonMinify ? '' : '    ';

    // add to builds
    bar.interrupt('Adding build'.grey);
    const builds = JSON.parse(readFileSync(resolve(__dirname, 'data', 'builds', 'builds.json')).toString());
    if (builds.filter(build => build.hash === info.hash).length === 0) builds.push(info);

    bar.tick({ file: '/data/builds/builds.json' });
    writeFileSync(resolve(__dirname, 'data', 'builds', 'builds.json'), JSON.stringify(builds, null, jsonFormat));

    bar.tick({ file: `/data/builds/${info.hash}.json` });
    writeFileSync(resolve(__dirname, 'data', 'builds', `${info.hash}.json`), JSON.stringify(data, null, jsonFormat));

    bar.tick({ file: '/data/all.json' });
    writeFileSync(resolve(__dirname, 'data', 'all.json'), JSON.stringify(data, null, jsonFormat));

    bar.tick({ file: 'data/all.slim.json' });
    writeFileSync(resolve(__dirname, 'data', 'all.slim.json'), JSON.stringify(dropSiteData, null, jsonFormat));

    bar.tick({ file: 'data/info.json' });
    writeFileSync(resolve(__dirname, 'data', 'info.json'), JSON.stringify(info, null, jsonFormat));

    Object.keys(data).forEach((key) => { writeData(data, key, jsonFormat); });

    trymkdir(resolve(__dirname, 'data', 'missionRewards'));

    // write structure
    for (const planet of Object.keys(data.missionRewards)) {
      for (const location of Object.keys(data.missionRewards[planet])) {
        trymkdir(resolve(__dirname, 'data', 'missionRewards', `${planet}`));

        bar.tick({ file: `/data/missionRewards/${planet}/${location.replace(':', '')}.json` });
        const missionData = { ...data.missionRewards[planet][location] };
        missionData.planet = planet;
        missionData.location = location;
        writeFileSync(resolve(__dirname, 'data', 'missionRewards', `${planet}`, `${location.replace(':', '')}.json`), JSON.stringify(missionData, null, jsonFormat));
      }
    }

    // write structure
    for (const tier of Object.keys(relicStruct)) {
      for (const relicName of Object.keys(relicStruct[tier])) {
        bar.tick({ file: `/data/relics/${tier}/${relicName}.json` });
        writeFileSync(resolve(__dirname, 'data', 'relics', `${tier}`, `${relicName}.json`), JSON.stringify(relicStruct[tier][relicName], null, jsonFormat));
      }
    }
    writeFileSync('.build_status', 'continue');
  });
