import { setup, render, mutable } from '@anchorlib/react';
import { useBuilderStore } from '@/features/builder/state/stores/builderStore';
import { mockApi } from '@/features/builder/data/services/mockApi';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/shared/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ChevronDown, Database, Download, Eye, EyeOff, FileText, LayoutTemplate, Loader2, Play, Plus, Save, Trash2, } from 'lucide-react';
import { toast } from 'sonner';
import { PageType } from '@/features/builder/types/builder';
import { Link } from 'react-router-dom';

export const BuilderToolbar = setup(() => {
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

    // use mutable.value consistently
    const state = mutable({ isNewPageDialogOpen: false, newPageName: '', newPageType: 'custom' as PageType, isExporting: false });

    const handleSave = async () => {
        await savePage();
        toast.success('Page saved successfully!');
    };

    const handleExport = async () => {
        if (!currentProject || !currentPage) return;

        state.isExporting = true;
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
            state.isExporting = false;
        }
    };

    const handleCreatePage = async () => {
        if (!state.newPageName.trim()) return;

        const page = await createNewPage(state.newPageName, state.newPageType);
        if (page) {
            toast.success(`Page "${state.newPageName}" created!`);
            state.isNewPageDialogOpen = false;
            state.newPageName = '';
            state.newPageType = 'custom';
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

    return render(() => (
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
                        <Dialog open={state.isNewPageDialogOpen} onOpenChange={(v) => state.isNewPageDialogOpen = v}>
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
                                            value={state.newPageName}
                                            onChange={(e) => (state.newPageName = e.target.value)}
                                            placeholder="e.g. Contact Us"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Page Type</Label>
                                        <Select
                                            value={state.newPageType}
                                            onValueChange={(v) => (state.newPageType = v as PageType)}
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
                                    <Button variant="outline" onClick={() => (state.isNewPageDialogOpen = false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreatePage} disabled={!state.newPageName.trim()}>
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
                    disabled={state.isExporting || !currentPage}
                    className="gap-2"
                >
                    {state.isExporting ? (
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
    ), 'BuilderToolbar');
});
