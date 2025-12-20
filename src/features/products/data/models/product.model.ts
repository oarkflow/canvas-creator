export interface Product {
	id: string;
	name: string;
	price: number;
	category: string;
	inStock: boolean;
}

export interface CreateProductDTO {
	name: string;
	price: number;
	category: string;
}