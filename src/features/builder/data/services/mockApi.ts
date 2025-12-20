import { Project, Page, BuilderComponent } from '@/features/builder/types/builder';
import { v4 as uuidv4 } from 'uuid';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
let projects: Project[] = [];
let currentProject: Project | null = null;

// Initialize with demo data
const initializeDemoData = () => {
  const demoProject: Project = {
    id: uuidv4(),
    name: 'My Website',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [
      {
        id: uuidv4(),
        name: 'Home',
        slug: 'home',
        type: 'landing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        components: [
          {
            id: uuidv4(),
            type: 'hero',
            props: {
              content: 'Welcome to Our Company',
            },
            styles: {
              backgroundColor: '#1a1a2e',
              textColor: '#ffffff',
              padding: '80px',
              textAlign: 'center',
            },
            children: [
              {
                id: uuidv4(),
                type: 'heading',
                props: {
                  content: 'Build Something Amazing',
                  level: 1,
                },
                styles: {
                  fontSize: '48px',
                  fontWeight: '700',
                  textColor: '#ffffff',
                  margin: '0 0 16px 0',
                },
              },
              {
                id: uuidv4(),
                type: 'paragraph',
                props: {
                  content: 'Create stunning websites with our drag and drop builder. No coding required.',
                },
                styles: {
                  fontSize: '18px',
                  textColor: '#a0a0a0',
                  margin: '0 0 32px 0',
                },
              },
              {
                id: uuidv4(),
                type: 'button',
                props: {
                  content: 'Get Started',
                  variant: 'primary',
                },
                styles: {
                  padding: '12px 32px',
                  borderRadius: '8px',
                },
              },
            ],
          },
        ],
      },
      {
        id: uuidv4(),
        name: 'About',
        slug: 'about',
        type: 'about',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        components: [],
      },
      {
        id: uuidv4(),
        name: 'News',
        slug: 'news',
        type: 'news',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        components: [],
      },
    ],
  };

  projects = [demoProject];
  currentProject = demoProject;
};

// Initialize on load
initializeDemoData();

export const mockApi = {
  // Projects
  async getProjects(): Promise<Project[]> {
    await delay(300);
    return [...projects];
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(200);
    return projects.find(p => p.id === id) || null;
  },

  async createProject(name: string): Promise<Project> {
    await delay(300);
    const newProject: Project = {
      id: uuidv4(),
      name,
      pages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    await delay(200);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return projects[index];
  },

  async deleteProject(id: string): Promise<boolean> {
    await delay(200);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    projects.splice(index, 1);
    return true;
  },

  // Pages
  async getPages(projectId: string): Promise<Page[]> {
    await delay(200);
    const project = projects.find(p => p.id === projectId);
    return project?.pages || [];
  },

  async getPage(projectId: string, pageId: string): Promise<Page | null> {
    await delay(150);
    const project = projects.find(p => p.id === projectId);
    return project?.pages.find(p => p.id === pageId) || null;
  },

  async createPage(projectId: string, page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page | null> {
    await delay(300);
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const newPage: Page = {
      ...page,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    project.pages.push(newPage);
    project.updatedAt = new Date().toISOString();
    return newPage;
  },

  async updatePage(projectId: string, pageId: string, updates: Partial<Page>): Promise<Page | null> {
    await delay(200);
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const pageIndex = project.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return null;

    project.pages[pageIndex] = {
      ...project.pages[pageIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    project.updatedAt = new Date().toISOString();
    return project.pages[pageIndex];
  },

  async deletePage(projectId: string, pageId: string): Promise<boolean> {
    await delay(200);
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;

    const pageIndex = project.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return false;

    project.pages.splice(pageIndex, 1);
    project.updatedAt = new Date().toISOString();
    return true;
  },

  // Components
  async updatePageComponents(
    projectId: string,
    pageId: string,
    components: BuilderComponent[]
  ): Promise<Page | null> {
    await delay(150);
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const pageIndex = project.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return null;

    project.pages[pageIndex].components = components;
    project.pages[pageIndex].updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    return project.pages[pageIndex];
  },

  // Get current project (for demo)
  getCurrentProject(): Project | null {
    return currentProject;
  },

  // Export page as HTML
  async exportPageHTML(projectId: string, pageId: string): Promise<string> {
    await delay(300);
    const project = projects.find(p => p.id === projectId);
    if (!project) return '';

    const page = project.pages.find(p => p.id === pageId);
    if (!page) return '';

    return generateHTML(page, project.name);
  },
};

function generateHTML(page: Page, projectName: string): string {
  const renderComponent = (component: BuilderComponent): string => {
    const styles = Object.entries(component.styles || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');

    const styleAttr = styles ? ` style="${styles}"` : '';

    switch (component.type) {
      case 'heading':
        const level = component.props.level || 1;
        return `<h${level}${styleAttr}>${component.props.content || ''}</h${level}>`;
      
      case 'paragraph':
        return `<p${styleAttr}>${component.props.content || ''}</p>`;
      
      case 'button':
        return `<button${styleAttr}>${component.props.content || 'Button'}</button>`;
      
      case 'image':
        return `<img src="${component.props.src || ''}" alt="${component.props.alt || ''}"${styleAttr} />`;
      
      case 'divider':
        return `<hr${styleAttr} />`;
      
      case 'spacer':
        return `<div${styleAttr}></div>`;
      
      case 'container':
      case 'card':
      case 'hero':
        const children = (component.children || []).map(renderComponent).join('\n  ');
        return `<div${styleAttr}>\n  ${children}\n</div>`;
      
      case 'grid':
        const gridChildren = (component.children || []).map(renderComponent).join('\n  ');
        return `<div${styleAttr}>\n  ${gridChildren}\n</div>`;
      
      default:
        return `<div${styleAttr}>${component.props.content || ''}</div>`;
    }
  };

  const content = page.components.map(renderComponent).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name} - ${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    img { max-width: 100%; height: auto; }
    button { cursor: pointer; border: none; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}
