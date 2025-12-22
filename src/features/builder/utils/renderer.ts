import { BuilderComponent } from '@/features/builder/types/builder';
import { DataSource } from '@/features/builder/types/datasource';
import { interpolateVariables } from './interpolation';

export interface RenderContext {
  dataSources: DataSource[];
  isPreview?: boolean;
}

/**
 * Interpolate all properties of a component with data source values
 */
export function interpolateComponent(
  component: BuilderComponent,
  context: RenderContext
): BuilderComponent {
  const { dataSources } = context;
  
  // Interpolate props
  const interpolatedProps: BuilderComponent['props'] = {};
  for (const [key, value] of Object.entries(component.props)) {
    if (typeof value === 'string') {
      interpolatedProps[key as keyof BuilderComponent['props']] = interpolateVariables(value, dataSources) as never;
    } else if (key === 'options' && Array.isArray(value)) {
      interpolatedProps.options = value.map((opt) => ({
        label: interpolateVariables(opt.label, dataSources),
        value: interpolateVariables(opt.value, dataSources),
      }));
    } else {
      interpolatedProps[key as keyof BuilderComponent['props']] = value as never;
    }
  }
  
  // Interpolate children recursively
  const interpolatedChildren = component.children?.map((child) =>
    interpolateComponent(child, context)
  );
  
  return {
    ...component,
    props: interpolatedProps,
    children: interpolatedChildren,
  };
}

/**
 * Export page data as JSON for external rendering
 */
export function exportPageJSON(
  components: BuilderComponent[],
  dataSources: DataSource[]
): string {
  return JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      dataSources: dataSources.map((ds) => ({
        id: ds.id,
        name: ds.name,
        type: ds.type,
      })),
      components,
    },
    null,
    2
  );
}

/**
 * Parse exported JSON and return components
 */
export function parseExportedJSON(json: string): {
  components: BuilderComponent[];
  dataSources: { id: string; name: string; type: string }[];
} | null {
  try {
    const parsed = JSON.parse(json);
    return {
      components: parsed.components || [],
      dataSources: parsed.dataSources || [],
    };
  } catch {
    return null;
  }
}
