/* globals $, jsondiffpatch, md5 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: '/' });
}

function sortModName(a, b) {
  if (a.modName) {
    return a.modName.localeCompare(b.modName);
  }
  if (a._id) {
    return a._id.localeCompare(b._id);
  }
}

function sortEnemyName(a, b) {
  if (a.enemyName) {
    return a.enemyName.localeCompare(b.enemyName);
  }
  if (a._id) {
    return a._id.localeCompare(b._id);
  }
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function sortItemName(a, b) {
  if (a.itemName) {
    return a.itemName.localeCompare(b.itemName);
  }
  if (a._id) {
    return a._id.localeCompare(b._id);
  }
}

function sortBuild(build) {
  const newArray = {};

  for (const key of Object.keys(build)) {
    if (Array.isArray(build[key])) {
      // Sort the main items.
      newArray[key] = build[key].sort((a, b) => {
        if (a.blueprintName) {
          return a.blueprintName.localeCompare(b.blueprintName);
        }
        if (a.bountyLevel) {
          return a.bountyLevel.localeCompare(b.bountyLevel);
        }
        if (a.enemyName) {
          return a.enemyName.localeCompare(b.enemyName);
        }
        if (a.itemName) {
          return a.itemName.localeCompare(b.itemName);
        }
        if (a.keyName) {
          return a.keyName.localeCompare(b.keyName);
        }
        if (a.modName) {
          return a.modName.localeCompare(b.modName);
        }
        if (a.objectiveName) {
          return a.objectiveName.localeCompare(b.objectiveName);
        }
        if (a.relicName) {
          return a.relicName.localeCompare(b.relicName);
        }
        console.log('Unknown array', key);
        return JSON.stringify(a).localeCompare(JSON.stringify(b));
      });
    }

    for (const sub of Object.keys(build[key])) {
      // Sort the subitems.
      if (key === 'missionRewards') {
        newArray.missionRewards = build.missionRewards;
        for (const mission of Object.keys(build[key][sub])) {
          if (Array.isArray(build[key][sub][mission].rewards)) {
            newArray[key][sub][mission].rewards = build[key][sub][mission].rewards.sort(sortItemName);
          } else if (
            build[key][sub][mission].rewards &&
            Array.isArray(build[key][sub][mission].rewards.A) &&
            Array.isArray(build[key][sub][mission].rewards.B) &&
            Array.isArray(build[key][sub][mission].rewards.C)
          ) {
            newArray[key][sub][mission].rewards.A = build[key][sub][mission].rewards.A.sort(sortItemName);
            newArray[key][sub][mission].rewards.B = build[key][sub][mission].rewards.B.sort(sortItemName);
            newArray[key][sub][mission].rewards.C = build[key][sub][mission].rewards.C.sort(sortItemName);
          }
        }
      } else if (Array.isArray(build[key][sub].mods)) {
        newArray[key][sub].mods = build[key][sub].mods.sort(sortModName);
      } else if (Array.isArray(build[key][sub].enemies)) {
        newArray[key][sub].enemies = build[key][sub].enemies.sort(sortEnemyName);
      } else if (Array.isArray(build[key][sub].items)) {
        newArray[key][sub].items = build[key][sub].items.sort(sortItemName);
      } else if (Array.isArray(build[key][sub].rewards)) {
        newArray[key][sub].rewards = build[key][sub].rewards.sort(sortItemName);
      } else if (
        build[key][sub].rewards &&
        Array.isArray(build[key][sub].rewards.A) &&
        Array.isArray(build[key][sub].rewards.B) &&
        Array.isArray(build[key][sub].rewards.C)
      ) {
        newArray[key][sub].rewards.A = build[key][sub].rewards.A.sort(sortItemName);
        newArray[key][sub].rewards.B = build[key][sub].rewards.B.sort(sortItemName);
        newArray[key][sub].rewards.C = build[key][sub].rewards.C.sort(sortItemName);
      } else if (key === 'sortieRewards') {
        continue;
      } // Already sorted at line 336.
      else {
        console.log('Unknown object', key);
      }
    }
  }

  return newArray;
}

function renderDiff(old, current) {
  const delta = jsondiffpatch
    .create({
      objectHash(obj) {
        if (!obj._id) return md5(obj.blueprintName || obj.itemName || obj.modName || obj.enemyName);

        return obj._id;
      },
      arrays: {
        detectMove: false,
      },
      propertyFilter(name) {
        return name.slice(0, 1) !== '_';
      },
    })
    .diff(old, current);

  const html = jsondiffpatch.formatters.html.format(delta, old);

  if (html) {
    $('#visualdiff').html(jsondiffpatch.formatters.html.format(delta, old));

    $('.jsondiffpatch-added pre, .jsondiffpatch-deleted pre').each(function () {
      if ($(this).text().match(/^\[/) || $(this).text().match(/^\{/)) {
        $(this).parent().addClass('jsondiffpatch-value-toggleable');
        $(this).on('click', function () {
          if (!$(this).data('toggled')) {
            $(this).parent().addClass('jsondiffpatch-value-closed');
            $(this).data('toggled', true);
          } else {
            $(this).parent().removeClass('jsondiffpatch-value-closed');
            $(this).data('toggled', false);
          }
        });
      }
    });

    $(
      '.jsondiffpatch-child-node-type-array > .jsondiffpatch-property-name, .jsondiffpatch-child-node-type-object > .jsondiffpatch-property-name'
    ).each(function () {
      $(this).on('click', function () {
        if ($(this).siblings().first().is(':visible')) {
          $(this).parent().addClass('jsondiffpatch-child-node-closed');
          $(this).siblings().hide();
        } else {
          $(this).parent().removeClass('jsondiffpatch-child-node-closed');
          $(this).siblings().show();
        }
      });
    });
  } else {
    $('#message').show().text('There were no changes between the selected versions.');
  }

  $('#loading').hide();
}

function compareBuild(source, target) {
  const now = new Date().getTime();

  $.getJSON(`./data/builds/${source}.json?${now}`, function (sourceBuild) {
    $.getJSON(`./data/builds/${target}.json?${now}`, function (targetBuild) {
      renderDiff(sortBuild(sourceBuild), sortBuild(targetBuild));
    }).fail(function () {
      $('#message').show().text(`Could not load "${target}.json".`);
      $('#loading').hide();
    });
  }).fail(function () {
    $('#message').show().text(`Could not load "${source}.json".`);
    $('#loading').hide();
  });
}

// We have JS, yay! Show loading screen.
$('#no-script').hide();
$('#loading').css('display', 'flex');

$(document).ready(function () {
  const now = new Date().getTime();

  $.getJSON(`./data/builds/builds.json?${now}`, function (builds) {
    builds = builds.sort((a, b) => b.timestamp - a.timestamp);

    const currentHash = builds[0].hash;
    const previousHash = builds[1].hash;

    for (const build of builds) {
      const date = new Date(build.timestamp);
      const append = $('<option></option>').attr('value', build.hash).attr('data-timestamp', build.timestamp);

      if (build.hash === currentHash) {
        $('#builds-new').append(append.text(`${date.toLocaleString()} (current)`));
        $('#builds-new').val(build.hash);
      } else if (build.hash === previousHash) {
        $('#builds-old, #builds-new').append(append.text(`${date.toLocaleString()} (previous)`));
        $('#builds-old').val(build.hash);
      } else {
        $('#builds-old, #builds-new').append(append.text(date.toLocaleString()));
      }
    }

    $('#builds-old, #builds-new').prop('disabled', false);

    const query = window.location.hash.split('/');

    if (query && query.length > 3 && query[1] === 'compare') {
      if (
        $(`#builds-old option[value='${query[2]}']`).length > 0 &&
        $(`#builds-new option[value='${query[3]}']`).length > 0
      ) {
        $('#builds-old').val(query[2]);
        $('#builds-new').val(query[3]);

        compareBuild(query[2], query[3]);
      } else {
        $('#builds-old, #builds-new').val('');

        $('#message').show().text('The link you used is malformed. Please manually select versions.');
        $('#loading').hide();
      }
    } else {
      compareBuild(previousHash, currentHash);
    }
  });
});

$('#builds-old, #builds-new').on('change', function () {
  if (!$('#builds-old').find('option:selected').val() || !$('#builds-new').find('option:selected').val()) {
    return false;
  }

  const oldItemHash = $('#builds-old').find('option:selected').val();
  const newItemHash = $('#builds-new').find('option:selected').val();
  const oldItemTime = $('#builds-old').find('option:selected').attr('data-timestamp');
  const newItemTime = $('#builds-new').find('option:selected').attr('data-timestamp');

  if (oldItemTime < newItemTime) {
    window.location.hash = `/compare/${oldItemHash}/${newItemHash}`;

    $('#message').hide().text('');
    $('#loading').css('display', 'flex');
    $('#visualdiff').empty();

    compareBuild(oldItemHash, newItemHash);
  } else {
    $('#message').show().text('The previous version should be preceding the current version.');
    $('#visualdiff').empty();
  }
});
