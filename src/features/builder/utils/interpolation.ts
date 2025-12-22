import { DataSource } from '@/features/builder/types/datasource';

/**
 * Get value from data using dot notation path
 * e.g., "user.name" from { user: { name: "John" } } returns "John"
 */
function getValueByPath(data: unknown, path: string): unknown {
  if (!data || typeof data !== 'object') return undefined;
  
  const parts = path.split('.');
  let current: unknown = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array index notation like "items.0.name"
    const arrayMatch = part.match(/^(\d+)$/);
    if (arrayMatch && Array.isArray(current)) {
      current = current[parseInt(arrayMatch[1])];
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Resolve a data source to its actual data
 */
function resolveDataSourceData(ds: DataSource): unknown {
  switch (ds.type) {
    case 'static-json':
      try {
        return ds.jsonData ? JSON.parse(ds.jsonData) : null;
      } catch {
        return null;
      }
    case 'key-value':
      return ds.keyValueData || {};
    case 'http-api':
      return ds.cachedData || null;
    default:
      return null;
  }
}

/**
 * Interpolate variables in a string using {{datasource.path.to.value}} syntax
 * 
 * @param template - The string containing variable placeholders
 * @param dataSources - Array of available data sources
 * @returns The interpolated string
 */
export function interpolateVariables(
  template: string | undefined,
  dataSources: DataSource[]
): string {
  if (!template || typeof template !== 'string') return template || '';
  
  // Match {{datasourceName.path.to.value}}
  const variablePattern = /\{\{([^}]+)\}\}/g;
  
  return template.replace(variablePattern, (match, variablePath: string) => {
    const trimmedPath = variablePath.trim();
    const parts = trimmedPath.split('.');
    
    if (parts.length < 1) return match;
    
    const dataSourceName = parts[0];
    const valuePath = parts.slice(1).join('.');
    
    // Find the data source by name
    const ds = dataSources.find(
      (source) => source.name.toLowerCase() === dataSourceName.toLowerCase()
    );
    
    if (!ds) return match;
    
    const data = resolveDataSourceData(ds);
    
    if (!data) return match;
    
    // If no path after datasource name, return stringified data
    if (!valuePath) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
    
    const value = getValueByPath(data, valuePath);
    
    if (value === undefined || value === null) return match;
    
    return typeof value === 'string' ? value : JSON.stringify(value);
  });
}

/**
 * Interpolate all string properties in an object
 */
export function interpolateObject<T extends Record<string, unknown>>(
  obj: T,
  dataSources: DataSource[]
): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = interpolateVariables(value, dataSources);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = interpolateObject(value as Record<string, unknown>, dataSources);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? interpolateObject(item as Record<string, unknown>, dataSources)
          : typeof item === 'string'
          ? interpolateVariables(item, dataSources)
          : item
      );
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Check if a string contains variable placeholders
 */
export function hasVariables(text: string | undefined): boolean {
  if (!text) return false;
  return /\{\{[^}]+\}\}/.test(text);
}

/**
 * Extract variable names from a string
 */
export function extractVariables(text: string | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2).trim());
}
