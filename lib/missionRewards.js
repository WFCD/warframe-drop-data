import { hash, parseLocation, parseRotation, parseChance } from './utils.js';

export default ($) => {
  const table = $('#missionRewards').next('table');

  const tbody = table.children()['0'];

  let location;
  let rotation;

  const missionRewards = {};

  for (const tr of tbody.children.filter((etr) => etr?.children?.length)) {
    const elem = tr.children?.[0];
    const text = $(elem)?.text();

    if (elem.name === 'th') {
      let tmp = parseLocation(text);

      if (tmp) {
        location = tmp;

        if (!missionRewards[location.planet]) {
          missionRewards[location.planet] = {};
        }

        if (missionRewards[location.planet][location.location] && location.gameMode === 'Hard') {
          location.location += ' (Hard)';
        }

        if (missionRewards[location.planet][location.location] && location.planet === 'Void') {
          location.location += ' (Extra)';
        }

        if (!missionRewards[location.planet][location.location]) {
          missionRewards[location.planet][location.location] = {
            gameMode: location.gameMode,
            isEvent: location.isEvent,
            rewards: {
              A: [],
              B: [],
              C: [],
            },
          };
        }
      } else {
        tmp = parseRotation(text);

        if (tmp) {
          rotation = tmp;
        }
      }
    }

    if (elem.name === 'td' && elem.attribs.class === 'blank-row') {
      rotation = undefined;
    }

    if (elem.name === 'td' && elem.attribs.class !== 'blank-row') {
      const chanceElem = tr.children[1];
      const chance = parseChance($(chanceElem).text());

      const item = {
        _id: hash(text),
        itemName: text,
        rarity: chance.rarity,
        chance: Number(chance.chance),
      };

      if (!rotation) {
        if (!Array.isArray(missionRewards[location?.planet]?.[location?.location]?.rewards)) {
          missionRewards[location.planet][location.location].rewards = [];
        }

        missionRewards[location?.planet]?.[location?.location]?.rewards.push(item);
      } else {
        if (!missionRewards[location?.planet]?.[location?.location].rewards[rotation]) {
          missionRewards[location?.planet][location?.location].rewards[rotation] = [];
        }

        missionRewards[location?.planet]?.[location?.location]?.rewards[rotation].push(item);
      }
    }
  }

  return missionRewards;
};
