

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');
let distance = require('euclidean-distance')
let COUNTER = 0;
let K = 5;

var MAX_VALENCE_DIST = 0;

//ORIGINAL ASTAR
function astar(startNodeId, endNodeId, tracksGraph) {
		let counter = 0;
		let k=7;
		var cameFrom = {};
		var fCosts = {};
		var gCosts = {};
		var open = {};
		var closed = {};
		var iteration = 1;

		console.log(startNodeId, endNodeId)

		open[startNodeId] = startNodeId;
		cameFrom[startNodeId] = false;
		gCosts[startNodeId] = 0;
		fCosts[startNodeId] = h(startNodeId, endNodeId, tracksGraph);
		while (true)
		{
			var bestId = null;

			// Select the best candidate from the open nodes.
			for (var nodeId in open)
			{
				if (bestId === null || fCosts[nodeId] < fCosts[bestId]) {
					bestId = nodeId;
				}
			}
			counter ++;
			if (bestId === null) {
				console.log("No path to goal");
				break;
			}

			// console.log("checking node " + bestId);

			if (endNodeId == bestId) {
				console.log("visited " + counter + " nodes");
				break;
			
				// We have a solution!
			}

			let edges = tracksGraph.edges(bestId, true);
			for (let edge of edges) {
				var toNodeId = edge[1];
				var cost = edge[2];

				if (!closed[toNodeId]) {
					var bestGCost = gCosts[bestId];
					var newGCost = bestGCost + cost;

					var gCostExists = gCosts.hasOwnProperty(toNodeId);
					if (!gCostExists || gCosts[toNodeId] > newGCost) {
							gCosts[toNodeId] = newGCost;
							fCosts[toNodeId] = newGCost + h(toNodeId, endNodeId, tracksGraph);
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

// MY ASTAR - found 4
// function astar(start, end, tracksGraph){
 
// 	let cameFrom = {};
// 	let fCosts = {};
// 	let gCosts = {};
// 	let open = {};
// 	let closed = {};
// 	let iteration = 1;

// 	open[start] = start;
// 	cameFrom[start] = false;
// 	gCosts[start] = 0;
// 	fCosts[start] = h(start, end, tracksGraph);
// 	//inits:
// 	while (!(_.isEmpty(open))) {
// 		let current = null;
// 		for (let node in open) {
// 			//if ((node !== undefined) && (current === null || fCosts[node] < fCosts[current])) {
// 			if ((node !== undefined) && (current === null || fCosts[node] < fCosts[current])) {
// 				current = node;
// 			}
// 		}
		
// 		if (current === null) {
// 			throw "no path to goal"
// 		}
		
// 		if (current === end) {
// 			return recPath(cameFrom, current);
// 		}	


// 		delete open[current];
// 		closed[current] = true;

// 		let edges = tracksGraph.edges(current, true);
// 		for (let edge of edges) {

// 			let neighbor = edge[1];
// 			let cost = edge[2];

// 			if (!!closed[neighbor]) {
// 				continue;
// 			}

// 			let newGcost = gCosts[current] + cost;
// 			open[neighbor] = neighbor;
			
// 			let gCostExists = gCosts.hasOwnProperty(neighbor);
// 			if (gCostExists && newGcost >= gCosts[neighbor]) {
// 				continue;
// 			}
// 			cameFrom[neighbor] = current;
// 			gCosts[neighbor] = newGcost;
// 			fCosts[neighbor] = h(neighbor, end, tracksGraph);
// 		}
// 		iteration++
// 	}
// 	return "no path";
// }

function recPath(cameFrom, current) {
	let path = [];
	path.push(current);
	while (!!cameFrom[current]) {
		current = cameFrom[current];
		path.push(current);
	}
	return path.reverse();
}

function alth(nodeId, destId, tracksGraph) {
	
	let curTrack = tracksGraph.node.get(nodeId);
	let destTrack = tracksGraph.node.get(destId);

	let dist = Math.abs(curTrack.valence - destTrack.valence);
	if (dist > MAX_VALENCE_DIST) {
		dist = 10;
	}
	return dist;
}

function h(nodeId, destId, tracksGraph) {
	// let curTrack = tracksGraph.node.get(nodeId);
	// let destTrack = tracksGraph.node.get(destId);

	// let v1 = _.values(curTrack);
	// let v2 = _.values(destTrack);
	// let dist = Math.pow(distance(v1, v2),2);
	// return dist; 
	return 0;
}

// PACKAGE
// function astar(tracksGraph, originId, destId) {

// 	let playlist = new Astar({
// 	    // function to look for a nodes exiting edges - take only the ones who are lower than factor
// 	    exitArcsForNodeId: (nodeId) => {
// 		    let exitEdges = tracksGraph.edges(nodeId, true);
// 		    let filtered = exitEdges.filter((edge) => { return edge[2] < FACTOR });
// 		    return filtered.map(edge => {
// 		    	return { 
// 			    	to: edge[0],
// 			    	from: edge[1],
// 			    	cost: edge[2]
// 		    	}
// 		    })  
// 	    },
	    
// 	    // heuristic function: distance between node and the destination track
// 	    h: (nodeId) => {
// 	    	let curTrack = tracksGraph.node.get(nodeId);
// 	    	let destTrack = tracksGraph.node.get(destId)
// 	    	return calculateWeight({ audio_features: curTrack }, { audio_features: destTrack });
// 	    }
// 	});
  
// 	return playlist.findPath(originId, destId);

// }

//WHAT
// function astar(start, end, tracksGraph){
// 	let cameFrom = {};
// 	let fCosts = {};
// 	let gCosts = {};
// 	let open = {};
// 	let closed = {};
// 	let iteration = 1;

// 	open[start] = start;
// 	cameFrom[start] = false;
// 	gCosts[start] = 0;
// 	fCosts[start] = h(start, end, tracksGraph);

// 	while (!(_.isEmpty(open))) {
// 		let current = null;
// 		for (let node in open) {
// 			//if ((node !== undefined) && (current === null || fCosts[node] < fCosts[current])) {
// 			if ((node !== undefined) && (current === null || gCosts[node] < gCosts[current])) {
// 				current = node;
// 			}
// 		}
		
// 		if (current === null) {
// 			throw "no path to goal"
// 		}
		
// 		if (current === end) {
// 			return recPath(cameFrom, current);
// 		}	


// 		delete open[current];
// 		closed[current] = true;

// 		let edges = tracksGraph.edges(current, true);
// 		for (let edge of edges) {

// 			let neighbor = edge[1];
// 			let cost = edge[2];

// 			if (!!closed[neighbor]) {
// 				continue;
// 			}

// 			let newGcost = cost;  // HERE only look at the next s	
// 			let gCostExists = gCosts.hasOwnProperty(neighbor);
// 			if (gCostExists && newGcost >= gCosts[neighbor]) {
// 				continue;
// 			}

// 			cameFrom[neighbor] = current;
// 			gCosts[neighbor] = newGcost;
// 			fCosts[neighbor] = h(neighbor, end, tracksGraph);
// 		}
// 		iteration++
// 	}
// 	return "no path";
// }




module.exports = astar;