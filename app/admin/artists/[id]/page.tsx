'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Define the Artist interface
interface Artist {
  id: string;
  name: string;
  image?: string | null;
  bio?: string | null;
  mix_url?: string | null;
  [key: string]: any; // Allow for dynamic property access
}

export default function EditArtistPage({ params }: { params: { id: string } }) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  // Load artist data
  useEffect(() => {
    async function loadArtist() {
      try {
        // Check authentication securely
        const user = await getAuthenticatedUser();
        
        if (!user) {
          setError('You need to be logged in');
          return;
        }
        
        // Load artist data
        const { data, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (artistError) {
          console.error('Error loading artist:', artistError);
          setError('Failed to load artist');
          return;
        }
        
        if (!data) {
          setError('Artist not found');
          return;
        }
        
        setArtist(data);
        
      } catch (e) {
        console.error('Unhandled error:', e);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadArtist();
  }, [params.id]);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setArtist((prev: Artist | null) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });
  };
  
  // Save artist changes
  const handleSave = async () => {
    if (!artist || !artist.name.trim()) {
      toast({
        title: "Error",
        description: "Artist name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name: artist.name,
          image: artist.image,
          bio: artist.bio,
          mix_url: artist.mix_url
        })
        .eq('id', params.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Artist updated successfully",
        variant: "success"
      });
      
    } catch (error) {
      console.error('Error updating artist:', error);
      toast({
        title: "Error",
        description: "Failed to update artist",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete artist
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', params.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Artist deleted successfully",
        variant: "success"
      });
      
      router.push('/admin/artists');
      
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast({
        title: "Error",
        description: "Failed to delete artist",
        variant: "destructive"
      });
      setIsDeleting(false);
    }
  };
  
  // Play/preview the mix
  const handlePlayMix = () => {
    if (artist?.mix_url) {
      setPreviewUrl(artist.mix_url);
    }
  };
  
  if (isLoading || !artist) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Edit Artist</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-destructive mb-4">Error</h1>
        <p className="mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin/artists">
            Return to Artists
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Edit Artist</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="shameless"
          >
            {isSaving ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icons.save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                <Icons.trash className="mr-2 h-4 w-4" />
                Delete Artist
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the artist
                  and remove their data from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Artist"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button asChild variant="outline">
            <Link href="/admin/artists">
              <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Artists
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Artist Image */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Artist Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square w-full relative bg-muted mb-4">
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Icons.user className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                name="image"
                value={artist.image || ''}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Enter a direct URL to the artist's image
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Artist Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Artist Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={artist.name}
                onChange={handleChange}
                placeholder="Artist name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={artist.bio || ''}
                onChange={handleChange}
                placeholder="Artist biography..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Provide a bio or description of the artist
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="mix_url">Mix URL</Label>
              <div className="flex gap-2">
                <Input
                  id="mix_url"
                  name="mix_url"
                  value={artist.mix_url || ''}
                  onChange={handleChange}
                  placeholder="https://soundcloud.com/artist/mix"
                  className="flex-grow"
                />
                <Button 
                  type="button" 
                  onClick={handlePlayMix}
                  disabled={!artist.mix_url}
                  variant="outline"
                >
                  <Icons.play className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add a SoundCloud, Mixcloud or other embeddable mix URL
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Mix Preview Section */}
      {previewUrl && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mix Preview</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPreviewUrl(null)}
              className="h-8 w-8"
            >
              <Icons.close className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full">
              <iframe
                src={previewUrl.includes('soundcloud.com') 
                  ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(previewUrl)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
                  : previewUrl.includes('mixcloud.com')
                    ? `https://www.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=${encodeURIComponent(previewUrl)}`
                    : previewUrl
                }
                width="100%"
                height="100%"
                allow="autoplay"
                className="border-0"
              ></iframe>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
