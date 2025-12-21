import {useEffect, useRef, useState} from 'react';
import {BuilderComponent} from '@/features/builder/types/builder';
import {useBuilderStore} from '@/features/builder/state/stores/builderStore';
import {cn} from '@/shared/lib/utils';
import {SortableContext, rectSortingStrategy, useSortable} from '@dnd-kit/sortable';
import {useDroppable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {Copy, GripVertical, Trash2} from 'lucide-react';
import {Button} from '@/shared/ui/button';
import {isContainerComponent} from '@/features/builder/data/models/componentDefinitions';

interface CanvasComponentProps {
	component: BuilderComponent;
	index: number;
	parentId?: string;
}

export function CanvasComponent({component, index, parentId}: CanvasComponentProps) {
	const {
		selectedComponent,
		hoveredComponentId,
		setSelectedComponent,
		deleteComponent,
		duplicateComponent,
		isPreviewMode,
		updateComponent,
	} = useBuilderStore();

	const isSelected = selectedComponent?.id === component.id;
	const isContainer = isContainerComponent(component.type);

	const contentRef = useRef<HTMLElement | null>(null);
	const resizeStartRef = useRef<{x: number; y: number; w: number; h: number} | null>(null);
	const [isResizing, setIsResizing] = useState(false);

	const {
		attributes,
		listeners,
		setNodeRef: setSortableRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: component.id,
		disabled: isPreviewMode || isResizing,
		data: {
			type: 'canvas',
			component,
			index,
			parentId,
		},
	});

	const {setNodeRef: setDroppableRef, isOver} = useDroppable({
		id: `container-${component.id}`,
		data: {
			type: 'container',
			containerId: component.id,
		},
		disabled: !isContainer || isPreviewMode,
	});

	const setContainerNodeRef = (node: HTMLElement | null) => {
		setDroppableRef(node);
		contentRef.current = node;
	};

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

	const handleResizeStart = (e: React.PointerEvent) => {
		e.stopPropagation();
		if (isPreviewMode) return;

		const node = contentRef.current;
		if (!node) return;

		const rect = node.getBoundingClientRect();
		resizeStartRef.current = {
			x: e.clientX,
			y: e.clientY,
			w: rect.width,
			h: rect.height,
		};
		setIsResizing(true);
		(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
	};

	useEffect(() => {
		if (!isResizing) return;

		const onMove = (e: PointerEvent) => {
			const start = resizeStartRef.current;
			if (!start) return;

			const nextW = Math.max(24, Math.round(start.w + (e.clientX - start.x)));
			const nextH = Math.max(24, Math.round(start.h + (e.clientY - start.y)));

			updateComponent(component.id, {
				styles: {
					...component.styles,
					width: `${nextW}px`,
					height: `${nextH}px`,
				},
			});
		};

		const onUp = () => {
			setIsResizing(false);
			resizeStartRef.current = null;
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp, {once: true});

		return () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
	}, [component.id, component.styles, isResizing, updateComponent]);

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
			case 'heading': {
				const HeadingTag = `h${component.props.level || 1}` as keyof JSX.IntrinsicElements;
				return <HeadingTag style={styles}>{component.props.content}</HeadingTag>;
			}

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
						style={{...styles, display: 'block'}}
					/>
				);

			case 'divider':
				return <hr style={{...styles, border: 'none', borderTop: '1px solid #374151'}}/>;

			case 'spacer':
				return <div style={styles}/>;

			case 'row':
				return (
					<div
						ref={setContainerNodeRef}
						style={{
							...styles,
							display: 'flex',
							flexWrap: 'wrap',
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
							<SortableContext
								items={component.children.map(c => c.id)}
								strategy={rectSortingStrategy}
							>
								{component.children.map((child, idx) => (
									<CanvasComponent key={child.id} component={child} index={idx} parentId={component.id}/>
								))}
							</SortableContext>
						) : (
							!isPreviewMode && (
								<div
									className="flex-1 text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg"
								>
									Drop columns or components here
								</div>
							)
						)}
					</div>
				);

			case 'column': {
				const width = component.styles.width;
				const span = component.styles.columnSpan || 1;
				const flex = width && width !== 'auto' ? `0 0 ${width}` : `${span} 1 0%`;

				return (
					<div
						ref={setContainerNodeRef}
						style={{
							...styles,
							flex,
							minWidth: 0,
						}}
						className={cn(
							'min-h-[60px] transition-all',
							isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
						)}
					>
						{component.children && component.children.length > 0 ? (
							<SortableContext
								items={component.children.map(c => c.id)}
								strategy={rectSortingStrategy}
							>
								<div className="space-y-2">
									{component.children.map((child, idx) => (
										<CanvasComponent key={child.id} component={child} index={idx} parentId={component.id}/>
									))}
								</div>
							</SortableContext>
						) : (
							!isPreviewMode && (
								<div
									className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg"
								>
									Drop here
								</div>
							)
						)}
					</div>
				);
			}

			case 'container':
			case 'card':
			case 'hero':
				return (
					<div
						ref={setContainerNodeRef}
						style={styles}
						className={cn(
							'min-h-[60px] transition-all',
							isOver && !isPreviewMode && 'ring-2 ring-primary ring-inset bg-primary/5'
						)}
					>
						{component.children && component.children.length > 0 ? (
							<SortableContext
								items={component.children.map(c => c.id)}
								strategy={rectSortingStrategy}
							>
								{component.children.map((child, idx) => (
									<CanvasComponent key={child.id} component={child} index={idx} parentId={component.id}/>
								))}
							</SortableContext>
						) : (
							!isPreviewMode && (
								<div
									className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border/50 rounded-lg"
								>
									Drop components here
								</div>
							)
						)}
					</div>
				);

			case 'grid':
				return (
					<div
						ref={setContainerNodeRef}
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
							<SortableContext
								items={component.children.map(c => c.id)}
								strategy={rectSortingStrategy}
							>
								{component.children.map((child, idx) => (
									<CanvasComponent key={child.id} component={child} index={idx} parentId={component.id}/>
								))}
							</SortableContext>
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
			data-component-id={component.id}
			style={style}
			{...attributes}
			className={cn(
				'relative',
				isDragging && 'opacity-50 z-50',
				isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg'
			)}
			onClick={handleClick}
		>
			{/* Drag handle and actions */}
			<div
				className={cn(
					'absolute -left-10 top-0 flex flex-col gap-1 transition-opacity z-50',
					(hoveredComponentId === component.id || isSelected) ? 'opacity-100' : 'opacity-0'
				)}
			>
				<div
					{...listeners}
					className="p-1.5 bg-card border border-border rounded cursor-grab hover:bg-secondary shadow-md"
				>
					<GripVertical className="w-4 h-4 text-muted-foreground"/>
				</div>
				<Button
					variant="icon"
					size="icon"
					className="h-7 w-7 bg-card border border-border shadow-md"
					onClick={handleDuplicate}
				>
					<Copy className="w-3 h-3"/>
				</Button>
				<Button
					variant="icon"
					size="icon"
					className="h-7 w-7 bg-card border border-border hover:bg-destructive hover:text-destructive-foreground shadow-md"
					onClick={handleDelete}
				>
					<Trash2 className="w-3 h-3"/>
				</Button>
			</div>

			{/* Resize handle (only on selected) */}
			{isSelected && (
				<div
					onPointerDown={handleResizeStart}
					className={cn(
						'absolute bottom-0 right-0 z-40 h-3 w-3 cursor-se-resize rounded-sm border border-border bg-card transition-opacity',
						(hoveredComponentId === component.id || isSelected) ? 'opacity-100' : 'opacity-0',
						isResizing && 'opacity-80'
					)}
					aria-label="Resize"
					title="Resize"
				/>
			)}

			{isContainer ? renderContent() : (
				<div ref={(node) => {
					contentRef.current = node;
				}}>
					{renderContent()}
				</div>
			)}
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

