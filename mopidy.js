const fetch = require("node-fetch")
const MOPIDY_URL = "http://127.0.0.1:6680"

const mopidyCommand = {
  jsonrpc: "2.0",
  id: 1,
  params: {}
};

const execMopidy = body =>
  fetch(`${MOPIDY_URL}/mopidy/rpc`, {
    method: "post",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
    .then(r => r.json())
//    .then(json => console.log(json) || json)
    .catch(console.log);

const playStream = async url => {
  console.log("mopidy: playStream", url);
  const addedTrack = await execMopidy({
    ...mopidyCommand,
    method: "core.tracklist.add",
    params: {
      uris: [url]
    }
  });
  if (addedTrack) {
    return execMopidy({
      ...mopidyCommand,
      method: "core.playback.play",
      params: {
        tlid: addedTrack.result[0].tlid
      }
    });
  } else {
    console.log(`mopidy: : cannot load ${url}`);
  }
};

module.exports = {
  playStream
}