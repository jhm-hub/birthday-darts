# Shared settings with one lasting private link

The private editing link connects Presents, Darts, Crown Vault, Piñata Party and Brokie Wheel to shared settings. Both people open that same full link once in their browser. Use **Save changes** to update the existing game; ordinary saves keep its ID and do not create another widget. The two separate Scam Wheel projects are not connected to this service.

Open the link first in the browser containing the settings you want to share. The first time each game is opened, its existing settings become the shared starting point. If the browser has no settings, that game starts with its normal defaults. Original local libraries remain untouched as a backup. The service only initializes a game once; opening it on another computer then loads the shared copy.

Share the private editing link directly with Faith. Anyone holding it can read and change settings, including configured username ranges. It requires no account. Never put this editing link in OBS or on stream; use the separate **Permanent display link** from Faith’s controls. Close older control tabs when switching to the shared link.

## Saving and playing

- Save changes in the editor, then use the same private link next time. Crown Vault’s main Save button also saves edited game ranges; the separate Save four games button remains available for range-only changes.
- Other open pages check for changes about every five seconds. Settings are applied to future rounds; the current round keeps its existing prize plan.
- If someone saves newer settings while you are editing, your draft stays in place. **Load latest & discard my edits** fetches the saved version. A stale save cannot silently overwrite it.
- Failed network saves show an error. Do not treat an unsaved draft as shared.
- Each computer keeps its own active round, history, audio level and OBS pairing. Changing saved settings does not replace its existing permanent OBS source. Faith should run live controls on her own computer.
- Downloading a settings backup remains available. Restoring/importing one is an explicit action and can add saved versions.

## Service and recovery

The frontend remains at `https://jhm-hub.github.io/birthday-darts/`. The service is `https://faith-shared-game-settings.filthynormie.chatgpt.site`, Site ID `appgprj_6ae8d1e857608191868da448c386ace6`. It stores settings in D1. All reads and writes require the private link’s edit key; only its SHA-256 hash is configured in the service. The key is carried in the link fragment and never included in display URLs or the public source.

Updates use an atomic revision check so simultaneous writers cannot lose a saved change. The original browser data is retained under its old storage key; shared data uses a separate workspace suffix. Do not clear browser data without preserving the existing OBS pairing if that pairing is still in use.

To rotate an exposed editing link, generate a fresh 32-byte base64url key and update the service’s secret `EDIT_KEY_HASH`, then deploy the same saved Site version with the new environment revision. Keep the workspace ID to retain settings, and share the updated private link with Faith. No plaintext edit key belongs in this repository.
