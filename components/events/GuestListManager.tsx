'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import toast from 'react-hot-toast';

interface GuestListManagerProps {
  eventId: string;
}

export default function GuestListManager({ eventId }: GuestListManagerProps) {
  const [guestList, setGuestList] = useState<any[]>([]);
  const [newGuest, setNewGuest] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: 1,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allocation, setAllocation] = useState(0);
  const [used, setUsed] = useState(0);
  const { roles, hasRole } = useUserRoles();
  const supabase = createClient();
  
  // Check if user can manage this event's guest list
  const [canManage, setCanManage] = useState(false);
  
  useEffect(() => {
    async function checkAccess() {
      // Admins, event managers, and box office always have access
      if (hasRole('admin') || hasRole('event_manager') || hasRole('box_office') || hasRole('guest_list_manager')) {
        setCanManage(true);
        return;
      }
      
      // Check if user is an artist for this event
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: artistData } = await supabase
          .from('event_artists')
          .select('*')
          .eq('event_id', eventId)
          .eq('user_id', session.user.id)
          .eq('can_manage_guestlist', true)
          .maybeSingle();
          
        if (artistData) {
          setCanManage(true);
          setAllocation(artistData.guestlist_allocation);
        }
      }
    }
    
    checkAccess();
  }, [eventId, roles]);
  
  // Load guest list
  useEffect(() => {
    async function loadGuestList() {
      if (!canManage) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      let query = supabase
        .from('guest_lists')
        .select('*')
        .eq('event_id', eventId);
        
      // If not admin, only show user's own guests
      if (!hasRole('admin') && !hasRole('event_manager') && !hasRole('box_office')) {
        query = query.eq('created_by', session.user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading guest list:', error);
        toast.error('Failed to load guest list');
      } else {
        setGuestList(data || []);
        
        // Calculate used allocation
        const totalGuests = data?.reduce((sum, guest) => sum + guest.number_of_guests, 0) || 0;
        setUsed(totalGuests);
      }
      
      setIsLoading(false);
    }
    
    loadGuestList();
  }, [eventId, canManage]);
  
  // Add guest to list
  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    
    if (!canManage) {
      toast.error('You do not have permission to manage this guest list');
      return;
    }
    
    // Check remaining allocation
    if (!hasRole('admin') && !hasRole('event_manager') && (used + newGuest.number_of_guests > allocation)) {
      toast.error(`You only have ${allocation - used} guest spots remaining`);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in');
        return;
      }
      
      const { data, error } = await supabase
        .from('guest_lists')
        .insert({
          event_id: eventId,
          created_by: session.user.id,
          ...newGuest
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setGuestList([data, ...guestList]);
      setUsed(used + newGuest.number_of_guests);
      setNewGuest({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        number_of_guests: 1,
        notes: ''
      });
      
      toast.success('Guest added successfully');
    } catch (error) {
      console.error('Error adding guest:', error);
      toast.error('Failed to add guest');
    }
  }
  
  // Remove guest
  async function removeGuest(id: number, guestCount: number) {
    try {
      const { error } = await supabase
        .from('guest_lists')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setGuestList(guestList.filter(guest => guest.id !== id));
      setUsed(used - guestCount);
      toast.success('Guest removed successfully');
    } catch (error) {
      console.error('Error removing guest:', error);
      toast.error('Failed to remove guest');
    }
  }
  
  // Check in guest
  async function checkInGuest(id: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { error } = await supabase
        .from('guest_lists')
        .update({
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: session.user.id
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setGuestList(guestList.map(guest => 
        guest.id === id 
          ? { 
              ...guest, 
              is_checked_in: true, 
              checked_in_at: new Date().toISOString(),
              checked_in_by: session.user.id 
            } 
          : guest
      ));
      
      toast.success('Guest checked in');
    } catch (error) {
      console.error('Error checking in guest:', error);
      toast.error('Failed to check in guest');
    }
  }
  
  if (isLoading) {
    return <div className="p-6">Loading guest list...</div>;
  }
  
  if (!canManage) {
    return <div className="p-6 text-red-600">You do not have permission to manage this guest list.</div>;
  }
  
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Add Guest</h2>
        
        {!hasRole('admin') && !hasRole('event_manager') && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Guest List Allocation: {used} / {allocation} spots used
            </p>
          </div>
        )}
        
        <form onSubmit={addGuest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Name
            </label>
            <input
              type="text"
              value={newGuest.guest_name}
              onChange={(e) => setNewGuest({...newGuest, guest_name: e.target.value})}
              required
              className="block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                value={newGuest.guest_email}
                onChange={(e) => setNewGuest({...newGuest, guest_email: e.target.value})}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={newGuest.guest_phone}
                onChange={(e) => setNewGuest({...newGuest, guest_phone: e.target.value})}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max={hasRole('admin') || hasRole('event_manager') ? 99 : allocation - used + 1}
                value={newGuest.number_of_guests}
                onChange={(e) => setNewGuest({...newGuest, number_of_guests: parseInt(e.target.value)})}
                required
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={newGuest.notes}
                onChange={(e) => setNewGuest({...newGuest, notes: e.target.value})}
                className="block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full p-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition"
          >
            Add to Guest List
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Guest List</h2>
        
        {guestList.length === 0 ? (
          <p className="text-gray-500">No guests added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # of Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guestList.map((guest) => (
                  <tr key={guest.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{guest.guest_name}</div>
                      {guest.guest_email && (
                        <div className="text-sm text-gray-500">{guest.guest_email}</div>
                      )}
                      {guest.notes && (
                        <div className="text-sm text-gray-500 italic">{guest.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.number_of_guests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.is_checked_in ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Checked In
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Not Checked In
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!guest.is_checked_in && (hasRole('admin') || hasRole('event_manager') || hasRole('box_office')) && (
                        <button
                          onClick={() => checkInGuest(guest.id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => removeGuest(guest.id, guest.number_of_guests)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
