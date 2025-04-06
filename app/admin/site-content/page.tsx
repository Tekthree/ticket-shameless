'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SiteContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [updatedContent, setUpdatedContent] = useState('');
  const supabase = createClient();
  
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
      
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content');
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Site Content Management</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Link href="/simple-admin" className="text-blue-500 hover:underline">
          Return to Admin Dashboard
        </Link>
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
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Site Content Management</h1>
        <Link 
          href="/simple-admin" 
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Back to Dashboard
        </Link>
      </div>
      
      {Object.keys(contentBySection).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-lg text-gray-500">No content found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(contentBySection).map(([section, items]) => (
            <div key={section} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold capitalize">{section} Section</h2>
              </div>
              
              <div className="divide-y">
                {items.map(item => (
                  <div key={item.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium capitalize">{item.field}</h3>
                      {editingItem?.id === item.id ? (
                        <div className="space-x-2">
                          <button 
                            onClick={saveEdit}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
                    {editingItem?.id === item.id ? (
                      <textarea
                        value={updatedContent}
                        onChange={e => setUpdatedContent(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        rows={5}
                      />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-md overflow-auto">
                        <pre className="whitespace-pre-wrap">{item.content}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
