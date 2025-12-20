import {derived, effect, mutable} from '@anchorlib/react';
import {ProductRepository} from "@/features/products/data/repositories/product.repositories";
import {CreateProductDTO, Product} from "@/features/products/data/models/product.model";
import {ProductValidator} from "@/features/products/data/validators/product.validator";

export class ProductStore {
	// Reactive state
	state = mutable({
		data: [] as Product[],
		selectedProduct: null as Product | null,
		selectedCategory: 'all' as string,
		searchQuery: '',
		loading: false,
		error: null as string | null,
		sortBy: 'name' as 'name' | 'price',
	});
	// Computed values
	filteredProducts = derived(() => {
		let products = this.state.data;
		
		// Filter by category
		if (this.state.selectedCategory !== 'all') {
			products = products.filter(
				p => p.category === this.state.selectedCategory
			);
		}
		
		// Filter by search query
		if (this.state.searchQuery) {
			const query = this.state.searchQuery.toLowerCase();
			products = products.filter(p =>
				p.name.toLowerCase().includes(query)
			);
		}
		
		// Sort
		return [...products].sort((a, b) => {
			if (this.state.sortBy === 'name') {
				return a.name.localeCompare(b.name);
			}
			return a.price - b.price;
		});
	});
	categories = derived(() => {
		const cats = new Set(this.state.data.map(p => p.category));
		return ['all', ...Array.from(cats)];
	});
	totalValue = derived(() => {
		return this.filteredProducts.value.reduce(
			(sum, p) => sum + p.price,
			0
		);
	});
	inStockCount = derived(() => {
		return this.filteredProducts.value.filter(p => p.inStock).length;
	});
	
	constructor(private repository: ProductRepository) {
		// Auto-save to localStorage on changes
		effect(() => {
			if (typeof window !== 'undefined') {
				const snapshot = {
					data: this.state.data,
					selectedCategory: this.state.selectedCategory,
				};
				localStorage.setItem('products', JSON.stringify(snapshot));
			}
		});
	}
	
	// Actions
	async loadProducts() {
		this.state.loading = true;
		this.state.error = null;
		try {
			this.state.data = await this.repository.getAll();
		} catch (error) {
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.state.loading = false;
		}
	}
	
	async loadProductById(id: string) {
		this.state.loading = true;
		this.state.error = null;
		try {
			this.state.selectedProduct = await this.repository.getById(id);
		} catch (error) {
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.state.loading = false;
		}
	}
	
	async createProduct(data: CreateProductDTO) {
		const errors = ProductValidator.validateCreate(data);
		if (errors.length > 0) {
			this.state.error = errors.join(', ');
			return null;
		}
		
		this.state.loading = true;
		this.state.error = null;
		try {
			const product = await this.repository.create(data);
			this.state.data = [...this.state.data, product];
			return product;
		} catch (error) {
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
			return null;
		} finally {
			this.state.loading = false;
		}
	}
	
	async deleteProduct(id: string) {
		this.state.loading = true;
		this.state.error = null;
		try {
			await this.repository.delete(id);
			this.state.data = this.state.data.filter(p => p.id !== id);
		} catch (error) {
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			this.state.loading = false;
		}
	}
	
	setCategory(category: string) {
		this.state.selectedCategory = category;
	}
	
	setSearchQuery(query: string) {
		this.state.searchQuery = query;
	}
	
	setSortBy(sortBy: 'name' | 'price') {
		this.state.sortBy = sortBy;
	}
	
	clearError() {
		this.state.error = null;
	}
}