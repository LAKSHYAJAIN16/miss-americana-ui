// src-tauri/sidecar/search.js
const ytSearch = require('yt-search');

const [,, ...args] = process.argv;
const query = args.join(' ');

ytSearch(query).then((result) => {
  const videos = result.videos.slice(0, 1).map(video => video.videoId);
  console.log(JSON.stringify(videos));
});
