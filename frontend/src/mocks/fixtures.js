export const stores = [
 {id:'seomun',name:'서문분식',category:'분식',description:'40년 전통의 서문시장 대표 떡볶이! 매콤달콤한 양념과 쫄깃한 떡이 어우러진 추억의 맛을 즐겨보세요.',greeting:'어서 오이소~\n매콤~한 떡볶이\n드시고 가이소!',location:'서문시장 2지구 101호',businessHours:'09:00 ~ 19:00 (매달 1, 3번째 일요일 휴무)',phone:'053-256-1011',tags:['#매콤달콤','#시장대표메뉴','#가성비','#줄서는맛집']},
 {id:'noodle',name:'시장칼국수',category:'면요리',description:'따끈한 멸치 육수와 매일 뽑는 쫄깃한 면! 든든한 한 그릇과 손만두로 시장 구경의 허기를 채워보세요.',greeting:'어서 오이소~\n뜨끈한 칼국수\n한 그릇 하이소!',location:'서문시장 2지구 102호',businessHours:'09:30 ~ 18:30 (매달 1, 3번째 일요일 휴무)',phone:'053-256-1022',tags:['#따끈한육수','#수제면','#든든한한끼','#손만두']},
 {id:'hotteok',name:'달콤호떡',category:'간식',description:'주문하면 바로 구워내는 바삭하고 쫀득한 호떡! 달콤한 씨앗과 고소한 치즈를 가득 담았어요.',greeting:'방금 구웠어요~\n달콤한 호떡\n드시고 가이소!',location:'서문시장 2지구 201호',businessHours:'10:00 ~ 19:30 (매달 1, 3번째 일요일 휴무)',phone:'053-256-2011',tags:['#갓구운호떡','#달콤한간식','#씨앗가득','#겉바속촉']},
 {id:'coffee',name:'골목카페',category:'카페',description:'시장 골목에서 잠깐 쉬어가세요. 향긋한 커피와 부드러운 디저트로 달콤한 휴식을 준비했어요.',greeting:'잠깐 쉬어가요~\n향긋한 커피와\n달콤한 디저트!',location:'서문시장 2지구 202호',businessHours:'08:30 ~ 20:00 (매달 1, 3번째 일요일 휴무)',phone:'053-256-2022',tags:['#커피한잔','#달콤디저트','#잠깐의휴식','#시장카페']},
];
export const getStore=id=>stores.find(store=>store.id===id)||stores[0];
const originalMenu = [
  {id:'tteok',name:'떡볶이',price:300,description:'매콤달콤한 양념이 매력적인 떡볶이',image:'imgImage32',featured:true},
  {id:'sundae',name:'순대',price:300,description:'쫄깃한 식감의 고소한 순대',image:'imgImage33'},
  {id:'fried',name:'튀김 세트',price:500,description:'바삭한 튀김 5종 세트',image:'imgImage34'},
  {id:'fish',name:'오뎅',price:300,description:'따뜻한 국물의 길거리 오뎅',image:'imgImage35'},
];
export const menu=[...originalMenu.map(item=>({...item,storeId:'seomun'})),
 ...[
 ['noodle','noodle-basic','멸치 칼국수',400,'진한 멸치 육수와 쫄깃한 면','🍜'],
 ['noodle','noodle-spicy','얼큰 칼국수',450,'칼칼한 국물로 든든한 한 끼','🍜'],
 ['noodle','noodle-dumpling','손만두',300,'고기와 채소를 꽉 채운 손만두','🥟'],
 ['noodle','noodle-cold','비빔국수',350,'새콤달콤 양념에 비빈 국수','🍝'],
 ['hotteok','hotteok-seed','씨앗 호떡',150,'고소한 씨앗과 달콤한 꿀','🥞'],
 ['hotteok','hotteok-cheese','치즈 호떡',200,'쭉 늘어나는 고소한 치즈','🧀'],
 ['hotteok','hotteok-honey','꿀 호떡',150,'흑설탕 꿀이 가득한 호떡','🥞'],
 ['hotteok','hotteok-rice','식혜',100,'살얼음 동동 시원한 식혜','🥤'],
 ['coffee','coffee-americano','아메리카노',200,'고소하고 깔끔한 커피 한 잔','☕'],
 ['coffee','coffee-latte','카페라떼',250,'부드러운 우유와 진한 커피','☕'],
 ['coffee','coffee-strawberry','딸기라떼',300,'달콤한 딸기와 신선한 우유','🥛'],
 ['coffee','coffee-waffle','크림 와플',350,'바삭한 와플과 달콤한 크림','🧇'],
 ].map(([storeId,id,name,price,description,emoji],index)=>({storeId,id,name,price,description,emoji,featured:index%4===0,mock:true}))
];
export const reviewText='진짜 서문시장 오면 무조건 먹어야 해요!\n매콤달콤한 양념이 너무 맛있고 튀김이랑 같이\n먹으니까 조합 최고에요!';
export const initialState={balance:1000,favorite:false,cart:[],claimed:[],visits:[],orders:[
  {id:'demo-1',itemId:'tteok',quantity:1,status:'cooking'},
  {id:'demo-2',itemId:'fried',quantity:1,status:'ready'},
  {id:'demo-3',itemId:'fish',quantity:1,status:'reviewed'}
],reviews:[{id:'review-1',name:'승우',rating:4,date:'2026. 10. 12',text:reviewText,photos:true},{id:'review-2',name:'승우',rating:4,date:'2026. 10. 12',text:reviewText,photos:true}]};
