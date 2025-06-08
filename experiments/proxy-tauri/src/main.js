const { invoke } = window.__TAURI__.core

async function fetchIP () {
  try {
    const ip = await invoke('get_ip_from_random_proxy')
    console.log('Public IP:', ip)
    document.getElementById('ip-display').textContent = `Your IP is: ${ip}`
  } catch (err) {
    console.error('Failed to fetch IP:', err)
  }
}

// Example: call it on load
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#greet-form').addEventListener('submit', e => {
    e.preventDefault()
    fetchIP()
  })
})
