import type React from 'react';
import { createComponent } from '@/features/builder/data/models/componentDefinitions';
import { BuilderComponent } from '@/features/builder/types/builder';
import { LayoutTemplate, Mail, Sparkles } from 'lucide-react';


export type TemplateCategory = 'blocks' | 'forms' | 'sections';

export interface BuilderTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: TemplateCategory;
  build: () => BuilderComponent;
}

function setText(comp: BuilderComponent, text: string) {
  comp.props = { ...comp.props, content: text };
  return comp;
}

export const builderTemplates: BuilderTemplate[] = [
  {
    id: 'hero-simple',
    title: 'Hero + CTA',
    description: 'Hero section with heading, copy and button',
    icon: Sparkles,
    category: 'sections',
    build: () => {
      const hero = createComponent('hero');
      const heading = setText(createComponent('heading'), 'Build pages with variables');
      heading.props.level = 1;
      const para = setText(
        createComponent('paragraph'),
        'Type {{ to insert data source variables. Switch to Preview to see interpolation.'
      );
      const button = setText(createComponent('button'), 'Get Started');
      hero.children = [heading, para, button];
      return hero;
    },
  },
  {
    id: 'contact-form',
    title: 'Contact Form',
    description: 'Heading + inputs + message + submit',
    icon: Mail,
    category: 'forms',
    build: () => {
      const card = createComponent('card');
      const heading = setText(createComponent('heading'), 'Contact us');
      heading.props.level = 2;
      const name = createComponent('input');
      name.props = { ...name.props, label: 'Name', name: 'name', placeholder: 'Your name' };
      const email = createComponent('input');
      email.props = { ...email.props, label: 'Email', name: 'email', inputType: 'email', placeholder: 'you@company.com' };
      const message = createComponent('textarea');
      message.props = { ...message.props, label: 'Message', name: 'message', placeholder: 'How can we help?' };
      const submit = setText(createComponent('button'), 'Send message');

      card.children = [heading, name, email, message, submit];
      return card;
    },
  },
  {
    id: 'two-col-feature',
    title: '2-Column Block',
    description: 'Row with 2 columns and text',
    icon: LayoutTemplate,
    category: 'blocks',
    build: () => {
      const row = createComponent('row');
      // row default creates two columns; add content inside them
      const [c1, c2] = row.children ?? [];
      if (c1) c1.children = [setText(createComponent('heading'), 'Left title'), setText(createComponent('paragraph'), 'Left content')];
      if (c2) c2.children = [setText(createComponent('heading'), 'Right title'), setText(createComponent('paragraph'), 'Right content')];
      return row;
    },
  },
];
