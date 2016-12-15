'use strict';

let express = require('express');
let serveStatic = require('serve-static');
var argv = require('minimist')(process.argv.slice(2));
let spotify = require('./spotify');
let config = require('./config');
let app = express();

spotify(argv.id, argv.secret).then(api => {

  app.get('/api/playlist/:originTrack/:destTrack', (req, res, next) => {
    api.getPlaylistBySeeds(req.params.originTrack, req.params.destTrack)
      .then(playlist => playlist.map(track => track.id))
      .then(res.json.bind(res)).catch(next);
  });

  // error handling
  let isProduction = app.get('env') === 'production';
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || err.error,
      err: isProduction ? '' : err.stack
    });
  });

  app.listen(config.port, () => {
    app.use(serveStatic(config.baseDir));
    console.log('up and running! :)');
  });

}).catch(console.error.bind(console));

