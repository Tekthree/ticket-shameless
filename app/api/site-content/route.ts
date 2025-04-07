import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET endpoint to fetch all site content
export async function GET() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('*');
      
    if (error) {
      console.error("Error fetching site content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Handle case where table doesn't exist yet
    if (!data) {
      return NextResponse.json({}, { status: 200 });
    }
    
    // Organize content by section
    const organizedContent = data.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = {};
      }
      acc[item.section][item.field] = {
        content: item.content,
        type: item.content_type,
        id: item.id,
        is_uploaded: item.is_uploaded || false
      };
      return acc;
    }, {});
    
    return NextResponse.json(organizedContent);
  } catch (error) {
    console.error("Error in site content API:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT endpoint to update a specific content item
export async function PUT(request: Request) {
  const supabase = createClient();
  
  try {
    const data = await request.json();
    
    const { section, field, content, content_type, is_uploaded = false, original_filename = null } = data;
    
    // Check if the item exists
    const { data: existingData, error: queryError } = await supabase
      .from('site_content')
      .select('*')
      .eq('section', section)
      .eq('field', field)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is not found error
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }
    
    let result;
    
    if (existingData) {
      // Update existing item
      const { data: updateData, error: updateError } = await supabase
        .from('site_content')
        .update({ 
          content, 
          content_type,
          is_uploaded,
          original_filename,
          updated_at: new Date().toISOString()
        })
        .eq('section', section)
        .eq('field', field)
        .select();
        
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      result = updateData[0];
    } else {
      // Insert new item
      const { data: insertData, error: insertError } = await supabase
        .from('site_content')
        .insert({ section, field, content, content_type, is_uploaded, original_filename })
        .select();
        
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      
      result = insertData[0];
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in site content API:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
