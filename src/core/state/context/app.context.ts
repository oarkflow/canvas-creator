import { contextProvider } from '@anchorlib/react';
import {ApiService} from "@/core/data/services/api.service";
import {ProductRepository} from "@/features/products/data/repositories/product.repositories";
import {ProductStore} from "@/features/products/state/stores/product.store";
import {ThemeStore} from "@/core/state/stores/theme.store";

// Create singleton instances
const apiService = new ApiService();
const productRepository = new ProductRepository(apiService);

export const AppState = {
	product: new ProductStore(productRepository),
	theme: new ThemeStore(),
};

export const AppCtx = Symbol('AppContext');
export const AppProvider = contextProvider(AppCtx);