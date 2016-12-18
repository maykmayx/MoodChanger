'use strict';

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');

let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];

function createPlaylist(origin, dest) {
	
	let tracks = [origin.track, dest.track]
		.concat(origin.recommendations)
		.concat(dest.recommendations);

	// build a complete graph from tracks, s.t each edge ('trackA','trackB', {weight = d(a,b)})
	let tracksGraph = buildGraph(tracks);
	
	// call astar with TODO
	//let playlist = jsnx.astar_path(graph, 'weight', weight);

    // debugging purposes
	// playlist.forEach(x => {
	// 	console.log(x.id, x.name, x.audio_features.valence);
	// });
  
	return tracksGraph;
}

function astar() {

}

function buildGraph(tracks) {
	let graph = new jsnx.Graph();
	
	let nodes = tracks.map(track => {
		return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
	});

	// create nodes
	graph.addNodesFrom(nodes);

	let tracksDictionary = _.keyBy(tracks, 'id');

	//create edges between nodes
	let ids = _.keys(tracksDictionary);
	let edges = combos(ids, 2);
	
	// update edges with weight
	let weightedEdges = _.map(edges, edge => {
		let edgeTracks = edge.map(id => tracksDictionary[id]);
		let weight = calculateWeight(...edgeTracks);
		return [
			edge[0],
			edge[1],
			weight
		];
	});

	graph.addWeightedEdgesFrom(weightedEdges)

	console.log(graph)

	return graph;
}

function calculateWeight(curTrack, destTrack) {
	return AUDIO_FEATURES.reduce((distance, featureName) => {
		return distance += Math.abs(curTrack.audio_features[featureName] - destTrack.audio_features[featureName]);
	}, 0);
};

module.exports = createPlaylist;