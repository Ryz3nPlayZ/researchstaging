'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Upload, FileText, AlertCircle, CheckCircle, Loader2,
  GitGraph, AlertTriangle, MessageSquare, Filter, Download
} from 'lucide-react';
import { getToken } from '@/lib/auth';

// Types
interface PaperUpload {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  status_message?: string;
  claim_count: number;
  relationship_count: number;
  contradiction_count: number;
  created_at: string;
}

interface Claim {
  id: string;
  text: string;
  quote: string;
  claim_type: 'fact' | 'claim' | 'assumption' | 'implication';
  section: string;
  confidence: number;
  importance_score: number;
}

interface Contradiction {
  id: string;
  type: 'numerical' | 'logical' | 'semantic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  claim_1: { id: string; text: string; section: string };
  claim_2: { id: string; text: string; section: string };
}

export default function ClaimsPage() {
  const searchParams = useSearchParams();
  const [uploads, setUploads] = useState<PaperUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<Array<{id: string; name: string}>>([]);

  // Load uploads
  const loadUploads = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/claims-graph/uploads', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setUploads(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (e) {
      console.error('Failed to load uploads:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load projects
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        const projectList = Array.isArray(data) ? data : data.data;
        if (projectList) {
          setProjects(projectList.map((p: any) => ({
            id: p.id,
            name: p.research_goal?.slice(0, 50) || 'Untitled'
          })));
        }
      });
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const files = e instanceof FileList ? e : e.target.files;
    const file = files?.[0];
    if (!file || !selectedProject) return;

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getToken();
      const res = await fetch(`/api/claims-graph/upload?project_id=${selectedProject}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const upload = data?.data ?? data;
        // Add to list
        setUploads(prev => [upload, ...prev]);
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Upload failed:', res.status, errorData);
        alert(`Upload failed: ${errorData.detail || res.statusText}`);
      }
    } catch (e) {
      console.error('Upload error:', e);
      alert(`Upload error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Claims Graph</h1>
          <p className="text-gray-500 mt-1">
            Upload research papers to extract claims and visualize their relationships
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Paper</h2>

          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors relative"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!selectedProject || uploading) return;
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleUpload(files);
              }
            }}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={!selectedProject || uploading}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className={`cursor-pointer flex flex-col items-center ${(!selectedProject || uploading) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
              ) : (
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : 'Drop PDF here or click to browse'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {!selectedProject ? 'Select a project first' : 'PDF files only'}
              </span>
            </label>
          </div>
        </div>

        {/* Uploads List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Processed Papers</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : uploads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No papers uploaded yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload a PDF to extract its claims and build a relationship graph
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uploads.map(upload => (
                <UploadCard
                  key={upload.id}
                  upload={upload}
                  onRefresh={loadUploads}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadCard({ upload, onRefresh }: { upload: PaperUpload; onRefresh: () => void }) {
  const [polling, setPolling] = useState(upload.status === 'pending' || upload.status === 'processing');

  // Poll for status updates
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const token = getToken();
        const res = await fetch(`/api/claims-graph/uploads/${upload.id}/status`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const upload = data?.data ?? data;
          if (upload.status === 'completed' || upload.status === 'failed') {
            setPolling(false);
            onRefresh();
          }
        }
      } catch (e) {
        console.error('Status check failed:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [upload.id, polling, onRefresh]);

  const getStatusIcon = () => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900 truncate" title={upload.filename}>
            {upload.filename}
          </span>
        </div>
        {getStatusIcon()}
      </div>

      {upload.status_message && (
        <p className="text-xs text-gray-500 mb-3">{upload.status_message}</p>
      )}

      {upload.status === 'completed' && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-lg font-semibold text-gray-900">{upload.claim_count}</div>
            <div className="text-[10px] text-gray-500 uppercase">Claims</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-lg font-semibold text-gray-900">{upload.relationship_count}</div>
            <div className="text-[10px] text-gray-500 uppercase">Relations</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className={`text-lg font-semibold ${upload.contradiction_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {upload.contradiction_count}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Issues</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{new Date(upload.created_at).toLocaleDateString()}</span>

        {upload.status === 'completed' && (
          <Link
            href={`/claims/${upload.id}`}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View Graph →
          </Link>
        )}
      </div>
    </div>
  );
}
