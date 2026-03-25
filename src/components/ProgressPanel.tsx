import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Award } from 'lucide-react';

interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  target: number;
  current: number;
  deadline?: Date;
  description: string;
}

interface WritingSession {
  date: string;
  wordsWritten: number;
  timeSpent: number; // in minutes
}

interface ProgressPanelProps {
  currentWordCount: number;
  projectId?: string;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({ 
  currentWordCount, 
  projectId 
}) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      type: 'daily',
      target: 500,
      current: 0,
      description: 'Daily writing goal'
    },
    {
      id: '2',
      type: 'project',
      target: 50000,
      current: currentWordCount,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'Novel completion'
    }
  ]);

  const [writingSessions, setWritingSessions] = useState<WritingSession[]>([
    { date: '2024-01-15', wordsWritten: 300, timeSpent: 45 },
    { date: '2024-01-14', wordsWritten: 600, timeSpent: 60 },
    { date: '2024-01-13', wordsWritten: 450, timeSpent: 50 },
    { date: '2024-01-12', wordsWritten: 200, timeSpent: 30 },
    { date: '2024-01-11', wordsWritten: 800, timeSpent: 75 },
  ]);

  const [streak, setStreak] = useState(3);
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Update current word count for project goals
  useEffect(() => {
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.type === 'project' 
          ? { ...goal, current: currentWordCount }
          : goal
      )
    );
  }, [currentWordCount]);

  const calculateProgress = (goal: Goal): number => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: Date): number => {
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAverageWordsPerDay = (): number => {
    if (writingSessions.length === 0) return 0;
    const total = writingSessions.reduce((sum, session) => sum + session.wordsWritten, 0);
    return Math.round(total / writingSessions.length);
  };

  const addGoal = (goalData: Omit<Goal, 'id' | 'current'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      current: 0
    };
    setGoals([...goals, newGoal]);
    setIsAddingGoal(false);
  };

  const updateGoalProgress = (goalId: string, progress: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, current: progress } : goal
    ));
  };

  return (
    <div className="progress-panel">
      <div className="panel-header">
        <h2>Progress & Goals</h2>
      </div>

      <div className="progress-content">
        {/* Current Stats */}
        <div className="stats-section">
          <h3>Today's Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <TrendingUp size={20} />
              <div>
                <span className="stat-value">{getAverageWordsPerDay()}</span>
                <span className="stat-label">Avg Words/Day</span>
              </div>
            </div>
            <div className="stat-card">
              <Award size={20} />
              <div>
                <span className="stat-value">{streak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
            <div className="stat-card">
              <Target size={20} />
              <div>
                <span className="stat-value">{currentWordCount.toLocaleString()}</span>
                <span className="stat-label">Total Words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="goals-section">
          <div className="section-header">
            <h3>Goals</h3>
            <button 
              onClick={() => setIsAddingGoal(true)} 
              className="add-button small"
            >
              Add Goal
            </button>
          </div>

          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <span className="goal-type">{goal.type}</span>
                  <span className="goal-description">{goal.description}</span>
                </div>
                
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${calculateProgress(goal)}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                  </span>
                </div>

                {goal.deadline && (
                  <div className="goal-deadline">
                    <Calendar size={14} />
                    <span>{getDaysUntilDeadline(goal.deadline)} days remaining</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="sessions-section">
          <h3>Recent Sessions</h3>
          <div className="sessions-list">
            {writingSessions.slice(0, 5).map((session, index) => (
              <div key={index} className="session-item">
                <div className="session-date">
                  {new Date(session.date).toLocaleDateString()}
                </div>
                <div className="session-stats">
                  <span>{session.wordsWritten} words</span>
                  <span>{session.timeSpent} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <GoalForm 
          onSave={addGoal}
          onCancel={() => setIsAddingGoal(false)}
        />
      )}
    </div>
  );
};

const GoalForm: React.FC<{
  onSave: (goal: Omit<Goal, 'id' | 'current'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'daily' as Goal['type'],
    target: 500,
    description: '',
    deadline: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData: Omit<Goal, 'id' | 'current'> = {
      type: formData.type,
      target: formData.target,
      description: formData.description,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined
    };
    onSave(goalData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Goal</h3>
        <form onSubmit={handleSubmit} className="goal-form">
          <div className="form-group">
            <label>Goal Type:</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target Words:</label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Deadline (optional):</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">Add Goal</button>
            <button type="button" onClick={onCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};