-- Create a public bucket for storing images and videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'Public Storage', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies to allow authenticated users to insert into the storage
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Create policy to allow all users to select/view objects from public bucket
CREATE POLICY "Allow public read access to objects"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Create policy to allow authenticated users to update their own objects
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public' AND auth.uid() = owner);

-- Create policy to allow authenticated users to delete their own objects
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public' AND auth.uid() = owner);
