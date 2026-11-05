export const storeArtwork={
  noodle:'/assets/generated/store-noodle.webp',
  hotteok:'/assets/generated/store-hotteok.webp',
  coffee:'/assets/generated/store-coffee.webp',
};
export const menuArtwork=Object.fromEntries([
  'noodle-basic','noodle-spicy','noodle-dumpling','noodle-cold',
  'hotteok-seed','hotteok-cheese','hotteok-honey','hotteok-rice',
  'coffee-americano','coffee-latte','coffee-strawberry','coffee-waffle',
].map(id=>[id,`/assets/generated/${id}.webp`]));
