import { setup, render, mutable, effect } from '@anchorlib/react';
import { BuilderComponent } from '@/features/builder/types/builder';
import { DataSource } from '@/features/builder/types/datasource';
import { useDataSourceStore } from '@/features/builder/state/stores/dataSourceStore';
import { interpolateComponent, parseExportedJSON } from '@/features/builder/utils/renderer';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ArrowLeft, Play, Upload, Code } from 'lucide-react';
import { Link } from 'react-router-dom';

export default setup(() => {
    const { dataSources, loadFromStorage } = useDataSourceStore();
    const state = mutable({
        jsonInput: '',
        components: [] as BuilderComponent[],
        error: null as string | null,
        isRendering: false,
    });

    effect(() => {
        loadFromStorage();
    });

    const handleRender = () => {
        state.error = null;
        try {
            const parsed = parseExportedJSON(state.jsonInput);
            if (parsed) {
                state.components = parsed.components;
                state.isRendering = true;
            } else {
                // Try parsing as raw components array
                const rawComponents = JSON.parse(state.jsonInput);
                if (Array.isArray(rawComponents)) {
                    state.components = rawComponents;
                    state.isRendering = true;
                } else if (rawComponents.components) {
                    state.components = rawComponents.components;
                    state.isRendering = true;
                } else {
                    state.error = 'Invalid JSON format. Expected an array of components or exported page JSON.';
                }
            }
        } catch (e) {
            state.error = 'Failed to parse JSON: ' + (e as Error).message;
        }
    };

    const handleLoadFromBuilder = () => {
        // Try to load from localStorage (builder saves here)
        try {
            const stored = localStorage.getItem('builder-current-page');
            if (stored) {
                const page = JSON.parse(stored);
                if (page.components) {
                    state.components = page.components;
                    state.isRendering = true;
                    state.error = null;
                }
            }
        } catch {
            state.error = 'No saved page found in builder.';
        }
    };

    return render(() => (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2">
                                <Play className="w-6 h-6 text-primary" />
                                <h1 className="text-xl font-semibold text-foreground">Render Preview</h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleLoadFromBuilder}>
                                <Upload className="w-4 h-4 mr-2" />
                                Load from Builder
                            </Button>
                            <Button variant="outline" onClick={() => (state.isRendering = false)}>
                                <Code className="w-4 h-4 mr-2" />
                                Edit JSON
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                {!state.isRendering ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Paste JSON</CardTitle>
                                <CardDescription>
                                    Paste exported page JSON or component array to render
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    value={state.jsonInput}
                                    onChange={(e) => (state.jsonInput = e.target.value)}
                                    placeholder='{"components": [...], "dataSources": [...]}'
                                    className="font-mono text-sm min-h-[400px]"
                                />
                                {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                                <Button onClick={handleRender} className="w-full" disabled={!state.jsonInput.trim()}>
                                    <Play className="w-4 h-4 mr-2" />
                                    Render
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Available Data Sources</CardTitle>
                                <CardDescription>
                                    Variables from these sources will be interpolated
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    {dataSources.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No data sources configured.{' '}
                                            <Link to="/datasources" className="text-primary hover:underline">
                                                Add some
                                            </Link>
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {dataSources.map((ds) => (
                                                <div key={ds.id} className="p-3 rounded border border-border">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{ds.name}</span>
                                                        <span className="text-xs text-muted-foreground">{ds.type}</span>
                                                    </div>
                                                    <code className="text-xs text-muted-foreground">
                                                        {`{{${ds.name}.property}}`}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-lg min-h-[600px] p-6">
                        <ComponentRenderer components={state.components} dataSources={dataSources} />
                    </div>
                )}
            </div>
        </div>
    ), 'RenderPage');
});

function ComponentRenderer({
    components,
    dataSources,
}: {
    components: BuilderComponent[];
    dataSources: DataSource[];
}) {
    return (
        <div className="space-y-4">
            {components.map((component) => (
                <RenderComponent key={component.id} component={component} dataSources={dataSources} />
            ))}
        </div>
    );
}

function RenderComponent({
    component,
    dataSources,
}: {
    component: BuilderComponent;
    dataSources: DataSource[];
}) {
    // Interpolate component with data sources
    const interpolated = interpolateComponent(component, { dataSources, isPreview: true });
    const { type, props, styles, children } = interpolated;

    const baseStyles: React.CSSProperties = {
        backgroundColor: styles.backgroundColor,
        color: styles.textColor,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        textAlign: styles.textAlign,
        padding: styles.padding,
        margin: styles.margin,
        borderRadius: styles.borderRadius,
        width: styles.width,
        height: styles.height,
    };

    const renderChildren = () =>
        children?.map((child) => (
            <RenderComponent key={child.id} component={child} dataSources={dataSources} />
        ));

    switch (type) {
        case 'heading': {
            const HeadingTag = `h${props.level || 1}` as keyof JSX.IntrinsicElements;
            return <HeadingTag style={baseStyles}>{props.content}</HeadingTag>;
        }
        case 'paragraph':
            return <p style={baseStyles}>{props.content}</p>;
        case 'button':
            return (
                <button style={baseStyles} className="px-4 py-2 bg-primary text-primary-foreground rounded">
                    {props.content}
                </button>
            );
        case 'image':
            return <img src={props.src} alt={props.alt} style={baseStyles} className="max-w-full" />;
        case 'container':
        case 'card':
            return (
                <div style={baseStyles} className="border border-border rounded p-4">
                    {renderChildren()}
                </div>
            );
        case 'row':
            return (
                <div
                    style={{
                        ...baseStyles,
                        display: 'flex',
                        flexDirection: styles.flexDirection || 'row',
                        justifyContent: styles.justifyContent?.replace('between', 'space-between').replace('around', 'space-around'),
                        alignItems: styles.alignItems,
                        gap: styles.gap,
                    }}
                >
                    {renderChildren()}
                </div>
            );
        case 'column':
            return (
                <div style={{ ...baseStyles, flex: styles.columnSpan || 1 }}>{renderChildren()}</div>
            );
        case 'divider':
            return <hr style={baseStyles} className="border-border" />;
        case 'spacer':
            return <div style={{ ...baseStyles, height: styles.height || '24px' }} />;
        case 'input':
            return (
                <div style={baseStyles}>
                    {props.label && <label className="block text-sm mb-1">{props.label}</label>}
                    <input
                        type={props.inputType || 'text'}
                        placeholder={props.placeholder}
                        name={props.name}
                        required={props.required}
                        disabled={props.disabled}
                        className="w-full px-3 py-2 border border-border rounded bg-background"
                    />
                </div>
            );
        case 'textarea':
            return (
                <div style={baseStyles}>
                    {props.label && <label className="block text-sm mb-1">{props.label}</label>}
                    <textarea
                        placeholder={props.placeholder}
                        name={props.name}
                        required={props.required}
                        disabled={props.disabled}
                        className="w-full px-3 py-2 border border-border rounded bg-background min-h-[100px]"
                    />
                </div>
            );
        case 'select':
            return (
                <div style={baseStyles}>
                    {props.label && <label className="block text-sm mb-1">{props.label}</label>}
                    <select
                        name={props.name}
                        required={props.required}
                        disabled={props.disabled}
                        className="w-full px-3 py-2 border border-border rounded bg-background"
                    >
                        <option value="">{props.placeholder || 'Select...'}</option>
                        {props.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            );
        case 'checkbox':
            return (
                <div style={baseStyles} className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name={props.name}
                        required={props.required}
                        disabled={props.disabled}
                    />
                    {props.label && <label className="text-sm">{props.label}</label>}
                </div>
            );
        case 'anchor':
            return (
                <a
                    href={props.href}
                    target={props.target}
                    style={baseStyles}
                    className="text-primary hover:underline"
                >
                    {props.content}
                </a>
            );
        case 'video':
            return (
                <video
                    src={props.src}
                    poster={props.poster}
                    controls={props.controls}
                    autoPlay={props.autoplay}
                    loop={props.loop}
                    muted={props.muted}
                    style={baseStyles}
                    className="max-w-full"
                />
            );
        case 'audio':
            return (
                <audio
                    src={props.src}
                    controls={props.controls}
                    autoPlay={props.autoplay}
                    loop={props.loop}
                    style={baseStyles}
                />
            );
        default:
            return <div style={baseStyles}>{props.content || `[${type}]`}</div>;
    }
}
