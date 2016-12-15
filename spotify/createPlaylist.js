'use strict';
let jsnx = require('jsnetworkx');
let comb = require("combinations-generator")

let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'acousticness', 'instrumentalness', 'valence'];

function createPlaylist(originTrack, destTrack, recommendations) {
	
	// build a complete graph from tracks, s.t each edge ('trackA','trackB', {weight = d(a,b)})
	let tracksGraph = buildGraph(recommendations);
	
	// call astar with TODO
	//let playlist = jsnx.astar_path(graph, 'weight', weight);

    // debugging purposes
	// playlist.forEach(x => {
	// 	console.log(x.id, x.name, x.audio_features.valence);
	// });
  
	return playlist;
}

function astar() {

}

function buildGraph(tracks) {
	var graph = jsnx.completeGraph(tracks.length);
	
	// create nodes
	graph.add_nodes_from(tracks);

	//create edges between nodes	
	let edges = comb(tracks, 2);
	graph.add_edges_from(edges)
	
	// update edges with weight
	for (let edge of edges){
		w = nodesDist(edges[i][0], edges[i][1])
		jsnx.set_edge_attributes(graph, 'weight', weight);
	}
	return graph;
}

function nodesDist(curTrack, destTrack) {
	let distSum = 0;
	for (let i = 0; i<AUDIO_FEATURES.length; i++) {
		let featureDist = Math.abs(curTrack.audio_features[i] - destTrack.audio_features[i]);
		distSum += featureDist;
	}
	return distSum;
};


module.exports = createPlaylist;