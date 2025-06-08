import { Command } from '@tauri-apps/plugin-shell'
export async function searchYouTube (query) {
  const command = Command.sidecar('ytsearch.exe-x86_64-pc-windows-msvc.exe', ["obama"])
  const output = await command.execute()
  const out = output.stdout;
  console.log(out);
  return JSON.parse(out);
}
