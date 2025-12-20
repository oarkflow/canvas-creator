import { BuilderComponent } from '@/features/builder/types/builder';
import { useBuilderStore } from '@/features/builder/state/stores/builderStore';
import { cn } from '@/shared/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { isContainerComponent } from '@/features/builder/data/models/componentDefinitions';

interface CanvasComponentProps {
  component: BuilderComponent;
  index: number;
  parentId?: string;
}

export function CanvasComponent({ component, index, parentId }: CanvasComponentProps) {
  const { selectedComponent, setSelectedComponent, deleteComponent, duplicateComponent, isPreviewMode } = useBuilderStore();
  
  const isSelected = selectedComponent?.id === component.id;
  const isContainer = isContainerComponent(component.type);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    data: {
      type: 'canvas',
      component,
      index,
      parentId,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `container-${component.id}`,
    data: {
      type: 'container',
      containerId: component.id,
    },
    disabled: !isContainer || isPreviewMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPreviewMode) {
      setSelectedComponent(component);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteComponent(component.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateComponent(component.id);
  };

  const renderContent = () => {
    const styles: React.CSSProperties = {
      backgroundColor: component.styles.backgroundColor,
      color: component.styles.textColor,
      fontSize: component.styles.fontSize,
      fontWeight: component.styles.fontWeight as React.CSSProperties['fontWeight'],
      textAlign: component.styles.textAlign,
      padding: component.styles.padding,
      margin: component.styles.margin,
      borderRadius: component.styles.borderRadius,
      width: component.styles.width,
      height: component.styles.height,
    };

    switch (component.type) {
      case 'heading':
        const HeadingTag = `h${component.props.level || 1}` as keyof JSX.IntrinsicElements;
        return <HeadingTag style={styles}>{component.props.content}</HeadingTag>;

      case 'paragraph':
        return <p style={styles}>{component.props.content}</p>;

      case 'button':
        return (
          <button
            style={{
              ...styles,
              backgroundColor: component.props.variant === 'primary' ? '#22d3ee' : '#374151',
              color: component.props.variant === 'primary' ? '#0a0a0f' : '#f9fafb',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {component.props.content}
          </button>
        );

      case 'image':
        return (
          <img
            src={component.props.src}
            alt={component.props.alt || ''}
            style={{ ...styles, display: 'block' }}
          />
        );

      case 'divider':
        return <hr style={{ ...styles, border: 'none', borderTop: '1px solid #374151' }} />;

      case 'spacer':
        return <div style={styles} />;

      case 'row':
        return (
          <div
            ref={setDroppableRef}
            style={{
              ...styles,
              display: 'flex',
              flexDirection: component.styles.flexDirection || 'row',
              gap: component.styles.gap,
              justifyContent: getFlexValue(component.styles.justifyContent),
              alignItems: getFlexValue(component.styles.alignItems),
            }}
            className={cn(
              'min-h-[60px] transition-all',
              isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
            )}
          >
            {component.children && component.children.length > 0 ? (
              component.children.map((child, idx) => (
                <CanvasComponent key={child.id} component={child} index={idx} parentId={component.id} />
              ))
            ) : (
              !isPreviewMode && (
                <div className="flex-1 text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                  Drop columns or components here
                </div>
              )
            )}
          </div>
        );

      case 'column':
        return (
          <div
            ref={setDroppableRef}
            style={{
              ...styles,
              flex: component.styles.columnSpan || 1,
              minWidth: 0,
            }}
            className={cn(
              'min-h-[60px] transition-all',
              isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
            )}
          >
            {component.children && component.children.length > 0 ? (
              <div className="space-y-2">
                {component.children.map((child, idx) => (
                  <CanvasComponent key={child.id} component={child} index={idx} parentId={component.id} />
                ))}
              </div>
            ) : (
              !isPreviewMode && (
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                  Drop here
                </div>
              )
            )}
          </div>
        );

      case 'container':
      case 'card':
      case 'hero':
        return (
          <div
            ref={setDroppableRef}
            style={styles}
            className={cn(
              'min-h-[60px] transition-all',
              isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
            )}
          >
            {component.children && component.children.length > 0 ? (
              component.children.map((child, idx) => (
                <CanvasComponent key={child.id} component={child} index={idx} parentId={component.id} />
              ))
            ) : (
              !isPreviewMode && (
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                  Drop components here
                </div>
              )
            )}
          </div>
        );

      case 'grid':
        return (
          <div
            ref={setDroppableRef}
            style={{
              ...styles,
              display: 'grid',
              gridTemplateColumns: `repeat(${component.styles.columns || 2}, 1fr)`,
              gap: component.styles.gap,
            }}
            className={cn(
              'min-h-[60px] transition-all',
              isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
            )}
          >
            {component.children && component.children.length > 0 ? (
              component.children.map((child, idx) => (
                <CanvasComponent key={child.id} component={child} index={idx} parentId={component.id} />
              ))
            ) : (
              !isPreviewMode && (
                <>
                  <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                    Column 1
                  </div>
                  <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                    Column 2
                  </div>
                </>
              )
            )}
          </div>
        );

      default:
        return <div style={styles}>{component.props.content}</div>;
    }
  };

  if (isPreviewMode) {
    return renderContent();
  }

  return (
    <div
      ref={setSortableRef}
      style={style}
      {...attributes}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}
      onClick={handleClick}
    >
      {/* Drag handle and actions - fixed z-index */}
      <div
        className={cn(
          'absolute -left-10 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50',
          isSelected && 'opacity-100'
        )}
      >
        <div
          {...listeners}
          className="p-1.5 bg-card border border-border rounded cursor-grab hover:bg-secondary shadow-md"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Button
          variant="icon"
          size="icon"
          className="h-7 w-7 bg-card border border-border shadow-md"
          onClick={handleDuplicate}
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          className="h-7 w-7 bg-card border border-border hover:bg-destructive hover:text-destructive-foreground shadow-md"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}

function getFlexValue(value?: string): string | undefined {
  if (!value) return undefined;
  const mapping: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    stretch: 'stretch',
  };
  return mapping[value] || value;
}
