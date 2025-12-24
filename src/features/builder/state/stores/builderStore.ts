import {create} from 'zustand';
import {BuilderComponent, Page, Project} from '@/features/builder/types/builder';
import {mockApi} from '@/features/builder/data/services/mockApi';

const findComponentById = (components: BuilderComponent[], targetId: string): BuilderComponent | null => {
	for (const component of components) {
		if (component.id === targetId) {
			return component;
		}
		if (component.children) {
			const match = findComponentById(component.children, targetId);
			if (match) return match;
		}
	}
	return null;
};

interface BuilderState {
	// Project state
	currentProject: Project | null;
	currentPage: Page | null;
	selectedComponent: BuilderComponent | null;
	hoveredComponentId: string | null;

	// UI state
	isLoading: boolean;
	isSaving: boolean;
	isPreviewMode: boolean;
	isDragging: boolean;

	// Actions
	setCurrentProject: (project: Project | null) => void;
	setCurrentPage: (page: Page | null) => void;
	setSelectedComponent: (component: BuilderComponent | null) => void;
	setHoveredComponentId: (id: string | null) => void;
	setIsLoading: (loading: boolean) => void;
	setIsSaving: (saving: boolean) => void;
	setIsPreviewMode: (preview: boolean) => void;
	setIsDragging: (dragging: boolean) => void;

	// Component operations
	addComponent: (component: BuilderComponent, index?: number, parentId?: string) => void;
	updateComponent: (id: string, updates: Partial<BuilderComponent>) => void;
	deleteComponent: (id: string) => void;
	moveComponent: (fromIndex: number, toIndex: number, parentId?: string) => void;
	duplicateComponent: (id: string) => void;
	addToContainer: (containerId: string, component: BuilderComponent) => void;

	// Page operations
	savePage: () => Promise<void>;
	loadPage: (projectId: string, pageId: string) => Promise<void>;
	createNewPage: (name: string, type: Page['type']) => Promise<Page | null>;
	deletePage: (pageId: string) => Promise<boolean>;

	// Project operations
	loadProject: () => Promise<void>;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
	// Initial state
	currentProject: null,
	currentPage: null,
	selectedComponent: null,
	hoveredComponentId: null,
	isLoading: false,
	isSaving: false,
	isPreviewMode: false,
	isDragging: false,

	// Setters
	setCurrentProject: (project) => set({currentProject: project}),
	setCurrentPage: (page) => set({currentPage: page, selectedComponent: null}),
	setSelectedComponent: (component) => set({selectedComponent: component}),
	setHoveredComponentId: (id) => set({hoveredComponentId: id}),
	setIsLoading: (loading) => set({isLoading: loading}),
	setIsSaving: (saving) => set({isSaving: saving}),
	setIsPreviewMode: (preview) => set({isPreviewMode: preview}),
	setIsDragging: (dragging) => set({isDragging: dragging}),

	// Component operations
	addComponent: (component, index, parentId) => {
		const {currentPage} = get();
		if (!currentPage) return;

		if (parentId) {
			// Add to a container
			const addToParent = (components: BuilderComponent[]): BuilderComponent[] => {
				return components.map(comp => {
					if (comp.id === parentId && comp.children) {
						const children = [...comp.children];
						if (index !== undefined) {
							children.splice(index, 0, component);
						} else {
							children.push(component);
						}
						return {...comp, children};
					}
					if (comp.children) {
						return {...comp, children: addToParent(comp.children)};
					}
					return comp;
				});
			};

			set({
				currentPage: {...currentPage, components: addToParent(currentPage.components)},
				selectedComponent: component,
			});
		} else {
			// Add to root
			const components = [...currentPage.components];
			if (index !== undefined) {
				components.splice(index, 0, component);
			} else {
				components.push(component);
			}

			set({
				currentPage: {...currentPage, components},
				selectedComponent: component,
			});
		}
	},

	addToContainer: (containerId, component) => {
		const {currentPage} = get();
		if (!currentPage) return;

		const addToContainer = (components: BuilderComponent[]): BuilderComponent[] => {
			return components.map(comp => {
				if (comp.id === containerId) {
					const children = comp.children ? [...comp.children, component] : [component];
					return {...comp, children};
				}
				if (comp.children) {
					return {...comp, children: addToContainer(comp.children)};
				}
				return comp;
			});
		};

		set({
			currentPage: {...currentPage, components: addToContainer(currentPage.components)},
			selectedComponent: component,
		});
	},

