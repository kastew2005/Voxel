export const RECIPES=[
{out:{id:10,count:4},in:[{id:6,count:1}]},
{out:{id:12,count:4},in:[{id:3,count:4}]}
];
export function craft(inv,recipe){if(recipe.in.every(x=>inv.slots.some(s=>s.id===x.id&&s.count>=x.count))){recipe.in.forEach(x=>inv.remove(x.id,x.count));inv.add(recipe.out.id,recipe.out.count);return true}return false}
