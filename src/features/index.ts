import { contextProvider } from '@anchorlib/react';
import {ApiService} from "@/core/data/services/api.service.ts";
import {ProductRepository} from "@/features/products/data/repositories/product.repositories.ts";
import {ProductStore} from "@/features/products/state/stores/product.store.ts";
import {ThemeStore} from "@/core/state/stores/theme.store.ts";

// Create singleton instances
const apiService = new ApiService(import.meta.env.VITE_API_URL as string);
const productRepository = new ProductRepository(apiService);

export const AppState = {
	product: new ProductStore(productRepository),
	theme: new ThemeStore(),
};

export const AppCtx = Symbol('AppContext');
export const AppProvider = contextProvider(AppCtx);