import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ProjectContext = createContext({
  selectedProject: null,
  setSelectedProject: () => {},
  selectedTask: null,
  setSelectedTask: () => {},
  selectedArtifact: null,
  setSelectedArtifact: () => {},
  selectedPaper: null,
  setSelectedPaper: () => {},
  selectedFile: null,
  setSelectedFile: () => {},
  selectedDocument: null,
  setSelectedDocument: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
  editorRef: { current: null },
  applyAISuggestion: () => {},
});

export const ProjectProvider = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Editor ref for AI text suggestions
  const editorRef = useRef(null);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Apply AI suggestion to editor
  const applyAISuggestion = useCallback((text, range) => {
    if (editorRef.current && editorRef.current.applySuggestion) {
      return editorRef.current.applySuggestion(text, range);
    }
    return false;
  }, []);

  return (
    <ProjectContext.Provider value={{
      selectedProject,
      setSelectedProject,
      selectedTask,
      setSelectedTask,
      selectedArtifact,
      setSelectedArtifact,
      selectedPaper,
      setSelectedPaper,
      selectedFile,
      setSelectedFile,
      selectedDocument,
      setSelectedDocument,
      refreshTrigger,
      triggerRefresh,
      editorRef,
      applyAISuggestion,
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
