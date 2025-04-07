'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import MediaUpload from '@/components/ui/media-upload';

export default function SiteContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [updatedContent, setUpdatedContent] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchUserRoles() {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Fetch user roles from the database
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', session.user.id);
          
        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
          return;
        }
        
        if (rolesData && rolesData.length > 0) {
          const roles = rolesData.map(r => r.roles.name);
          console.log('User roles:', roles);
          setUserRoles(roles);
        }
      } catch (e) {
        console.error('Error in fetchUserRoles:', e);
      }
    }
    
    fetchUserRoles();
  }, []);
  
  const moveItemUp = async (item: any, sectionItems: any[]) => {
    // Find current index of the item in the section
    const currentIndex = sectionItems.findIndex(i => i.id === item.id);
    
    if (currentIndex <= 0) return; // Already at the top
    
    // Get the item before this one
    const prevItem = sectionItems[currentIndex - 1];
    
    // Swap sort_order values
    const temp = prevItem.sort_order;
    
    try {
      // Update previous item
      await supabase
        .from('site_content')
        .update({ sort_order: item.sort_order })
        .eq('id', prevItem.id);
      
      // Update current item
      await supabase
        .from('site_content')
        .update({ sort_order: temp })
        .eq('id', item.id);
      
      // Refresh content
      await loadContent();
      
      toast({
        title: "Order updated",
        description: `Moved ${item.field} up`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };
  
  const moveItemDown = async (item: any, sectionItems: any[]) => {
    // Find current index of the item in the section
    const currentIndex = sectionItems.findIndex(i => i.id === item.id);
    
    if (currentIndex >= sectionItems.length - 1) return; // Already at the bottom
    
    // Get the item after this one
    const nextItem = sectionItems[currentIndex + 1];
    
    // Swap sort_order values
    const temp = nextItem.sort_order;
    
    try {
      // Update next item
      await supabase
        .from('site_content')
        .update({ sort_order: item.sort_order })
        .eq('id', nextItem.id);
      
      // Update current item
      await supabase
        .from('site_content')
        .update({ sort_order: temp })
        .eq('id', item.id);
      
      // Refresh content
      await loadContent();
      
      toast({
        title: "Order updated",
        description: `Moved ${item.field} down`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const ensureSortOrder = async () => {
    // This function ensures all items have a sort_order value
    // If any items are missing sort_order, we'll assign incremental values
    const sectionMap = {};
    let updates = [];
    
    // Group by section and check if sort_order exists
    content.forEach(item => {
      if (!sectionMap[item.section]) {
        sectionMap[item.section] = [];
      }
      sectionMap[item.section].push(item);
    });
    
    // Assign sort_order for each section if needed
    for (const section in sectionMap) {
      const items = sectionMap[section];
      let needsUpdate = false;
      
      // Check if any items lack sort_order
      for (const item of items) {
        if (item.sort_order === null || item.sort_order === undefined) {
          needsUpdate = true;
          break;
        }
      }
      
      if (needsUpdate) {
        // Sort by ID to ensure consistent ordering
        items.sort((a, b) => a.id.localeCompare(b.id));
        
        // Assign sort_order
        for (let i = 0; i < items.length; i++) {
          updates.push({
            id: items[i].id,
            sort_order: i + 1
          });
        }
      }
    }
    
    // Apply updates if needed
    if (updates.length > 0) {
      console.log('Applying sort_order updates:', updates);
      
      for (const update of updates) {
        await supabase
          .from('site_content')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
      
      // Reload content
      await loadContent();
    }
  };

  // Function to load content
  async function loadContent() {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('You need to be logged in');
          return;
        }
        
        console.log('User authenticated:', session.user.email);
        
        // Load all site content
        const { data: contentData, error: contentError } = await supabase
          .from('site_content')
          .select('*')
          .order('section', { ascending: true })
          .order('sort_order', { ascending: true });
          
        if (contentError) {
          console.error('Error loading content:', contentError);
          setError('Failed to load content');
          return;
        }
        
        console.log('Content loaded:', contentData?.length || 0);
        setContent(contentData || []);
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
  }
  
  // Initial content loading
  useEffect(() => {
    loadContent().then(() => {
      ensureSortOrder();
    });
  }, []);
  
  const startEdit = (item: any) => {
    setEditingItem(item);
    setUpdatedContent(item.content);
  };
  
  const handleMediaSelected = (url: string, mediaType: 'image' | 'video') => {
    if (!editingItem) return;
    
    console.log('Media selected:', { url, mediaType, contentType: editingItem.content_type });
    console.log('Current editing item:', editingItem);
    
    setUpdatedContent(url);
    // Just update the item in memory
    setEditingItem({
      ...editingItem,
    });
  };
  
  const cancelEdit = () => {
    setEditingItem(null);
    setUpdatedContent('');
  };
  
  const validateContent = (content: string, contentType: string) => {
    // Basic validation for different content types
    if (!content || content.trim() === '') {
      return 'Content cannot be empty';
    }
    
    if (contentType === 'image') {
      try {
        // Try to create a URL object to validate the URL format
        const url = new URL(content);
        return null; // Valid URL
      } catch (e) {
        return 'Invalid image URL format';
      }
    }
    
    return null; // Default - content is valid
  };
  
  const saveEdit = async () => {
    try {
      if (!editingItem) return;
      
      // Validate content before saving
      const validationError = validateContent(updatedContent, editingItem.content_type);
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Saving content:', {
        id: editingItem.id,
        content: updatedContent,
        is_uploaded: editingItem.is_uploaded || false,
        userRoles: userRoles
      });
      
      // Prepare content for saving
      let finalContent = updatedContent;
      
      // Check if this is a data URL (very long base64 string)
      if (editingItem.content_type === 'image' && updatedContent.startsWith('data:')) {
        console.log('Detected data URL, this might be too large for database storage');
        toast({
          title: "Warning",
          description: "Data URLs may be too large to save. Please use a hosted image URL instead.",
          variant: "warning"
        });
        return;
      }
      
      // Prepare update payload (only include fields that exist in the database)
      const updatePayload = {
        content: finalContent,
        updated_at: new Date().toISOString()
      };
      
      // Log the final payload we're sending
      console.log('Update payload:', updatePayload);
      
      const { data, error } = await supabase
        .from('site_content')
        .update(updatePayload)
        .eq('id', editingItem.id)
        .select();
        
      if (error) {
        console.error('Supabase update error details:', error);
        throw error;
      }
      
      console.log('Update response:', data);
      
      // Update local state
      setContent(content.map(item => 
        item.id === editingItem.id 
          ? { ...item, content: finalContent }
          : item
      ));
      
      setEditingItem(null);
      setUpdatedContent('');
      
      toast({
        title: "Saved successfully",
        description: `Updated ${editingItem.field} content`,
        variant: "success"
      });
      
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content. Check browser console for details.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Site Content Management</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-destructive mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin">
            Return to Admin Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  // Group content by section
  const contentBySection: {[key: string]: any[]} = {};
  content.forEach(item => {
    if (!contentBySection[item.section]) {
      contentBySection[item.section] = [];
    }
    contentBySection[item.section].push(item);
  });
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Site Content Management</h1>
        <Button asChild variant="outline">
          <Link href="/admin">
            <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {Object.keys(contentBySection).length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Icons.fileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No content found.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(contentBySection).map(([section, items]) => (
            <Card key={section}>
              <CardHeader className="pb-3">
                <CardTitle className="capitalize">{section} Section</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Content is displayed in the order shown below. Items at the top appear first on the page.</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map(item => (
                    <div key={item.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium capitalize">{item.field}</h3>
                          {!editingItem && (
                            <div className="flex gap-1">
                              <Button 
                                onClick={() => moveItemUp(item, items)}
                                size="sm"
                                variant="outline"
                                className="px-2 h-7"
                              >
                                <Icons.chevronUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                onClick={() => moveItemDown(item, items)}
                                size="sm"
                                variant="outline"
                                className="px-2 h-7"
                              >
                                <Icons.chevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {editingItem?.id === item.id ? (
                          <div className="space-x-2">
                            <Button 
                              onClick={saveEdit}
                              size="sm"
                              variant="success"
                            >
                              <Icons.check className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button 
                              onClick={cancelEdit}
                              size="sm"
                              variant="outline"
                            >
                              <Icons.close className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => startEdit(item)}
                            size="sm"
                            variant="outline"
                          >
                            <Icons.edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                      
                      {editingItem?.id === item.id ? (
                        item.content_type === 'image' ? (
                          <MediaUpload 
                            onMediaSelected={handleMediaSelected} 
                            defaultMediaUrl={updatedContent}
                            defaultTab="url"
                            mediaType="image"
                          />
                        ) : item.content_type === 'video' ? (
                          <MediaUpload 
                            onMediaSelected={handleMediaSelected} 
                            defaultMediaUrl={updatedContent}
                            defaultTab="url"
                            mediaType="video"
                          />
                        ) : (
                          <Textarea
                            value={updatedContent}
                            onChange={e => setUpdatedContent(e.target.value)}
                            className="w-full"
                            rows={5}
                          />
                        )
                      ) : (
                        item.content_type === 'image' ? (
                          <div className="bg-muted p-4 rounded-md overflow-auto text-center">
                            <div className="relative h-48 w-full mb-2">
                              <Image
                                src={item.content}
                                alt={item.field}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                          </div>
                        ) : item.content_type === 'video' ? (
                          <div className="bg-muted p-4 rounded-md overflow-auto text-center">
                            <video 
                              className="w-full h-48 object-contain bg-black mb-2"
                              controls
                              src={item.content}
                            />
                            <p className="text-xs text-muted-foreground truncate">{item.content}</p>
                          </div>
                        ) : (
                          <div className="bg-muted p-4 rounded-md overflow-auto">
                            <pre className="whitespace-pre-wrap text-sm">{item.content}</pre>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}