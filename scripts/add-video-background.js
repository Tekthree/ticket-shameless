// This script adds a video_background content item if one doesn't exist
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key is missing. Please check your .env.local file.');
  process.exit(1);
}

async function addVideoBackground() {
  console.log('Starting to add video background content item...');
  
  try {
    // Create a supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if a video_background item already exists
    const { data: existingItems, error: checkError } = await supabase
      .from('site_content')
      .select('*')
      .eq('field', 'video_background');
      
    if (checkError) {
      console.error('Error checking for existing video background:', checkError);
      return;
    }
    
    if (existingItems && existingItems.length > 0) {
      console.log('Video background content item already exists:', existingItems[0]);
      
      // Ensure it has the correct content_type
      if (existingItems[0].content_type !== 'video') {
        const { error: updateError } = await supabase
          .from('site_content')
          .update({ content_type: 'video' })
          .eq('id', existingItems[0].id);
          
        if (updateError) {
          console.error('Error updating video background content type:', updateError);
        } else {
          console.log('Updated content type to "video"');
        }
      }
      
      return;
    }
    
    // Find the next available sort_order value for the home section
    const { data: homeItems, error: homeError } = await supabase
      .from('site_content')
      .select('sort_order')
      .eq('section', 'home')
      .order('sort_order', { ascending: false })
      .limit(1);
    
    if (homeError) {
      console.error('Error getting last sort_order:', homeError);
      return;
    }
    
    let nextSortOrder = 1;
    if (homeItems && homeItems.length > 0 && homeItems[0].sort_order) {
      nextSortOrder = homeItems[0].sort_order + 1;
    }
    
    // Add the video background content item
    const { data: newItem, error: insertError } = await supabase
      .from('site_content')
      .insert({
        section: 'home',
        field: 'video_background',
        content_type: 'video',
        content: '', // This will be empty until a video is uploaded
        sort_order: nextSortOrder
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting video background content:', insertError);
      return;
    }
    
    console.log('Successfully added video background content item:', newItem);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
addVideoBackground()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
