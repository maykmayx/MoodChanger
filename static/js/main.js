'use strict';

let TRACKS_CACHE = {};
let SORT_BY_PROPERTY = 'popularity';

let getSuggestions = _.memoize(q => {
  return fetch('/api/autocomplete?q=' + q)
    .then(response => response.json())
    .then(results => {
      let suggestions = _.sortBy(results, SORT_BY_PROPERTY).reverse();
      return { q: q, suggestions: suggestions };
    });
});

let retryIfNeeded = (result) => {
  let shouldRetry = result.suggestions.length === 0 && result.q.length >= 2 && !result.q.endsWith('*');
  return shouldRetry ? getSuggestions(result.q + '*') : result;
};

let isResultRelevant = (result, q) => {
  return result.q === q || result.q === q + '*';
};

Array.from(document.querySelectorAll('input.autocomplete')).forEach(input => {
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

  let showSuggestions = _.debounce(e => {
    let q = e.target.value.trim();
    getSuggestions(q)
      .then(retryIfNeeded)
      .then(result => {
        if (isResultRelevant(result, e.target.value.trim())) {
          awesomeplete.list = result.suggestions;
          awesomeplete.evaluate();
        }
      });
  }, 150);

  input.addEventListener('input', showSuggestions);

  input.addEventListener('awesomplete-selectcomplete', e => {
    let selectedTrack = TRACKS_CACHE[e.text.value];
    console.log(selectedTrack);
  });

});