import { useRef, useCallback } from 'react';
import { setup, render, mutable, derived, effect } from '@anchorlib/react';
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

export const VariableInput = setup((props: VariableInputProps) => {
    const { value, onChange, placeholder, multiline = false, className } = props;
    const dataSources = useDataSourceStore((state) => state.dataSources);
    const loadFromStorage = useDataSourceStore((state) => state.loadFromStorage);

    // Local mutable state (DSV style)
    const state = mutable({
        showAutocomplete: false,
        autocompleteFilter: '',
        cursorPosition: 0,
        selectedIndex: 0,
        localValue: value,
    });

    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const hasLoadedRef = useRef(false);

    // Load data sources only once on mount
    effect(() => {
        if (!hasLoadedRef.current) {
            loadFromStorage();
            hasLoadedRef.current = true;
        }
    });

    // Use local mutable buffer for live editing
    const hasVars = hasVariables(state.localValue);
    const variables = extractVariables(state.localValue);

    const commitTimer = useRef<number | null>(null);

    // Keep local buffer in sync when parent value changes (but don't clobber during edit)
    effect(() => {
        if (value !== state.localValue) {
            state.localValue = value;
        }
    });

    // Cleanup timer on unmount
    effect(() => {
        return () => {
            if (commitTimer.current) clearTimeout(commitTimer.current);
        };
    });

    // Get all available paths from data sources (derived)
    const availablePaths = derived(() => {
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
    });

    // Filter autocomplete items based on current filter (derived)
    const filteredItems = derived(() => {
        const filter = state.autocompleteFilter.trim();
        if (!filter) return availablePaths.value;

        // If the user typed a datasource prefix ("ds" or "ds.") prefer narrowing to that datasource
        const [dsPrefixRaw, ...rest] = filter.split('.');
        const dsPrefix = dsPrefixRaw?.trim();
        const restFilter = rest.join('.').toLowerCase();

        const lowerFilter = filter.toLowerCase();

        const datasourceMatches = availablePaths.value.filter(
            (item) => item.type === 'datasource' && item.value.toLowerCase().includes(lowerFilter)
        );

        // If user started typing "datasource." only show fields for that datasource
        const scopedFieldMatches = dsPrefix && filter.includes('.')
            ? availablePaths.value.filter((item) =>
                item.type === 'field' &&
                item.value.toLowerCase().startsWith(dsPrefix.toLowerCase() + '.') &&
                item.value.toLowerCase().includes((dsPrefix.toLowerCase() + '.' + restFilter).replace(/\.+$/, '.'))
            )
            : [];

        const fieldMatches = !filter.includes('.')
            ? availablePaths.value.filter((item) => item.type === 'field' && item.value.toLowerCase().includes(lowerFilter))
            : scopedFieldMatches;

        // Datasources first, then fields
        return [...datasourceMatches, ...fieldMatches];
    });

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

        state.cursorPosition = cursor;

        // Update local buffer immediately so input remains responsive
        state.localValue = newValue;

        // debounce commit to parent store to avoid re-render storms
        if (commitTimer.current) clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(() => {
            onChange(newValue);
            commitTimer.current = null;
        }, 200);

        // Check if we should show autocomplete based on the current cursor
        const context = getVariableContext(newValue, cursor);

        if (context) {
            state.autocompleteFilter = context.filter;
            state.showAutocomplete = true;
            state.selectedIndex = 0;
        } else {
            state.showAutocomplete = false;
            state.autocompleteFilter = '';
        }
    }, [onChange, getVariableContext]);

    const insertVariable = useCallback((varPath: string) => {
        const context = getVariableContext(state.localValue, state.cursorPosition);

        let newValue: string;
        if (context) {
            // Replace from {{ to cursor with the selected variable
            const before = state.localValue.slice(0, context.start);
            const after = state.localValue.slice(state.cursorPosition);
            newValue = `${before}{{${varPath}}}${after}`;
        } else {
            // Just append
            newValue = state.localValue + `{{${varPath}}}`;
        }

        // update local buffer and commit immediately
        state.localValue = newValue;
        if (commitTimer.current) clearTimeout(commitTimer.current);
        onChange(newValue);

        state.showAutocomplete = false;
        state.autocompleteFilter = '';

        // after updating, refocus and restore caret just after inserted text
        setTimeout(() => {
            const el = inputRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
            if (!el) return;
            const pos = (context ? (context.start + 2 + varPath.length + 2) : newValue.length);
            el.focus();
            try { el.setSelectionRange(pos, pos); } catch { }
            state.cursorPosition = pos;
        }, 0);
    }, [getVariableContext, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Let autocomplete keys be handled when it's open
        if (state.showAutocomplete && filteredItems.value.length > 0) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    state.selectedIndex = (state.selectedIndex + 1) % filteredItems.value.length;
                    return;
                case 'ArrowUp':
                    e.preventDefault();
                    state.selectedIndex = (state.selectedIndex - 1 + filteredItems.value.length) % filteredItems.value.length;
                    return;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    insertVariable(filteredItems.value[state.selectedIndex].value);
                    return;
                case 'Escape':
                    state.showAutocomplete = false;
                    return;
            }
        }

        // When autocomplete is closed, allow Enter to commit immediately
        if (e.key === 'Enter') {
            if (commitTimer.current) clearTimeout(commitTimer.current);
            onChange(state.localValue);
            return;
        }
    }, [insertVariable, onChange]);

    // Scroll selected item into view
    effect(() => {
        if (state.showAutocomplete && autocompleteRef.current) {
            const selected = autocompleteRef.current.querySelector(`[data-index="${state.selectedIndex}"]`);
            selected?.scrollIntoView({ block: 'nearest' });
        }
    });

    // NOTE: We intentionally do NOT auto-focus/restore focus on every render.
    // Doing so can steal focus from other inputs in the Properties Panel.
    // We keep editing responsive via local buffer + debounced commit instead.

    // Close autocomplete on outside click
    effect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                autocompleteRef.current && !autocompleteRef.current.contains(target) &&
                inputRef.current && !inputRef.current.contains(target) &&
                wrapperRef.current && !wrapperRef.current.contains(target)
            ) {
                state.showAutocomplete = false;
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    });

    const InputComponent = multiline ? Textarea : Input;

    const openAutocomplete = useCallback(() => {
        const el = inputRef.current as (HTMLInputElement | HTMLTextAreaElement | null);
        const pos = (el?.selectionStart ?? state.localValue.length);
        state.cursorPosition = pos;
        const context = getVariableContext(state.localValue, pos);
        if (context) state.autocompleteFilter = context.filter;
        else state.autocompleteFilter = '';
        state.selectedIndex = 0;
        state.showAutocomplete = true;
        // ensure focus and caret
        setTimeout(() => {
            el?.focus();
            try { el?.setSelectionRange(pos, pos); } catch { }
        }, 0);
    }, [getVariableContext]);

    return render(() => (
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-1">
                <InputComponent
                    ref={inputRef as never}
                    value={state.localValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // commit pending changes on blur
                        if (commitTimer.current) {
                            clearTimeout(commitTimer.current);
                            commitTimer.current = null;
                        }
                        wasFocusedRef.current = false;
                        state.showAutocomplete = false;
                        if (state.localValue !== value) onChange(state.localValue);
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
            {state.showAutocomplete && (
                <div
                    ref={autocompleteRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden"
                >
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
                        <Database className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            {state.autocompleteFilter ? `Filtering: "${state.autocompleteFilter}"` : 'Select a variable'}
                        </span>
                    </div>

                    {filteredItems.value.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                No matching variables found.
                            </p>
                            <a
                                href="/datasources"
                                className="text-xs text-primary hover:underline"
                                onClick={() => (state.showAutocomplete = false)}
                            >
                                Add data sources
                            </a>
                        </div>
                    ) : (
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredItems.value.map((item, index) => (
                                <button
                                    key={item.value}
                                    data-index={index}
                                    className={cn(
                                        'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                                        index === state.selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                                    )}
                                    onClick={() => insertVariable(item.value)}
                                    onMouseEnter={() => (state.selectedIndex = index)}
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
            {hasVars && !state.showAutocomplete && (
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
    ), 'VariableInput');
});
