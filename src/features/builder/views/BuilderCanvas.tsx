import {useDroppable} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {useBuilderStore} from '@/features/builder/state/stores/builderStore';
import {CanvasComponent} from './CanvasComponent';
import {cn} from '@/shared/lib/utils';
import {ScrollArea} from '@/shared/ui/scroll-area';
import {Layers} from 'lucide-react';

export function BuilderCanvas() {
	const {
		currentPage,
		setSelectedComponent,
		isPreviewMode,
		isDragging,
		setHoveredComponentId,
	} = useBuilderStore();

	const {setNodeRef, isOver} = useDroppable({
		id: 'canvas',
		data: {
			type: 'canvas',
			parentId: undefined,
		},
	});

	const handleCanvasClick = () => {
		setSelectedComponent(null);
	};

	const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
		if (isPreviewMode) return;
		const target = e.target as HTMLElement | null;
		const el = target?.closest?.('[data-component-id]') as HTMLElement | null;
		setHoveredComponentId(el?.dataset.componentId || null);
	};

	const handlePointerLeave: React.PointerEventHandler<HTMLDivElement> = () => {
		setHoveredComponentId(null);
	};

	const components = currentPage?.components || [];
	
	if (!currentPage) {
		return (
			<div className="flex-1 flex items-center justify-center bg-background">
				<div className="text-center">
					<Layers className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4"/>
					<h2 className="text-xl font-semibold text-foreground mb-2">No Page Selected</h2>
					<p className="text-muted-foreground">Select a page from the toolbar or create a new one</p>
				</div>
			</div>
		);
	}
	
	return (
		<div className="flex-1 bg-background overflow-hidden" onClick={handleCanvasClick}>
			<ScrollArea className="h-full">
				<div className="min-h-full p-8">
					<div
						ref={setNodeRef}
						onPointerMove={handlePointerMove}
						onPointerLeave={handlePointerLeave}
						className={cn(
							'max-w-4xl mx-auto min-h-[600px] rounded-xl transition-all duration-200',
							!isPreviewMode && 'bg-surface-2 shadow-lg border border-border canvas-grid',
							isPreviewMode && 'bg-background',
							isOver && 'ring-2 ring-primary ring-offset-4 ring-offset-background',
							isDragging && 'drop-indicator'
						)}
					>
						{components.length === 0 ? (
							<div className="h-full min-h-[600px] flex items-center justify-center">
								<div className="text-center p-8">
									<div
										className="w-20 h-20 mx-auto mb-4 rounded-xl bg-surface-3 border-2 border-dashed border-border flex items-center justify-center">
										<Layers className="w-8 h-8 text-muted-foreground/50"/>
									</div>
									<h3 className="text-lg font-medium text-foreground mb-2">
										Start Building
									</h3>
									<p className="text-muted-foreground text-sm max-w-xs">
										Drag and drop components from the sidebar to start building your page
									</p>
								</div>
							</div>
						) : (
							<div className="p-6">
								<SortableContext
									items={components.map(c => c.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="space-y-4 pl-10">
										{components.map((component, index) => (
											<CanvasComponent
												key={component.id}
												component={component}
												index={index}
											/>
										))}
									</div>
								</SortableContext>
							</div>
						)}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
