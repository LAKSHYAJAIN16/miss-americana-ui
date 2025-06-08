import { serve } from 'https://deno.land/std@0.148.0/http/server.ts'

const port = 8080

const userAgents : string[] = [
  // ===== Desktop Browsers =====
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.80',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',

  // ===== Mobile Browsers =====
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/124.0.0.0 Mobile Safari/537.36',

  // ===== Bots / Crawlers =====
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)',
  'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',

  // ===== Command-line Tools =====
  'curl/8.1.0',
  'Wget/1.21.4 (linux-gnu)',
  'python-requests/2.31.0',
  'Go-http-client/2.0',

  // ===== Headless Browsers =====
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',

  // ===== Legacy Browsers =====
  'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OPR/109.0.0.0',
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)'
]

function copyHeader (headerName: string, to: Headers, from: Headers) {
  const hdrVal = from.get(headerName)
  if (hdrVal) {
    to.set(headerName, hdrVal)
  }
}

const handler = async (request: Request): Promise<Response> => {
  // If options send do CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new Response('', {
      status: 200,
      headers: new Headers({
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers':
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-goog-visitor-id, x-goog-api-key, x-origin, x-youtube-client-version, x-youtube-client-name, x-goog-api-format-version, x-user-agent, Accept-Language, Range, Referer',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
      })
    })
    return response
  }

  const url = new URL(request.url, 'http://localhost/')
  if (!url.searchParams.has('__host')) {
    return new Response(
      'Request is formatted incorrectly. Please include __host in the query string.',
      { status: 400 }
    )
  }

  // Set the URL host to the __host parameter
  url.host = url.searchParams.get('__host')!
  url.protocol = 'https'
  url.port = '443'
  url.searchParams.delete('__host')

  // Copy headers from the request to the new request
  const request_headers = new Headers(
    JSON.parse(url.searchParams.get('__headers') || '{}')
  )
  copyHeader('range', request_headers, request.headers)

  request_headers.set('user-agent', userAgents[Math.floor(Math.random() * userAgents.length)])
  if (!request_headers.has('user-agent'))
    copyHeader('user-agent', request_headers, request.headers)

  url.searchParams.delete('__headers')

  // Make the request to YouTube
  console.log(url.toString())
  console.log(request_headers)
  console.log(request.method)

  const fetchRes = await fetch(url, {
    method: request.method,
    headers: request_headers,
    body: request.body
  })

  // Construct the return headers
  const headers = new Headers()

  // Copy content headers
  copyHeader('content-length', headers, fetchRes.headers)
  copyHeader('content-type', headers, fetchRes.headers)
  copyHeader('content-disposition', headers, fetchRes.headers)
  copyHeader('accept-ranges', headers, fetchRes.headers)
  copyHeader('content-range', headers, fetchRes.headers)

  // Add cors headers
  headers.set(
    'Access-Control-Allow-Origin',
    request.headers.get('origin') || '*'
  )
  headers.set('Access-Control-Allow-Headers', '*')
  headers.set('Access-Control-Allow-Methods', '*')
  headers.set('Access-Control-Allow-Credentials', 'true')

  console.log(headers)
  console.log('-------------------------')
  // Return the proxied response
  return new Response(fetchRes.body, {
    status: fetchRes.status,
    headers: headers
  })
}

await serve(handler, { port })
