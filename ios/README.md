# Voxel Survival — iOS build

The native wrapper uses WKWebView and a custom app://bundle origin so the bundled ES modules and relative game assets can load without file:// origin restrictions.

## Build
Run the **Build Voxel Survival iOS IPA** workflow from the Actions tab on branch `ios-ipa-build`. GitHub-hosted macOS builds the unsigned IPA and uploads it as `VoxelSurvival-unsigned-IPA`.

Import the IPA into SideStore and let SideStore sign it with your Apple ID. The artifact is unsigned and cannot be installed directly until signed. Free Apple ID signing requires periodic refresh.

Three.js r159 is downloaded during the build and included locally. The game itself, CSS, JS modules and assets are bundled from this repository. LAN multiplayer still requires the separate Node/WebSocket server.
