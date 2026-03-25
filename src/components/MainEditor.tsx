import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Chapter, ProjectData } from '../context/ProjectContext';

interface MainEditorProps {
  currentChapter: Chapter | null;
  projectData: ProjectData;
  onContentChange: (content: string) => void;
}

export const MainEditor: React.FC<MainEditorProps> = ({ 
  currentChapter, 
  projectData,
  onContentChange 
}) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  // Update content when chapter changes
  useEffect(() => {
    if (currentChapter) {
      setContent(currentChapter.content);
    } else {
      setContent('');
    }
  }, [currentChapter]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    onContentChange(text);
  }, [onContentChange]);

  const generateAiSuggestion = async () => {
    if (!content.trim() || !projectData) return;
    
    setIsLoading(true);
    try {
      const suggestion = await invoke<string>("generate_ai_content", { 
        prompt: content.slice(-500), // Use last 500 characters as context
        context: "continue_writing",
        projectId: projectData.project.id
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      setAiSuggestion("AI service unavailable. Please ensure Ollama is running with the llama3.2:1b model.");
      console.error('AI generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const insertAiSuggestion = () => {
    if (aiSuggestion) {
      const newContent = content + " " + aiSuggestion;
      setContent(newContent);
      onContentChange(newContent);
      setAiSuggestion("");
    }
  };

  if (!currentChapter) {
    return (
      <div className="main-editor">
        <div className="editor-header">
          <h2>Select a Chapter</h2>
        </div>
        <div className="editor-empty">
          <p>Select a chapter from the dropdown above to start writing, or create a new chapter in the Plot panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-editor">
      <div className="editor-header">
        <h2>Chapter {currentChapter.number}: {currentChapter.title}</h2>
        <div className="editor-stats">
          <span>Words: {currentChapter.word_count}</span>
          <span>Characters: {content.length}</span>
          <span>Status: {currentChapter.status}</span>
        </div>
      </div>
      
      <div className="editor-content">
        <textarea
          className="editor-textarea"
          value={content}
          onChange={handleContentChange}
          placeholder={`Start writing "${currentChapter.title}" here...`}
        />
        
        <div className="editor-controls">
          <button 
            onClick={generateAiSuggestion}
            disabled={isLoading || !content.trim()}
            className="ai-button primary"
          >
            {isLoading ? "Generating..." : "Get AI Suggestion"}
          </button>
          
          {projectData.characters.length > 0 && (
            <div className="context-info">
              <span>Characters in this story:</span>
              {projectData.characters.slice(0, 3).map(char => (
                <span key={char.id} className="character-tag">
                  {char.name}
                </span>
              ))}
              {projectData.characters.length > 3 && (
                <span className="character-tag">+{projectData.characters.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {aiSuggestion && (
        <div className="ai-suggestion-panel">
          <h3>AI Suggestion</h3>
          <div className="ai-content">
            {aiSuggestion}
          </div>
          <div className="ai-controls">
            <button onClick={insertAiSuggestion} className="accept-button">
              Accept
            </button>
            <button onClick={() => setAiSuggestion("")} className="reject-button">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};