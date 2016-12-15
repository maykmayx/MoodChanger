'use strict';

let SpotifyWebApi = require('spotify-web-api-node');
let createPlaylist = require('./createPlaylist');
let Promise = require('bluebird');
let _ = require('lodash');

let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];


let spotifyApi = new SpotifyWebApi();

let getRecommendationByTrack = (track, seedTrackId) => {
  let query = {
    seed_tracks: [seedTrackId]
  };

  // set target audio features
  AUDIO_FEATURES.forEach(attr => query['target_' + attr] = track[attr]);

  let mapTrackIds = (response) => {
    let tracks = response.body.tracks;
    let trackIds = tracks.map(track => track.id);
    return spotifyApi.getAudioFeaturesForTracks(trackIds)
      .then(response => _.keyBy(response.body.audio_features, 'id'))
      .then(audioFeatures => {
        // add audio features to tracks
        tracks.forEach(track => track.audio_features = audioFeatures[track.id]);
        return tracks;
      });
  };

  return spotifyApi.getRecommendations(query).then(mapTrackIds);
};

let getRecommendationsForTracks = (originTrack, destTrack) => {
  return Promise.all([
    getRecommendationByTrack(originTrack, destTrack.id),
    getRecommendationByTrack(destTrack, originTrack.id)
  ]);
};

let getPlaylistBySeeds = (originId, destId) => {
  return spotifyApi.getAudioFeaturesForTracks([originId, destId])
    .then(response => getRecommendationsForTracks(...response.body.audio_features))
    // @TODO add origin and dest tracks to recommendations arrays
    .then(recommendations => createPlaylist(...recommendations));
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
        getPlaylistBySeeds: getPlaylistBySeeds
      })
    });

};