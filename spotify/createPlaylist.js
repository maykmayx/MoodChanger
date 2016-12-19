'use strict';

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');

let FACTOR = 1;
let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];

function createPlaylist(origin, dest) {
	
	// re organize tracks for the correct structure
	let tracks = [origin.track, dest.track]
		.concat(origin.recommendations)
		.concat(dest.recommendations);
	
	// Build Graph
	console.time('buildGraph');
	let tracksGraph = buildGraph(tracks);
	console.timeEnd('buildGraph');

	//call A* algorithm to return the path
	console.time('A*');
	return Promise.method(astar)(tracksGraph, origin.track.id, dest.track.id)
		.then(path => path.path)
		.finally(() => console.timeEnd('A*'));
}


function astar(tracksGraph, originId, destId) {

	let playlist = new Astar({
	    // function to look for a nodes exiting edges - take only the ones who are lower than factor
	    exitArcsForNodeId: (nodeId) => {
		    
		    let exitEdges = tracksGraph.edges(nodeId, true);
		    let filtered = exitEdges.filter((edge) => { return edge[2] < FACTOR });
		    return filtered.map(edge => {
		    	return { 
			    	to: edge[0],
			    	from: edge[1],
			    	cost: edge[2]
		    	}
		    })  
	    },
	    
	    // heuristic function: distance between node and the destination track
	    h: (nodeId) => {
	    	let curTrack = tracksGraph.node.get(nodeId);
	    	let destTrack = tracksGraph.node.get(destId)
	    	return calculateWeight({ audio_features: curTrack }, { audio_features: destTrack });
	    }
	});
  
	return playlist.findPath(originId, destId);

}


function buildGraph(tracks) {
	let graph = new jsnx.Graph();
	
	let nodes = tracks.map(track => {
		return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
	});

	// create nodes
	graph.addNodesFrom(nodes);

	// struct weighted edges as [node1id, node2id, { weight: distance }]
	let tracksDictionary = _.keyBy(tracks, 'id');
	let ids = _.keys(tracksDictionary);
	let edges = combos(ids, 2);
	let weightedEdges = _.map(edges, edge => {
		let edgeTracks = edge.map(id => tracksDictionary[id]);
		let weight = calculateWeight(...edgeTracks);
		return [
			edge[0],
			edge[1],
			weight
		];
	});
	
	// add edges to graph
	graph.addWeightedEdgesFrom(weightedEdges);
	return graph;
}

function calculateWeight(curTrack, destTrack) {
	return AUDIO_FEATURES.reduce((distance, featureName) => {
		return distance += Math.abs(curTrack.audio_features[featureName] - destTrack.audio_features[featureName]);
	}, 0);
};

module.exports = createPlaylist;


// Optimizing options:
// 		optimize factor
// 		normalize audio features
// 		write custome lookup function for astar