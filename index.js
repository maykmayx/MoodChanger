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
let buildStaticGraph = require('./spotify/createPlaylist.js');
let astar = require('./spotify/astar.js');

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
  expandPlaylist('1269437965', '2iBH9S3UXlrtUBxjffgZEh', 10000).then(results => {

    // flatten tracks
    let tracks = _.flatten(results.map(result => result.recommendations));
    let logLabel = 'Build graph from ' + tracks.length + ' tracks';
    
    // pre-build graph from results
    console.time(logLabel);
    let graph = buildStaticGraph(results);
    console.timeEnd(logLabel);
    // let playlist = astar('55EelrA8250jCznurTC1Jb', '3Ev29Sj0ca0TD11oE8N0Bc', graph);
    // console.log(playlist)

    // lookup path by origin and destination tracks
    app.get('/api/playlist/:originTrack/:destTrack', (req, res, next) => {
      // api.createPlaylist(req.params.originTrack, req.params.destTrack)
      // let userId = '22gochlrm25jto43irdazuyqy';
      // let playlistName = req.params.originTrack + ' to ' + req.params.destTrack;

      console.time('Creating playlist');
      let playlist = astar(req.params.originTrack, req.params.destTrack, graph);
      console.log(playlist)
      console.timeEnd('Creating playlist');

      Promise.resolve(playlist).then(res.json.bind(res)).catch(next);

      // api.createPlaylist(userId, playlistName).then(response => {
      //   let playlistId = response.body.playlist.id;
      //   return api.addTracksToPlaylist(playlistId, playlist).then(() => playlistId);
      // }).then(res.json.bind(res)).catch(next);
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

