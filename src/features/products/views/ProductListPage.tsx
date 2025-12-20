import { setup, render, getContext, effect, mutable } from '@anchorlib/react';
import {AppCtx, AppState} from "@/core/state/context/app.context";
import {Button} from "@/shared/ui/button";
import {TextInput} from "@/shared/ui/text-input";
import {ProductCard} from "@/features/products/views/components/ProductCard";

export const ProductListPage = setup(() => {
	const { product, theme } = getContext(AppCtx) as typeof AppState;
	
	// Load products on mount
	effect(() => {
		product.loadProducts();
	});
	
	const newProduct = mutable({
		name: '',
		price: 0,
		category: '',
	});
	
	const handleCreate = async () => {
		const result = await product.createProduct(newProduct);
		if (result) {
			newProduct.name = '';
			newProduct.price = 0;
			newProduct.category = '';
		}
	};
	
	return render(() => (
		<div className={`min-h-screen p-8 ${theme.isDark.value ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">Product Manager</h1>
					<Button onClick={() => theme.toggle()}>
						Toggle Theme ({theme.state.mode})
					</Button>
				</div>
				
				{/* Stats */}
				<div className="grid grid-cols-3 gap-4 mb-8">
					<div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
						<p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
						<p className="text-2xl font-bold">{product.state.data.length}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
						<p className="text-sm text-gray-600 dark:text-gray-400">In Stock</p>
						<p className="text-2xl font-bold">{product.inStockCount.value}</p>
					</div>
					<div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
						<p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
						<p className="text-2xl font-bold">${product.totalValue.value.toFixed(2)}</p>
					</div>
				</div>
				
				{/* Create Form */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
					<h2 className="text-xl font-bold mb-4">Add New Product</h2>
					<div className="grid grid-cols-3 gap-4">
						<TextInput
							label="Name"
							defaultValue={newProduct.name}
							placeholder="Product name"
						/>
						<TextInput
							label="Price"
							defaultValue={newProduct.price}
							type="number"
							placeholder="0.00"
						/>
						<TextInput
							label="Category"
							defaultValue={newProduct.category}
							placeholder="Category"
						/>
					</div>
					<Button onClick={handleCreate} disabled={product.state.loading}>
						Create Product
					</Button>
					{product.state.error && (
						<p className="text-red-500 mt-2">{product.state.error}</p>
					)}
				</div>
				
				{/* Filters */}
				<div className="flex gap-4 mb-6">
					<TextInput
						defaultValue={product.state.searchQuery}
						placeholder="Search products..."
						className="flex-1"
					/>
					<select
						defaultValue={product.state.selectedCategory}
						onChange={e => product.setCategory(e.target.value)}
						className="px-4 py-2 border rounded"
					>
						{product.categories.value.map(cat => (
							<option key={cat} value={cat}>{cat}</option>
						))}
					</select>
					<select
						defaultValue={product.state.sortBy}
						onChange={e => product.setSortBy(e.target.value as 'name' | 'price')}
						className="px-4 py-2 border rounded"
					>
						<option value="name">Sort by Name</option>
						<option value="price">Sort by Price</option>
					</select>
				</div>
				
				{/* Product Grid */}
				{product.state.loading ? (
					<div className="text-center py-12">Loading...</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{product.filteredProducts.value.map(p => (
							<ProductCard
								key={p.id}
								product={p}
								onDelete={id => product.deleteProduct(id)}
							/>
						))}
					</div>
				)}
				
				{product.filteredProducts.value.length === 0 && !product.state.loading && (
					<div className="text-center py-12 text-gray-500">
						No products found
					</div>
				)}
			</div>
		</div>
	), 'ProductListPage');
}, 'ProductListPage');