'use strict';

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');

let FACTOR = 0.6;
let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];

function createPlaylist(origin, dest) {
	
	// re organize tracks for the correct structure
	let tracks = [origin.track, dest.track]
		.concat(origin.recommendations)
		.concat(dest.recommendations);
	
	// // Build Graph
	console.time('buildGraph');
	//let tracksGraph = buildGraph(tracks);
	let tracksGraph = alternateGraph(tracks);
	console.timeEnd('buildGraph');
	console.log(tracksGraph.nodes().length)
	console.log(tracksGraph.edges().length)

	let curTrack = tracksGraph.node.get(origin.track.id);
	console.log(curTrack.valence)


	//call A* algorithm to return the path
	let path = alternateAstar(origin.track.id, dest.track.id, tracksGraph);
	// console.time('A*');
	// return Promise.method(astar)(tracksGraph, origin.track.id, dest.track.id)
	// 	.then(path => path.path)
	// 	.finally(() => console.timeEnd('A*'));

	console.log(path)
	return path;
	// return path;
	// TODO if no path -> enlarge factor and run again
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

function alternateGraph(tracks) {
	let graph = new jsnx.Graph();

	let nodes = tracks.map(track => {
		return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
	});

	// create nodes
	graph.addNodesFrom(nodes);

	let tracksDictionary = _.keyBy(tracks, 'id');
	let ids = _.keys(tracksDictionary);

	let weightedEdges = [];

	for (let i=0; i < ids.length; i++) {
		let nodeId = ids[i];
		for (let j=i+1; j < ids.length-i; j++) {
			let neighborId = ids[j];
			let weight = calculateWeight(tracksDictionary[nodeId], tracksDictionary[neighborId]);
			if (weight < FACTOR) {
				weightedEdges.push([nodeId, neighborId, weight]);
			}
		}
	}
	graph.addWeightedEdgesFrom(weightedEdges);
	return graph;
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
	//return Math.abs(curTrack.audio_features['valence']-destTrack.audio_features['valence']);

	return AUDIO_FEATURES.reduce((distance, featureName) => {
		return distance += Math.abs(curTrack.audio_features[featureName] - destTrack.audio_features[featureName]);
	}, 0);
};

module.exports = createPlaylist;


// Optimizing options:
// 		optimize factor
// 		normalize audio features
// 		write custome lookup function for astar

function alternateAstar(start, end, tracksGraph){
 
	let cameFrom = {};
	let fCosts = {};
	let gCosts = {};
	let open = {};
	let closed = {};
	let iteration = 1;

	open[start] = start;
	cameFrom[start] = false;
	gCosts[start] = 0;
	fCosts[start] = alth(start, end, tracksGraph);
	//inits:
	while (!(_.isEmpty(open))) {
		let current = null;
		for (let node in open) {
			if ((node !== undefined) && (current === null || fCosts[node] < fCosts[current])) {
				current = node;
			}
		}
		
		if (current === null) {
			throw "no path to goal"
		}
		
		if (current === end) {
			return recPath(cameFrom, current);
		}	


		delete open[current];
		closed[current] = true;

		let edges = tracksGraph.edges(current, true);
		for (let edge of edges) {

			let neighbor = edge[1];
			let cost = edge[2];

			if (!!closed[neighbor]) {
				continue;
			}

			let newGcost = gCosts[current] + cost;
			open[neighbor] = neighbor;
			
			let gCostExists = gCosts.hasOwnProperty(neighbor);
			if (gCostExists && newGcost >= gCosts[neighbor]) {
				continue;
			}
			cameFrom[neighbor] = current;
			gCosts[neighbor] = newGcost;
			fCosts[neighbor] = gCosts[neighbor] + alth(neighbor, end, tracksGraph);
		}
		iteration++
	}
	return "no path";
}

function recPath(cameFrom, current) {
	let path = [];
	path.push(current);
	while (!!cameFrom[current]) {
		current = cameFrom[current];
		path.push(current);
	}
	return path;
}

function alth(nodeId, destId, tracksGraph) {
	
	let curTrack = tracksGraph.node.get(nodeId);
	let destTrack = tracksGraph.node.get(destId);

	let dist = Math.abs(curTrack.valence-destTrack.valence);
	console.log(dist)
	return dist;
}
