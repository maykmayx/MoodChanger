'use strict';

let log = require('single-line-log').stdout;
let SpotifyWebApi = require('spotify-web-api-node');
let createPlaylist = require('./createPlaylist');
let Promise = require('bluebird');
let _ = require('lodash');

let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];
let DEFAULT_RECOMMENDATIONS_LIMIT = 100;
let MIN_POPULARITY = 60;
let MAX_LIVENESS = 0.8;

let spotifyApi = new SpotifyWebApi();

let addAudioFeatures = (tracks) => {

  let trackIds = tracks.map(track => track.id);
  return spotifyApi.getAudioFeaturesForTracks(trackIds)
    .then(response => _.keyBy(response.body.audio_features, 'id'))
    .then(audioFeatures => {
      // add audio features to tracks
      tracks.forEach(track => {
        track.audio_features = audioFeatures[track.id];
      });
      return tracks;
    });
};

let getRecommendationByTrack = (track, seedTrackId, limit) => {
  let query = {
    seed_tracks: [seedTrackId],
    limit: Number(limit) || DEFAULT_RECOMMENDATIONS_LIMIT
  };

  // set target audio features
  AUDIO_FEATURES.forEach(attr => query['target_' + attr] = track.audio_features[attr]);
  // TODO add minimum popularity > 50 and liveness < 0.8
  query['min_popularity'] = MIN_POPULARITY;
  query['max_liveness'] = MAX_LIVENESS;
  return spotifyApi.getRecommendations(query)
    .then(response => response.body.tracks)
    .then(addAudioFeatures);
};

let getRecommendationsForTracks = (originTrack, destTrack) => {
  console.time('getRecommendationsForTracks');
  return Promise.all([
    getRecommendationByTrack(originTrack, destTrack.id),
    getRecommendationByTrack(destTrack, originTrack.id)
  ]).then(recommendations => {
    console.timeEnd('getRecommendationsForTracks');
    return {
      origin: {
        track: originTrack,
        recommendations: recommendations[0]
      },
      dest: {
        track: destTrack,
        recommendations: recommendations[1]
      }
    }
  });
};

let getPlaylistBySeeds = (originId, destId) => {
  return spotifyApi.getTracks([originId, destId])
    .then(response => response.body.tracks).then(addAudioFeatures)
    .then(tracks => getRecommendationsForTracks(...tracks))
    .then(result => createPlaylist(result.origin, result.dest));
};

let autocomplete = (query, limit) => {
  if (!query) return Promise.resolve([]);
  return spotifyApi.searchTracks(query, { limit: Number(limit) || 20 })
    .then(response => response.body.tracks.items);
};

let getPlaylistTracks = (userId, playlistId, offset) => {
  offset = Number(offset) || 0;

  return spotifyApi.getPlaylistTracks(userId, playlistId, { offset: offset })
    .then(response => {
      let tracks = response.body.items.map(item => item.track);
      log('Fetching playlist:', (response.body.offset + tracks.length / response.body.total * 100).toFixed(1) + '%');
      if (!response.body.next) return addAudioFeatures(tracks);
      return getPlaylistTracks(userId, playlistId, offset + response.body.limit)
        .then(moreTracks => tracks.concat(moreTracks));
    })
};

let expandPlaylist = (userId, playlistId, limit) => {
  console.time('expanding top 100 playlist');
  return getPlaylistTracks(userId, playlistId)
    .then(tracks => {
      console.log();

      let totalChunks = Math.ceil((limit - tracks.length) / DEFAULT_RECOMMENDATIONS_LIMIT);
      let chunks = _.chunk(tracks, 5).slice(0, totalChunks)

      let i = 0;
      return Promise.mapSeries(chunks, seedTracks => {
        let seedTracksIds = seedTracks.map(track => track.id)
        let query = {
          seed_tracks: seedTracksIds,
          limit: DEFAULT_RECOMMENDATIONS_LIMIT,
          min_popularity: MIN_POPULARITY,
          max_liveness: MAX_LIVENESS
        };

        return spotifyApi.getRecommendations(query)
          .then(response => response.body.tracks)
          .then(addAudioFeatures)
          .then(recommendations => {
            log('Fetching recommendations', (++i / totalChunks * 100).toFixed(1) + '%')
            return {
              seed_tracks: seedTracksIds,
              recommendations: recommendations
            };
          })
      }).then(results => {
        results = _.flatten(results);
        return [{
          seed_tracks: [],
          recommendations: tracks
        }].concat(results);
      });
    });
};

module.exports = function initialize(clientId, clientSecret) {

  spotifyApi.setCredentials({
    clientId : clientId,
    clientSecret : clientSecret
  });

  return spotifyApi.clientCredentialsGrant()
    .then(response => spotifyApi.setAccessToken(response.body.access_token))
    .then(() => {
      return _.extend(spotifyApi, {
        createPlaylist: createPlaylist,
        getPlaylistBySeeds: getPlaylistBySeeds,
        autocomplete: autocomplete,
        expandPlaylist: expandPlaylist
      })
    });

};