import { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Button } from '@/shared/ui/button';
import { useDataSourceStore } from '@/features/builder/state/stores/dataSourceStore';
import { hasVariables, extractVariables } from '@/features/builder/utils/interpolation';
import { Database, Braces, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export function VariableInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
}: VariableInputProps) {
  const { dataSources, loadFromStorage } = useDataSourceStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const hasVars = hasVariables(value);
  const variables = extractVariables(value);

  const insertVariable = (varPath: string) => {
    const newValue = value + `{{${varPath}}}`;
    onChange(newValue);
    setIsPopoverOpen(false);
  };

  const getDataSourcePaths = (dsName: string, data: unknown, prefix = ''): string[] => {
    const paths: string[] = [];
    
    if (data === null || data === undefined) {
      return paths;
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
      for (const key of Object.keys(data as Record<string, unknown>)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        paths.push(`${dsName}.${fullPath}`);
        
        const nestedData = (data as Record<string, unknown>)[key];
        if (typeof nestedData === 'object' && nestedData !== null && !Array.isArray(nestedData)) {
          paths.push(...getDataSourcePaths(dsName, nestedData, fullPath));
        }
      }
    }
    
    return paths;
  };

  const getAvailablePaths = () => {
    const allPaths: { dsName: string; paths: string[] }[] = [];
    
    for (const ds of dataSources) {
      let data: unknown = null;
      
      if (ds.type === 'static-json' && ds.jsonData) {
        try {
          data = JSON.parse(ds.jsonData);
        } catch {
          // Invalid JSON
        }
      } else if (ds.type === 'key-value' && ds.keyValueData) {
        data = ds.keyValueData;
      } else if (ds.type === 'http-api' && ds.cachedData) {
        data = ds.cachedData;
      }
      
      const paths = getDataSourcePaths(ds.name, data);
      if (paths.length > 0) {
        allPaths.push({ dsName: ds.name, paths });
      } else {
        // Just add the datasource name as a path
        allPaths.push({ dsName: ds.name, paths: [ds.name] });
      }
    }
    
    return allPaths;
  };

  const availablePaths = getAvailablePaths();

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <div className="flex gap-1">
        <InputComponent
          ref={inputRef as never}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'bg-secondary border-border pr-8',
            hasVars && 'border-primary/50 bg-primary/5',
            className
          )}
        />
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 shrink-0',
                hasVars && 'text-primary'
              )}
              title="Insert variable"
            >
              <Braces className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="end">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <Database className="w-3 h-3" />
                <span>Insert Variable</span>
              </div>
              
              {availablePaths.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                  No data sources available.
                  <br />
                  <a href="/datasources" className="text-primary hover:underline">
                    Add data sources
                  </a>
                </p>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {availablePaths.map(({ dsName, paths }) => (
                    <div key={dsName}>
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                        {dsName}
                      </div>
                      {paths.map((path) => (
                        <button
                          key={path}
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary flex items-center gap-1"
                          onClick={() => insertVariable(path)}
                        >
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <code className="text-xs">{`{{${path}}}`}</code>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {hasVars && (
        <div className="mt-1 flex flex-wrap gap-1">
          {variables.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
