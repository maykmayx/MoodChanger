'use strict';

let TRACKS_CACHE = {};
let SORT_BY_PROPERTY = 'popularity';

let getSuggestions = _.memoize(q => {
  return fetch('/api/autocomplete?q=' + q)
    .then(response => response.json())
    .then(results => {
      return { q: q, suggestions: results };
    });
});

let retryIfNeeded = (result) => {
  let shouldRetry = result.suggestions.length === 0 && result.q.length >= 2 && !result.q.endsWith('*');
  return shouldRetry ? getSuggestions(result.q + '*') : result;
};

let selectedTracks = {
  origin: null,
  dest: null
};

let createPlaylist = (origin, dest) => {
  return fetch('/api/playlist/' + origin + '/' + dest)
    .then(response => response.json()); 
};

let selectTrack = (id, trackId) => {
  selectedTracks[id] = TRACKS_CACHE[trackId];
  if (selectedTracks.origin && selectedTracks.dest) {
    createPlaylist(selectedTracks.origin.id, selectedTracks.dest.id).then(playlist => {
      console.log(playlist);
    });
  }
};

document.querySelectorAll('input.autocomplete').forEach(input => {
  let awesomeplete = new Awesomplete(input, {
    maxItems: 20,
    replace: function(item) {
      this.input.value = TRACKS_CACHE[item.value].name;
    },
    sort: function(a, b) {
      return TRACKS_CACHE[b.value][SORT_BY_PROPERTY] - TRACKS_CACHE[a.value][SORT_BY_PROPERTY]
    },
    data: function(item, input) {
      let artistName = _.map(item.artists, 'name').join(', ');
      let label = item.name + ' – ' + artistName
      TRACKS_CACHE[item.id] = item;
      return { label: label, value: item.id };
    }
  });

  let getData = (q) => getSuggestions(q).then(retryIfNeeded).then(result => result.suggestions);
  
  awesomeplete.async(getData, {
    debounce: 150,
    isRevelant: (current, original) => {
      return current === original || current === original + '*'; 
    }
  });

  input.addEventListener('awesomplete-selectcomplete', e => {
    selectTrack(input.id, e.text.value);
  });


});