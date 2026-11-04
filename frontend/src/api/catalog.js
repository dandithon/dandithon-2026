import {menu as demoMenu, stores as demoStores} from '../mocks/fixtures.js';

export let stores = demoStores;
export let menu = demoMenu;
export const getStore = id => stores.find(store => store.id === id) || stores[0];

export function useServerCatalog(details) {
  stores = details;
  menu = details.flatMap(store => store.menus.map(item => {
    const artwork = demoMenu.find(entry => entry.id === item.id);
    return {...item, storeId:store.id, featured:item.isFeatured, image:artwork?.image, emoji:artwork?.emoji};
  }));
}
