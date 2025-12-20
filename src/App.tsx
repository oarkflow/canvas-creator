import {Toaster} from "@/shared/ui/toaster";
import {Toaster as Sonner} from "@/shared/ui/sonner";
import {TooltipProvider} from "@/shared/ui/tooltip";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {HelmetProvider} from 'react-helmet-async';
import {loadRoutes} from "./core/routing/route-loader";
import Index from "./features/builder/pages";
import NotFound from "@/core/pages/NotFound";

const queryClient = new QueryClient();
const autoRoutes = loadRoutes();

const App = () => (
	<HelmetProvider>
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster/>
				<Sonner/>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<Index/>}/>
						{/* Auto-discovered routes from init/index.ts files */}
						{autoRoutes.map((route, index) => (
							<Route key={index} path={route.path} element={route.element}/>
						))}
						{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
						<Route path="*" element={<NotFound/>}/>
					</Routes>
				</BrowserRouter>
			</TooltipProvider>
		</QueryClientProvider>
	</HelmetProvider>
);

export default App;
