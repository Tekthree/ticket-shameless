import { createClient } from '@/lib/supabase/client';
import { fetchSiteContent } from '@/lib/supabase/server-actions';

export interface ContentItem {
  id?: string;
  content: string;
  type: string;
}

export interface SiteContent {
  [section: string]: {
    [field: string]: ContentItem;
  };
}

export async function getSiteContent() {
  const response = await fetch('/api/site-content', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch site content');
  }
  
  return response.json();
}

export async function updateSiteContent(
  section: string,
  field: string,
  content: string,
  content_type: string = 'text'
) {
  const response = await fetch('/api/site-content', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      section,
      field,
      content,
      content_type
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update site content');
  }
  
  return response.json();
}

export async function getSiteContentServer() {
  try {
    return await fetchSiteContent();
  } catch (error) {
    console.error("Error fetching site content:", error);
    return null;
  }
}

export async function uploadImage(file: File) {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `site-content/${fileName}`;
  
  const { error } = await supabase.storage.from('public').upload(filePath, file);
  
  if (error) {
    throw new Error('Error uploading image: ' + error.message);
  }
  
  const { data } = supabase.storage.from('public').getPublicUrl(filePath);
  
  return data.publicUrl;
}
