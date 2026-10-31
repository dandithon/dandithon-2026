# Store and mission UI flow

Work on the existing `feat/ui` branch after the teammate merge. Exploration, camera, movement, profile and equipment implementations are preserved.

- Store gray handle supports pointer dragging, clicking and ArrowUp/ArrowDown. Up expands menus; down returns to information. Pointer distances account for the shared scaled canvas; canceled/short drags reset.
- Mission cards use separate title, progress and reward areas. Incomplete and claimed rewards are disabled. Photo completion is explicitly a sample; no camera integration or daily reset is implemented.
- Store and menu review counts use the same local records. Review entry refreshes cooking status before selecting an eligible order, and uses the profile nickname.
- Direct purchase preserves the basket. Cart purchase removes only the purchased quantities. Failed purchases preserve balance and cart.
- Purchase completion connects to receipts; mock orders become ready after 15 seconds and can receive one review.
- App integration changes are limited to order completion, cart source and review callbacks. APIs remain local mocks; no server endpoints have been assumed. AI summaries, hours and additional quests/events remain clearly marked unavailable.

Validation: `npm run verify` (assets, Node tests, production build). Browser checks cover both handle directions, basket preservation, order completion, receipt/review registration and mission layout. Real mobile hardware and backend integration remain to be tested when available.
