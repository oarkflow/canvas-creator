import { BuilderComponent } from '@/types/builder';
import { useBuilderStore } from '@/stores/builderStore';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanvasComponentProps {
  component: BuilderComponent;
  index: number;
}

export function CanvasComponent({ component, index }: CanvasComponentProps) {
  const { selectedComponent, setSelectedComponent, deleteComponent, duplicateComponent, isPreviewMode } = useBuilderStore();
  
  const isSelected = selectedComponent?.id === component.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    data: {
      type: 'canvas',
      component,
      index,
    },
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

      case 'container':
      case 'card':
      case 'hero':
        return (
          <div style={styles}>
            {component.children && component.children.length > 0 ? (
              component.children.map((child, idx) => (
                <CanvasComponent key={child.id} component={child} index={idx} />
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                Drop components here
              </div>
            )}
          </div>
        );

      case 'grid':
        return (
          <div
            style={{
              ...styles,
              display: 'grid',
              gridTemplateColumns: `repeat(${component.styles.columns || 2}, 1fr)`,
              gap: component.styles.gap,
            }}
          >
            {component.children && component.children.length > 0 ? (
              component.children.map((child, idx) => (
                <CanvasComponent key={child.id} component={child} index={idx} />
              ))
            ) : (
              <>
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                  Column 1
                </div>
                <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg">
                  Column 2
                </div>
              </>
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
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'relative group',
        isDragging && 'opacity-50',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
      )}
      onClick={handleClick}
    >
      {/* Drag handle and actions */}
      <div
        className={cn(
          'absolute -left-10 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <div
          {...listeners}
          className="p-1.5 bg-surface-3 border border-border rounded cursor-grab hover:bg-surface-4"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Button
          variant="icon"
          size="icon"
          className="h-7 w-7 bg-surface-3 border border-border"
          onClick={handleDuplicate}
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          className="h-7 w-7 bg-surface-3 border border-border hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}
