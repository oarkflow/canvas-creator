import { setup, render, mutable, derived, effect } from '@anchorlib/react';
import { useBuilderStore } from '@/features/builder/state/stores/builderStore';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Switch } from '@/shared/ui/switch';
import { getComponentDefinition } from '@/features/builder/data/models/componentDefinitions';
import { VariableInput } from '@/features/builder/views/components/VariableInput';
import { Box, FormInput, LayoutGrid, Link, Palette, Play, Settings, Trash2 } from 'lucide-react';

function createDebouncedCommit<T>(getValue: () => T, onCommit: (v: T) => void, delay = 250) {
    const state = mutable({ local: getValue(), timer: null as number | null });

    // Sync when external value changes
    effect(() => {
        state.local = getValue();
    });

    // Cleanup timer on unmount
    effect(() => {
        return () => {
            if (state.timer) window.clearTimeout(state.timer);
        };
    });

    const setLocal = (next: T) => {
        state.local = next;
        if (state.timer) window.clearTimeout(state.timer);
        state.timer = window.setTimeout(() => {
            onCommit(next);
            state.timer = null;
        }, delay);
    };

    const flush = () => {
        if (state.timer) {
            window.clearTimeout(state.timer);
            state.timer = null;
        }
        onCommit(state.local);
    };

    // expose helpers
    (state as any).setLocal = setLocal;
    (state as any).flush = flush;

    return state;
}