	updateComponent: (id, updates) => {
		const {currentPage, selectedComponent} = get();
		if (!currentPage) return;

		const updateInArray = (components: BuilderComponent[]): BuilderComponent[] => {
			return components.map(comp => {
				if (comp.id === id) {
					return {...comp, ...updates};
				}
				if (comp.children) {
					return {...comp, children: updateInArray(comp.children)};
				}
				return comp;
			});
		};

		const updatedComponents = updateInArray(currentPage.components);

		// Also update selectedComponent if it's the one being updated, keeping reference in sync with tree
		let updatedSelected = selectedComponent;
		if (selectedComponent?.id === id) {
			updatedSelected = findComponentById(updatedComponents, id);
		}

		set({
			currentPage: {...currentPage, components: updatedComponents},
			selectedComponent: updatedSelected ?? selectedComponent,
		});
	},

	deleteComponent: (id) => {
		const {currentPage, selectedComponent} = get();
		if (!currentPage) return;

		const removeFromArray = (components: BuilderComponent[]): BuilderComponent[] => {
			return components
				.filter(comp => comp.id !== id)
				.map(comp => ({
					...comp,
					children: comp.children ? removeFromArray(comp.children) : undefined,
				}));
		};

		set({
			currentPage: {...currentPage, components: removeFromArray(currentPage.components)},
			selectedComponent: selectedComponent?.id === id ? null : selectedComponent,
		});
	},

	moveComponent: (fromIndex, toIndex, parentId) => {
		const {currentPage} = get();
		if (!currentPage) return;

		if (parentId) {
			const moveInParent = (components: BuilderComponent[]): BuilderComponent[] => {
				return components.map(comp => {
					if (comp.id === parentId && comp.children) {
						const children = [...comp.children];
						const [moved] = children.splice(fromIndex, 1);
						children.splice(toIndex, 0, moved);
						return {...comp, children};
					}
					if (comp.children) {
						return {...comp, children: moveInParent(comp.children)};
					}
					return comp;
				});
			};

			set({currentPage: {...currentPage, components: moveInParent(currentPage.components)}});
		} else {
			const components = [...currentPage.components];
			const [moved] = components.splice(fromIndex, 1);
			components.splice(toIndex, 0, moved);

			set({currentPage: {...currentPage, components}});
		}
	},

	duplicateComponent: (id) => {
		const {currentPage} = get();
		if (!currentPage) return;

		const deepClone = (comp: BuilderComponent): BuilderComponent => {
			return {
				...comp,
				id: crypto.randomUUID(),
				children: comp.children?.map(deepClone),
			};
		};

		const findAndDuplicate = (components: BuilderComponent[]): BuilderComponent[] => {
			const result: BuilderComponent[] = [];
			for (const comp of components) {
				result.push({
					...comp,
					children: comp.children ? findAndDuplicate(comp.children) : undefined,
				});
				if (comp.id === id) {
					result.push(deepClone(comp));
				}
			}
			return result;
		};

		set({
			currentPage: {...currentPage, components: findAndDuplicate(currentPage.components)},
		});
	},

	// Page operations
	savePage: async () => {
		const {currentProject, currentPage} = get();
		if (!currentProject || !currentPage) return;

		set({isSaving: true});
		try {
			await mockApi.updatePageComponents(
				currentProject.id,
				currentPage.id,
				currentPage.components
			);
		} finally {
			set({isSaving: false});
		}
	},

	loadPage: async (projectId, pageId) => {
		set({isLoading: true});
		try {
			const page = await mockApi.getPage(projectId, pageId);
			set({currentPage: page, selectedComponent: null});
		} finally {
			set({isLoading: false});
		}
	},

	createNewPage: async (name, type) => {
		const {currentProject} = get();
		if (!currentProject) return null;

		set({isLoading: true});
		try {
			const slug = name.toLowerCase().replace(/\s+/g, '-');
			const newPage = await mockApi.createPage(currentProject.id, {
				name,
				slug,
				type,
				components: [],
			});

			if (newPage) {
				const project = await mockApi.getProject(currentProject.id);
				set({currentProject: project, currentPage: newPage});
			}

			return newPage;
		} finally {
			set({isLoading: false});
		}
	},

	deletePage: async (pageId) => {
		const {currentProject, currentPage} = get();
		if (!currentProject) return false;

		set({isLoading: true});
		try {
			const success = await mockApi.deletePage(currentProject.id, pageId);
			if (success) {
				const project = await mockApi.getProject(currentProject.id);
				set({
					currentProject: project,
					currentPage: currentPage?.id === pageId ? null : currentPage,
				});
			}
			return success;
		} finally {
			set({isLoading: false});
		}
	},

	// Project operations
	loadProject: async () => {
		set({isLoading: true});
		try {
			const project = mockApi.getCurrentProject();
			if (project) {
				set({
					currentProject: project,
					currentPage: project.pages[0] || null,
				});
			}
		} finally {
			set({isLoading: false});
		}
	},
}));
