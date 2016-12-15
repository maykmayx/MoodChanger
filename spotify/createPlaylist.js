'use strict';
let ug = require('ug');

let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'acousticness', 'instrumentalness', 'valence'];

function createPlaylist(originTrack, destTrack, recommendations) {

	let playlist;
	let tracksGraph;
	// TODO create graph from recommendations
	// TODO call a* with graph and playlist(empty), a* will add tracks from graph to playlist

  // debugging purposes
  // playlist.forEach(x => {
  //   console.log(x.id, x.name, x.audio_features.valence);
  // });
  
	return playlist;
}

function buildGraph(originTrack, destTrack, recommendations) {
	let graph = new ug.Graph();
	
	let startNode = graph.createNode(originTrack.id, originTrack.body);
	let destTrack = graph.createNode(destTrack.id, originTrack.body);

	for (let i=0; i<recommendations.length; i++) {
		let trackNode = graph.createNode(recommendations[i].id, recommendations[i].body)
	}

	// create edges between nodes


}

function nodesDist(curTrack, destTrack) {
	let distSum = 0;
	for (let i = 0; i<AUDIO_FEATURES.length; i++) {
		let featureDist = Math.abs(curTrack.audio_features[i] - destTrack.audio_features[i]);
		distSum += featureDist;
	}
	return distSum;
};

// desired audio features:
// 	"danceability" : 0.735,
// 	"energy" : 0.578,
// 	"acousticness" : 0.514,
// 	"instrumentalness" : 0.0902,
// 	"valence" : 0.624,


module.exports = createPlaylist;