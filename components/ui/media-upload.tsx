'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Icons } from '@/components/ui/icons';

interface MediaUploadProps {
  onMediaSelected: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  defaultMediaUrl?: string;
  defaultTab?: 'url' | 'upload';
  mediaType?: 'image' | 'video';
}

export default function MediaUpload({ 
  onMediaSelected, 
  defaultMediaUrl = '', 
  defaultTab = 'url',
  mediaType = 'image'
}: MediaUploadProps) {
  const [mediaUrl, setMediaUrl] = useState(defaultMediaUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(defaultMediaUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const acceptTypes = mediaType === 'image' ? 'image/*' : 'video/*';
  const folderPath = mediaType === 'image' ? 'site-content' : 'videos';

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMediaUrl(url);
    setPreviewUrl(url);
  };

  const handleUrlSubmit = () => {
    onMediaSelected(mediaUrl, mediaType);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Create a preview for images
    if (mediaType === 'image') {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload the file to Supabase Storage
      // Note: We can't use onUploadProgress as it's not in the FileOptions type
      // So we'll set a fixed progress value instead
      setUploadProgress(50); // Set to 50% to show some progress
      
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Once upload is complete, set to 100%
      setUploadProgress(100);

      if (error) throw error;

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      const uploadedUrl = publicUrlData.publicUrl;
      setMediaUrl(uploadedUrl);
      onMediaSelected(uploadedUrl, mediaType);

      toast({
        title: "Upload successful",
        description: `${mediaType === 'image' ? 'Image' : 'Video'} has been uploaded and selected`,
        variant: "success"
      });
    } catch (error) {
      console.error(`Error uploading ${mediaType}:`, error);
      toast({
        title: "Upload failed",
        description: `There was an error uploading your ${mediaType}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="url">{mediaType === 'image' ? 'Image' : 'Video'} URL</TabsTrigger>
          <TabsTrigger value="upload">Upload {mediaType === 'image' ? 'Image' : 'Video'}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="media-url">Enter {mediaType === 'image' ? 'image' : 'video'} URL</Label>
            <Input
              id="media-url"
              type="text"
              placeholder={mediaType === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
              value={mediaUrl}
              onChange={handleUrlChange}
            />
          </div>
          
          <Button onClick={handleUrlSubmit} className="w-full">
            Use This URL
          </Button>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptTypes}
              onChange={handleFileChange}
            />
            
            <Button 
              onClick={triggerFileInput} 
              variant="outline" 
              disabled={isUploading}
              className="w-full h-24 border-dashed"
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Icons.spinner className="h-6 w-6 animate-spin" />
                  <span className="mt-2">Uploading... {uploadProgress}%</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Icons.add className="h-6 w-6" />
                  <span className="mt-2">Click to upload a {mediaType}</span>
                </div>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {previewUrl && mediaType === 'image' && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="bg-muted p-2 text-xs font-medium">Preview</div>
          <div className="relative h-48 w-full">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-contain"
              onError={() => setPreviewUrl('')}
            />
          </div>
        </div>
      )}
      
      {previewUrl && mediaType === 'video' && (
        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="bg-muted p-2 text-xs font-medium">Preview</div>
          <video 
            className="w-full h-48 object-contain bg-black"
            controls
            src={previewUrl}
            onError={() => setPreviewUrl('')}
          />
        </div>
      )}
    </div>
  );
}
