'use strict';

let express = require('express');
let serveStatic = require('serve-static');
var argv = require('minimist')(process.argv.slice(2));
let spotify = require('./spotify');
let config = require('./config');
var jsonfile = require('jsonfile')
let Fuse = require('fuse.js');
let Promise = require('bluebird');
let _ = require('lodash');
let app = express();

spotify(argv.id, argv.secret).then(api => {

  // '1269437965', '2iBH9S3UXlrtUBxjffgZEh',
  // 'spotify', '4hOKQuZbraPDIfaGbM3lKI'

  // get expanded playlist from cache
  let expandPlaylist = (userId, playlistId, limit) => {
    let filename = [userId, playlistId, limit].join('_') + '.json';
    var file = __dirname + '/tmp/' + filename;

    return Promise.promisify(jsonfile.readFile)(file).catch(err => {
      console.log(err.toString(), 'creating', filename);
      return api.expandPlaylist(userId, playlistId, limit).then(results => {
        return Promise.promisify(jsonfile.writeFile)(file, results, { spaces: 2 })
          .then(() => results);
      });
    });
  };

  // preload a playlist into memory
  // results are an array of { seed_tracks: [ TRACK IDS ], recommendations: [ TRACKS ] }
  expandPlaylist('spotify', '4hOKQuZbraPDIfaGbM3lKI', 1000).then(results => {

    // flatten tracks
    let tracks = _.flatten(results.map(result => result.recommendations));

    // @TODO: build the graph here (now just gives 20 random tracks)
    // should be something like spotify.buildGraph(results)
    let createPlaylist = (origin, dest) => {
      let randomIds = _.sampleSize(tracks, 20).map(track => track.id);
      let playlist = [];

      playlist.push(origin, ...randomIds, dest);

      return playlist;
    };

    // lookup path by origin and destination tracks
    app.get('/api/playlist/:originTrack/:destTrack', (req, res, next) => {
      // api.createPlaylist(req.params.originTrack, req.params.destTrack)
      let playlist = createPlaylist(req.params.originTrack, req.params.destTrack);
      Promise.resolve(playlist).then(res.json.bind(res)).catch(next);
    });

    // fuzzy search for autocomplete
    let fuse = new Fuse(tracks, {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        'name',
        'artists.name',
        'album.name'
      ]
    });

    app.get('/api/autocomplete', (req, res, next) => {
      let matches = fuse.search(String(req.query.q).trim())
      Promise.resolve(matches).then(res.json.bind(res)).catch(next);
      // api.autocomplete(q).then(res.json.bind(res)).catch(next);
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
    

  });


}).catch(console.error.bind(console));

