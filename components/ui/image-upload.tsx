'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  onImageSelected: (imageUrl: string, isUploaded: boolean) => void;
  defaultImageUrl?: string;
  defaultTab?: 'url' | 'upload';
}

export default function ImageUpload({ 
  onImageSelected, 
  defaultImageUrl = '', 
  defaultTab = 'url' 
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(defaultImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleUrlSubmit = () => {
    onImageSelected(imageUrl, false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `site-content/${fileName}`;

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
      setImageUrl(uploadedUrl);
      onImageSelected(uploadedUrl, true);

      toast({
        title: "Upload successful",
        description: "Image has been uploaded and selected",
        variant: "success"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
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
          <TabsTrigger value="url">Image URL</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="image-url">Enter image URL</Label>
            <Input
              id="image-url"
              type="text"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
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
              accept="image/*"
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
                  <Icons.upload className="h-6 w-6" />
                  <span className="mt-2">Click to upload an image</span>
                </div>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {previewUrl && (
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
    </div>
  );
}
