import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import { MainEditor } from './MainEditor';
import { CharacterPanel } from './CharacterPanel';
import { PlotPanel } from './PlotPanel';
import { ProgressPanel } from './ProgressPanel';
import { ProjectSetup } from './ProjectSetup';
import { useProject } from '../context/ProjectContext';
import { 
  PenTool, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Save,
  FolderOpen,
  Settings,
  AlertCircle
} from 'lucide-react';

export const Workspace: React.FC = () => {
  const { 
    currentProject, 
    currentChapter, 
    isLoading, 
    error,
    updateChapterContent,
    setCurrentChapter,
    refreshProject
  } = useProject();

  const [activeSidePanel, setActiveSidePanel] = useState<'characters' | 'plot' | 'progress'>('characters');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const handleContentChange = async (newContent: string) => {
    if (!currentChapter) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer for auto-save
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await updateChapterContent(currentChapter.id, newContent);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    setAutoSaveTimer(timer);
  };

  const saveProject = async () => {
    if (!currentChapter) return;
    
    try {
      setIsSaving(true);
      // Force immediate save
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      await refreshProject();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSidePanel = () => {
    if (!currentProject) return null;

    switch (activeSidePanel) {
      case 'characters':
        return <CharacterPanel projectData={currentProject} />;
      case 'plot':
        return <PlotPanel projectData={currentProject} />;
      case 'progress':
        return <ProgressPanel projectData={currentProject} />;
      default:
        return null;
    }
  };

  const sidePanelButtons = [
    { id: 'characters', icon: Users, label: 'Characters' },
    { id: 'plot', icon: BookOpen, label: 'Plot & Structure' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' }
  ];

  // Show project setup if no current project
  if (!currentProject && !isLoading) {
    return <ProjectSetup />;
  }

  if (isLoading) {
    return (
      <div className="workspace-loading">
        <div className="loading-spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-error">
        <AlertCircle size={48} />
        <h2>Error loading project</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  return (
    <div className="workspace">
      {/* Top Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <div className="project-info">
            <h1>{currentProject.project.title}</h1>
            <span className="project-meta">
              {currentProject.project.genre} • {currentProject.project.word_count.toLocaleString()} words
              {currentChapter && (
                <span> • Chapter {currentChapter.number}: {currentChapter.title}</span>
              )}
              {isSaving && <span className="saving-indicator"> • Saving...</span>}
            </span>
          </div>
        </div>
        
        <div className="toolbar-center">
          <div className="panel-toggles">
            {sidePanelButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`panel-toggle ${activeSidePanel === id ? 'active' : ''}`}
                onClick={() => {
                  if (activeSidePanel === id) {
                    setShowSidePanel(!showSidePanel);
                  } else {
                    setActiveSidePanel(id as any);
                    setShowSidePanel(true);
                  }
                }}
                title={label}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          <button onClick={saveProject} className="toolbar-button" title="Save" disabled={isSaving}>
            <Save size={18} />
          </button>
          <button className="toolbar-button" title="Open Project">
            <FolderOpen size={18} />
          </button>
          <button className="toolbar-button" title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Chapter Selector */}
      {currentProject.chapters.length > 0 && (
        <div className="chapter-selector">
          <label>Current Chapter:</label>
          <select
            value={currentChapter?.id || ''}
            onChange={(e) => {
              const chapter = currentProject.chapters.find(c => c.id === e.target.value);
              setCurrentChapter(chapter || null);
            }}
          >
            <option value="">Select a chapter...</option>
            {currentProject.chapters.map(chapter => (
              <option key={chapter.id} value={chapter.id}>
                Chapter {chapter.number}: {chapter.title} ({chapter.word_count} words)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content Area */}
      <div className="workspace-content">
        {showSidePanel ? (
          <Split
            sizes={[70, 30]}
            minSize={[400, 300]}
            expandToMin={false}
            gutterSize={8}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
            className="workspace-split"
          >
            <div className="main-content">
              <MainEditor
                currentChapter={currentChapter}
                projectData={currentProject}
                onContentChange={handleContentChange}
              />
            </div>
            <div className="side-content">
              {renderSidePanel()}
            </div>
          </Split>
        ) : (
          <div className="main-content full-width">
            <MainEditor
              currentChapter={currentChapter}
              projectData={currentProject}
              onContentChange={handleContentChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};