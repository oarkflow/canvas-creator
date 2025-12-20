import { useBuilderStore } from '@/stores/builderStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getComponentDefinition } from '@/lib/componentDefinitions';
import { Settings, Palette, Box } from 'lucide-react';

export function PropertiesPanel() {
  const { selectedComponent, updateComponent } = useBuilderStore();

  if (!selectedComponent) {
    return (
      <div className="w-72 bg-card border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Select a component to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  const definition = getComponentDefinition(selectedComponent.type);

  const handlePropChange = (key: string, value: string | number) => {
    updateComponent(selectedComponent.id, {
      props: { ...selectedComponent.props, [key]: value },
    });
  };

  const handleStyleChange = (key: string, value: string | number) => {
    updateComponent(selectedComponent.id, {
      styles: { ...selectedComponent.styles, [key]: value },
    });
  };

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {definition && <definition.icon className="w-4 h-4 text-primary" />}
          <h2 className="text-sm font-semibold text-foreground">
            {definition?.label || 'Component'}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">ID: {selectedComponent.id.slice(0, 8)}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Content Properties */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Content
              </h3>
            </div>

            {selectedComponent.props.content !== undefined && (
              <div className="space-y-2 mb-4">
                <Label className="text-xs">Text Content</Label>
                {selectedComponent.type === 'paragraph' ? (
                  <Textarea
                    value={selectedComponent.props.content || ''}
                    onChange={(e) => handlePropChange('content', e.target.value)}
                    className="min-h-[100px] bg-surface-3 border-border"
                  />
                ) : (
                  <Input
                    value={selectedComponent.props.content || ''}
                    onChange={(e) => handlePropChange('content', e.target.value)}
                    className="bg-surface-3 border-border"
                  />
                )}
              </div>
            )}

            {selectedComponent.type === 'heading' && (
              <div className="space-y-2 mb-4">
                <Label className="text-xs">Heading Level</Label>
                <Select
                  value={String(selectedComponent.props.level || 1)}
                  onValueChange={(v) => handlePropChange('level', parseInt(v))}
                >
                  <SelectTrigger className="bg-surface-3 border-border">
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
                <Select
                  value={selectedComponent.props.variant || 'primary'}
                  onValueChange={(v) => handlePropChange('variant', v)}
                >
                  <SelectTrigger className="bg-surface-3 border-border">
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
                  <Input
                    value={selectedComponent.props.src || ''}
                    onChange={(e) => handlePropChange('src', e.target.value)}
                    placeholder="https://..."
                    className="bg-surface-3 border-border"
                  />
                </div>
                <div className="space-y-2 mb-4">
                  <Label className="text-xs">Alt Text</Label>
                  <Input
                    value={selectedComponent.props.alt || ''}
                    onChange={(e) => handlePropChange('alt', e.target.value)}
                    className="bg-surface-3 border-border"
                  />
                </div>
              </>
            )}
          </div>

          <Separator className="bg-border/50" />

          {/* Style Properties */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Styles
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {selectedComponent.styles.backgroundColor !== undefined && (
                <div className="space-y-2">
                  <Label className="text-xs">Background</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedComponent.styles.backgroundColor || '#000000'}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="w-10 h-9 p-1 bg-surface-3 border-border"
                    />
                    <Input
                      value={selectedComponent.styles.backgroundColor || ''}
                      onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                      className="flex-1 bg-surface-3 border-border text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedComponent.styles.textColor !== undefined && (
                <div className="space-y-2">
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedComponent.styles.textColor || '#ffffff'}
                      onChange={(e) => handleStyleChange('textColor', e.target.value)}
                      className="w-10 h-9 p-1 bg-surface-3 border-border"
                    />
                    <Input
                      value={selectedComponent.styles.textColor || ''}
                      onChange={(e) => handleStyleChange('textColor', e.target.value)}
                      className="flex-1 bg-surface-3 border-border text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Font Size</Label>
                <Input
                  value={selectedComponent.styles.fontSize || ''}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  placeholder="16px"
                  className="bg-surface-3 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Font Weight</Label>
                <Select
                  value={selectedComponent.styles.fontWeight || '400'}
                  onValueChange={(v) => handleStyleChange('fontWeight', v)}
                >
                  <SelectTrigger className="bg-surface-3 border-border">
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
                <Select
                  value={selectedComponent.styles.textAlign || 'left'}
                  onValueChange={(v) => handleStyleChange('textAlign', v)}
                >
                  <SelectTrigger className="bg-surface-3 border-border">
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
                  value={selectedComponent.styles.padding || ''}
                  onChange={(e) => handleStyleChange('padding', e.target.value)}
                  placeholder="16px"
                  className="bg-surface-3 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Margin</Label>
                <Input
                  value={selectedComponent.styles.margin || ''}
                  onChange={(e) => handleStyleChange('margin', e.target.value)}
                  placeholder="0px"
                  className="bg-surface-3 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Border Radius</Label>
                <Input
                  value={selectedComponent.styles.borderRadius || ''}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                  placeholder="8px"
                  className="bg-surface-3 border-border"
                />
              </div>

              {selectedComponent.type === 'grid' && (
                <div className="space-y-2">
                  <Label className="text-xs">Columns</Label>
                  <Select
                    value={String(selectedComponent.styles.columns || 2)}
                    onValueChange={(v) => handleStyleChange('columns', parseInt(v))}
                  >
                    <SelectTrigger className="bg-surface-3 border-border">
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
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
