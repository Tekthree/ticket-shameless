'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { getSiteContent, updateSiteContent, SiteContent } from '@/lib/site-content';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';

export default function SiteContentManager() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getSiteContent();
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load site content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, []);
  
  const handleTextChange = (section: string, field: string, value: string) => {
    if (!content) return;
    
    setContent({
      ...content,
      [section]: {
        ...content[section],
        [field]: {
          ...content[section][field],
          content: value
        }
      }
    });
  };
  
  const handleUploadFile = async (section: string, field: string, file: File) => {
    setLoading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Call API to upload the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      
      // Update the content with the new file URL
      await updateSiteContent(
        section,
        field,
        data.url,
        field.includes('video') ? 'video' : 'image'
      );
      
      // Update local state
      if (content) {
        setContent({
          ...content,
          [section]: {
            ...content[section],
            [field]: {
              ...content[section][field],
              content: data.url,
              type: field.includes('video') ? 'video' : 'image'
            }
          }
        });
      }
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (section: string, field: string) => {
    if (!content) return;
    
    setLoading(true);
    
    try {
      await updateSiteContent(
        section,
        field,
        content[section][field].content,
        content[section][field].type
      );
      
      toast.success('Content saved successfully');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleVideoButtonClick = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };
  
  if (loading && !content) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <AdminHeader />
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <AdminHeader />
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">Site Content Manager</h1>
        <p className="text-gray-600 mb-4">
          Edit your site's content including text, images, and videos.
        </p>
        
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${activeSection === 'hero' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('hero')}
          >
            Hero Section
          </button>
          <button
            className={`px-4 py-2 ${activeSection === 'about' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('about')}
          >
            About Section
          </button>
          <button
            className={`px-4 py-2 ${activeSection === 'motto' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('motto')}
          >
            Motto Section
          </button>
        </div>
        
        {content && activeSection === 'hero' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Hero Title</h2>
              <input
                type="text"
                value={content.hero.title.content}
                onChange={(e) => handleTextChange('hero', 'title', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => handleSave('hero', 'title')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Hero Subtitle</h2>
              <input
                type="text"
                value={content.hero.subtitle.content}
                onChange={(e) => handleTextChange('hero', 'subtitle', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => handleSave('hero', 'subtitle')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Background Image</h2>
              {content.hero.background.content && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current image:</p>
                  <img
                    src={content.hero.background.content}
                    alt="Hero background"
                    className="h-40 object-cover rounded mb-2"
                  />
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile('hero', 'background', e.target.files[0]);
                  }
                }}
              />
              <button
                onClick={handleFileButtonClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Upload New Image
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Background Video (optional)</h2>
              {content.hero.video.content && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current video:</p>
                  <video
                    src={content.hero.video.content}
                    controls
                    className="h-40 object-cover rounded mb-2"
                  />
                </div>
              )}
              <input
                type="file"
                ref={videoInputRef}
                className="hidden"
                accept="video/mp4,video/quicktime"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile('hero', 'video', e.target.files[0]);
                  }
                }}
              />
              <button
                onClick={handleVideoButtonClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Upload Video
              </button>
              {content.hero.video.content && (
                <button
                  onClick={async () => {
                    await updateSiteContent('hero', 'video', '', 'video');
                    if (content) {
                      setContent({
                        ...content,
                        hero: {
                          ...content.hero,
                          video: {
                            ...content.hero.video,
                            content: ''
                          }
                        }
                      });
                    }
                    toast.success('Video removed');
                  }}
                  className="ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={loading}
                >
                  Remove Video
                </button>
              )}
            </div>
          </div>
        )}
        
        {content && activeSection === 'about' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">About Title</h2>
              <input
                type="text"
                value={content.about.title.content}
                onChange={(e) => handleTextChange('about', 'title', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => handleSave('about', 'title')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">About Description</h2>
              <textarea
                value={content.about.description.content}
                onChange={(e) => handleTextChange('about', 'description', e.target.value)}
                className="w-full p-2 border rounded h-40"
              />
              <button
                onClick={() => handleSave('about', 'description')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">About Image</h2>
              {content.about.image.content && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current image:</p>
                  <img
                    src={content.about.image.content}
                    alt="About section"
                    className="h-40 object-cover rounded mb-2"
                  />
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                id="about-image-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile('about', 'image', e.target.files[0]);
                  }
                }}
              />
              <button
                onClick={() => document.getElementById('about-image-input')?.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Upload New Image
              </button>
            </div>
          </div>
        )}
        
        {content && activeSection === 'motto' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Motto Title</h2>
              <input
                type="text"
                value={content.motto.title.content}
                onChange={(e) => handleTextChange('motto', 'title', e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={() => handleSave('motto', 'title')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Motto Description</h2>
              <textarea
                value={content.motto.description.content}
                onChange={(e) => handleTextChange('motto', 'description', e.target.value)}
                className="w-full p-2 border rounded h-40"
              />
              <button
                onClick={() => handleSave('motto', 'description')}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Save
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Motto Image</h2>
              {content.motto.image.content && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current image:</p>
                  <img
                    src={content.motto.image.content}
                    alt="Motto section"
                    className="h-40 object-cover rounded mb-2"
                  />
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                id="motto-image-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile('motto', 'image', e.target.files[0]);
                  }
                }}
              />
              <button
                onClick={() => document.getElementById('motto-image-input')?.click()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                disabled={loading}
              >
                Upload New Image
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-12 pt-6 border-t">
          <Link
            href="/admin"
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Admin Dashboard
          </Link>
          
          <Link
            href="/"
            className="ml-6 text-gray-600 hover:text-gray-800"
            target="_blank"
          >
            View Live Site →
          </Link>
        </div>
      </div>
    </div>
  )
}
