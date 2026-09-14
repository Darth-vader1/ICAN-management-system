import React, { useState } from 'react';
import { X, FileText, Download, Upload, Plus } from 'lucide-react';
import type { ClassMaterial } from '../../types/classroom';

interface MaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: ClassMaterial[];
  isInstructor: boolean;
  onUpload?: (formData: FormData) => void;
  isUploading?: boolean;
}

export const MaterialsModal: React.FC<MaterialsModalProps> = ({
  isOpen,
  onClose,
  materials,
  isInstructor,
  onUpload,
  isUploading,
}) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file || !onUpload) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    onUpload(formData);
    setTitle('');
    setDescription('');
    setFile(null);
    setShowUploadForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Classroom Materials</h3>
            <p className="text-xs text-slate-500">Lecture slides, practice sheets, and notes</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {isInstructor && onUpload && !showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Learning Material</span>
            </button>
          )}

          {/* Upload Form */}
          {showUploadForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Upload Learning Material</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Financial Reporting Week 1 Slides"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of file..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">File *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Materials List */}
          {materials.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-100">
              No materials uploaded for this class yet.
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.title}</p>
                      {m.description && <p className="text-[11px] text-slate-500 truncate">{m.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded by {m.uploaded_by_name || 'Instructor'} • {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <a
                    href={m.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
