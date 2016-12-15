let response = {
  "audio_features" : [ {
    "danceability" : 0.612,
    "energy" : 0.280,
    "key" : 0,
    "loudness" : -8.648,
    "mode" : 1,
    "speechiness" : 0.0434,
    "acousticness" : 0.932,
    "instrumentalness" : 0,
    "liveness" : 0.0880,
    "valence" : 0.400,
    "tempo" : 72.795,
    "type" : "audio_features",
    "id" : "0nJW01T7XtvILxQgC5J7Wh",
    "uri" : "spotify:track:0nJW01T7XtvILxQgC5J7Wh",
    "track_href" : "https://api.spotify.com/v1/tracks/0nJW01T7XtvILxQgC5J7Wh",
    "analysis_url" : "https://api.spotify.com/v1/audio-analysis/0nJW01T7XtvILxQgC5J7Wh",
    "duration_ms" : 213827,
    "time_signature" : 4
  }, {
    "danceability" : 0.818,
    "energy" : 0.803,
    "key" : 1,
    "loudness" : -4.282,
    "mode" : 1,
    "speechiness" : 0.0797,
    "acousticness" : 0.0340,
    "instrumentalness" : 0,
    "liveness" : 0.153,
    "valence" : 0.618,
    "tempo" : 106.970,
    "type" : "audio_features",
    "id" : "6b8Be6ljOzmkOmFslEb23P",
    "uri" : "spotify:track:6b8Be6ljOzmkOmFslEb23P",
    "track_href" : "https://api.spotify.com/v1/tracks/6b8Be6ljOzmkOmFslEb23P",
    "analysis_url" : "https://api.spotify.com/v1/audio-analysis/6b8Be6ljOzmkOmFslEb23P",
    "duration_ms" : 225983,
    "time_signature" : 4
  } ]
};

function createPlaylist(originSong, destSong) {
	let playlist = []

	// query spotify with dest as target
	// query spotify with origin as target
	let originList = [];
	let destList =[];

	// create graph from the songs, with edges connecting

	return playlist;
}

function heuristic(curSong, destSong) {
	// get curSongs neighbors
	// for each feature - chose the closest neighbor
	// choose the neighbor that wins by the most

//     "danceability" : 0.612,
//     "energy" : 0.280,
//     "key" : 0,
//     "loudness" : -8.648,
//     "mode" : 1,
//     "speechiness" : 0.0434,
//     "acousticness" : 0.932,
//     "instrumentalness" : 0,
//     "liveness" : 0.0880,
//     "valence" : 0.400,
//     "tempo" : 72.795,
}

let playlist = createPlaylist(response.audio_features[0], response.audio_features[1]);
console.log(playlist)