import React, { useState } from 'react';
import { BookOpen, Plus, Edit3, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface PlotPoint {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution';
  chapter?: number;
  completed: boolean;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  wordCount: number;
  status: 'planning' | 'writing' | 'completed';
  plotPoints: string[];
}

interface PlotPanelProps {
  projectId?: string;
}

export const PlotPanel: React.FC<PlotPanelProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'chapters'>('structure');
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([
    {
      id: '1',
      title: 'Opening Scene',
      description: 'Introduce the protagonist and their normal world',
      type: 'setup',
      chapter: 1,
      completed: false
    },
    {
      id: '2',
      title: 'Call to Adventure',
      description: 'The event that sets the story in motion',
      type: 'inciting_incident',
      chapter: 2,
      completed: false
    }
  ]);

  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: '1',
      number: 1,
      title: 'The Beginning',
      summary: 'Opening chapter that establishes the world and main character',
      wordCount: 0,
      status: 'planning',
      plotPoints: ['1']
    }
  ]);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const addPlotPoint = () => {
    const newPlotPoint: PlotPoint = {
      id: Date.now().toString(),
      title: 'New Plot Point',
      description: '',
      type: 'rising_action',
      completed: false
    };
    setPlotPoints([...plotPoints, newPlotPoint]);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      number: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      summary: '',
      wordCount: 0,
      status: 'planning',
      plotPoints: []
    };
    setChapters([...chapters, newChapter]);
  };

  const toggleChapterExpanded = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getPlotTypeColor = (type: PlotPoint['type']) => {
    switch (type) {
      case 'setup': return '#3498db';
      case 'inciting_incident': return '#e67e22';
      case 'rising_action': return '#f39c12';
      case 'climax': return '#e74c3c';
      case 'falling_action': return '#9b59b6';
      case 'resolution': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status: Chapter['status']) => {
    switch (status) {
      case 'planning': return '#95a5a6';
      case 'writing': return '#f39c12';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="plot-panel">
      <div className="panel-header">
        <h2>Plot & Structure</h2>
        <div className="tab-buttons">
          <button 
            className={activeTab === 'structure' ? 'active' : ''}
            onClick={() => setActiveTab('structure')}
          >
            Story Structure
          </button>
          <button 
            className={activeTab === 'chapters' ? 'active' : ''}
            onClick={() => setActiveTab('chapters')}
          >
            Chapters
          </button>
        </div>
      </div>

      {activeTab === 'structure' && (
        <div className="structure-tab">
          <div className="tab-header">
            <h3>Story Structure</h3>
            <button onClick={addPlotPoint} className="add-button">
              <Plus size={16} />
              Add Plot Point
            </button>
          </div>

          <div className="plot-timeline">
            {plotPoints.map((point, index) => (
              <div key={point.id} className="plot-point">
                <div className="plot-connector">
                  <div 
                    className="plot-dot"
                    style={{ backgroundColor: getPlotTypeColor(point.type) }}
                  />
                  {index < plotPoints.length - 1 && <div className="plot-line" />}
                </div>
                <div className="plot-content">
                  <div className="plot-header">
                    <h4>{point.title}</h4>
                    <span 
                      className="plot-type"
                      style={{ color: getPlotTypeColor(point.type) }}
                    >
                      {point.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p>{point.description}</p>
                  {point.chapter && (
                    <span className="plot-chapter">Chapter {point.chapter}</span>
                  )}
                  <div className="plot-actions">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={point.completed}
                        onChange={(e) => {
                          const updated = plotPoints.map(p =>
                            p.id === point.id ? { ...p, completed: e.target.checked } : p
                          );
                          setPlotPoints(updated);
                        }}
                      />
                      Completed
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'chapters' && (
        <div className="chapters-tab">
          <div className="tab-header">
            <h3>Chapter Outline</h3>
            <button onClick={addChapter} className="add-button">
              <Plus size={16} />
              Add Chapter
            </button>
          </div>

          <div className="chapters-list">
            {chapters.map(chapter => (
              <div key={chapter.id} className="chapter-item">
                <div 
                  className="chapter-header"
                  onClick={() => toggleChapterExpanded(chapter.id)}
                >
                  <div className="chapter-title">
                    {expandedChapters.has(chapter.id) ? 
                      <ChevronDown size={16} /> : 
                      <ChevronRight size={16} />
                    }
                    <BookOpen size={16} />
                    <span>{chapter.title}</span>
                  </div>
                  <div className="chapter-meta">
                    <span 
                      className="chapter-status"
                      style={{ color: getStatusColor(chapter.status) }}
                    >
                      {chapter.status}
                    </span>
                    <span className="chapter-wordcount">{chapter.wordCount} words</span>
                  </div>
                </div>

                {expandedChapters.has(chapter.id) && (
                  <div className="chapter-details">
                    <div className="chapter-summary">
                      <h5>Summary:</h5>
                      <p>{chapter.summary || 'No summary yet...'}</p>
                    </div>
                    
                    {chapter.plotPoints.length > 0 && (
                      <div className="chapter-plot-points">
                        <h5>Plot Points:</h5>
                        <ul>
                          {chapter.plotPoints.map(plotPointId => {
                            const plotPoint = plotPoints.find(p => p.id === plotPointId);
                            return plotPoint ? (
                              <li key={plotPointId}>{plotPoint.title}</li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="chapter-actions">
                      <select
                        value={chapter.status}
                        onChange={(e) => {
                          const updated = chapters.map(c =>
                            c.id === chapter.id ? 
                            { ...c, status: e.target.value as Chapter['status'] } : c
                          );
                          setChapters(updated);
                        }}
                      >
                        <option value="planning">Planning</option>
                        <option value="writing">Writing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};