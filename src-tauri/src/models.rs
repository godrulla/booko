use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub genre: String,
    pub description: Option<String>,
    pub word_count: i32,
    pub target_word_count: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: String,
    pub project_id: String,
    pub number: i32,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub word_count: i32,
    pub status: ChapterStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ChapterStatus {
    Planning,
    Writing,
    Completed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub role: CharacterRole,
    pub traits: Vec<String>,
    pub backstory: Option<String>,
    pub goals: Option<String>,
    pub conflicts: Option<String>,
    pub appearance: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum CharacterRole {
    Protagonist,
    Antagonist,
    Supporting,
    Minor,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlotPoint {
    pub id: String,
    pub project_id: String,
    pub chapter_id: Option<String>,
    pub title: String,
    pub description: String,
    pub plot_type: PlotType,
    pub order_index: i32,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PlotType {
    Setup,
    IncitingIncident,
    RisingAction,
    Climax,
    FallingAction,
    Resolution,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WritingGoal {
    pub id: String,
    pub project_id: String,
    pub goal_type: GoalType,
    pub target: i32,
    pub current: i32,
    pub description: String,
    pub deadline: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum GoalType {
    Daily,
    Weekly,
    Monthly,
    Project,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WritingSession {
    pub id: String,
    pub project_id: String,
    pub chapter_id: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub words_written: i32,
    pub words_deleted: i32,
    pub net_words: i32,
    pub session_notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub project: Project,
    pub chapters: Vec<Chapter>,
    pub characters: Vec<Character>,
    pub plot_points: Vec<PlotPoint>,
    pub goals: Vec<WritingGoal>,
    pub recent_sessions: Vec<WritingSession>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiContext {
    pub characters: Vec<Character>,
    pub current_chapter: Option<Chapter>,
    pub relevant_plot_points: Vec<PlotPoint>,
    pub writing_style_notes: Option<String>,
    pub genre: String,
}