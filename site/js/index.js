/* globals $ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: '/' });
}

$('#no-script').hide();
$('#loading').css('display', 'flex');

String.prototype.contains = function (substr) {
  return this.toLowerCase().includes(substr.toLowerCase());
};
String.prototype.isJSON = function () {
  try {
    JSON.parse(this);
  } catch (e) {
    return false;
  }
  return true;
};

const CURR_SCRIPT_VERSION = 17;
const INFO_DEFAULT = '{"hash":"clem"}';
const searchablePlace = place => place.replace(/<\/?b>/ig, '');

function updateData(fromVersion) {
  const oldTheme = localStorage.getItem('_theme');
  if (fromVersion < CURR_SCRIPT_VERSION) {
    localStorage.clear();
  }

  window._script_version = CURR_SCRIPT_VERSION;
  localStorage.setItem('_script_version', CURR_SCRIPT_VERSION);
  if (oldTheme) localStorage.setItem('_theme', oldTheme);
}

function validateData() {
  // validate _wfinfo
  const oldDataRaw = localStorage.getItem('_wfinfo') || INFO_DEFAULT;
  if (!oldDataRaw.isJSON() || !JSON.parse(oldDataRaw).timestamp) {
    localStorage.setItem('_wfinfo', INFO_DEFAULT);
  }

  // validate _wfdata
  if (!localStorage.getItem('_wfdata') || !localStorage.getItem('_wfdata').isJSON()) {
    localStorage.removeItem('_wfdata');
    console.info('cleared _wfdata');
  }
}

function fill(data, sort, reverse, amount) {
  $('#tablebody').empty();
  $('#tablehead').empty();

  if (data.length === 0) {
    $('#tablebody').append("<tr><td class='msg' colspan='3'>Nothing found that matches your search query.</td></tr>");
    return;
  }

  data = data.sort((a, b) => {
    if (sort === 'item') {
      return a.item.localeCompare(b.item) || b.chance - a.chance || a.place.localeCompare(b.place);
    } if (sort === 'place') {
      return a.place.localeCompare(b.place) || b.chance - a.chance || a.item.localeCompare(b.item);
    }
    return b.chance - a.chance || a.place.localeCompare(b.place) || a.item.localeCompare(b.item);
  });

  if (reverse) { data.reverse(); }

  const itemIcon = sort === 'item'
    ? `<i class="fa fa-sort-alpha-${reverse ? 'desc' : 'asc'}" aria-hidden="true"></i>`
    : '';
  const placeIcon = sort === 'place'
    ? `<i class="fa fa-sort-alpha-${reverse ? 'desc' : 'asc'}" aria-hidden="true"></i>`
    : '';
  const rarityIcon = sort === 'rarity'
    ? `<i class="fa fa-sort-amount-${reverse ? 'asc' : 'desc'}" aria-hidden="true"></i>`
    : '';

  $('#tablehead').append(`<tr>
        <th id="item">Item Name (${data.length}) ${itemIcon}</th>
        <th id="place">Drops ${placeIcon}</th>
        <th id="rarity">Rarity ${rarityIcon}</th>
    </tr>`);

  if (!Number.isNaN(amount) && data.length > amount) {
    data.slice(0, amount).forEach((obj) => {
      $('#tablebody').append(`<tr>
                <td>${obj.item}</td>
                <td>${obj.place}</td>
                <td>${obj.rarity} (<b>${obj.chance}%</b>)</td>
            </tr>`);
    });
    $('#tablebody').append(
      `<tr>
        <td class="msg" colspan="3">
            <strong>${data.length - amount}</strong> more results found. Refine your query to see more relevant results.
        </td>
      </tr>`,
    );
  } else {
    data.forEach((obj) => {
      $('#tablebody').append(`<tr>
              <td>${obj.item}</td>
              <td>${obj.place}</td>
              <td>${obj.rarity} (<b>${obj.chance}%</b>)</td>
          </tr>`);
    });
  }

  $('th').on('click', function () {
    if (this.id) {
      fill(data, this.id, sort === this.id ? !reverse : false, amount);
    }
  });
}

function search(searchValue) {
  if (searchValue.length < 2) {
    window.location.hash = '';

    $('#tablehead').empty();
    $('#tablebody').empty();
    $('#tablebody').append(`<tr>
      <td class='msg' colspan='3'>You have to type in at least 2 characters to search.</td>
    </tr>`);
    return;
  }

  const match = $('#match-search').val();
  const type = $('#search-type').val();
  const amount = $('#display-amount').val();
  let items;

  window.location.hash = `/search/${encodeURIComponent(searchValue)}/${type}/${match}`;

  const lowerSearchValue = searchValue.toLowerCase();
  const regex = match === 'regex' ? new RegExp(searchValue, 'i') : null;
  function matchPredicate(value) {
    const lowerValue = value.toLowerCase();

    switch (match) {
      case 'exact':
        return lowerValue === lowerSearchValue;
      case 'regex':
        return lowerValue.match(regex);
      default:
        return lowerValue.includes(lowerSearchValue);
    }
  }

  if (type === 'items') {
    items = window._data.filter(entry => matchPredicate(entry.item));
  } else if (type === 'locations') {
    items = window._data.filter(entry => matchPredicate(searchablePlace(entry.place)));
  } else if (type === 'both') {
    items = window._data.filter(entry => matchPredicate(entry.item) || matchPredicate(searchablePlace(entry.place)));
  } else {
    items = window._data.filter(entry => matchPredicate(entry.item));
  }

  fill(items, 'rarity', false, amount);
}

function onDataRetrieved(data) {
  window._data = data;

  const info = JSON.parse(localStorage.getItem('_wfinfo'));
  const date = new Date(info.modified);

  $('#last-update').text(date.toLocaleString());

  const query = window.location.hash.split('/');

  if (query && query.length > 2 && query[1] === 'search') {
    $('#search-field').val(decodeURIComponent(query[2]));

    if (query.length > 4 && query[4].match(/(default|exact|regex)/)) {
      $('#match-search').val(query[4]);
    } else {
      $('#match-search').val('default');
    }

    if (query.length > 3 && query[3].match(/(items|locations|both)/)) {
      $('#search-type').val(decodeURIComponent(query[3]));
    } else {
      $('#search-type').val(decodeURIComponent('items'));
    }
  }

  const searchFieldValue = $('#search-field').val();

  if (searchFieldValue) {
    search(searchFieldValue);
  }

  $('#loading').remove();
}

async function init(time) {
  validateData();

  const data = await fetch(`./data/info.json?${time}`).then(response => response.json());
  const { hash } = data;
  console.log('./data/info.json', data);
  if (hash !== JSON.parse(localStorage.getItem('_wfinfo')).hash || !localStorage.getItem('_wfdata')) {
    console.log('new hash found or missing local data, re-download data');
    localStorage.setItem('_wfinfo', JSON.stringify(data));
    const all = await fetch(`./data/all.slim.json?${time}`).then(response => response.text());
    if (all && all.isJSON()) {
      localStorage.setItem('_wfdata', all);
      onDataRetrieved(JSON.parse(all));
    }
  } else {
    onDataRetrieved(JSON.parse(localStorage.getItem('_wfdata')));
  }
}

function load() {
  const time = new Date().getTime();

  window._script_version = Number(localStorage.getItem('_script_version') || -1);

  updateData(window._script_version);
  init(time);
}

$(document).ready(load);
$('#search-field').on('keyup', function () {
  search($(this).val().trim().replace(/\s\s+/g, ' '));
});
$('#search-type, #display-amount, #match-search, #show-all').on('change', () => {
  search($('#search-field').val().trim().replace(/\s\s+/g, ' '));
});
