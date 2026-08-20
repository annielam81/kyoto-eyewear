import { defineStore } from 'pinia';
import { OrderService } from '@/services/OrderService';
import type { Order } from '@/models';
export const useOrderStore = defineStore('order', {
  state: () => ({ orders: [] as Order[], lastOrderId: '' }),
  actions: {
    async refresh() { this.orders = await OrderService.list(); },
  },
});
