import {AppProvider, AppState} from "@/core/state/context/app.context";
import {ProductListPage} from "@/features/products/views/ProductListPage";

export default function ProductDemo() {
	// Initialize theme on mount
	AppState.theme.init();
	
	return (
		<AppProvider value={AppState}>
			<ProductListPage />
		</AppProvider>
	);
}