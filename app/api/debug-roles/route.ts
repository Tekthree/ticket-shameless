import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get the user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        message: 'No authenticated user found', 
        authenticated: false 
      });
    }
    
    // Get user roles
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          id,
          name,
          description
        )
      `)
      .eq('user_id', user.id);
    
    if (userRolesError) {
      return NextResponse.json({ 
        message: 'Error fetching user roles', 
        error: userRolesError,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        }
      }, { status: 500 });
    }
    
    // Fetch the user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        primary_role_id,
        roles:primary_role_id (
          name
        )
      `)
      .eq('id', user.id)
      .single();
    
    // Extract info for the response
    const roleNames = userRolesData.map(item => item.roles?.name);
    
    return NextResponse.json({
      message: 'User roles retrieved successfully',
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      rawRoleData: userRolesData,
      roles: roleNames,
      profile: profileData || null,
      primaryRole: profileData?.roles?.name || null
    });
    
  } catch (error) {
    console.error('Debug roles error:', error);
    return NextResponse.json({ 
      message: 'Error debugging roles', 
      error: String(error)
    }, { status: 500 });
  }
}
