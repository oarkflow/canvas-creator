import {RouteObject} from 'react-router-dom';

interface RouteModule {
	routes: () => RouteObject[];
}

// Vite's import.meta.glob for dynamic imports
const routeModules = import.meta.glob<RouteModule>('/src/**/init/index.tsx', {
	eager: true
});

export function loadRoutes(): RouteObject[] {
	const routes: RouteObject[] = [];
	
	for (const path in routeModules) {
		const module = routeModules[path];
		const routeArray = module.routes();
		if (routeArray && routeArray.length > 0) {
			routes.push(...routeArray);
		}
	}
	
	return routes;
}
