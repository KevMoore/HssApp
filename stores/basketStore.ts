import { create } from 'zustand';
import { Part } from '../types';
import {
	BasketItem,
	addToBasket as addToBasketDB,
	getBasketItems as getBasketItemsDB,
	updateBasketItemQuantity as updateBasketItemQuantityDB,
	removeFromBasket as removeFromBasketDB,
	clearBasket as clearBasketDB,
	getBasketItemCount as getBasketItemCountDB,
	getBasketTotal as getBasketTotalDB,
} from '../services/basketService';

interface BasketState {
	items: BasketItem[];
	itemCount: number;
	total: number;
	isLoading: boolean;
	loadBasket: () => Promise<void>;
	addItem: (part: Part, quantity?: number) => Promise<void>;
	updateQuantity: (partId: string, quantity: number) => Promise<void>;
	removeItem: (partId: string) => Promise<void>;
	clear: () => Promise<void>;
	refreshCount: () => Promise<void>;
}

export const useBasketStore = create<BasketState>((set, get) => ({
	items: [],
	itemCount: 0,
	total: 0,
	isLoading: false,

	loadBasket: async () => {
		set({ isLoading: true });
		try {
			const items = await getBasketItemsDB();
			const itemCount = await getBasketItemCountDB();
			const total = await getBasketTotalDB();
			set({ items, itemCount, total, isLoading: false });
		} catch (error) {
			console.error('Error loading basket:', error);
			set({ isLoading: false });
		}
	},

	addItem: async (part: Part, quantity: number = 1) => {
		try {
			await addToBasketDB(part, quantity);
			// Reload basket to get updated state
			await get().loadBasket();
		} catch (error) {
			console.error('Error adding item to basket:', error);
			throw error;
		}
	},

	updateQuantity: async (partId: string, quantity: number) => {
		try {
			// Optimistic update
			const currentItems = get().items;
			const updatedItems = currentItems.map((item) =>
				item.id === partId ? { ...item, quantity } : item
			);
			
			// Calculate new totals
			const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
			const newTotal = updatedItems.reduce(
				(sum, item) => sum + (item.price ?? 0) * item.quantity,
				0
			);
			
			// Update state immediately
			set({ items: updatedItems, itemCount: newItemCount, total: newTotal });
			
			// Sync with database
			await updateBasketItemQuantityDB(partId, quantity);
		} catch (error) {
			console.error('Error updating basket item quantity:', error);
			// Reload on error to sync state
			await get().loadBasket();
			throw error;
		}
	},

	removeItem: async (partId: string) => {
		try {
			// Optimistic update
			const currentItems = get().items;
			const updatedItems = currentItems.filter((item) => item.id !== partId);
			
			// Calculate new totals
			const newItemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
			const newTotal = updatedItems.reduce(
				(sum, item) => sum + (item.price ?? 0) * item.quantity,
				0
			);
			
			// Update state immediately
			set({ items: updatedItems, itemCount: newItemCount, total: newTotal });
			
			// Sync with database
			await removeFromBasketDB(partId);
		} catch (error) {
			console.error('Error removing item from basket:', error);
			// Reload on error to sync state
			await get().loadBasket();
			throw error;
		}
	},

	clear: async () => {
		try {
			await clearBasketDB();
			set({ items: [], itemCount: 0, total: 0 });
		} catch (error) {
			console.error('Error clearing basket:', error);
			throw error;
		}
	},

	refreshCount: async () => {
		try {
			const itemCount = await getBasketItemCountDB();
			const total = await getBasketTotalDB();
			set({ itemCount, total });
		} catch (error) {
			console.error('Error refreshing basket count:', error);
		}
	},
}));

