import { Command } from '@tauri-apps/plugin-shell'
export async function searchYouTube (query) {
  const command = Command.sidecar('binaries/ytsearch', [query])
  const output = await command.execute()
  const out = output.stdout;
  return JSON.parse(out);
}
