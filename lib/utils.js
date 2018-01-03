const crypto = require("crypto")

module.exports = {
    hash: function(str) {
        return crypto.createHash("md5").update(str, "utf8").digest("hex")
    },

    parseLocation: function(str) {
        if (str.indexOf('/') === -1) {
            return null;
        }

        const parts = str.split('/');
        const planet = parts[0].replace('Event:', '').trim();
        
        const locationAndModeParts = parts[1].split('(');
        const location = locationAndModeParts[locationAndModeParts.length - 2].trim() + (str.trim().endsWith('Extra') ? 'Extra' : '');

        const gameMode = locationAndModeParts[locationAndModeParts.length - 1].replace(')', '').trim();

        return {
            planet,
            location,
            gameMode,
            isEvent: str.indexOf('Event:') >= 0
        }
    },

    parseRotation: function(str) {
        const rotationRegex = /Rotation\s([A-D])/i

        let res = str.match(rotationRegex)

        if(!Array.isArray(res) || res.length != 2) return null

        return res[1]
    },

    parseChance: function(str) {
        const chanceRegex = /([A-z]*)\s\((.*)\%\)/i

        let res = str.match(chanceRegex)

        if(!Array.isArray(res) || res.length != 3) return null

        return {
            rarity: res[1],
            chance: res[2]
        }
    },

    parseRelic: function(str) {
        const relicRegex = /([A-z]*)\s([A-Z][0-9])\sRelic\s\(([A-z]*)\)/i

        let res = str.match(relicRegex)

        if(!Array.isArray(res) || res.length != 4) return null

        return {
            tier: res[1],
            relicName: res[2],
            state: res[3],
            rewards: []
        }
    }
}