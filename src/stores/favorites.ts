import { defineStore } from 'pinia';
import { load, save } from '@/utils/storage';
export const useFavoritesStore = defineStore('favorites', {
  state: () => ({ ids: load<string[]>('kyoto.favorites', []) }),
  actions: {
    toggle(id: string) {
      const i = this.ids.indexOf(id);
      i >= 0 ? this.ids.splice(i,1) : this.ids.push(id);
      save('kyoto.favorites', [...this.ids]);
      return i < 0;
    },
    has(id: string) { return this.ids.includes(id); },
  },
});
