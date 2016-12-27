'use strict';

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
      tracks.forEach(track => track.audio_features = audioFeatures[track.id]);
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

let expandPlaylist = (userId, playlistId, limit) => {
  return spotifyApi.getPlaylistTracks(userId, playlistId)
    .then(response => response.body.items.map(item => item.track)).then(addAudioFeatures)
    .then(tracks => {
      let mapRecommendations = track => {
        // console.log(track)
        let query = {
          seed_tracks: [track.id],
          limit: Number(limit) || DEFAULT_RECOMMENDATIONS_LIMIT
        };

        return spotifyApi.getRecommendations(query)
          .then(response => response.body.tracks)
          .then(addAudioFeatures)
          .then(recommendations => {
            return {
              track: track,
              recommendations: recommendations
            };
          });
      };

      return Promise.map(tracks, mapRecommendations)
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
        getPlaylistBySeeds: getPlaylistBySeeds,
        autocomplete: autocomplete,
        expandPlaylist: expandPlaylist
      })
    });

};