'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export default function SiteContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [updatedContent, setUpdatedContent] = useState('');
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
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
          .order('section', { ascending: true });
          
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
    
    loadContent();
  }, []);
  
  const startEdit = (item: any) => {
    setEditingItem(item);
    setUpdatedContent(item.content);
  };
  
  const cancelEdit = () => {
    setEditingItem(null);
    setUpdatedContent('');
  };
  
  const saveEdit = async () => {
    try {
      if (!editingItem) return;
      
      const { error } = await supabase
        .from('site_content')
        .update({ content: updatedContent })
        .eq('id', editingItem.id);
        
      if (error) throw error;
      
      // Update local state
      setContent(content.map(item => 
        item.id === editingItem.id 
          ? { ...item, content: updatedContent }
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
        description: "Failed to update content",
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
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map(item => (
                    <div key={item.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium capitalize">{item.field}</h3>
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
                        <Textarea
                          value={updatedContent}
                          onChange={e => setUpdatedContent(e.target.value)}
                          className="w-full"
                          rows={5}
                        />
                      ) : (
                        <div className="bg-muted p-4 rounded-md overflow-auto">
                          <pre className="whitespace-pre-wrap text-sm">{item.content}</pre>
                        </div>
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
