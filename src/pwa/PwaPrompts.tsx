import { UpdatePrompt } from '@/pwa/UpdatePrompt'
import { InstallPrompt } from '@/pwa/InstallPrompt'

// A single fixed container stacking both banners — kept separate from
// UpdatePrompt/InstallPrompt themselves so they can never end up
// independently `fixed` at the same screen position and overlap (a real
// possibility: a browser tab left open across a deploy, before the user
// ever installed, can have both needRefresh and canInstall true at once).
export function PwaPrompts() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      <UpdatePrompt />
      <InstallPrompt />
    </div>
  )
}
