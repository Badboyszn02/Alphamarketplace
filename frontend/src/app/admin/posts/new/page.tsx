'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminCreatePost, adminUploadImage } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import { getCurrentMonth, validateImageFile, cn } from '@/lib/utils';

export default function NewPostPage() {
  const router = useRouter();
  const { addToast } = useAppStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [month, setMonth] = useState(getCurrentMonth());
  const [isPremium, setIsPremium] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [contractAddress, setContractAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        addToast('error', validation.error!);
        continue;
      }

      try {
        const uploadResponse = await adminUploadImage(file);
        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.error || 'Failed to upload image');
        }
        newImages.push(uploadResponse.data.url);
      } catch (error) {
        addToast('error', `Failed to upload ${file.name}`);
      }
    }

    setImages([...images, ...newImages]);
    setUploading(false);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      addToast('error', 'Title is required');
      return;
    }

    if (!content.trim()) {
      addToast('error', 'Content is required');
      return;
    }

    setSaving(true);

    const response = await adminCreatePost({
      title: title.trim(),
      content: content.trim(),
      images,
      month,
      is_premium: isPremium,
      contract_address: contractAddress.trim() || undefined,
    });

    if (response.success) {
      addToast('success', 'Post created');
      router.push('/admin/posts');
    } else {
      addToast('error', response.error || 'Failed to create post');
    }

    setSaving(false);
  }

  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -6; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    monthOptions.push({ value, label });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/admin/posts" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Posts
        </Link>
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">New Post</h1>
        <p className="text-text-secondary">Create a new signal or content post.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Enter token contract address..."
            className="w-full font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Access Level
            </label>
            <div className="flex items-center gap-4 h-[46px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isPremium}
                  onChange={() => setIsPremium(true)}
                  className="w-4 h-4 accent-accent-gold"
                />
                <span className="text-text-secondary">Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isPremium}
                  onChange={() => setIsPremium(false)}
                  className="w-4 h-4 accent-accent-gold"
                />
                <span className="text-text-secondary">Free</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content..."
            rows={12}
            className="w-full font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Image
          </label>

          <div className="mb-4">
            <label className={cn(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              uploading
                ? 'border-border-subtle bg-bg-tertiary cursor-wait'
                : 'border-border-accent hover:border-accent-gold/50 hover:bg-bg-tertiary'
            )}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <>
                  <svg className="w-5 h-5 text-text-muted animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-text-muted">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text-secondary">Click to upload image</span>
                </>
              )}
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-bg-tertiary">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-900/80 text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-primary"
          >
            {saving ? 'Creating...' : 'Create Post'}
          </button>
          <Link href="/admin/posts" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
