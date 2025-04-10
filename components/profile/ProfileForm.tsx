'use client';

import { useState } from 'react';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface ProfileFormProps {
  profile: any;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    notification_preferences: profile?.notification_preferences || { email: true, sms: false }
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData({
      ...formData,
      notification_preferences: {
        ...formData.notification_preferences,
        [field]: checked
      }
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFormData({
            ...formData,
            avatar_url: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, avatarFile);
      
    if (uploadError) {
      toast.error('Failed to upload avatar');
      return null;
    }
    
    const { data } = supabase.storage.from('public').getPublicUrl(filePath);
    return data.publicUrl;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the current user ID securely
      const user = await getAuthenticatedUser();
      
      if (!user) {
        throw new Error('You must be logged in to update your profile');
      }
      
      let avatarUrl = formData.avatar_url;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar();
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }
      
      // Use the authenticated user ID
      const userId = user.id;
      
      // Log the update operation
      console.log('Updating profile for user ID:', userId);
      console.log('Update data:', {
        display_name: formData.display_name,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        bio: formData.bio,
        avatar_url: avatarUrl,
        notification_preferences: formData.notification_preferences,
        updated_at: new Date().toISOString()
      });
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          bio: formData.bio,
          avatar_url: avatarUrl,
          notification_preferences: formData.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      toast.success('Your profile has been updated');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-24 h-24 relative overflow-hidden">
            <AvatarImage src={formData.avatar_url} alt={formData.display_name} className="object-cover" />
            <AvatarFallback>{formData.display_name?.[0] || profile?.email?.[0] || '?'}</AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-center">
            <Button variant="outline" asChild className="text-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
              <Label htmlFor="avatar" className="cursor-pointer text-sm font-medium">
                Change Avatar
              </Label>
            </Button>
            <Input 
              id="avatar"
              type="file"
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="dark:text-white">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Display Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="dark:text-white">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Full Name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="dark:text-white">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Phone Number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio" className="dark:text-white">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself"
              rows={4}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-y-4 border dark:border-gray-800 border-gray-200 p-6 rounded-lg dark:bg-gray-900/30 bg-gray-50">
        <h3 className="text-lg font-medium dark:text-white">Notification Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email_notifications" className="font-medium dark:text-white">Email Notifications</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about your tickets and events</p>
          </div>
          <Switch
            id="email_notifications"
            checked={formData.notification_preferences.email}
            onCheckedChange={(checked) => handleSwitchChange('email', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="sms_notifications" className="font-medium dark:text-white">SMS Notifications</Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive text messages about upcoming events</p>
          </div>
          <Switch
            id="sms_notifications"
            checked={formData.notification_preferences.sms}
            onCheckedChange={(checked) => handleSwitchChange('sms', checked)}
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-8">
        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
