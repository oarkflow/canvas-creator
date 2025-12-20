import {AppProvider, AppState} from "@/features";
import {ProductListPage} from "@/features/products/views/ProductListPage.tsx";

export default function ProductDemo() {
	// Initialize theme on mount
	AppState.theme.init();
	
	return (
		<AppProvider value={AppState}>
			<ProductListPage />
		</AppProvider>
	);
}