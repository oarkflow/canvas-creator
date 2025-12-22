import { setup, render, mutable, effect } from '@anchorlib/react';
import { useDataSourceStore } from '@/features/builder/state/stores/dataSourceStore';
import { DataSource, DataSourceType, HttpConfig } from '@/features/builder/types/datasource';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';
import {
    Database,
    Plus,
    Trash2,
    Edit,
    ArrowLeft,
    Code,
    Key,
    Globe,
    RefreshCw,
    Save,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default setup(() => {
    const { dataSources, addDataSource, updateDataSource, deleteDataSource, fetchHttpData, loadFromStorage } = useDataSourceStore();

    const state = mutable({ editingId: null as string | null, isCreating: false });

    effect(() => {
        loadFromStorage();
    });

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
                                <Database className="w-6 h-6 text-primary" />
                                <h1 className="text-xl font-semibold text-foreground">Data Sources</h1>
                            </div>
                        </div>
                        <Button onClick={() => (state.isCreating = true)} disabled={state.isCreating}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Data Source
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Data Sources List */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Available Data Sources</CardTitle>
                                <CardDescription>
                                    Use <code className="text-xs bg-secondary px-1 py-0.5 rounded">{'{{name.path}}'}</code> in properties
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[500px]">
                                    <div className="p-4 space-y-2">
                                        {dataSources.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                No data sources yet. Create one to get started.
                                            </p>
                                        ) : (
                                            dataSources.map((ds) => (
                                                <DataSourceItem
                                                    key={ds.id}
                                                    dataSource={ds}
                                                    isSelected={state.editingId === ds.id}
                                                    onSelect={() => (state.editingId = ds.id)}
                                                    onDelete={() => deleteDataSource(ds.id)}
                                                    onRefresh={() => fetchHttpData(ds.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Editor Panel */}
                    <div className="lg:col-span-2">
                        {state.isCreating ? (
                            <DataSourceEditor
                                onSave={(ds) => {
                                    addDataSource(ds);
                                    state.isCreating = false;
                                }}
                                onCancel={() => (state.isCreating = false)}
                            />
                        ) : state.editingId ? (
                            <DataSourceEditor
                                dataSource={dataSources.find((ds) => ds.id === state.editingId)}
                                onSave={(updates) => {
                                    updateDataSource(state.editingId!, updates);
                                    state.editingId = null;
                                }}
                                onCancel={() => (state.editingId = null)}
                            />
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
                                    <Database className="w-16 h-16 text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium text-foreground mb-2">
                                        Select or Create a Data Source
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Data sources provide dynamic values for your components.
                                        Use variables like <code className="bg-secondary px-1 py-0.5 rounded">{'{{myData.title}}'}</code> in any property.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    ), 'DataSourcesPage');
});

function DataSourceItem({
    dataSource,
    isSelected,
    onSelect,
    onDelete,
    onRefresh,
}: {
    dataSource: DataSource;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRefresh: () => void;
}) {
    const TypeIcon = {
        'static-json': Code,
        'key-value': Key,
        'http-api': Globe,
    }[dataSource.type];

    return (
        <div
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{dataSource.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    {dataSource.type === 'http-api' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRefresh();
                            }}
                        >
                            <RefreshCw className="w-3 h-3" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
            </div>
            <Badge variant="secondary" className="mt-2 text-xs">
                {dataSource.type}
            </Badge>
        </div>
    );
}

export const DataSourceEditor = setup((props: {
    dataSource?: DataSource;
    onSave: (ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
}) => {
    const { dataSource, onSave, onCancel } = props;

    const state = mutable({
        name: dataSource?.name || '',
        type: dataSource?.type || ('static-json' as DataSourceType),
        jsonData: dataSource?.jsonData || '{\n  "example": "value"\n}',
        keyValueData: dataSource?.keyValueData || ({ key1: 'value1' } as Record<string, string>),
        httpConfig: dataSource?.httpConfig || ({ url: '', method: 'GET', headers: {}, body: '', queryParams: {} } as HttpConfig),
        headerKey: '',
        headerValue: '',
        kvKey: '',
        kvValue: '',
    });

    // Sync when dataSource prop changes
    effect(() => {
        state.name = dataSource?.name || '';
        state.type = dataSource?.type || 'static-json';
        state.jsonData = dataSource?.jsonData || '{\n  "example": "value"\n}';
        state.keyValueData = dataSource?.keyValueData || { key1: 'value1' };
        state.httpConfig = dataSource?.httpConfig || { url: '', method: 'GET', headers: {}, body: '', queryParams: {} };
    });

    const handleSave = () => {
        if (!state.name.trim()) return;

        onSave({
            name: state.name.trim(),
            type: state.type,
            jsonData: state.type === 'static-json' ? state.jsonData : undefined,
            keyValueData: state.type === 'key-value' ? state.keyValueData : undefined,
            httpConfig: state.type === 'http-api' ? state.httpConfig : undefined,
        });
    };

    return render(() => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                        {dataSource ? 'Edit Data Source' : 'Create Data Source'}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={state.name}
                            onChange={(e) => (state.name = e.target.value)}
                            placeholder="e.g., userData, apiResponse"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use as <code className="bg-secondary px-1 rounded">{`{{${state.name || 'name'}.property}}`}</code>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={state.type} onValueChange={(v) => (state.type = v as DataSourceType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="static-json">Static JSON</SelectItem>
                                <SelectItem value="key-value">Key-Value Pairs</SelectItem>
                                <SelectItem value="http-api">HTTP API</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {state.type === 'static-json' && (
                    <div className="space-y-2">
                        <Label>JSON Data</Label>
                        <Textarea
                            value={state.jsonData}
                            onChange={(e) => (state.jsonData = e.target.value)}
                            placeholder='{"key": "value"}'
                            className="font-mono text-sm min-h-[200px]"
                        />
                    </div>
                )}

                {state.type === 'key-value' && (
                    <div className="space-y-4">
                        <Label>Key-Value Pairs</Label>
                        <div className="space-y-2">
                            {Object.entries(state.keyValueData).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                    <Input value={key} disabled className="flex-1" />
                                    <Input
                                        value={value}
                                        onChange={(e) => (state.keyValueData = { ...state.keyValueData, [key]: e.target.value })}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const { [key]: _, ...rest } = state.keyValueData;
                                            state.keyValueData = rest;
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={state.kvKey}
                                onChange={(e) => (state.kvKey = e.target.value)}
                                placeholder="Key"
                                className="flex-1"
                            />
                            <Input
                                value={state.kvValue}
                                onChange={(e) => (state.kvValue = e.target.value)}
                                placeholder="Value"
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (state.kvKey.trim()) {
                                        state.keyValueData = { ...state.keyValueData, [state.kvKey.trim()]: state.kvValue };
                                        state.kvKey = '';
                                        state.kvValue = '';
                                    }
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {state.type === 'http-api' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Method</Label>
                                <Select
                                    value={state.httpConfig.method}
                                    onValueChange={(v) =>
                                        (state.httpConfig = { ...state.httpConfig, method: v as HttpConfig['method'] })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3 space-y-2">
                                <Label>URL</Label>
                                <Input
                                    value={state.httpConfig.url}
                                    onChange={(e) => (state.httpConfig = { ...state.httpConfig, url: e.target.value })}
                                    placeholder="https://api.example.com/data"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Headers</Label>
                            <div className="space-y-2">
                                {Object.entries(state.httpConfig.headers).map(([key, value]) => (
                                    <div key={key} className="flex gap-2">
                                        <Input value={key} disabled className="flex-1" />
                                        <Input
                                            value={value}
                                            onChange={(e) =>
                                            (state.httpConfig = {
                                                ...state.httpConfig,
                                                headers: { ...state.httpConfig.headers, [key]: e.target.value },
                                            })
                                            }
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const { [key]: _, ...rest } = state.httpConfig.headers;
                                                state.httpConfig = { ...state.httpConfig, headers: rest };
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={state.headerKey}
                                    onChange={(e) => (state.headerKey = e.target.value)}
                                    placeholder="Header name"
                                    className="flex-1"
                                />
                                <Input
                                    value={state.headerValue}
                                    onChange={(e) => (state.headerValue = e.target.value)}
                                    placeholder="Header value"
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (state.headerKey.trim()) {
                                            state.httpConfig = {
                                                ...state.httpConfig,
                                                headers: { ...state.httpConfig.headers, [state.headerKey.trim()]: state.headerValue },
                                            };
                                            state.headerKey = '';
                                            state.headerValue = '';
                                        }
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {state.httpConfig.method !== 'GET' && (
                            <div className="space-y-2">
                                <Label>Request Body (JSON)</Label>
                                <Textarea
                                    value={state.httpConfig.body}
                                    onChange={(e) => (state.httpConfig = { ...state.httpConfig, body: e.target.value })}
                                    placeholder='{"key": "value"}'
                                    className="font-mono text-sm min-h-[100px]"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!state.name.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        {dataSource ? 'Update' : 'Create'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    ), 'DataSourceEditor');
});
