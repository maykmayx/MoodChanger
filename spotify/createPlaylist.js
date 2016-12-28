'use strict';

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');
let astar = require('./astar.js');
let distance = require('euclidean-distance')


let AUDIO_FEATURES = ['danceability', 'energy', 'acousticness', 'instrumentalness', 'valence'];

// Globals
var FACTOR = 0.13;
var K = 10;

function createPlaylist(origin, dest) {
	
	// bring tracksGraph from cache
	
	return path = astar(origin, dest, tracksGraph);
}

  // tracks are an array of { seed_tracks: [ TRACKS ], recommendations: [ TRACKS ] }
function buildStaticGraph(tracks){
	console.log("in")
	let graph = new jsnx.Graph();
	let seeds = _.flatten(tracks.map(track=>track.seed_tracks));
	let nodes = seeds.map(track=> [track.id, _.pick(track.audio_features, AUDIO_FEATURES)])
	// let nodes = _.flatten(tracks.map(track=>tracks.seed_tracks)).map(track=> {
	// 	return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
	// });

	// // let nodes = tracks.map(track => {
	// // 	return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
	// // });
	//console.log(nodes)
	graph.addNodesFrom(nodes);
	
	let ids = nodes.map(node=>node[0]);
	
	// for (let chunk of tracks) {
	//  	for (let recommendation of chunk.recommendations){
	//  		let isNode = _.find(ids, function(id) { return id === recommendation.id; });
	//  		if (isNode !== undefined) {
	// 			for (let seedTrack in chunk.seed_tracks) {
	//  	 			graph.addEdge(seedTrack.id, recommendation.id);
	// 		 	}
	//  		}
	// 	}
	//}
	let weightedEdges = []
	for (let i=0; i < ids.length; i++) {
		let nodeId = ids[i];
		for (let j=i+1; j < ids.length-i; j++) {
			let neighborId = ids[j];
			let weight = calculateWeight(nodes[i][1], nodes[j][1]);
			if (weight < 0.13) {
			weightedEdges.push([nodeId, neighborId, weight]);
			}
		}
	}
	graph.addWeightedEdgesFrom(weightedEdges);
	console.log("nodes: " + graph.nodes().length);
	console.log("edges: " + graph.edges().length);	
	return graph;
}

/** createPlaylist for dynamic version **/

// function createPlaylist(origin, dest) {

// 	// re organize tracks for the correct structure
// 	let tracks = [origin.track, dest.track]
// 		.concat(origin.recommendations)
// 		.concat(dest.recommendations);
// 	console.log(tracks);
// 	let nodes = tracks.map(track => {
// 		return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
// 	});
// 	let weight = calculateWeight(nodes[0][1], nodes[1][1]);
// 	console.log("s->e w: " +weight)
// 	// var afRanges = getAudioFeatureRanges(origin.track, dest.track);
// 	// afRanges = expandAFranges(afRanges);
// 	// //console.log(afRanges);
// 	// //let sliced = afRanges.forEach(af=>afRanges[af].slice(0,1));
// 	// let sliced = sliceAFranges(afRanges, 0);
// 	// console.log(sliced);
// 	let tracksGraph = build1000graph(origin, dest);

// 	// //Build Graph
// 	// console.time('buildGraph');	
// 	// let tracksGraph = buildWeightedGraph(tracks);
// 	// console.timeEnd('buildGraph');
	
// 	// console.log("nodes: " + tracksGraph.nodes().length)
// 	// console.log("edges: " + tracksGraph.edges().length)

// 	// //call A* algorithm to return the path
// 	// console.time('A*');
// 	// let path = astar(origin.track.id, dest.track.id, tracksGraph);
// 	// console.timeEnd('A*');
	
// 	// console.log(path)
// 	// // for (let id of path) {
// 	// 	console.log(tracksGraph.node.get(id))
// 	// }

// 	// TODO if no path -> enlarge factor and run again	
// 	// return path;
// }

// function analyzeValence(start, end) {
// 	VALENCE_DIFF = end.audio_features['valence']-start.audio_features['valence']
// 	if (VALENCE_DIFF < 0) {
// 		GROWTH = false;
// 	}
// }

// 	for (var node in nodes) {
// 		// get node recommendations
// 		// go through a node's recs, if one of them is already in the graph add an edge
// 		let recommendations = tracks[node[0]];
// 		for (var recommendation in recommendations) {
// 			var isNode = nodes.hasOwnProperty(recommendation.id);
// 			if (isNode) {
// 				let weight = calculateWeight(nodes[node][1], nodes[j][1]);
// 				if (weight < FACTOR) {
// 					weightedEdges.push([nodeId, neighborId, weight]);
// 				}
// 		}
// 	}
// 	return graph;
// }

// function buildWeightedGraph(tracks) {
// 	let graph = new jsnx.Graph();

// 	let nodes = tracks.map(track => {
// 		return [track.id, _.pick(track.audio_features, AUDIO_FEATURES)]
// 	});

// 	// create nodes
// 	graph.addNodesFrom(nodes);

// 	//let tracksDictionary = _.keyBy(tracks, 'id');
// 	//let ids = _.keys(tracksDictionary);

// 	let ids = nodes.map(node=>node[0]);
// 	let weightedEdges = [];

// 	for (let i=0; i < ids.length; i++) {
// 		let nodeId = ids[i];
// 		for (let j=i+1; j < ids.length-i; j++) {
// 			let neighborId = ids[j];
// 			let weight = calculateWeight(nodes[i][1], nodes[j][1]);
// 			if (weight < FACTOR) {
// 				weightedEdges.push([nodeId, neighborId, weight]);
// 			}
// 		}
// 	}
// 	graph.addWeightedEdgesFrom(weightedEdges);
// 	return graph;
// }


function calculateWeight(track1, track2) {
	// option 1: calculate vector distance (norm) distance([audio_features],[audio_features])
	let v1 = _.values(track1);
	let v2 = _.values(track2);
	return Math.pow(distance(v1, v2),2);

	// option 2: abs dist between valence audio features
	// return Math.abs(curTrack.audio_features['valence']-destTrack.audio_features['valence']);

	// option 3: abd dist between the sum of all audio features
	// return AUDIO_FEATURES.reduce((distance, featureName) => {
	// 	return distance += Math.abs(curTrack.audio_features[featureName] - destTrack.audio_features[featureName]);
	// }, 0);
};


function buildCompleteGraph(tracks) {
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


function getAudioFeatureRanges(originTrack, destTrack){
  var afRanges = {};
  AUDIO_FEATURES.forEach(af =>afRanges[af] = [originTrack.audio_features[af], destTrack.audio_features[af]]);
  return afRanges;
}

function expandAFranges(afRanges){
	for (var af in afRanges) {
		var diff = afRanges[af][1] - afRanges[af][0];
		var segment = diff / K;
		var temp = afRanges[af][1];
		afRanges[af].pop();
		for (var i=1;i<K-1; i++) {
			afRanges[af].push(afRanges[af][i-1]+segment);
		}
		afRanges[af].push(temp);
	}
	return afRanges;
}

function sliceAFranges(afRanges, i){
	for (var af in afRanges) {
		afRanges[af] = afRanges[af].slice(i,i+2);
	}
	return afRanges;
}

module.exports = buildStaticGraph;
