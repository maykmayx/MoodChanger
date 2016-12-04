'use strict';

let express = require('express');
let serveStatic = require('serve-static');
let config = require('./config');
let app = express();

app.listen(config.port, () => {
  app.use(serveStatic(config.baseDir));
  console.log('up and running');
});