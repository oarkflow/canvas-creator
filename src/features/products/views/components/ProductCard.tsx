import {render, setup} from '@anchorlib/react';
import {Product} from "@/features/products/data/models/product.model";
import {Button} from "@/shared/ui/button";

interface ProductCardProps {
	product: Product;
	onDelete?: (id: string) => void;
}

export const ProductCard = setup<ProductCardProps>((props) => {
	const handleDelete = () => {
		if (confirm('Are you sure?')) {
			props.onDelete?.(props.product.id);
		}
	};
	return render(() => (
		<div className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
			<h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{props.product.name}</h3>
			<p className="text-gray-600 dark:text-gray-400 mb-2">{props.product.category}</p>
			<p className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">${props.product.price.toFixed(2)}</p>
			<div className="flex items-center justify-between">
        <span
	        className={props.product.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
          {props.product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
				<Button variant="destructive" onClick={handleDelete}>
					Delete
				</Button>
			</div>
		</div>
	), 'ProductCard');
}, 'ProductCard');