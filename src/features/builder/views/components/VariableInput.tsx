import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useDataSourceStore } from '@/features/builder/state/stores/dataSourceStore';
import { hasVariables, extractVariables } from '@/features/builder/utils/interpolation';
import { Database, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

interface AutocompleteItem {
  label: string;
  value: string;
  type: 'datasource' | 'field';
}

export function VariableInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
}: VariableInputProps) {
  const dataSources = useDataSourceStore((state) => state.dataSources);
  const loadFromStorage = useDataSourceStore((state) => state.loadFromStorage);
  
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // Load data sources only once on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadFromStorage();
      hasLoadedRef.current = true;
    }
  }, [loadFromStorage]);

  const hasVars = hasVariables(value);
  const variables = extractVariables(value);

  // Get all available paths from data sources
  const availablePaths = useMemo(() => {
    const getDataSourcePaths = (dsName: string, data: unknown, prefix = ''): AutocompleteItem[] => {
      const items: AutocompleteItem[] = [];
      
      if (data === null || data === undefined) {
        return items;
      }
      
      if (typeof data === 'object' && !Array.isArray(data)) {
        for (const key of Object.keys(data as Record<string, unknown>)) {
          const fullPath = prefix ? `${prefix}.${key}` : key;
          items.push({
            label: fullPath,
            value: `${dsName}.${fullPath}`,
            type: 'field',
          });
          
          const nestedData = (data as Record<string, unknown>)[key];
          if (typeof nestedData === 'object' && nestedData !== null && !Array.isArray(nestedData)) {
            items.push(...getDataSourcePaths(dsName, nestedData, fullPath));
          }
        }
      }
      
      return items;
    };

    const allItems: AutocompleteItem[] = [];
    
    for (const ds of dataSources) {
      // Add datasource itself
      allItems.push({
        label: ds.name,
        value: ds.name,
        type: 'datasource',
      });
      
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
      
      allItems.push(...getDataSourcePaths(ds.name, data));
    }
    
    return allItems;
  }, [dataSources]);

  // Filter autocomplete items based on current filter
  const filteredItems = useMemo(() => {
    if (!autocompleteFilter) return availablePaths;
    
    const lowerFilter = autocompleteFilter.toLowerCase();
    return availablePaths.filter((item) =>
      item.value.toLowerCase().includes(lowerFilter)
    );
  }, [availablePaths, autocompleteFilter]);

  // Find the variable being typed (between {{ and cursor)
  const getVariableContext = useCallback((text: string, cursor: number) => {
    // Look backwards from cursor for {{
    const beforeCursor = text.slice(0, cursor);
    const lastOpenBrace = beforeCursor.lastIndexOf('{{');
    
    if (lastOpenBrace === -1) return null;
    
    // Check if there's a closing }} between the {{ and cursor
    const afterOpenBrace = beforeCursor.slice(lastOpenBrace + 2);
    if (afterOpenBrace.includes('}}')) return null;
    
    return {
      start: lastOpenBrace,
      filter: afterOpenBrace,
    };
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursor);
    
    // Check if we should show autocomplete
    const context = getVariableContext(newValue, cursor);
    
    if (context) {
      setAutocompleteFilter(context.filter);
      setShowAutocomplete(true);
      setSelectedIndex(0);
    } else {
      setShowAutocomplete(false);
      setAutocompleteFilter('');
    }
  }, [onChange, getVariableContext]);

  const insertVariable = useCallback((varPath: string) => {
    const context = getVariableContext(value, cursorPosition);
    
    if (context) {
      // Replace from {{ to cursor with the selected variable
      const before = value.slice(0, context.start);
      const after = value.slice(cursorPosition);
      const newValue = `${before}{{${varPath}}}${after}`;
      onChange(newValue);
    } else {
      // Just append
      onChange(value + `{{${varPath}}}`);
    }
    
    setShowAutocomplete(false);
    setAutocompleteFilter('');
    inputRef.current?.focus();
  }, [value, cursorPosition, getVariableContext, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showAutocomplete || filteredItems.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertVariable(filteredItems[selectedIndex].value);
        break;
      case 'Escape':
        setShowAutocomplete(false);
        break;
    }
  }, [showAutocomplete, filteredItems, selectedIndex, insertVariable]);

  // Scroll selected item into view
  useEffect(() => {
    if (showAutocomplete && autocompleteRef.current) {
      const selected = autocompleteRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showAutocomplete]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as never}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          'bg-secondary border-border',
          hasVars && 'border-primary/50 bg-primary/5',
          multiline && 'min-h-[100px]',
          className
        )}
      />
      
      {/* Autocomplete dropdown */}
      {showAutocomplete && (
        <div
          ref={autocompleteRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
            <Database className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {autocompleteFilter ? `Filtering: "${autocompleteFilter}"` : 'Select a variable'}
            </span>
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                No matching variables found.
              </p>
              <a 
                href="/datasources" 
                className="text-xs text-primary hover:underline"
                onClick={() => setShowAutocomplete(false)}
              >
                Add data sources
              </a>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto">
              {filteredItems.map((item, index) => (
                <button
                  key={item.value}
                  data-index={index}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    index === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                  )}
                  onClick={() => insertVariable(item.value)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <ChevronRight className={cn(
                    'w-3 h-3',
                    item.type === 'datasource' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <code className="text-xs flex-1">{`{{${item.value}}}`}</code>
                  {item.type === 'datasource' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      source
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Show detected variables */}
      {hasVars && !showAutocomplete && (
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
