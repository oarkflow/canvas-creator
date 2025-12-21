import { useEffect } from 'react';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useBuilderStore } from '@/features/builder/state/stores/builderStore';
import { createComponent } from '@/features/builder/data/models/componentDefinitions';
import { ComponentType } from '@/features/builder/types/builder';
import { BuilderToolbar } from './BuilderToolbar';
import { ComponentPalette } from './ComponentPalette';
import { BuilderCanvas } from './BuilderCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { Loader2 } from 'lucide-react';

export function BuilderLayout() {
    const {
        isLoading,
        isPreviewMode,
        loadProject,
        currentPage,
        addComponent,
        moveComponent,
        addToContainer,
        setIsDragging,
    } = useBuilderStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        loadProject();
    }, [loadProject]);

    const handleDragStart = (event: DragStartEvent) => {
        setIsDragging(true);
    };

    const getSiblings = (parentId?: string | null) => {
        const page = useBuilderStore.getState().currentPage;
        if (!page) return [];

        const findChildren = (components: any[]): any[] | null => {
            for (const c of components) {
                if (c.id === parentId) return c.children || [];
                if (c.children) {
                    const found = findChildren(c.children);
                    if (found) return found;
                }
            }
            return null;
        };

        if (!parentId) return page.components || [];
        return findChildren(page.components) || [];
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragging(false);

        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current as any;
        const overData = over.data.current as any;
        const overId = over.id as string;

        // Dragging from palette
        if (activeData?.type === 'palette') {
            const componentType = activeData.componentType as ComponentType;
            const newComponent = createComponent(componentType);

            // Dropping into a container
            if (overData?.type === 'container') {
                addToContainer(overData.containerId, newComponent);
                return;
            }

            // Dropping onto canvas/root list
            const components = currentPage?.components || [];
            let dropIndex = components.length;

            if (overId !== 'canvas') {
                const overIndex = components.findIndex(c => c.id === overId);
                if (overIndex !== -1) dropIndex = overIndex;
            }

            addComponent(newComponent, dropIndex);
            return;
        }

        // Moving/reordering existing component
        if (activeData?.type === 'canvas') {
            // Dropping into a container (move into it)
            if (overData?.type === 'container') {
                const { deleteComponent } = useBuilderStore.getState();
                const componentToMove = activeData.component;
                deleteComponent(componentToMove.id);
                addToContainer(overData.containerId, componentToMove);
                return;
            }

            // Reorder within same parent list (root or nested)
            if (overData?.type === 'canvas') {
                const fromParentId = activeData.parentId as string | undefined;
                const toParentId = overData.parentId as string | undefined;

                if (fromParentId === toParentId) {
                    const siblings = getSiblings(fromParentId);
                    const activeIndex = siblings.findIndex((c: any) => c.id === active.id);
                    const overIndex = siblings.findIndex((c: any) => c.id === over.id);

                    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                        moveComponent(activeIndex, overIndex, fromParentId);
                    }
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading builder...</p>
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-background">
                <BuilderToolbar />

                <div className="flex-1 flex overflow-hidden">
                    {!isPreviewMode && <ComponentPalette />}
                    <BuilderCanvas />
                    {!isPreviewMode && <PropertiesPanel />}
                </div>
            </div>

            <DragOverlay>
                {/* Optional: Add drag overlay content */}
            </DragOverlay>
        </DndContext>
    );
}
