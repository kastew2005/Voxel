# Voxel Survival — Universe 16 Stable Engine

Исправлен реальный синтаксический баг в `js/rendering/Lighting.js`: `selected?.id===110?.65` заменён на корректный тернарный оператор. Это и вызывало `SyntaxError: Unexpected token ':' / Expected ')'`.

Запуск: откройте игру через HTTP(S), а не `file://`.
