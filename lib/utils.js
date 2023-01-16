'use strict';

const crypto = require('crypto');

module.exports = {
  hash(str) {
    return crypto.createHash('md5').update(str, 'utf8').digest('hex');
  },

  checkUniqueHash(items, source, properties) {
    for (const item of items) {
      // This will save some time...
      if (item._id === source._id) {
        const itemHash = [];
        const sourceHash = [];

        // Add one to the properties length to add an additional static check.
        for (let i = 0; i < (properties.length + 1); i++) {
          if (item._id === source._id) {
            if (i < properties.length) {
              // We don't really care about whether the value is defined or not, here.
              if (Array.isArray(source[properties[i]]) && Array.isArray(item[properties[i]])) {
                sourceHash.push(source[properties[i]].length);
                itemHash.push(item[properties[i]].length);
              } else {
                sourceHash.push(source[properties[i]]);
                itemHash.push(item[properties[i]]);
              }

              item._id = module.exports.hash(itemHash.join(' '));
              source._id = module.exports.hash(sourceHash.join(' '));
            } else {
              // Last chance; hash the entire object and check one last time.
              item._id = module.exports.hash(JSON.stringify(item));
              source._id = module.exports.hash(JSON.stringify(source));

              if (item._id === source._id) {
                // Discard all changes and don't add the object.
                item._id = module.exports.hash(item[properties[0]]);
                return false;
              }
            }
          }
        }
      }
    }

    // Good to go at this point.
    return true;
  },

  formatSiteData(data) {
    const newData = [];

    // mission rewards
    // planets
    for (const planetName of Object.keys(data.missionRewards)) {
      // locations
      for (let locationName of Object.keys(data.missionRewards[planetName])) {
        const location = data.missionRewards[planetName][locationName];

        locationName = locationName.replace(' (Extra)', '').replace(' (Caches)', '');
        if (Array.isArray(location.rewards)) {
          const placeName = `${planetName}/${locationName} (<b>${location.gameMode}</b>)`;

          for (const reward of location.rewards) {
            newData.push({
              place: placeName,
              item: reward.itemName,
              rarity: reward.rarity,
              chance: reward.chance,
            });
          }
        } else {
          for (const rotationName of Object.keys(location.rewards)) {
            const placeName = `${planetName}/${locationName} (<b>${location.gameMode}</b>), Rotation ${rotationName}`;
            for (const reward of location.rewards[rotationName]) {
              newData.push({
                place: placeName,
                item: reward.itemName,
                rarity: reward.rarity,
                chance: reward.chance,
              });
            }
          }
        }
      }
    }

    // key rewards
    for (const item of data.keyRewards) {
      if (Array.isArray(item.rewards)) {
        const placeName = item.keyName;

        for (const reward of item.rewards) {
          newData.push({
            place: placeName,
            item: reward.itemName,
            rarity: reward.rarity,
            chance: reward.chance,
          });
        }
      } else {
        for (const rotationName of Object.keys(item.rewards)) {
          const placeName = `${item.keyName}, Rotation ${rotationName}`;

          for (const reward of item.rewards[rotationName]) {
            newData.push({
              place: placeName,
              item: reward.itemName,
              rarity: reward.rarity,
              chance: reward.chance,
            });
          }
        }
      }
    }

    // blueprint locations
    for (const item of data.blueprintLocations) {
      for (const enemy of item.enemies) {
        newData.push({
          place: enemy.enemyName,
          item: item.itemName,
          rarity: enemy.rarity,
          chance: (((enemy.enemyItemDropChance / 100) * (enemy.chance / 100)) * 100).toFixed(2),
        });
      }
    }

    // mod locations
    for (const mod of data.modLocations) {
      for (const enemy of mod.enemies) {
        newData.push({
          place: enemy.enemyName,
          item: mod.modName,
          rarity: enemy.rarity,
          chance: (((enemy.enemyModDropChance / 100) * (enemy.chance / 100)) * 100).toFixed(2),
        });
      }
    }

    // relics
    for (const relic of data.relics) {
      for (const item of relic.rewards) {
        newData.push({
          place: `${relic.tier} ${relic.relicName} Relic (${relic.state})`,
          item: item.itemName,
          rarity: item.rarity,
          chance: item.chance,
        });
      }
    }

    // sortie rewards
    for (const sortie of data.sortieRewards) {
      newData.push({
        place: 'Sorties',
        item: sortie.itemName,
        rarity: sortie.rarity,
        chance: sortie.chance,
      });
    }

    // transient rewards
    for (const objective of data.transientRewards) {
      for (const reward of objective.rewards) {
        let rotation = '';

        if (reward.rotation) {
          rotation = `, Rotation ${reward.rotation}`;
        }

        newData.push({
          place: `${objective.objectiveName}${rotation}`,
          item: reward.itemName,
          rarity: reward.rarity,
          chance: reward.chance,
        });
      }
    }

    const bountyKeys = [{
      key: 'cetusBountyRewards',
      place: 'Earth/Cetus',
    },
    {
      key: 'solarisBountyRewards',
      place: 'Venus/Orb Vallis',
    },
    {
      key: 'deimosRewards',
      place: 'Deimos/Cambion Drift',
    },
    {
      key: 'zarimanRewards',
      place: 'Zariman Ten Zero',
    },
    ];

    const stageReg = /(\d) of (\d)/i;
    bountyKeys.forEach((bountyConfig) => {
      for (const bountyLevel of data[bountyConfig.key]) {
        const levelRange = bountyLevel.bountyLevel;

        for (const rewardTier of Object.keys(bountyLevel.rewards)) {
          for (const reward of bountyLevel.rewards[rewardTier]) {
            const stages = (reward.stage.match(stageReg) || []);
            newData.push({
              place: `${bountyConfig.place} (<b>${levelRange}</b>), Rotation ${rewardTier}`,
              item: reward.itemName,
              rarity: reward.rarity,
              chance: reward.chance,
              stage: stages[1],
              maxStage: stages[2],
            });
          }
        }
      }
    });

    // Add syndicate data
    Object.keys(data.syndicates).forEach((syndicate) => {
      const syndicateData = data.syndicates[syndicate];
      syndicateData.forEach((syndicateItem) => {
        newData.push({
          ...syndicateItem,
          place: [syndicate, syndicateItem.place].filter(Boolean).join(' / '),
        });
      });
    });

    // misc enemy drops
    /* for (let enemy of data.miscItems) {
        for (let item of enemy.items) {
            newData.push({
                place: enemy.enemyName,
                item: item.itemName,
                rarity: item.rarity,
                chance: (((enemy.enemyItemDropChance / 100) * (item.chance / 100)) * 100).toFixed(2)
            })
        }
    } */

    const dropsByAvatarKeys = ['sigilByAvatar', 'additionalItemByAvatar', 'resourceByAvatar'];

    dropsByAvatarKeys.forEach((key) => {
      data[key].forEach((avatar) => {
        avatar.items.forEach((item) => {
          newData.push({
            place: avatar.source,
            item: item.item,
            rarity: item.rarity,
            chance: item.chance,
          });
        });
      });
    });

    // Manually clean up the rewards list.
    newData.forEach((reward) => {
      reward.place = reward.place
        .replace('Relic (Intact)', 'Relic')
        .replace('Derelict/', '')
        .replace('Assassinate (<b>Assassination</b>)', 'Assassinate')
        .replace('Defense (<b>Defense</b>)', 'Defense')
        .replace('Survival (<b>Survival</b>)', 'Survival')
        .replace('Gantulyst (Special)', 'Gantulyst (Capture)')
        .replace('Hydrolyst (Special)', 'Hydrolyst (Capture)')
        .replace('Teralyst (Special)', 'Teralyst (Capture)')
        .replace('The Jordas Verdict C', 'Jordas Verdict')
        .replace('The Law Of Retribution (Nightmare) C', 'Law Of Retribution (Nightmare)')
        .replace('The Law Of Retribution C', 'Law Of Retribution')
        .replace('Lunaro Arena', 'Lunaro')
        .replace('Sanctuary/Elite Sanctuary Onslaught (<b>Sanctuary Onslaught</b>)', 'Elite Sanctuary Onslaught')
        .replace('Sanctuary/Sanctuary Onslaught (<b>Sanctuary Onslaught</b>)', 'Sanctuary Onslaught')
        .replace(' (Extra)', '');
    });

    return newData;
  },

  parseLocation(str) {
    if (str.indexOf('/') === -1) {
      return null;
    }

    const parts = str.split('/');
    const planet = parts[0].replace('Event:', '').trim();
    const locationCleaned = parts[1].replace('(Variant)', '').replace(/Extra$/, '').trim();

    const locationAndModeParts = locationCleaned.split('(');

    // This works in all cases where the length of locationAndModeParts is 2.
    let location = locationAndModeParts[0].trim();

    if (locationAndModeParts.length === 3) {
      // Handles cases like "The Index: Endurance (High Risk)".
      location = `${locationAndModeParts[0].trim()} (${locationAndModeParts[1].trim()}`;
    }

    const gameMode = locationAndModeParts[locationAndModeParts.length - 1].replace(')', '').trim();

    // Handles strings having "(Variant)".
    if (str.trim().indexOf('(Variant)') !== -1) {
      location = `Variant ${location}`;
    }

    // Handles strings ending with "Extra".
    if (str.trim().endsWith('Extra')) {
      location = `${location} (Extra)`;
    }

    if (str.trim().endsWith('(Caches)')) {
      location = `${location} (Caches)`;
    }

    return {
      planet,
      location,
      gameMode,
      isEvent: str.indexOf('Event:') >= 0,
    };
  },

  parseRotation(str) {
    const rotationRegex = /Rotation\s([A-D])/i;

    const res = str.match(rotationRegex);

    if (!Array.isArray(res) || res.length !== 2) return null;

    return res[1];
  },

  parseChance(str) {
    const chanceRegex = /([A-z]*)\s\((.*)\%\)/i;

    const res = str.match(chanceRegex);

    if (!Array.isArray(res) || res.length !== 3) return null;

    return {
      rarity: res[1],
      chance: res[2],
    };
  },

  parseRelic(str) {
    const relicRegex = /([A-z]*)\s(?:([A-Z][0-9]+)|([IVXLCDM]*))\s?Relic\s\(([A-z]*)\)/i;

    const res = str.match(relicRegex);

    if (!Array.isArray(res) || res.length !== 5) return null;
    const rn = res[2] || res[3] || undefined;

    return {
      tier: res[1],
      relicName: rn ? rn.toUpperCase() : rn,
      state: res[4],
      rewards: [],
    };
  },
};
