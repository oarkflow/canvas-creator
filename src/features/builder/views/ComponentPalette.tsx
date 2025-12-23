import { setup, render, derived, mutable, effect } from '@anchorlib/react';
import { componentDefinitions } from '@/features/builder/data/models/componentDefinitions';
import { builderTemplates } from '@/features/builder/data/models/templateDefinitions';
import { DraggableComponent } from './components/DraggableComponent';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import { useBuilderStore } from '@/features/builder/state/stores/builderStore';

const STORAGE_KEY = 'builder.sidebar.tab';

type SidebarTab = 'components' | 'templates';

export const ComponentPalette = setup(() => {
    const layoutComponents = derived(() => componentDefinitions.filter(d => d.category === 'layout'));
    const basicComponents = derived(() => componentDefinitions.filter(d => d.category === 'basic'));
    const formComponents = derived(() => componentDefinitions.filter(d => d.category === 'form'));
    const mediaComponents = derived(() => componentDefinitions.filter(d => d.category === 'media'));

    const addComponent = useBuilderStore((s) => s.addComponent);

    const saved = window.localStorage.getItem(STORAGE_KEY);
    const state = mutable({
        tab: (saved === 'templates' || saved === 'components') ? (saved as SidebarTab) : ('components' as SidebarTab),
    });

    effect(() => {
        window.localStorage.setItem(STORAGE_KEY, state.tab);
    });

    return render(() => (
        <div className="w-64 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Library</h2>
                <p className="text-xs text-muted-foreground mt-1">Drag components or insert templates</p>
            </div>

            <Tabs value={state.tab} onValueChange={(v) => (state.tab = v as SidebarTab)} className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="components">Components</TabsTrigger>
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="components" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-6">
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Layout</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {layoutComponents.value.map(def => (
                                        <DraggableComponent key={def.type} definition={def} />
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Basic</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {basicComponents.value.map(def => (
                                        <DraggableComponent key={def.type} definition={def} />
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Form</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {formComponents.value.map(def => (
                                        <DraggableComponent key={def.type} definition={def} />
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Media</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {mediaComponents.value.map(def => (
                                        <DraggableComponent key={def.type} definition={def} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="templates" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-3">
                            {builderTemplates.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className="w-full text-left rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors p-3"
                                    onClick={() => {
                                        addComponent(t.build());
                                        state.tab = 'templates';
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center border border-border">
                                            <t.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="pt-2">
                                <Button variant="outline" size="sm" className="w-full" disabled>
                                    More templates coming soon
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    ), 'ComponentPalette');
}, 'ComponentPalette');
