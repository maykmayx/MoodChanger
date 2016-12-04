'use strict';

function createPlaylist(a, b) {
  let playlist = a.concat(b);

  // debugging purposes
  playlist.forEach(x => {
    console.log(x.id, x.name, x.audio_features.valence);
  });
  
  return playlist;
}

module.exports = createPlaylist;