export const PropertiesPanel = setup(() => {
    const selectedComponent = useBuilderStore((s) => s.selectedComponent);
    const updateComponent = useBuilderStore((s) => s.updateComponent);
    const deleteComponent = useBuilderStore((s) => s.deleteComponent);

    const definition = derived(() => (selectedComponent ? getComponentDefinition(selectedComponent.type) : undefined));


    const handlePropChange = (key: string, valueOrEvent: any) => {
        if (!selectedComponent) return;

        // If an event was passed, prevent propagation and extract the value
        if (valueOrEvent && typeof valueOrEvent === 'object' && 'target' in valueOrEvent) {
            const e = valueOrEvent as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
            console.log(valueOrEvent)
            try {
                e.preventDefault();
                e.stopPropagation();
                throw new Error('Test');
            } catch { }
            const val = (e.target as HTMLInputElement).value;
            updateComponent(selectedComponent.id, {
                props: { ...selectedComponent.props, [key]: val },
            });
            return;
        }

        updateComponent(selectedComponent.id, {
            props: { ...selectedComponent.props, [key]: valueOrEvent },
        });
    };

    const handleStyleChange = (key: string, valueOrEvent: any) => {
        if (!selectedComponent) return;

        // Support passing the raw value or an event. If event, prevent defaults and extract.
        if (valueOrEvent && typeof valueOrEvent === 'object' && 'target' in valueOrEvent) {
            const e = valueOrEvent as React.ChangeEvent<HTMLInputElement>;
            try {
                e.preventDefault();
                e.stopPropagation();
            } catch { }
            const val = (e.target as HTMLInputElement).value;
            updateComponent(selectedComponent.id, {
                styles: { ...selectedComponent.styles, [key]: val },
            });
            return;
        }

        updateComponent(selectedComponent.id, {
            styles: { ...selectedComponent.styles, [key]: valueOrEvent },
        });
    };

    const handleDelete = () => {
        if (!selectedComponent) return;
        deleteComponent(selectedComponent.id);
    };

    if (!selectedComponent) {
        return render(() => (
            <aside className="w-72 bg-card border-l border-border flex flex-col" aria-label="Properties panel">
                <div className="p-4 border-b border-border">
                    <h2 className="text-sm font-semibold text-foreground">Properties</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <Settings className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Select a component to edit its properties</p>
                    </div>
                </div>
            </aside>
        ));
    }

    const isFormComponent = derived(() => Boolean(selectedComponent) && ['input', 'textarea', 'select', 'checkbox', 'radio', 'date', 'datetime'].includes(selectedComponent.type));
    const isMediaComponent = derived(() => Boolean(selectedComponent) && ['anchor', 'video', 'audio', 'webcam'].includes(selectedComponent.type));

    // Buffered fields (avoid store updates on every keystroke -> prevents focus loss)
    const labelField = createDebouncedCommit(() => selectedComponent?.props.label || '', (v) => handlePropChange('label', v));
    const nameField = createDebouncedCommit(() => selectedComponent?.props.name || '', (v) => handlePropChange('name', v));
    const placeholderField = createDebouncedCommit(
        () => selectedComponent?.props.placeholder || '',
        (v) => handlePropChange('placeholder', v)
    );

    const hrefField = createDebouncedCommit(() => selectedComponent?.props.href || '', (v) => handlePropChange('href', v));
    const mediaSrcField = createDebouncedCommit(() => selectedComponent?.props.src || '', (v) => handlePropChange('src', v));
    const posterField = createDebouncedCommit(() => selectedComponent?.props.poster || '', (v) => handlePropChange('poster', v));

    const gapField = createDebouncedCommit(() => selectedComponent?.styles.gap || '', (v) => handleStyleChange('gap', v));
    const colWidthField = createDebouncedCommit(() => selectedComponent?.styles.width || '', (v) => handleStyleChange('width', v));
    const fontSizeField = createDebouncedCommit(() => selectedComponent?.styles.fontSize || '', (v) => handleStyleChange('fontSize', v));
    const paddingField = createDebouncedCommit(() => selectedComponent?.styles.padding || '', (v) => handleStyleChange('padding', v));
    const marginField = createDebouncedCommit(() => selectedComponent?.styles.margin || '', (v) => handleStyleChange('margin', v));
    const radiusField = createDebouncedCommit(
        () => selectedComponent?.styles.borderRadius || '',
        (v) => handleStyleChange('borderRadius', v)
    );

    const handleOptionChange = (index: number, field: 'label' | 'value', newValue: string) => {
        const options = [...(selectedComponent.props.options || [])];
        options[index] = { ...options[index], [field]: newValue };
        handlePropChange('options', options);
    };

    const addOption = () => {
        const options = [...(selectedComponent.props.options || [])];
        options.push({ label: `Option ${options.length + 1}`, value: `option-${options.length + 1}` });
        handlePropChange('options', options);
    };

    const removeOption = (index: number) => {
        const options = [...(selectedComponent.props.options || [])];
        options.splice(index, 1);
        handlePropChange('options', options);
    };

    return render(() => (
        <aside className="w-72 bg-card border-l border-border flex flex-col" aria-label="Properties panel">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {(() => {
                            const Icon = definition.value?.icon;
                            return Icon ? <Icon className="w-4 h-4 text-primary" /> : null;
                        })()}
                        <h2 className="text-sm font-semibold text-foreground">{definition.value?.label || 'Component'}</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">ID: {selectedComponent.id.slice(0, 8)}</p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Content */}
                    <section aria-label="Content settings">
                        <div className="flex items-center gap-2 mb-3">
                            <Box className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</h3>
                        </div>

                        {selectedComponent.props.content !== undefined && (
                            <div className="space-y-2 mb-4">
                                <Label className="text-xs">Text Content</Label>
                                <VariableInput
                                    value={selectedComponent.props.content || ''}
                                    onChange={(e) => {
                                        handlePropChange('content', e)
                                    }}
                                    multiline={selectedComponent.type === 'paragraph'}
                                />
                            </div>
                        )}

                        {selectedComponent.type === 'heading' && (
                            <div className="space-y-2 mb-4">
                                <Label className="text-xs">Heading Level</Label>
                                <Select
                                    value={String(selectedComponent.props.level || 1)}
                                    onValueChange={(v) => handlePropChange('level', { target: { value: parseInt(v) } })}
                                >
                                    <SelectTrigger className="bg-secondary border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">H1</SelectItem>
                                        <SelectItem value="2">H2</SelectItem>
                                        <SelectItem value="3">H3</SelectItem>
                                        <SelectItem value="4">H4</SelectItem>
                                        <SelectItem value="5">H5</SelectItem>
                                        <SelectItem value="6">H6</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedComponent.type === 'button' && (
                            <div className="space-y-2 mb-4">
                                <Label className="text-xs">Variant</Label>
                                <Select value={selectedComponent.props.variant || 'primary'} onValueChange={(v) => handlePropChange('variant', { target: { value: v } })}>
                                    <SelectTrigger className="bg-secondary border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="primary">Primary</SelectItem>
                                        <SelectItem value="secondary">Secondary</SelectItem>
                                        <SelectItem value="outline">Outline</SelectItem>
                                        <SelectItem value="ghost">Ghost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedComponent.type === 'image' && (
                            <>
                                <div className="space-y-2 mb-4">
                                    <Label className="text-xs">Image URL</Label>
                                    <VariableInput
                                        value={selectedComponent.props.src || ''}
                                        onChange={(v) => handlePropChange('src', v)}
                                        placeholder="https://... or {{datasource.url}}"
                                    />
                                </div>
                                <div className="space-y-2 mb-4">
                                    <Label className="text-xs">Alt Text</Label>
                                    <VariableInput value={selectedComponent.props.alt || ''} onChange={(v) => handlePropChange('alt', v)} />
                                </div>
                            </>
                        )}
                    </section>

                    {/* Form Settings */}
                    {isFormComponent.value && (
                        <>
                            <Separator className="bg-border/50" />
                            <section aria-label="Form settings">
                                <div className="flex items-center gap-2 mb-3">
                                    <FormInput className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Form Settings</h3>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <Label className="text-xs">Label</Label>
                                    <Input
                                        value={(labelField as any).local}
                                        onChange={(e) => (labelField as any).setLocal(e.target.value)}
                                        onBlur={(labelField as any).flush}
                                        className="bg-secondary border-border"
                                    />
                                </div>

                                <div className="space-y-2 mb-4">
                                    <Label className="text-xs">Name (form field)</Label>
                                    <Input
                                        value={(nameField as any).local}
                                        onChange={(e) => (nameField as any).setLocal(e.target.value)}
                                        onBlur={(nameField as any).flush}
                                        className="bg-secondary border-border"
                                    />
                                </div>

                                {['input', 'textarea', 'select', 'date', 'datetime'].includes(selectedComponent.type) && (
                                    <div className="space-y-2 mb-4">
                                        <Label className="text-xs">Placeholder</Label>
                                        <Input
                                            value={(placeholderField as any).local}
                                            onChange={(e) => (placeholderField as any).setLocal(e.target.value)}
                                            onBlur={(placeholderField as any).flush}
                                            className="bg-secondary border-border"
                                        />
                                    </div>
                                )}

                                {selectedComponent.type === 'input' && (
                                    <div className="space-y-2 mb-4">
                                        <Label className="text-xs">Input Type</Label>
                                        <Select value={selectedComponent.props.inputType || 'text'} onValueChange={(v) => handlePropChange('inputType', { target: { value: v } })}>
                                            <SelectTrigger className="bg-secondary border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="password">Password</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="tel">Phone</SelectItem>
                                                <SelectItem value="url">URL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {(selectedComponent.type === 'select' || selectedComponent.type === 'radio') && (
                                    <div className="space-y-2 mb-4">
                                        <Label className="text-xs">Options</Label>
                                        <div className="space-y-2">
                                            {selectedComponent.props.options?.map((opt, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <Input
                                                        value={opt.label}
                                                        onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                                                        placeholder="Label"
                                                        className="flex-1 bg-secondary border-border text-xs"
                                                    />
                                                    <Input
                                                        value={opt.value}
                                                        onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                                                        placeholder="Value"
                                                        className="flex-1 bg-secondary border-border text-xs"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                        onClick={() => removeOption(idx)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" className="w-full" onClick={addOption}>
                                                Add Option
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {selectedComponent.type === 'select' && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-xs">Multi-select</Label>
                                            <Switch checked={selectedComponent.props.multiSelect || false} onCheckedChange={(v) => handlePropChange('multiSelect', { target: { value: v } })} />
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-xs">Filterable</Label>
                                            <Switch checked={selectedComponent.props.filterable || false} onCheckedChange={(v) => handlePropChange('filterable', { target: { value: v } })} />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center justify-between mb-4">
                                    <Label className="text-xs">Required</Label>
                                    <Switch checked={selectedComponent.props.required || false} onCheckedChange={(v) => handlePropChange('required', { target: { value: v } })} />
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <Label className="text-xs">Disabled</Label>
                                    <Switch checked={selectedComponent.props.disabled || false} onCheckedChange={(v) => handlePropChange('disabled', { target: { value: v } })} />
                                </div>
                            </section>
                        </>
                    )}

                    {/* Media Settings */}
                    {isMediaComponent.value && (
                        <>
                            <Separator className="bg-border/50" />
                            <section aria-label="Media settings">
                                <div className="flex items-center gap-2 mb-3">
                                    {selectedComponent.type === 'anchor' ? <Link className="w-4 h-4 text-muted-foreground" /> : <Play className="w-4 h-4 text-muted-foreground" />}
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Media Settings</h3>
                                </div>

                                {selectedComponent.type === 'anchor' && (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Link URL</Label>
                                            <Input
                                                value={(hrefField as any).local}
                                                onChange={(e) => (hrefField as any).setLocal(e.target.value)}
                                                onBlur={(hrefField as any).flush}
                                                placeholder="https://..."
                                                className="bg-secondary border-border"
                                            />
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Target</Label>
                                            <Select value={selectedComponent.props.target || '_self'} onValueChange={(v) => handlePropChange('target', { target: { value: v } })}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_self">Same Tab</SelectItem>
                                                    <SelectItem value="_blank">New Tab</SelectItem>
                                                    <SelectItem value="_parent">Parent Frame</SelectItem>
                                                    <SelectItem value="_top">Full Window</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {(selectedComponent.type === 'video' || selectedComponent.type === 'audio') && (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Source URL</Label>
                                            <Input
                                                value={(mediaSrcField as any).local}
                                                onChange={(e) => (mediaSrcField as any).setLocal(e.target.value)}
                                                onBlur={(mediaSrcField as any).flush}
                                                placeholder="https://..."
                                                className="bg-secondary border-border"
                                            />
                                        </div>

                                        {selectedComponent.type === 'video' && (
                                            <div className="space-y-2 mb-4">
                                                <Label className="text-xs">Poster Image</Label>
                                                <Input
                                                    value={(posterField as any).local}
                                                    onChange={(e) => (posterField as any).setLocal(e.target.value)}
                                                    onBlur={(posterField as any).flush}
                                                    placeholder="https://..."
                                                    className="bg-secondary border-border"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-xs">Controls</Label>
                                            <Switch checked={selectedComponent.props.controls ?? true} onCheckedChange={(v) => handlePropChange('controls', { target: { value: v } })} />
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-xs">Autoplay</Label>
                                            <Switch checked={selectedComponent.props.autoplay || false} onCheckedChange={(v) => handlePropChange('autoplay', { target: { value: v } })} />
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-xs">Loop</Label>
                                            <Switch checked={selectedComponent.props.loop || false} onCheckedChange={(v) => handlePropChange('loop', { target: { value: v } })} />
                                        </div>

                                        {selectedComponent.type === 'video' && (
                                            <div className="flex items-center justify-between mb-4">
                                                <Label className="text-xs">Muted</Label>
                                                <Switch checked={selectedComponent.props.muted || false} onCheckedChange={(v) => handlePropChange('muted', { target: { value: v } })} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        </>
                    )}

                    {/* Layout */}
                    {(selectedComponent.type === 'row' || selectedComponent.type === 'column') && (
                        <>
                            <Separator className="bg-border/50" />
                            <section aria-label="Layout settings">
                                <div className="flex items-center gap-2 mb-3">
                                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layout</h3>
                                </div>

                                {selectedComponent.type === 'row' && (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Direction</Label>
                                            <Select value={selectedComponent.styles.flexDirection || 'row'} onValueChange={(v) => handleStyleChange('flexDirection', { target: { value: v } })}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="row">Horizontal</SelectItem>
                                                    <SelectItem value="column">Vertical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Justify Content</Label>
                                            <Select value={selectedComponent.styles.justifyContent || 'start'} onValueChange={(v) => handleStyleChange('justifyContent', { target: { value: v } })}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="start">Start</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="end">End</SelectItem>
                                                    <SelectItem value="between">Space Between</SelectItem>
                                                    <SelectItem value="around">Space Around</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Align Items</Label>
                                            <Select value={selectedComponent.styles.alignItems || 'stretch'} onValueChange={(v) => handleStyleChange('alignItems', { target: { value: v } })}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="start">Start</SelectItem>
                                                    <SelectItem value="center">Center</SelectItem>
                                                    <SelectItem value="end">End</SelectItem>
                                                    <SelectItem value="stretch">Stretch</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {selectedComponent.type === 'column' && (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Column Span (Flex)</Label>
                                            <Select value={String(selectedComponent.styles.columnSpan || 1)} onValueChange={(v) => handleStyleChange('columnSpan', parseInt(v))}>
                                                <SelectTrigger className="bg-secondary border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 (Equal)</SelectItem>
                                                    <SelectItem value="2">2 (Double)</SelectItem>
                                                    <SelectItem value="3">3 (Triple)</SelectItem>
                                                    <SelectItem value="4">4 (Quadruple)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Label className="text-xs">Width</Label>
                                            <Input
                                                value={(colWidthField as any).local}
                                                onChange={(e) => (colWidthField as any).setLocal(e.target.value)}
                                                onBlur={(colWidthField as any).flush}
                                                placeholder="auto, 50%, 200px"
                                                className="bg-secondary border-border"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2 mb-4">
                                    <Label className="text-xs">Gap</Label>
                                    <Input
                                        value={(gapField as any).local}
                                        onChange={(e) => (gapField as any).setLocal(e.target.value)}
                                        onBlur={(gapField as any).flush}
                                        placeholder="16px"
                                        className="bg-secondary border-border"
                                    />
                                </div>
                            </section>
                        </>
                    )}

                    {/* Styles */}
                    <Separator className="bg-border/50" />
                    <section aria-label="Style settings">
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Styles</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs">Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={selectedComponent.styles.backgroundColor || '#000000'}
                                        onChange={(e) => handleStyleChange('backgroundColor', e)}
                                        className="w-10 h-9 p-1 bg-secondary border-border cursor-pointer"
                                    />
                                    <Input
                                        value={selectedComponent.styles.backgroundColor || ''}
                                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                        placeholder="#000000"
                                        className="flex-1 bg-secondary border-border text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs">Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={selectedComponent.styles.textColor || '#ffffff'}
                                        onChange={(e) => handleStyleChange('textColor', e)}
                                        className="w-10 h-9 p-1 bg-secondary border-border cursor-pointer"
                                    />
                                    <Input
                                        value={selectedComponent.styles.textColor || ''}
                                        onChange={(e) => handleStyleChange('textColor', e.target.value)}
                                        placeholder="#ffffff"
                                        className="flex-1 bg-secondary border-border text-xs"
                                    />
                                </div>
                            </div>

                            {isFormComponent.value && (
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-xs">Border Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={selectedComponent.styles.borderColor || '#374151'}
                                            onChange={(e) => handleStyleChange('borderColor', e)}
                                            className="w-10 h-9 p-1 bg-secondary border-border cursor-pointer"
                                        />
                                        <Input
                                            value={selectedComponent.styles.borderColor || ''}
                                            onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                                            placeholder="#374151"
                                            className="flex-1 bg-secondary border-border text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs">Font Size</Label>
                                <Input
                                    value={(fontSizeField as any).local}
                                    onChange={(e) => (fontSizeField as any).setLocal(e.target.value)}
                                    onBlur={(fontSizeField as any).flush}
                                    placeholder="16px"
                                    className="bg-secondary border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Font Weight</Label>
                                <Select value={selectedComponent.styles.fontWeight || '400'} onValueChange={(v) => handleStyleChange('fontWeight', v)}>
                                    <SelectTrigger className="bg-secondary border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="300">Light</SelectItem>
                                        <SelectItem value="400">Regular</SelectItem>
                                        <SelectItem value="500">Medium</SelectItem>
                                        <SelectItem value="600">Semibold</SelectItem>
                                        <SelectItem value="700">Bold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Text Align</Label>
                                <Select value={selectedComponent.styles.textAlign || 'left'} onValueChange={(v) => handleStyleChange('textAlign', v)}>
                                    <SelectTrigger className="bg-secondary border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Padding</Label>
                                <Input
                                    value={(paddingField as any).local}
                                    onChange={(e) => (paddingField as any).setLocal(e.target.value)}
                                    onBlur={(paddingField as any).flush}
                                    placeholder="16px"
                                    className="bg-secondary border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Margin</Label>
                                <Input
                                    value={(marginField as any).local}
                                    onChange={(e) => (marginField as any).setLocal(e.target.value)}
                                    onBlur={(marginField as any).flush}
                                    placeholder="0px"
                                    className="bg-secondary border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Border Radius</Label>
                                <Input
                                    value={(radiusField as any).local}
                                    onChange={(e) => (radiusField as any).setLocal(e.target.value)}
                                    onBlur={(radiusField as any).flush}
                                    placeholder="8px"
                                    className="bg-secondary border-border"
                                />
                            </div>

                            {selectedComponent.type === 'grid' && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Columns</Label>
                                    <Select value={String(selectedComponent.styles.columns || 2)} onValueChange={(v) => handleStyleChange('columns', parseInt(v))}>
                                        <SelectTrigger className="bg-secondary border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="4">4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </section>

                    <Separator className="bg-border/50" />
                    <Button variant="destructive" className="w-full" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Component
                    </Button>
                </div>
            </ScrollArea>
        </aside>
    ));
});
