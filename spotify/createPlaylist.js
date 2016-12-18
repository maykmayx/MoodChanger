'use strict';

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');

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

	// call A* algorithm to return the path
	let path = astar(tracksGraph, origin, dest);
	console.log(path);
	// TODO turn path to playlist
	//let playlist = path; // TODO manipulate this.
	
	//return playlist;
}


function astar(tracksGraph, origin, dest) {

	let playlist = new Astar({
	    // function to look for a nodes exiting edges - take only the ones who are lower than factor
	    exitArcsForNodeId: (nodeId) => {
		    let exitEdges = tracksGraph.edges(nodeId, true);		    
		    return exitEdges.filter((edge) => {return tracksGraph.edge.get(edge[0]).get(edge[1]).weight < FACTOR})  
	    },
	    
	    // heuristic function: distance between node and the destination track
	    h: (nodeId) => {
	    	let curTrack = tracksGraph.node.get(nodeId);
	    	return calculateWeight(curTrack, dest.track);
	    }
	});

  
	return playlist.findPath(origin.track.id, dest.track.id)
	    .then(path => path.path).then(x => { console.log(x); return x 
	        // path is an object that looks like:
	        // path = {
	        //   cost: <fullCostOfPath>,
	        //   path: <arrayOfEdges>
	        // }
	    }).catch(function (reason) {
	        if (reason === "No path to goal") {
	            // This is pedestrian...
	        } else {
	            // This is not...
	        }
	    });
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