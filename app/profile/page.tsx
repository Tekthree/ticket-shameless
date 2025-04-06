'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import ProfileForm from '@/components/profile/ProfileForm';
import TicketHistory from '@/components/profile/TicketHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLink from './admin-link';

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    async function getSessionAndProfile() {
      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // We need to use window.location instead of redirect() in useEffect
          window.location.href = '/auth/enhanced-login';
          return;
        }
        
        setSession(session);
        console.log('User session:', session.user.id);
        
        // Fetch user roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', session.user.id);
          
        const roleNames = rolesData?.map((role: any) => role.roles?.name) || [];
        setUserRoles(roleNames);
        console.log('User roles:', roleNames);
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating new profile');
            await createProfile(session);
          }
        } else {
          console.log('Profile found:', profile);
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error in getSessionAndProfile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    async function createProfile(session: any) {
      try {
        // Get user info to create profile
        console.log('Creating profile for user ID:', session.user.id);
        
        // Create a new profile for the user
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error('Error in profile creation:', error);
          throw error;
        }
        
        console.log('Profile created successfully:', data);
        setProfile(data);
        toast.success('Profile created successfully');
      } catch (error) {
        console.error('Error creating profile:', error);
        toast.error('Failed to create profile');
      }
    }
    
    getSessionAndProfile();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Loading profile...</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null; // We're redirecting, no need to render anything
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      {/* Display admin links if user has admin role */}
      {userRoles.includes('admin') && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Admin Access</h2>
          <p className="mb-4">You have administrator privileges. Access admin sections:</p>
          <div className="flex space-x-4">
            <a 
              href="/admin" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Main Admin Dashboard
            </a>
            <a 
              href="/simple-admin" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Simple Admin Dashboard
            </a>
            <a 
              href="/admin/users" 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              User Management
            </a>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="tickets">Ticket History</TabsTrigger>
          {userRoles.length > 0 && (
            <TabsTrigger value="roles">Your Roles</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
            {profile ? (
              <ProfileForm profile={profile} />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">Unable to load profile. Please try again later.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:underline"
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="tickets">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
            <TicketHistory />
          </div>
        </TabsContent>
        
        {userRoles.length > 0 && (
          <TabsContent value="roles">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Your Roles & Permissions</h2>
              <ul className="space-y-2">
                {userRoles.map(role => (
                  <li key={role} className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="capitalize">{role}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
