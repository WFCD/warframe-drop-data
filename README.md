# warframe-drop-data

[![Supported by Warframe Community Developers](https://raw.githubusercontent.com/Warframe-Community-Developers/banner/master/banner.png)](https://github.com/WFCD "Supported by Warframe Community Developers")

Warframe drop data in an easier to parse format.

**NOTE**: This data is parsed from [Digital Extremes official drop data website](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html), no data mining was involved.

## Web UI & URL

![screenshot](misc/screenshot.jpg)

There is an experimental searchable web ui available at http://drops.warframestat.us

## "API Endpoints"

You can access the data via normal HTTP requests, which makes it usable like an API without really being one.

### /data/all.json

All data from the website in one single file.

### /data/info.json

Meta data, which contains a timestamp of the time I last build this and a hash of DEs website, which will change if they push a change!

### /data/missionRewards.json

All mission rewards, like what drops where and in which rotation. [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#missionRewards)

### /data/missionRewards/$PLANET_NAME/$PLACE.json

Drop data for a specific location. Example: ```/data/missionRewards/Eris/Xini.json```.

### /data/relics.json

All relics, what they contain, rarity etc. [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#relicRewards)

### /data/relics/$TIER/$RELIC_NAME.json

Data for a specific relic. Example: ```/data/relics/Axi/R1.json```.

### /data/transientRewards.json

Rewards not tied to a specific location, like "Nightmare Mode", "Fomorian Sabotage" or "Phorid Assassination". [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#transientRewards)

### /data/sortieRewards.json

Sortie rewards!, [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#sortieRewards)

### /data/modLocations.json

All mods and from which enemies they drop. [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#modLocations)

### /data/enemyModTables.json

Enemies and which mods they drop. [(Source)](https://n8k6e2y6.ssl.hwcdn.net/repos/hnfvc0o3jnfvc873njb03enrf56.html#enemyModTables)

### /data/enemyBlueprintTables.json

Add text

### /data/blueprintLocations.json

Add text

## Disclaimer

This list represents data and drops from the PC version of the Free-to-play game Warframe.
That's right - Warframe is free! Which means our drop system is designed to maintain a balance. Our free players can earn the game's content, and our paying players who support us (and keep the game running) usually get first dibs on the content by using Platinum (which can be traded to free players)!
As far as we can tell... we are the first developers to openly post something quite like this. Let's hope it works out for us and we set a trend.

This is automatically generated from our internal data but this data comes with no guarantees -- do not expect it to be comprehensive for how complex the game is.
This list will be maintained by an automated process which will be published with Updates (not all Hotfixes). We update often and new game systems may or may not be covered here.
This list can be discussed here. Know a free-to-play game that provides official drop rates in a different way? We'd love to know.

## License

MIT