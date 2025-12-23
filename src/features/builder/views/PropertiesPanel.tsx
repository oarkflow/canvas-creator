import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

function useDebouncedCommit<T>(value: T, onCommit: (v: T) => void, delay = 250) {
  const [local, setLocal] = useState<T>(value);
  const timerRef = useRef<number | null>(null);

  // Sync when external value changes (e.g. selecting different component)
  useEffect(() => {
    setLocal(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleCommit = useCallback(
    (next: T) => {
      setLocal(next);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onCommit(next);
        timerRef.current = null;
      }, delay);
    },
    [delay, onCommit]
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onCommit(local);
  }, [local, onCommit]);

  return { local, setLocal: scheduleCommit, flush };
}

export function PropertiesPanel() {
  const selectedComponent = useBuilderStore((s) => s.selectedComponent);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const deleteComponent = useBuilderStore((s) => s.deleteComponent);

  const definition = useMemo(
    () => (selectedComponent ? getComponentDefinition(selectedComponent.type) : undefined),
    [selectedComponent]
  );

  const handlePropChange = useCallback(
    (key: string, value: string | number | boolean | Array<{ label: string; value: string }>) => {
      if (!selectedComponent) return;
      updateComponent(selectedComponent.id, {
        props: { ...selectedComponent.props, [key]: value },
      });
    },
    [selectedComponent, updateComponent]
  );

  const handleStyleChange = useCallback(
    (key: string, value: string | number) => {
      if (!selectedComponent) return;
      updateComponent(selectedComponent.id, {
        styles: { ...selectedComponent.styles, [key]: value },
      });
    },
    [selectedComponent, updateComponent]
  );

  const handleDelete = useCallback(() => {
    if (!selectedComponent) return;
    deleteComponent(selectedComponent.id);
  }, [deleteComponent, selectedComponent]);

  if (!selectedComponent) {
    return (
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
    );
  }

  const isFormComponent = ['input', 'textarea', 'select', 'checkbox', 'radio', 'date', 'datetime'].includes(
    selectedComponent.type
  );
  const isMediaComponent = ['anchor', 'video', 'audio', 'webcam'].includes(selectedComponent.type);

  // Buffered fields (avoid store updates on every keystroke -> prevents focus loss)
  const labelField = useDebouncedCommit(selectedComponent.props.label || '', (v) => handlePropChange('label', v));
  const nameField = useDebouncedCommit(selectedComponent.props.name || '', (v) => handlePropChange('name', v));
  const placeholderField = useDebouncedCommit(
    selectedComponent.props.placeholder || '',
    (v) => handlePropChange('placeholder', v)
  );

  const hrefField = useDebouncedCommit(selectedComponent.props.href || '', (v) => handlePropChange('href', v));
  const mediaSrcField = useDebouncedCommit(selectedComponent.props.src || '', (v) => handlePropChange('src', v));
  const posterField = useDebouncedCommit(selectedComponent.props.poster || '', (v) => handlePropChange('poster', v));

  const gapField = useDebouncedCommit(selectedComponent.styles.gap || '', (v) => handleStyleChange('gap', v));
  const colWidthField = useDebouncedCommit(selectedComponent.styles.width || '', (v) => handleStyleChange('width', v));
  const fontSizeField = useDebouncedCommit(selectedComponent.styles.fontSize || '', (v) => handleStyleChange('fontSize', v));
  const paddingField = useDebouncedCommit(selectedComponent.styles.padding || '', (v) => handleStyleChange('padding', v));
  const marginField = useDebouncedCommit(selectedComponent.styles.margin || '', (v) => handleStyleChange('margin', v));
  const radiusField = useDebouncedCommit(
    selectedComponent.styles.borderRadius || '',
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

  return (
    <aside className="w-72 bg-card border-l border-border flex flex-col" aria-label="Properties panel">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {definition && <definition.icon className="w-4 h-4 text-primary" />}
            <h2 className="text-sm font-semibold text-foreground">{definition?.label || 'Component'}</h2>
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
                  onChange={(v) => handlePropChange('content', v)}
                  multiline={selectedComponent.type === 'paragraph'}
                />
              </div>
            )}

            {selectedComponent.type === 'heading' && (
              <div className="space-y-2 mb-4">
                <Label className="text-xs">Heading Level</Label>
                <Select
                  value={String(selectedComponent.props.level || 1)}
                  onValueChange={(v) => handlePropChange('level', parseInt(v))}
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
                <Select value={selectedComponent.props.variant || 'primary'} onValueChange={(v) => handlePropChange('variant', v)}>
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
          {isFormComponent && (
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
                    value={labelField.local}
                    onChange={(e) => labelField.setLocal(e.target.value)}
                    onBlur={labelField.flush}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label className="text-xs">Name (form field)</Label>
                  <Input
                    value={nameField.local}
                    onChange={(e) => nameField.setLocal(e.target.value)}
                    onBlur={nameField.flush}
                    className="bg-secondary border-border"
                  />
                </div>

                {['input', 'textarea', 'select', 'date', 'datetime'].includes(selectedComponent.type) && (
                  <div className="space-y-2 mb-4">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={placeholderField.local}
                      onChange={(e) => placeholderField.setLocal(e.target.value)}
                      onBlur={placeholderField.flush}
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                {selectedComponent.type === 'input' && (
                  <div className="space-y-2 mb-4">
                    <Label className="text-xs">Input Type</Label>
                    <Select value={selectedComponent.props.inputType || 'text'} onValueChange={(v) => handlePropChange('inputType', v)}>
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
                      <Switch checked={selectedComponent.props.multiSelect || false} onCheckedChange={(v) => handlePropChange('multiSelect', v)} />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xs">Filterable</Label>
                      <Switch checked={selectedComponent.props.filterable || false} onCheckedChange={(v) => handlePropChange('filterable', v)} />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between mb-4">
                  <Label className="text-xs">Required</Label>
                  <Switch checked={selectedComponent.props.required || false} onCheckedChange={(v) => handlePropChange('required', v)} />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <Label className="text-xs">Disabled</Label>
                  <Switch checked={selectedComponent.props.disabled || false} onCheckedChange={(v) => handlePropChange('disabled', v)} />
                </div>
              </section>
            </>
          )}

          {/* Media Settings */}
          {isMediaComponent && (
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
                        value={hrefField.local}
                        onChange={(e) => hrefField.setLocal(e.target.value)}
                        onBlur={hrefField.flush}
                        placeholder="https://..."
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2 mb-4">
                      <Label className="text-xs">Target</Label>
                      <Select value={selectedComponent.props.target || '_self'} onValueChange={(v) => handlePropChange('target', v)}>
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
                        value={mediaSrcField.local}
                        onChange={(e) => mediaSrcField.setLocal(e.target.value)}
                        onBlur={mediaSrcField.flush}
                        placeholder="https://..."
                        className="bg-secondary border-border"
                      />
                    </div>

                    {selectedComponent.type === 'video' && (
                      <div className="space-y-2 mb-4">
                        <Label className="text-xs">Poster Image</Label>
                        <Input
                          value={posterField.local}
                          onChange={(e) => posterField.setLocal(e.target.value)}
                          onBlur={posterField.flush}
                          placeholder="https://..."
                          className="bg-secondary border-border"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xs">Controls</Label>
                      <Switch checked={selectedComponent.props.controls ?? true} onCheckedChange={(v) => handlePropChange('controls', v)} />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xs">Autoplay</Label>
                      <Switch checked={selectedComponent.props.autoplay || false} onCheckedChange={(v) => handlePropChange('autoplay', v)} />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xs">Loop</Label>
                      <Switch checked={selectedComponent.props.loop || false} onCheckedChange={(v) => handlePropChange('loop', v)} />
                    </div>

                    {selectedComponent.type === 'video' && (
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-xs">Muted</Label>
                        <Switch checked={selectedComponent.props.muted || false} onCheckedChange={(v) => handlePropChange('muted', v)} />
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
                      <Select value={selectedComponent.styles.flexDirection || 'row'} onValueChange={(v) => handleStyleChange('flexDirection', v)}>
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
                      <Select value={selectedComponent.styles.justifyContent || 'start'} onValueChange={(v) => handleStyleChange('justifyContent', v)}>
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
                      <Select value={selectedComponent.styles.alignItems || 'stretch'} onValueChange={(v) => handleStyleChange('alignItems', v)}>
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
                        value={colWidthField.local}
                        onChange={(e) => colWidthField.setLocal(e.target.value)}
                        onBlur={colWidthField.flush}
                        placeholder="auto, 50%, 200px"
                        className="bg-secondary border-border"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 mb-4">
                  <Label className="text-xs">Gap</Label>
                  <Input
                    value={gapField.local}
                    onChange={(e) => gapField.setLocal(e.target.value)}
                    onBlur={gapField.flush}
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
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
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
                    onChange={(e) => handleStyleChange('textColor', e.target.value)}
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

              {isFormComponent && (
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs">Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedComponent.styles.borderColor || '#374151'}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
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
                  value={fontSizeField.local}
                  onChange={(e) => fontSizeField.setLocal(e.target.value)}
                  onBlur={fontSizeField.flush}
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
                  value={paddingField.local}
                  onChange={(e) => paddingField.setLocal(e.target.value)}
                  onBlur={paddingField.flush}
                  placeholder="16px"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Margin</Label>
                <Input
                  value={marginField.local}
                  onChange={(e) => marginField.setLocal(e.target.value)}
                  onBlur={marginField.flush}
                  placeholder="0px"
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Border Radius</Label>
                <Input
                  value={radiusField.local}
                  onChange={(e) => radiusField.setLocal(e.target.value)}
                  onBlur={radiusField.flush}
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
  );
}
