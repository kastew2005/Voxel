# Voxel Survival — Universe 15

Stable startup hotfix.

- Главный экран не блокируется загрузкой движка.
- JS-модули получают cache-busting `?v=15`.
- Service Worker v15 использует network-first для JS, чтобы старый код не запускался после обновления.
- Первый чанк мира создаётся только после «ИГРАТЬ».
