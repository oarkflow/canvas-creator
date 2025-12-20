import {componentDefinitions} from '@/features/builder/data/models/componentDefinitions';
import {DraggableComponent} from './DraggableComponent';
import {ScrollArea} from '@/shared/ui/scroll-area';
import {Separator} from '@/shared/ui/separator';

export function ComponentPalette() {
	const layoutComponents = componentDefinitions.filter(d =>
		['row', 'container', 'card', 'grid', 'hero'].includes(d.type)
	);
	
	const basicComponents = componentDefinitions.filter(d =>
		['heading', 'paragraph', 'button', 'image'].includes(d.type)
	);
	
	const utilityComponents = componentDefinitions.filter(d =>
		['divider', 'spacer', 'column'].includes(d.type)
	);
	
	return (
		<div className="w-64 bg-card border-r border-border flex flex-col">
			<div className="p-4 border-b border-border">
				<h2 className="text-sm font-semibold text-foreground">Components</h2>
				<p className="text-xs text-muted-foreground mt-1">Drag to canvas</p>
			</div>
			
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					{/* Layout Components */}
					<div>
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
							Layout
						</h3>
						<div className="grid grid-cols-2 gap-2">
							{layoutComponents.map(def => (
								<DraggableComponent key={def.type} definition={def}/>
							))}
						</div>
					</div>
					
					<Separator className="bg-border/50"/>
					
					{/* Basic Components */}
					<div>
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
							Basic
						</h3>
						<div className="grid grid-cols-2 gap-2">
							{basicComponents.map(def => (
								<DraggableComponent key={def.type} definition={def}/>
							))}
						</div>
					</div>
					
					<Separator className="bg-border/50"/>
					
					{/* Utility Components */}
					<div>
						<h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
							Utility
						</h3>
						<div className="grid grid-cols-2 gap-2">
							{utilityComponents.map(def => (
								<DraggableComponent key={def.type} definition={def}/>
							))}
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
