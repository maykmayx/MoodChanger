'use strict';

let jsnx = require('jsnetworkx');
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');
let distance = require('euclidean-distance');
let createPlaylist = require('./createPlaylist');


// tracksercommendations: {track, {recommendations}}
// destAudioFeatures { af: destnum }
let getRecommendationsForTracks = (originTrack, destTrack) => {
  K = 5;
  let afRanges = expandAFranges(getAudioFeatureRanges(originTrack, destTrack));
  for (var i = 0, i<K, i++) {
  	let slicedRange = sliceAFranges(afRanges, i);
  	getRecommendationsByRange(originTrack, slicedRange);
  }

  return Promise.all([
    getRecommendationByTrack(originTrack, destTrack.id),
    getRecommendationByTrack(destTrack, originTrack.id)
  ]).then(recommendations => {
    console.timeEnd('getRecommendationsForTracks');
    return {
      origin: {
        track: originTrack,
        recommendations: recommendations[0]
      },
      dest: {
        track: destTrack,
        recommendations: recommendations[1]
      }
    }
  });
};


function getRecommendationsByRange(start, rangeAF) {
	let query = {
		seed_tracks: start.id,
	};
	for (var af in rangeAF) {
		query['min_' + af] = afRanges[af][0];
		query['max_' + af] = afRanges[af][1];
	}
	return spotifyApi.getRecommendations(query).then(addAudioFeatures);
}

function createCluster(trackRecommendations, destAudioFeatures) {

	let track = trackRecommendations.track;
	let recommendations = trackRecommendations.recommendations;
	
	let tracks = track.concat(recommendations);
	let graph = buildGraph(tracks);

	let goalFunc(nodeId) {
		let curNode = tracksGraph.node.get(nodeId);
		let audioFeatures = _.values(curNode);
		if (distance(audioFeatures, destAudioFeatures) < 0.1) {
			return true;
		} else {
			return false;
		}
	}
	return path = specialAstar(track.id, tracksGraph, goalFunc);
}

function specialAstar(startNodeId, tracksGraph, goalFunc) {
		let counter = 0;
		var cameFrom = {};
		var fCosts = {};
		var gCosts = {};
		var open = {};
		var closed = {};
		var iteration = 1;

		//MAX_VALENCE_DIST = alth(startNodeId, endNodeId, tracksGraph);

		open[startNodeId] = startNodeId;
		cameFrom[startNodeId] = false;
		gCosts[startNodeId] = 0;
		fCosts[startNodeId] = h(startNodeId, endNodeId, tracksGraph);
		final = []

		while (true)
		{
			var bestId = null;

			// Select the best candidate from the open nodes.
			for (var nodeId in open)
			{
				if (bestId === null || fCosts[nodeId] < fCosts[bestId] || bestId === undefined) {
					bestId = nodeId;
				}
			}

			if (bestId === null) {
				console.log('hi')
				fCosts[bestId] += 100;
				bestId = cameFrom[bestId];

				//throw "No path to goal";
			}
			console.log("checking node " + bestId);
			final.push(bestId);
			counter++;
			if (goalFunc(bestId)) {
				console.log("counter: "+counter)
				console.log("final: " +final)
				break;
			
				// We have a solution!
			}

			let edges = tracksGraph.edges(bestId, true);
			console.log(edges.length);
			for (let edge of edges) {
				var toNodeId = edge[1];
				var cost = edge[2];

				if (!closed[toNodeId]) {
					var bestGCost = gCosts[bestId];
					var newGCost = bestGCost + cost;

					var gCostExists = gCosts.hasOwnProperty(toNodeId);
					if (!gCostExists || gCosts[toNodeId] > newGCost) {
							gCosts[toNodeId] = newGCost;
							fCosts[toNodeId] = h(toNodeId, endNodeId, tracksGraph);
							cameFrom[toNodeId] = bestId;
						
					}

					open[toNodeId] = toNodeId;
				}
			};

			closed[bestId] = true;
			delete open[bestId];

			iteration++;
		}

		return recPath(cameFrom, bestId);

	}

function h(nodeId, destId, tracksGraph) {
	let curTrack = tracksGraph.node.get(nodeId);
	let destTrack = tracksGraph.node.get(destId);

	let v1 = _.values(curTrack);
	let v2 = _.values(destTrack);

	let dist = distance(v1, v2);
		if (dist > 1) {
		dist = 10;
	}
	return dist;
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

f
function sliceAFranges(afRanges, i){
	for (var af in afRanges) {
		afRanges[af] = afRanges[af].slice(i,i+2);
	}
	return afRanges;
}
