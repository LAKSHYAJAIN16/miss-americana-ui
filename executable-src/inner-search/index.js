const { Innertube, UniversalCache } = require('youtubei.js')

async function main () {
  const [, , ...args] = process.argv
  const query = args.join(' ')
  const innertube = await Innertube.create({
    cache: new UniversalCache(
      // Enables persistent caching
      true,
      // Path to the cache directory. The directory will be created if it doesn't exist
      './.cache'
    )
  })
  const res = await innertube.search(query)
  const vid_url = res.results[0]['video_id']
    ? res.results[0]['video_id']
    : res.results[1]['video_id']
    ? res.results[1]['video_id']
    : res.results[2]['video_id']
    ? res.results[2]['video_id']
    : res.results[3]['video_id']
    ? res.results[3]['video_id']
    : res.results[4]['video_id']
  const urlA = await innertube.getStreamingData(vid_url)
  console.log(urlA.url ? urlA.url : 'None')
}

main()
