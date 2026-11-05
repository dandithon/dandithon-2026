# 추가 메뉴·매장 이미지

Built-in `image_gen`으로 생성한 원본을 사용했다. 실행 모드는 CLI가 아닌 기본 이미지 도구다. 배포 파일은 이 폴더의 WebP이며 PNG 원본은 이미지 도구의 생성 이미지 폴더에 보존된다.

## 공통 프롬프트

- 메뉴: 기존 `/assets/75-189-imgImage32.png`를 스타일 참고로, 따뜻한 크림색 식기·갈색 외곽선·윤기 있는 음식 음영의 3/4 시점 픽셀 RPG 메뉴 그림. 음식 한 개를 중앙에 두고 실제 투명 배경, 글자·로고·이모지·체커보드 배경 없음. 작은 UI에서 읽히는 단계형 픽셀 가장자리.
- 매장: 기존 `/assets/48-143-imgImage21.png`를 편집 대상으로, 빈 나무 간판·빈 말풍선·손님 뒷모습·상인·나무 카운터 위치와 세로 비율은 유지. 가게에 맞는 차양·상인·음식·장식만 변경. 글자나 UI는 이미지에 넣지 않음.
- store-noodle: 깊은 초록/크림 차양, 크림 앞치마의 칼국수 상인, 김이 나는 칼국수 그릇·만두 찜기·밀가루·밀대. 떡볶이와 어묵 꼬치는 제거.

## 개별 요청

- `store-hotteok.webp` (scene): Change the store into a honey hotteok pancake stall. Golden amber and cream awning, friendly older Korean pancake cook in tan apron. Counter displays golden round hotteok pancakes on iron griddle, sunflower seeds, honey jar, cups of rice punch. Remove all tteokbokki, rice cake pans and fishcake skewers.
- `store-coffee.webp` (scene): Change the store into a charming Korean alley cafe. Muted blue and cream striped awning, friendly Korean barista with blue cap and cream apron. Counter has espresso machine, coffee cups, clear glasses of strawberry milk and latte, golden waffle plate. Remove all tteokbokki, rice cake pans, garlic, fishcake skewers.
- `noodle-basic.webp` (food): A ceramic bowl of Korean hand-cut kalguksu noodles in pale anchovy broth, thin zucchini and carrot slices, seaweed garnish.
- `noodle-spicy.webp` (food): A ceramic bowl of spicy Korean kalguksu hand-cut noodles in orange-red broth, green scallions, small chili slices.
- `noodle-dumpling.webp` (food): A round bamboo steamer containing five plump Korean steamed dumplings with pleated tops.
- `noodle-cold.webp` (food): A ceramic bowl of bibim guksu thin noodles mixed in red sauce, cucumber strips and a half boiled egg.
- `hotteok-seed.webp` (food): Two golden Korean hotteok pancakes on a small cream plate; one cut open showing brown honey and sunflower seeds.
- `hotteok-cheese.webp` (food): Two golden Korean hotteok pancakes on a small cream plate; one pulled apart with melted white cheese stretching between halves.
- `hotteok-honey.webp` (food): Two golden Korean hotteok pancakes on a small cream plate with a shiny small amber honey filling at one cut edge. No seeds or cheese.
- `hotteok-rice.webp` (food): A clear short glass of Korean sikhye pale golden rice punch with visible white rice grains and a few ice cubes.
- `coffee-americano.webp` (food): A clear tumbler of iced dark brown Americano coffee with distinct large ice cubes and a small amber highlight. No milk.
- `coffee-latte.webp` (food): A clear tumbler of iced cafe latte with creamy milk below and tan espresso above, large ice cubes.
- `coffee-strawberry.webp` (food): A clear tall glass of pink strawberry milk with small red strawberry pieces at the bottom, ice and a single strawberry garnish.
- `coffee-waffle.webp` (food): A golden square waffle with crisp grid texture on a cream plate, topped with a dollop of white whipped cream and two strawberry slices.

## 적용과 용량

- 매장 3종은 최대 804×1736, 메뉴 12종은 384×288 이내로 축소하고 WebP quality 88로 인코딩했다. 투명도와 픽셀 형태를 유지한다.
- `src/assets/storeArtwork.js`에서 가게·메뉴 ID로 연결한다. 원래 서문분식 에셋은 유지한다.
- 실제 음식·상점 사진이 아닌 게임 내 표현용 생성 이미지다.
