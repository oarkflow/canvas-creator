import { useState } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { mockApi } from '@/lib/mockApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Save,
  Eye,
  EyeOff,
  Download,
  Plus,
  FileText,
  ChevronDown,
  Loader2,
  Trash2,
  LayoutTemplate,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageType } from '@/types/builder';

export function BuilderToolbar() {
  const {
    currentProject,
    currentPage,
    setCurrentPage,
    isPreviewMode,
    setIsPreviewMode,
    isSaving,
    savePage,
    createNewPage,
    deletePage,
  } = useBuilderStore();

  const [isNewPageDialogOpen, setIsNewPageDialogOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageType, setNewPageType] = useState<PageType>('custom');
  const [isExporting, setIsExporting] = useState(false);

  const handleSave = async () => {
    await savePage();
    toast.success('Page saved successfully!');
  };

  const handleExport = async () => {
    if (!currentProject || !currentPage) return;

    setIsExporting(true);
    try {
      const html = await mockApi.exportPageHTML(currentProject.id, currentPage.id);
      
      // Create and download file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPage.slug}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('HTML exported successfully!');
    } catch (error) {
      toast.error('Failed to export HTML');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;

    const page = await createNewPage(newPageName, newPageType);
    if (page) {
      toast.success(`Page "${newPageName}" created!`);
      setIsNewPageDialogOpen(false);
      setNewPageName('');
      setNewPageType('custom');
    }
  };

  const handleDeletePage = async () => {
    if (!currentPage) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${currentPage.name}"?`);
    if (!confirmed) return;

    const success = await deletePage(currentPage.id);
    if (success) {
      toast.success('Page deleted');
    }
  };

  const pages = currentProject?.pages || [];

  return (
    <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left section - Logo and page selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-primary" />
          <span className="font-semibold text-foreground">PageBuilder</span>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Page Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="toolbar" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              {currentPage?.name || 'Select Page'}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.id}
                onClick={() => setCurrentPage(page)}
                className={currentPage?.id === page.id ? 'bg-secondary' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                {page.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <Dialog open={isNewPageDialogOpen} onOpenChange={setIsNewPageDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Page
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Page</DialogTitle>
                  <DialogDescription>
                    Add a new page to your project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Page Name</Label>
                    <Input
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="e.g. Contact Us"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Page Type</Label>
                    <Select
                      value={newPageType}
                      onValueChange={(v) => setNewPageType(v as PageType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landing">Landing</SelectItem>
                        <SelectItem value="about">About</SelectItem>
                        <SelectItem value="news">News</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewPageDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePage} disabled={!newPageName.trim()}>
                    Create Page
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>

        {currentPage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleDeletePage}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="toolbar"
          size="sm"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="gap-2"
        >
          {isPreviewMode ? (
            <>
              <EyeOff className="w-4 h-4" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview
            </>
          )}
        </Button>

        <Button
          variant="toolbar"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !currentPage}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export
        </Button>

        <Button
          variant="glow"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !currentPage}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
