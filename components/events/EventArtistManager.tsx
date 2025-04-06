'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import toast from 'react-hot-toast';

interface EventArtistManagerProps {
  eventId: string;
}

export default function EventArtistManager({ eventId }: EventArtistManagerProps) {
  const [artists, setArtists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isEventManager } = useUserRoles();
  const supabase = createClient();
  
  // Only admins and event managers can access this component
  useEffect(() => {
    async function loadData() {
      if (!isAdmin() && !isEventManager()) {
        return;
      }
      
      setIsLoading(true);
      try {
        // Load event artists
        const { data: artistData, error: artistError } = await supabase
          .from('event_artists')
          .select(`
            *,
            profiles:user_id(id, full_name, email)
          `)
          .eq('event_id', eventId);
          
        if (artistError) throw artistError;
        
        setArtists(artistData || []);
        
        // Load all users that can be added as artists
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .order('full_name');
          
        if (userError) throw userError;
        
        // Filter out users who are already artists for this event
        const artistUserIds = artistData?.map(a => a.user_id) || [];
        const filteredUsers = userData?.filter(u => !artistUserIds.includes(u.id)) || [];
        
        setUsers(filteredUsers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load artists');
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [eventId]);
  
  // Add artist to event
  async function addArtist(userId: string) {
    try {
      const { data, error } = await supabase
        .from('event_artists')
        .insert({
          event_id: eventId,
          user_id: userId,
          is_headliner: false,
          can_manage_guestlist: true,
          guestlist_allocation: 10
        })
        .select(`
          *,
          profiles:user_id(id, full_name, email)
        `)
        .single();
        
      if (error) throw error;
      
      // Update state
      setArtists([...artists, data]);
      setUsers(users.filter(u => u.id !== userId));
      
      // Add the guest_list_manager role if they don't have it
      await ensureGuestListManagerRole(userId);
      
      toast.success('Artist added successfully');
    } catch (error) {
      console.error('Error adding artist:', error);
      toast.error('Failed to add artist');
    }
  }
  
  // Ensure user has guest_list_manager role
  async function ensureGuestListManagerRole(userId: string) {
    try {
      // Check if user already has the role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'guest_list_manager')
        .single();
        
      if (!roleData) return;
      
      // Check if user already has this role
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', roleData.id);
        
      if (userRoleError) throw userRoleError;
      
      // If user doesn't have the role, add it
      if (!userRoleData || userRoleData.length === 0) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleData.id
          });
      }
    } catch (error) {
      console.error('Error ensuring guest list manager role:', error);
    }
  }
  
  // Remove artist from event
  async function removeArtist(userId: string) {
    try {
      // Get the user details first
      const artist = artists.find(a => a.user_id === userId);
      
      if (!artist) return;
      
      const { error } = await supabase
        .from('event_artists')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update state
      setArtists(artists.filter(a => a.user_id !== userId));
      setUsers([...users, artist.profiles]);
      
      toast.success('Artist removed successfully');
    } catch (error) {
      console.error('Error removing artist:', error);
      toast.error('Failed to remove artist');
    }
  }
  
  // Update artist settings
  async function updateArtist(userId: string, data: any) {
    try {
      const { error } = await supabase
        .from('event_artists')
        .update(data)
        .eq('event_id', eventId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Update state
      setArtists(artists.map(artist => 
        artist.user_id === userId 
          ? { ...artist, ...data } 
          : artist
      ));
      
      toast.success('Artist updated successfully');
    } catch (error) {
      console.error('Error updating artist:', error);
      toast.error('Failed to update artist');
    }
  }
  
  if (!isAdmin() && !isEventManager()) {
    return (
      <div className="p-6 text-red-600">
        You don't have permission to manage artists for this event.
      </div>
    );
  }
  
  if (isLoading) {
    return <div className="p-6">Loading artists...</div>;
  }
  
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Event Artists</h2>
        
        {artists.length === 0 ? (
          <p className="text-gray-500">No artists added to this event yet.</p>
        ) : (
          <div className="space-y-4">
            {artists.map((artist) => (
              <div key={artist.user_id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{artist.profiles.full_name || artist.profiles.email}</h3>
                  <p className="text-sm text-gray-500">{artist.profiles.email}</p>
                  <div className="mt-2 space-x-4">
                    <label className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={artist.is_headliner}
                        onChange={(e) => updateArtist(artist.user_id, { is_headliner: e.target.checked })} 
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm">Headliner</span>
                    </label>
                    
                    <label className="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        checked={artist.can_manage_guestlist}
                        onChange={(e) => updateArtist(artist.user_id, { can_manage_guestlist: e.target.checked })} 
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm">Can Manage Guest List</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Guest Allocation</label>
                    <input 
                      type="number" 
                      min="0"
                      value={artist.guestlist_allocation}
                      onChange={(e) => updateArtist(artist.user_id, { guestlist_allocation: parseInt(e.target.value) })}
                      className="w-20 p-1 text-sm border rounded"
                    />
                  </div>
                  
                  <button
                    onClick={() => removeArtist(artist.user_id)}
                    className="p-2 text-sm text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Add Artist</h2>
        
        {users.length === 0 ? (
          <p className="text-gray-500">No available users to add as artists.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-medium">{user.full_name || user.email}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                
                <button
                  onClick={() => addArtist(user.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                >
                  Add Artist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
