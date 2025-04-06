'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newArtist, setNewArtist] = useState({ name: '', image: '', bio: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    loadArtists();
  }, []);
  
  const loadArtists = async () => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You need to be logged in');
        return;
      }
      
      // Load all artists
      const { data, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .order('name');
        
      if (artistsError) {
        console.error('Error loading artists:', artistsError);
        setError('Failed to load artists');
        return;
      }
      
      setArtists(data || []);
      
    } catch (e) {
      console.error('Unhandled error:', e);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newArtist.name.trim()) {
      toast({
        title: "Error",
        description: "Artist name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('artists')
        .insert([newArtist])
        .select();
        
      if (error) throw error;
      
      // Reset form and close dialog
      setNewArtist({ name: '', image: '', bio: '' });
      setIsAddDialogOpen(false);
      
      // Add the new artist to the list
      if (data && data.length > 0) {
        setArtists(prev => [...prev, data[0]]);
      }
      
      toast({
        title: "Success",
        description: "Artist created successfully",
        variant: "success"
      });
      
    } catch (error) {
      console.error('Error creating artist:', error);
      toast({
        title: "Error",
        description: "Failed to create artist",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter artists based on search term
  const filteredArtists = artists.filter(artist => 
    artist.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Artists Management</h1>
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
          <Link href="/admin">
            Return to Admin Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Artists Management</h1>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="shameless">
                <Icons.add className="mr-2 h-4 w-4" />
                Add Artist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddArtist}>
                <DialogHeader>
                  <DialogTitle>Add New Artist</DialogTitle>
                  <DialogDescription>
                    Create a new artist profile to include in events.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newArtist.name}
                      onChange={e => setNewArtist({...newArtist, name: e.target.value})}
                      placeholder="Artist name"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={newArtist.image}
                      onChange={e => setNewArtist({...newArtist, image: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={newArtist.bio}
                      onChange={e => setNewArtist({...newArtist, bio: e.target.value})}
                      placeholder="Artist biography..."
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} variant="shameless">
                    {isSubmitting ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Artist'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button asChild variant="outline">
            <Link href="/admin">
              <Icons.arrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search artists..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredArtists.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <Icons.users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No artists found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm 
                ? `No artists match the search "${searchTerm}"`
                : "Start by adding your first artist"
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)} 
                className="mt-4" 
                variant="shameless"
              >
                <Icons.add className="mr-2 h-4 w-4" />
                Add Artist
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtists.map(artist => (
            <Card key={artist.id} className="overflow-hidden">
              <div className="aspect-square w-full relative bg-muted">
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
              <CardHeader className="p-4">
                <CardTitle className="text-xl">{artist.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {artist.bio ? (
                  <p className="text-muted-foreground text-sm line-clamp-3">{artist.bio}</p>
                ) : (
                  <p className="text-muted-foreground text-sm italic">No bio provided</p>
                )}
                <div className="flex justify-end mt-4">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/artists/${artist.id}`}>
                      <Icons.edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
