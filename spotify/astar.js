

let jsnx = require('jsnetworkx');
let combos = require('array-combos').default;
let _ = require('lodash');
let Astar = require('a-star-for-async-data');
let Promise = require('bluebird');


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
// 	fCosts[start] = alth(start, end, tracksGraph);
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
// 			fCosts[neighbor] = alth(neighbor, end, tracksGraph);
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
	return path;
}

function alth(nodeId, destId, tracksGraph) {
	
	let curTrack = tracksGraph.node.get(nodeId);
	let destTrack = tracksGraph.node.get(destId);

	let dist = curTrack.valence - destTrack.valence;
	return dist;
}

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

function astar(start, end, tracksGraph){
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

	while (!(_.isEmpty(open))) {
		let current = null;
		for (let node in open) {
			//if ((node !== undefined) && (current === null || fCosts[node] < fCosts[current])) {
			if ((node !== undefined) && (current === null || gCosts[node] < gCosts[current])) {
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

			let newGcost = cost;  // HERE only look at the next step
			open[neighbor] = neighbor;
			
			// let gCostExists = gCosts.hasOwnProperty(neighbor);
			// if (gCostExists && newGcost >= gCosts[neighbor]) {
			// 	continue;
			// }

			cameFrom[neighbor] = current;
			gCosts[neighbor] = newGcost;
			fCosts[neighbor] = alth(neighbor, end, tracksGraph);
		}
		iteration++
	}
	return "no path";
}


module.exports = astar;