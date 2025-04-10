'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import ProfileForm from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    async function getProfile() {
      try {
        // Get authenticated user securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          // We need to use window.location instead of redirect() in useEffect
          window.location.href = '/auth/login';
          return;
        }
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // If profile doesn't exist, create it
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating new profile');
            await createProfile(user);
          }
        } else {
          console.log('Profile found:', profile);
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error in getProfile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    async function createProfile(user: any) {
      try {
        // Get user info to create profile
        console.log('Creating profile for user ID:', user.id);
        
        // Create a new profile for the user
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
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
    
    getProfile();
  }, []);
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 bg-white dark:bg-gray-900/50 p-8 rounded-lg border dark:border-gray-800 border-gray-200">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-900/50 p-8 rounded-lg border dark:border-gray-800 border-gray-200">
      {profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Unable to load profile. Please try again later.</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2 dark:bg-gray-800 dark:border-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Page
          </Button>
        </div>
      )}
    </div>
  );
}
