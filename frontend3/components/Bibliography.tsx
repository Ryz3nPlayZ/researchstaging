import { useState, useEffect } from 'react';
import { citationApi } from '../lib/api';

interface BibliographyEntry {
  authors: string;
  year: number;
  title: string;
  journal?: string;
  doi?: string;
}

interface BibliographyProps {
  documentId: string | null;
  format?: 'apa' | 'mla' | 'chicago';
}

export const Bibliography: React.FC<BibliographyProps> = ({ documentId, format = 'apa' }) => {
  const [selectedFormat, setSelectedFormat] = useState<'apa' | 'mla' | 'chicago'>(format);
  const [bibliographyText, setBibliographyText] = useState('');
  const [citationCount, setCitationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setBibliographyText('');
      setCitationCount(0);
      return;
    }

    const fetchBibliography = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await citationApi.generate(documentId, selectedFormat);
        if (response.error) throw new Error(response.error);

        setBibliographyText(response.data?.bibliography || '');
        setCitationCount(response.data?.count || 0);
      } catch (err) {
        console.error('Bibliography error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bibliography');
        setBibliographyText('');
        setCitationCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBibliography();
  }, [documentId, selectedFormat]);

  if (!documentId) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Create or open a document to see bibliography
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">Loading bibliography...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
        <div className="text-sm text-red-600 dark:text-red-400 text-center">{error}</div>
      </div>
    );
  }

  const entries = bibliographyText
    .split('\n\n')
    .filter(entry => entry.trim().length > 0);

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Format Selector */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          References ({citationCount})
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400">Format:</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as any)}
            className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-primary"
          >
            <option value="apa">APA</option>
            <option value="mla">MLA</option>
            <option value="chicago">Chicago</option>
          </select>
        </div>
      </div>

      {/* Bibliography Entries */}
      {entries.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No citations in document. Use the "Insert Citation" button to add references.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: entry.replace(/\n/g, '<br />')
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
