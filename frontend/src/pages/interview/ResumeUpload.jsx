import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadResume() {
    if (!file) {
      toast.error('Choose a resume first');
      return;
    }
    const formData = new FormData();
    formData.append('resume', file);
    setIsUploading(true);
    try {
      await apiClient.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Resume uploaded');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <PageHeader title="Resume upload" description="Upload structure is ready for private storage URLs and future resume parsing." />
      <Card>
        <label className="block text-sm font-medium text-slate-700">
          Resume file
          <input className="mt-2 block w-full rounded-md border border-slate-200 bg-white p-2 text-sm" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <Button className="mt-4" isLoading={isUploading} onClick={uploadResume}>Upload resume</Button>
      </Card>
    </>
  );
}
