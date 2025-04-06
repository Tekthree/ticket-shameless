import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    
    // Create the Supabase client
    const supabase = createClient();
    
    // Detailed error logging
    console.log('Starting user registration process for email:', email);
    
    // Step 1: Create the user in Supabase Auth with the regular signUp method
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });
    
    if (authError) {
      console.error('Error creating user in Supabase Auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    if (!authData.user) {
      console.error('User data is null after creation');
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }
    
    console.log('User created successfully in Supabase Auth, ID:', authData.user.id);
    
    // Step 2: Manually create the profile record
    try {
      console.log('Creating profile manually for user ID:', authData.user.id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue despite profile creation error
      } else {
        console.log('Profile created successfully for user ID:', authData.user.id);
      }
    } catch (profileError) {
      console.error('Exception during profile creation:', profileError);
      // Continue despite profile creation error
    }
    
    // Return success response
    return NextResponse.json({
      message: 'User created successfully',
      userId: authData.user.id,
      needsEmailVerification: authData.user.email_confirmed_at ? false : true
    });
  } catch (error) {
    console.error('Unhandled error in registration API:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
