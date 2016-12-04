'use strict';

let SpotifyWebApi = require('spotify-web-api-node');
let Promise = require('bluebird');
let createPlaylist = require('./createPlaylist');
var argv = require('minimist')(process.argv.slice(2));
let _ = require('lodash');

let AUDIO_ATTRIBUTES = ['acousticness','danceability', 'energy', 'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo', 'valence']

// credentials are optional
let spotifyApi = new SpotifyWebApi({
  clientId : argv.id || argv._[0],
  clientSecret : argv.secret || argv._[1]
});

let getToken = spotifyApi.clientCredentialsGrant()
  .then(response => response.body.access_token)

let getRecommendationByTrack = (track, seedTrackId) => {
  let query = {
    seed_tracks: [seedTrackId]
  };

  AUDIO_ATTRIBUTES.forEach(attr => query['target_' + attr] = track[attr]);

  // https://developer.spotify.com/web-api/get-recommendations/
  let mapTrackIds = (response) => {
    let tracks = response.body.tracks.slice(0, 1);
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

getToken.then(token => spotifyApi.setAccessToken(token))
  .then(() => {
    // Bruno Mars - When I Was Your Man => Bruno Mars - 24K Magic
    return getPlaylistBySeeds('0nJW01T7XtvILxQgC5J7Wh','6b8Be6ljOzmkOmFslEb23P');
  })
  .then(playlist => console.log(playlist.map(track => track.id)))
  .catch(response => console.error(response));