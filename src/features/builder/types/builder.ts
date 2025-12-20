// Types for the page builder

export type ComponentType = 
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'container'
  | 'divider'
  | 'spacer'
  | 'card'
  | 'grid'
  | 'hero'
  | 'row'
  | 'column';

export interface ComponentStyles {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  margin?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  gap?: string;
  columns?: number;
  columnSpan?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

export interface BuilderComponent {
  id: string;
  type: ComponentType;
  props: {
    content?: string;
    src?: string;
    alt?: string;
    href?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
  styles: ComponentStyles;
  children?: BuilderComponent[];
}

export type PageType = 'landing' | 'about' | 'news' | 'events' | 'contact' | 'custom';

export interface Page {
  id: string;
  name: string;
  slug: string;
  type: PageType;
  components: BuilderComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}
