import {ApiService} from "@/core/data/services/api.service";
import {CreateProductDTO, Product} from "@/features/products/data/models/product.model";

export class ProductRepository {
	constructor(private api: ApiService) {}
	
	async getAll(): Promise<Product[]> {
		return this.api.get<Product[]>('/products');
	}
	
	async getById(id: string): Promise<Product> {
		return this.api.get<Product>(`/products/${id}`);
	}
	
	async create(data: CreateProductDTO): Promise<Product> {
		return this.api.post<Product>('/products', data);
	}
	
	async update(id: string, data: Partial<Product>): Promise<Product> {
		return this.api.put<Product>(`/products/${id}`, data);
	}
	
	async delete(id: string): Promise<void> {
		return this.api.delete(`/products/${id}`);
	}
	
	async searchByCategory(category: string): Promise<Product[]> {
		return this.api.get<Product[]>(`/products?category=${category}`);
	}
}