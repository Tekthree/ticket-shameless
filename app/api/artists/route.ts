import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('artists')
      .insert([{ name: body.name, image: body.image }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating artist:', error);
      return NextResponse.json({ error: 'Failed to create artist' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}
