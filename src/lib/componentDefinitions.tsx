import { ComponentType, BuilderComponent, ComponentStyles } from '@/types/builder';
import { v4 as uuidv4 } from 'uuid';
import {
  Type,
  AlignLeft,
  Square,
  Image,
  Minus,
  Space,
  LayoutGrid,
  CreditCard,
  Layers,
  MousePointer,
} from 'lucide-react';

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultProps: BuilderComponent['props'];
  defaultStyles: ComponentStyles;
}

export const componentDefinitions: ComponentDefinition[] = [
  {
    type: 'heading',
    label: 'Heading',
    icon: Type,
    defaultProps: {
      content: 'Heading Text',
      level: 1,
    },
    defaultStyles: {
      fontSize: '32px',
      fontWeight: '700',
      margin: '0 0 16px 0',
    },
  },
  {
    type: 'paragraph',
    label: 'Paragraph',
    icon: AlignLeft,
    defaultProps: {
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    defaultStyles: {
      fontSize: '16px',
      margin: '0 0 16px 0',
    },
  },
  {
    type: 'button',
    label: 'Button',
    icon: MousePointer,
    defaultProps: {
      content: 'Click Me',
      variant: 'primary',
    },
    defaultStyles: {
      padding: '12px 24px',
      borderRadius: '8px',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: Image,
    defaultProps: {
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop',
      alt: 'Placeholder image',
    },
    defaultStyles: {
      width: '100%',
      borderRadius: '8px',
    },
  },
  {
    type: 'container',
    label: 'Container',
    icon: Square,
    defaultProps: {},
    defaultStyles: {
      padding: '24px',
      backgroundColor: '#1a1a2e',
      borderRadius: '8px',
    },
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    defaultProps: {},
    defaultStyles: {
      margin: '24px 0',
    },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: Space,
    defaultProps: {},
    defaultStyles: {
      height: '48px',
    },
  },
  {
    type: 'card',
    label: 'Card',
    icon: CreditCard,
    defaultProps: {},
    defaultStyles: {
      padding: '24px',
      backgroundColor: '#252538',
      borderRadius: '12px',
    },
  },
  {
    type: 'grid',
    label: 'Grid',
    icon: LayoutGrid,
    defaultProps: {},
    defaultStyles: {
      gap: '16px',
      columns: 2,
    },
  },
  {
    type: 'hero',
    label: 'Hero Section',
    icon: Layers,
    defaultProps: {
      content: 'Hero Section',
    },
    defaultStyles: {
      padding: '80px 24px',
      backgroundColor: '#1a1a2e',
      textAlign: 'center',
    },
  },
];

export function createComponent(type: ComponentType): BuilderComponent {
  const definition = componentDefinitions.find(d => d.type === type);
  if (!definition) {
    throw new Error(`Unknown component type: ${type}`);
  }

  return {
    id: uuidv4(),
    type,
    props: { ...definition.defaultProps },
    styles: { ...definition.defaultStyles },
    children: ['container', 'card', 'grid', 'hero'].includes(type) ? [] : undefined,
  };
}

export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
  return componentDefinitions.find(d => d.type === type);
}
