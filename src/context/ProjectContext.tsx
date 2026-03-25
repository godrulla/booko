import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface Project {
  id: string;
  title: string;
  genre: string;
  description?: string;
  word_count: number;
  target_word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  number: number;
  title: string;
  content: string;
  summary?: string;
  word_count: number;
  status: 'Planning' | 'Writing' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  role: 'Protagonist' | 'Antagonist' | 'Supporting' | 'Minor';
  traits: string[];
  backstory?: string;
  goals?: string;
  conflicts?: string;
  appearance?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectData {
  project: Project;
  chapters: Chapter[];
  characters: Character[];
  plot_points: any[];
  goals: any[];
  recent_sessions: any[];
}

interface ProjectContextType {
  currentProject: ProjectData | null;
  currentChapter: Chapter | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeDatabase: () => Promise<void>;
  createProject: (title: string, genre: string, description?: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  createCharacter: (name: string, role: string) => Promise<void>;
  createChapter: (number: number, title: string) => Promise<void>;
  setCurrentChapter: (chapter: Chapter | null) => void;
  refreshProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Initializing database...');
      await invoke('init_database');
      console.log('Database initialized successfully');
    } catch (err) {
      console.error('Database initialization failed:', err);
      setError(err as string);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (title: string, genre: string, description?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Creating project with:', { title, genre, description });
      
      const project = await invoke<Project>('create_project', { 
        title, 
        genre, 
        description: description || null 
      });
      console.log('Project created successfully:', project);
      
      // Load the full project data
      console.log('Loading full project data for ID:', project.id);
      await loadProject(project.id);
      console.log('Project loaded successfully');
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err as string);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const projectData = await invoke<ProjectData | null>('get_project_data', { 
        projectId 
      });
      
      if (projectData) {
        setCurrentProject(projectData);
        // Set the first chapter as current if available
        if (projectData.chapters.length > 0) {
          setCurrentChapter(projectData.chapters[0]);
        }
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError(err as string);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateChapterContent = async (chapterId: string, content: string) => {
    if (!currentProject) return;
    
    try {
      setError(null);
      await invoke('update_chapter_content', { 
        chapterId, 
        content, 
        projectId: currentProject.project.id 
      });
      
      // Refresh project data to get updated word counts
      await refreshProject();
    } catch (err) {
      setError(err as string);
      throw err;
    }
  };

  const createCharacter = async (name: string, role: string) => {
    if (!currentProject) return;
    
    try {
      setError(null);
      await invoke<Character>('create_character', { 
        projectId: currentProject.project.id,
        name, 
        role 
      });
      
      // Refresh project data to include new character
      await refreshProject();
    } catch (err) {
      setError(err as string);
      throw err;
    }
  };

  const createChapter = async (number: number, title: string) => {
    if (!currentProject) return;
    
    try {
      setError(null);
      const chapter = await invoke<Chapter>('create_chapter', { 
        projectId: currentProject.project.id,
        number, 
        title 
      });
      
      // Refresh project data to include new chapter
      await refreshProject();
      
      // Set the new chapter as current
      setCurrentChapter(chapter);
    } catch (err) {
      setError(err as string);
      throw err;
    }
  };

  const refreshProject = async () => {
    if (!currentProject) return;
    await loadProject(currentProject.project.id);
  };

  // Initialize database on component mount
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  const value: ProjectContextType = {
    currentProject,
    currentChapter,
    isLoading,
    error,
    initializeDatabase,
    createProject,
    loadProject,
    updateChapterContent,
    createCharacter,
    createChapter,
    setCurrentChapter,
    refreshProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};