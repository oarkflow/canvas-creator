import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useDataSourceStore } from '@/features/builder/state/stores/dataSourceStore';
import { hasVariables, extractVariables } from '@/features/builder/utils/interpolation';
import { Database, ChevronRight, Braces } from 'lucide-react';
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
    const wrapperRef = useRef<HTMLDivElement>(null);
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

    // Local editing buffer to avoid updating the global store on every keystroke
    const [localValue, setLocalValue] = useState(value);
    const commitTimer = useRef<number | null>(null);

    // Keep local buffer in sync when parent value changes (but don't clobber during edit)
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value, localValue]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (commitTimer.current) clearTimeout(commitTimer.current);
        };
    }, []);

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

    const wasFocusedRef = useRef(false);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        // capture cursor BEFORE scheduling commit
        const cursor = e.target.selectionStart ?? 0;

        // Track whether input had focus so we can restore it after parent updates
        wasFocusedRef.current = document.activeElement === inputRef.current;

        setCursorPosition(cursor);

        // Update local buffer immediately so input remains responsive
        setLocalValue(newValue);

        // debounce commit to parent store to avoid re-render storms
        if (commitTimer.current) clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(() => {
            onChange(newValue);
            commitTimer.current = null;
        }, 200);

        // Check if we should show autocomplete based on the current cursor
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
        const context = getVariableContext(localValue, cursorPosition);

        let newValue: string;
        if (context) {
            // Replace from {{ to cursor with the selected variable
            const before = localValue.slice(0, context.start);
            const after = localValue.slice(cursorPosition);
            newValue = `${before}{{${varPath}}}${after}`;
        } else {
            // Just append
            newValue = localValue + `{{${varPath}}}`;
        }

        // update local buffer and commit immediately
        setLocalValue(newValue);
        if (commitTimer.current) clearTimeout(commitTimer.current);
        onChange(newValue);

        setShowAutocomplete(false);
        setAutocompleteFilter('');

        // after updating, refocus and restore caret just after inserted text
        setTimeout(() => {
            const el = inputRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
            if (!el) return;
            const pos = (context ? (context.start + 2 + varPath.length + 2) : newValue.length);
            el.focus();
            try { el.setSelectionRange(pos, pos); } catch { }
            setCursorPosition(pos);
        }, 0);
    }, [localValue, cursorPosition, getVariableContext, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Let autocomplete keys be handled when it's open
        if (showAutocomplete && filteredItems.length > 0) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
                    return;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
                    return;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    insertVariable(filteredItems[selectedIndex].value);
                    return;
                case 'Escape':
                    setShowAutocomplete(false);
                    return;
            }
        }

        // When autocomplete is closed, allow Enter to commit immediately
        if (e.key === 'Enter') {
            if (commitTimer.current) clearTimeout(commitTimer.current);
            onChange(localValue);
            return;
        }
    }, [showAutocomplete, filteredItems, selectedIndex, insertVariable, onChange, localValue]);

    // Scroll selected item into view
    useEffect(() => {
        if (showAutocomplete && autocompleteRef.current) {
            const selected = autocompleteRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, showAutocomplete]);

    // Preserve caret position and restore focus after parent updates value
    useEffect(() => {
        const el = inputRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
        if (!el) return;

        const pos = Math.min(cursorPosition, el.value.length);

        // If the input was focused before update, restore focus and selection
        if (wasFocusedRef.current) {
            try {
                el.focus();
                el.setSelectionRange(pos, pos);
            } catch (e) {
                // ignore setSelectionRange errors
            }
            wasFocusedRef.current = false;
            return;
        }

        // Otherwise, only restore selection if the element still has focus
        if (document.activeElement === el) {
            try {
                el.setSelectionRange(pos, pos);
            } catch (e) {
                // ignore setSelectionRange errors
            }
        }
    }, [value, cursorPosition]);

    // Close autocomplete on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                autocompleteRef.current && !autocompleteRef.current.contains(target) &&
                inputRef.current && !inputRef.current.contains(target) &&
                wrapperRef.current && !wrapperRef.current.contains(target)
            ) {
                setShowAutocomplete(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const InputComponent = multiline ? Textarea : Input;

    const openAutocomplete = useCallback(() => {
        const el = inputRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
        const pos = (el?.selectionStart ?? value.length);
        setCursorPosition(pos);
        const context = getVariableContext(value, pos);
        if (context) setAutocompleteFilter(context.filter);
        else setAutocompleteFilter('');
        setSelectedIndex(0);
        setShowAutocomplete(true);
        // ensure focus and caret
        setTimeout(() => {
            el?.focus();
            try { el?.setSelectionRange(pos, pos); } catch { }
        }, 0);
    }, [getVariableContext, value]);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-1">
                <InputComponent
                    ref={inputRef as never}
                    value={localValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // commit pending changes on blur
                        if (commitTimer.current) {
                            clearTimeout(commitTimer.current);
                            commitTimer.current = null;
                        }
                        if (localValue !== value) onChange(localValue);
                    }}
                    placeholder={placeholder}
                    className={cn(
                        'bg-secondary border-border',
                        hasVars && 'border-primary/50 bg-primary/5',
                        multiline && 'min-h-[100px]',
                        className
                    )}
                />

                <button
                    type="button"
                    className={cn(
                        'h-9 w-9 inline-flex items-center justify-center rounded-md',
                        'text-muted-foreground hover:bg-secondary',
                        hasVars && 'text-primary'
                    )}
                    title="Insert variable"
                    onClick={openAutocomplete}
                >
                    <Braces className="w-4 h-4" />
                </button>
            </div>

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
