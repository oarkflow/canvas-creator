import { componentDefinitions } from '@/features/builder/data/models/componentDefinitions';
import { DraggableComponent } from './components/DraggableComponent';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';

export function ComponentPalette() {
    const layoutComponents = componentDefinitions.filter(d => d.category === 'layout');
    const basicComponents = componentDefinitions.filter(d => d.category === 'basic');
    const formComponents = componentDefinitions.filter(d => d.category === 'form');
    const mediaComponents = componentDefinitions.filter(d => d.category === 'media');

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
                                <DraggableComponent key={def.type} definition={def} />
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Basic Components */}
                    <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Basic
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {basicComponents.map(def => (
                                <DraggableComponent key={def.type} definition={def} />
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Form Components */}
                    <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Form
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {formComponents.map(def => (
                                <DraggableComponent key={def.type} definition={def} />
                            ))}
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Media Components */}
                    <div>
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Media
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {mediaComponents.map(def => (
                                <DraggableComponent key={def.type} definition={def} />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
