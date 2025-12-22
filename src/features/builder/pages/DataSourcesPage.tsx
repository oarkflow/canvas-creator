import { useEffect, useState } from 'react';
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

export default function DataSourcesPage() {
  const { dataSources, addDataSource, updateDataSource, deleteDataSource, fetchHttpData, loadFromStorage } = useDataSourceStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
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
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
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
                          isSelected={editingId === ds.id}
                          onSelect={() => setEditingId(ds.id)}
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
            {isCreating ? (
              <DataSourceEditor
                onSave={(ds) => {
                  addDataSource(ds);
                  setIsCreating(false);
                }}
                onCancel={() => setIsCreating(false)}
              />
            ) : editingId ? (
              <DataSourceEditor
                dataSource={dataSources.find((ds) => ds.id === editingId)}
                onSave={(updates) => {
                  updateDataSource(editingId, updates);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
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
  );
}

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
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
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

function DataSourceEditor({
  dataSource,
  onSave,
  onCancel,
}: {
  dataSource?: DataSource;
  onSave: (ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dataSource?.name || '');
  const [type, setType] = useState<DataSourceType>(dataSource?.type || 'static-json');
  const [jsonData, setJsonData] = useState(dataSource?.jsonData || '{\n  "example": "value"\n}');
  const [keyValueData, setKeyValueData] = useState<Record<string, string>>(
    dataSource?.keyValueData || { key1: 'value1' }
  );
  const [httpConfig, setHttpConfig] = useState<HttpConfig>(
    dataSource?.httpConfig || {
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      queryParams: {},
    }
  );
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [kvKey, setKvKey] = useState('');
  const [kvValue, setKvValue] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      jsonData: type === 'static-json' ? jsonData : undefined,
      keyValueData: type === 'key-value' ? keyValueData : undefined,
      httpConfig: type === 'http-api' ? httpConfig : undefined,
    });
  };

  return (
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., userData, apiResponse"
            />
            <p className="text-xs text-muted-foreground">
              Use as <code className="bg-secondary px-1 rounded">{`{{${name || 'name'}.property}}`}</code>
            </p>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DataSourceType)}>
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

        {type === 'static-json' && (
          <div className="space-y-2">
            <Label>JSON Data</Label>
            <Textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='{"key": "value"}'
              className="font-mono text-sm min-h-[200px]"
            />
          </div>
        )}

        {type === 'key-value' && (
          <div className="space-y-4">
            <Label>Key-Value Pairs</Label>
            <div className="space-y-2">
              {Object.entries(keyValueData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Input value={key} disabled className="flex-1" />
                  <Input
                    value={value}
                    onChange={(e) =>
                      setKeyValueData({ ...keyValueData, [key]: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const { [key]: _, ...rest } = keyValueData;
                      setKeyValueData(rest);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={kvKey}
                onChange={(e) => setKvKey(e.target.value)}
                placeholder="Key"
                className="flex-1"
              />
              <Input
                value={kvValue}
                onChange={(e) => setKvValue(e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (kvKey.trim()) {
                    setKeyValueData({ ...keyValueData, [kvKey.trim()]: kvValue });
                    setKvKey('');
                    setKvValue('');
                  }
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {type === 'http-api' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={httpConfig.method}
                  onValueChange={(v) =>
                    setHttpConfig({ ...httpConfig, method: v as HttpConfig['method'] })
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
                  value={httpConfig.url}
                  onChange={(e) => setHttpConfig({ ...httpConfig, url: e.target.value })}
                  placeholder="https://api.example.com/data"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Headers</Label>
              <div className="space-y-2">
                {Object.entries(httpConfig.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input value={key} disabled className="flex-1" />
                    <Input
                      value={value}
                      onChange={(e) =>
                        setHttpConfig({
                          ...httpConfig,
                          headers: { ...httpConfig.headers, [key]: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const { [key]: _, ...rest } = httpConfig.headers;
                        setHttpConfig({ ...httpConfig, headers: rest });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="Header name"
                  className="flex-1"
                />
                <Input
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="Header value"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (headerKey.trim()) {
                      setHttpConfig({
                        ...httpConfig,
                        headers: { ...httpConfig.headers, [headerKey.trim()]: headerValue },
                      });
                      setHeaderKey('');
                      setHeaderValue('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {httpConfig.method !== 'GET' && (
              <div className="space-y-2">
                <Label>Request Body (JSON)</Label>
                <Textarea
                  value={httpConfig.body}
                  onChange={(e) => setHttpConfig({ ...httpConfig, body: e.target.value })}
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
          <Button onClick={handleSave} disabled={!name.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {dataSource ? 'Update' : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
