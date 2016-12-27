'use strict';

(function() {
  if (typeof Awesomplete !== 'function') throw new Error('Awesomplete not loaded');

  let defaultIsRelevant = (current, original) => current === original;

  Awesomplete.prototype.async = function(getData, options) {
    options = Object(options);
    options.debounce = Number(options.debounce) || 150;
    options.isRevelant = typeof options.isRevelant === 'function' ? options.isRevelant : defaultIsRelevant; 

    let input = this.input;
    let oninput = _.debounce(e => {
      let q = input.value.trim();
      getData(q).then(results => {
        if (options.isRevelant(input.value.trim(), q)) {
          this.list = results;
          this.evaluate();
        }
      });
    }, options.debounce);

    input.addEventListener('input', oninput);
  };

}());