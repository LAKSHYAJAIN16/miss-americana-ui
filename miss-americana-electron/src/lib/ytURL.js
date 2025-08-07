import { Command } from '@tauri-apps/plugin-shell'
export async function ytURL (query) {
  const command = Command.sidecar('binaries/innersearch', [query])
  const output = await command.execute()
  const out = output.stdout;
  return out;
}
