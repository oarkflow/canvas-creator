import { useDraggable } from '@dnd-kit/core';
import { ComponentDefinition } from '@/features/builder/data/models/componentDefinitions';
import { cn } from '@/shared/lib/utils';

interface DraggableComponentProps {
    definition: ComponentDefinition;
}

export function DraggableComponent({ definition }: DraggableComponentProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${definition.type}`,
        data: {
            type: 'palette',
            componentType: definition.type,
        },
    });

    const Icon = definition.icon;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg cursor-grab',
                'bg-surface-3 border border-border/50 hover:border-primary/50',
                'transition-all duration-200 hover:bg-surface-4',
                'hover-lift select-none',
                isDragging && 'opacity-50 cursor-grabbing ring-2 ring-primary'
            )}
        >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
                {definition.label}
            </span>
        </div>
    );
}
