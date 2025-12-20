import {CreateProductDTO} from "@/features/products/data/models/product.model";

export class ProductValidator {
	static validateCreate(data: CreateProductDTO): string[] {
		const errors: string[] = [];
		
		if (!data.name || data.name.trim().length === 0) {
			errors.push('Name is required');
		}
		
		if (data.price <= 0) {
			errors.push('Price must be greater than 0');
		}
		
		if (!data.category || data.category.trim().length === 0) {
			errors.push('Category is required');
		}
		
		return errors;
	}
}