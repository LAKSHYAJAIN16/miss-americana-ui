'use server'
import { prominent } from 'color.js'

export async function fetchBackend (input, init) {
  const url =
    typeof input === 'string'
      ? new URL(input)
      : input instanceof URL
      ? input
      : new URL(input.url)

  // Transform the URL for use with the proxy
  url.searchParams.set('__host', url.host)
  url.host = 'localhost:8080'
  url.protocol = 'http'

  // Handle headers
  let headers
  if (init && init.headers) {
    headers = new Headers(init.headers)
  } else if (input instanceof Request) {
    headers = new Headers(input.headers)
  } else {
    headers = new Headers()
  }

  // Serialize headers
  url.searchParams.set('__headers', JSON.stringify([...headers]))

  // Delete user-agent header (not allowed in browser)
  headers.delete('user-agent')

  // Copy request if input is a Request
  const request = new Request(url, input instanceof Request ? input : undefined)

  // Perform the fetch with updated URL and headers
  return fetch(
    request,
    init
      ? {
          ...init,
          headers
        }
      : {
          headers
        }
  )
}

export async function getImageColor (imgElement) {
  function rgbToHex ([r, g, b]) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
  }
  const out = await prominent(imgElement)
  console.log(out)
  return [rgbToHex(out[0]), rgbToHex(out[1]), rgbToHex(out[2])]
}

const tailwindColors = {
  'red-500': '#ef4444',
  'red-700': '#b91c1c',
  'yellow-500': '#eab308',
  'orange-500': '#f97316',
  'pink-500': '#ec4899'
}

function hexToRgb (hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  }
}

function colorDistance (c1, c2) {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
  )
}

export function getNearestTailwindFromClass (prefix,hex) {
  const inputColor = hexToRgb(hex)

  let closest = null
  let minDistance = Infinity

  for (const [name, colorHex] of Object.entries(tailwindColors)) {
    const candidate = hexToRgb(colorHex)
    const dist = colorDistance(inputColor, candidate)

    if (dist < minDistance) {
      minDistance = dist
      closest = name
    }
  }
  console.log(`${prefix}-${closest}`);
  return `${prefix}-${closest}`
}
