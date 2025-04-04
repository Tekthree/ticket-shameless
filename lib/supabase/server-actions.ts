'use server';

import { cookies } from 'next/headers';
import { createServerClient as createClient } from '@supabase/ssr';

// Default placeholder values for development
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export async function getServerSideSupabaseClient() {
  const cookieStore = cookies();
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, any>) {
          // This is a server action, we cannot set cookies directly
        },
        remove(name: string, options: Record<string, any>) {
          // This is a server action, we cannot remove cookies directly
        },
      },
    }
  );
}

// Function to fetch site content from the server
export async function fetchSiteContent() {
  'use server';
  
  const supabase = await getServerSideSupabaseClient();
  
  const { data, error } = await supabase
    .from('site_content')
    .select('*');
    
  if (error) {
    console.error("Error fetching site content:", error);
    return null;
  }
  
  // Organize content by section
  const organizedContent = data.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = {};
    }
    acc[item.section][item.field] = {
      content: item.content,
      type: item.content_type,
      id: item.id
    };
    return acc;
  }, {});
  
  return organizedContent;
}
