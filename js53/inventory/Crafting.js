export const RECIPES=[
{out:{id:10,count:4},in:[{id:6,count:1}]},
{out:{id:12,count:4},in:[{id:3,count:4}]},
{out:{id:127,count:1},in:[{id:10,count:3},{id:126,count:3}]}
];
export function craft(inv,recipe){if(recipe.in.every(x=>inv.slots.some(s=>s.id===x.id&&s.count>=x.count))){recipe.in.forEach(x=>inv.remove(x.id,x.count));inv.add(recipe.out.id,recipe.out.count);return true}return false}
