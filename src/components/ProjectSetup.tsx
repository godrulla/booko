import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { BookOpen, Pen, Users, Settings } from 'lucide-react';

export const ProjectSetup: React.FC = () => {
  const { createProject, isLoading } = useProject();
  const [formData, setFormData] = useState({
    title: '',
    genre: 'Fiction',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await createProject(
        formData.title.trim(),
        formData.genre,
        formData.description.trim() || undefined
      );
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const genres = [
    'Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Romance',
    'Thriller',
    'Historical Fiction',
    'Young Adult',
    'Literary Fiction',
    'Non-fiction',
    'Biography',
    'Self-Help',
    'Business',
    'Other'
  ];

  return (
    <div className="project-setup">
      <div className="setup-container">
        <div className="setup-header">
          <BookOpen size={48} />
          <h1>Welcome to Booko</h1>
          <p>AI-Assisted Book Writing Software</p>
        </div>

        <div className="setup-content">
          <h2>Create Your First Project</h2>
          
          <form onSubmit={handleSubmit} className="project-form">
            <div className="form-group">
              <label htmlFor="title">Book Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter your book title..."
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                disabled={isLoading}
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your book..."
                rows={4}
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="create-button"
              disabled={isLoading || !formData.title.trim()}
            >
              {isLoading ? 'Creating Project...' : 'Create Project'}
            </button>
          </form>
        </div>

        <div className="setup-features">
          <h3>What You'll Get:</h3>
          <div className="features-grid">
            <div className="feature-item">
              <Pen size={24} />
              <h4>AI Writing Assistant</h4>
              <p>Get intelligent suggestions that understand your characters and plot</p>
            </div>
            <div className="feature-item">
              <Users size={24} />
              <h4>Character Development</h4>
              <p>Track characters, their arcs, and maintain consistency</p>
            </div>
            <div className="feature-item">
              <BookOpen size={24} />
              <h4>Plot Structure</h4>
              <p>Organize your story with chapter planning and plot points</p>
            </div>
            <div className="feature-item">
              <Settings size={24} />
              <h4>Progress Tracking</h4>
              <p>Set goals, track word counts, and monitor your writing progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};