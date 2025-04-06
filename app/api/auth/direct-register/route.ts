import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    
    // Create the Supabase client
    const supabase = createClient();
    
    console.log('Starting direct user registration process for email:', email);
    
    // First, create the user in the Supabase Auth system
    // This is required due to the foreign key constraint on the profiles table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (authError) {
      console.error('Error creating user in auth system:', authError);
      
      // If this is the same database error, we'll try to continue anyway
      if (!authError.message?.includes('Database error')) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
      
      console.log('Continuing despite auth error...');
    }
    
    // If we managed to get a user from auth, use that user's ID
    let userId = authData?.user?.id;
    
    // If we couldn't get a user from auth, we need to find another way
    if (!userId) {
      // As a last resort, try to check if the user already exists in profiles
      // This is a desperate measure and may not work in all cases
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (existingProfile?.id) {
        // If a profile with this email already exists, use that ID
        userId = existingProfile.id;
        console.log('Found existing profile with ID:', userId);
        
        return NextResponse.json({ 
          message: 'User profile exists',
          userId: existingProfile.id,
          email
        });
      } else {
        // If we still can't find a user, we can't proceed
        return NextResponse.json({ 
          error: 'Cannot create user due to database constraints. Please contact support.' 
        }, { status: 500 });
      }
    }
    
    console.log('Registration successful, redirecting to login');
    
    // Return success response
    return NextResponse.json({
      message: 'User created successfully',
      userId,
      email
    });
  } catch (error) {
    console.error('Unhandled error in direct registration API:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
