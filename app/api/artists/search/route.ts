import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('term');
  
  if (!searchTerm) {
    return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
  }
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name')
    .limit(10);
  
  if (error) {
    console.error('Error searching artists:', error);
    return NextResponse.json({ error: 'Failed to search artists' }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
