# Voxel Survival — Universe 19

Performance + visual redesign release.

- Original Minecraft-inspired menu redesign with a generated voxel landscape backdrop.
- 64×64 procedural pixel textures with deterministic detail, nearest filtering and no texture downloads.
- Chunk meshing optimized: visible faces are grouped into contiguous geometry batches, reducing WebGL draw calls dramatically.
- Particle materials/geometries are reused to reduce garbage collection and mobile memory pressure.
- Adaptive pixel ratio, lighter mobile shadows/lights/particles and smaller mesh budgets for smoother iPhone performance.
- One raycast result is reused by HUD and block outline each frame.
- Safari startup version bumped to Universe 19 and Service Worker cache updated.
- Three.js remains on UNPKG.

## Deploy

Upload the contents of this folder to GitHub Pages. After deployment, reload Safari once with the page refreshed so the new Service Worker cache (`v19`) is installed.
