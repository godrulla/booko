import React, { useState } from 'react';
import { User, Plus, Edit3, Trash2 } from 'lucide-react';
import { Character, ProjectData } from '../context/ProjectContext';
import { useProject } from '../context/ProjectContext';

interface CharacterPanelProps {
  projectData: ProjectData;
}

export const CharacterPanel: React.FC<CharacterPanelProps> = ({ projectData }) => {
  const { createCharacter } = useProject();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const addNewCharacter = async (name: string, role: string) => {
    try {
      await createCharacter(name, role);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  };

  const getRoleColor = (role: Character['role']) => {
    switch (role) {
      case 'Protagonist': return '#27ae60';
      case 'Antagonist': return '#e74c3c';
      case 'Supporting': return '#3498db';
      case 'Minor': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="character-panel">
      <div className="panel-header">
        <h2>Characters</h2>
        <button onClick={() => setIsCreating(true)} className="add-button">
          <Plus size={16} />
          Add Character
        </button>
      </div>

      <div className="character-content">
        <div className="character-list">
          {projectData.characters.map(character => (
            <div 
              key={character.id}
              className={`character-item ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
              onClick={() => setSelectedCharacter(character)}
            >
              <div className="character-avatar">
                <User size={24} />
              </div>
              <div className="character-info">
                <h3>{character.name}</h3>
                <span 
                  className="character-role"
                  style={{ color: getRoleColor(character.role) }}
                >
                  {character.role}
                </span>
              </div>
              <div className="character-actions">
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCharacter(character);
                  setIsEditing(true);
                }}>
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          ))}

          {projectData.characters.length === 0 && (
            <div className="empty-state">
              <User size={48} />
              <p>No characters yet</p>
              <p>Add your first character to get started!</p>
            </div>
          )}
        </div>

        {selectedCharacter && !isEditing && (
          <div className="character-details">
            <CharacterView character={selectedCharacter} />
          </div>
        )}

        {isCreating && (
          <CharacterCreateForm 
            onSave={addNewCharacter}
            onCancel={() => setIsCreating(false)}
          />
        )}
      </div>
    </div>
  );
};

const CharacterView: React.FC<{ character: Character }> = ({ character }) => (
  <div className="character-view">
    <h3>{character.name}</h3>
    <div className="character-field">
      <label>Role:</label>
      <span className="character-role">{character.role}</span>
    </div>
    {character.description && (
      <div className="character-field">
        <label>Description:</label>
        <p>{character.description}</p>
      </div>
    )}
    {character.traits.length > 0 && (
      <div className="character-field">
        <label>Traits:</label>
        <div className="traits-list">
          {character.traits.map((trait, index) => (
            <span key={index} className="trait-tag">{trait}</span>
          ))}
        </div>
      </div>
    )}
    {character.backstory && (
      <div className="character-field">
        <label>Backstory:</label>
        <p>{character.backstory}</p>
      </div>
    )}
    {character.goals && (
      <div className="character-field">
        <label>Goals:</label>
        <p>{character.goals}</p>
      </div>
    )}
    {character.conflicts && (
      <div className="character-field">
        <label>Conflicts:</label>
        <p>{character.conflicts}</p>
      </div>
    )}
  </div>
);

const CharacterCreateForm: React.FC<{
  onSave: (name: string, role: string) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Supporting'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData.name.trim(), formData.role.toLowerCase());
    }
  };

  return (
    <div className="character-create-form">
      <h3>Add New Character</h3>
      <form onSubmit={handleSubmit} className="character-form">
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Character name..."
            required
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <label>Role:</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="Protagonist">Protagonist</option>
            <option value="Antagonist">Antagonist</option>
            <option value="Supporting">Supporting</option>
            <option value="Minor">Minor</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-button" disabled={!formData.name.trim()}>
            Add Character
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};