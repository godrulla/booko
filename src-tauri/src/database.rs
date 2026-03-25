use sqlx::{Pool, Sqlite, SqlitePool, Row};
use chrono::Utc;
use uuid::Uuid;
use crate::models::*;
use std::path::Path;

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(db_path: &str) -> Result<Self, sqlx::Error> {
        // Ensure the directory exists
        if let Some(parent) = Path::new(db_path).parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e))
            })?;
        }

        let database_url = format!("sqlite:{}", db_path);
        let pool = SqlitePool::connect(&database_url).await?;
        
        let db = Database { pool };
        db.init_schema().await?;
        Ok(db)
    }

    async fn init_schema(&self) -> Result<(), sqlx::Error> {
        // Create projects table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                genre TEXT NOT NULL,
                description TEXT,
                word_count INTEGER NOT NULL DEFAULT 0,
                target_word_count INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create chapters table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS chapters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                number INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                summary TEXT,
                word_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'Planning',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create characters table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                role TEXT NOT NULL,
                traits TEXT, -- JSON array
                backstory TEXT,
                goals TEXT,
                conflicts TEXT,
                appearance TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create plot_points table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS plot_points (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                chapter_id TEXT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                plot_type TEXT NOT NULL,
                order_index INTEGER NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE SET NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create writing_goals table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS writing_goals (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                goal_type TEXT NOT NULL,
                target INTEGER NOT NULL,
                current INTEGER NOT NULL DEFAULT 0,
                description TEXT NOT NULL,
                deadline TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create writing_sessions table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS writing_sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                chapter_id TEXT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                words_written INTEGER NOT NULL DEFAULT 0,
                words_deleted INTEGER NOT NULL DEFAULT 0,
                net_words INTEGER NOT NULL DEFAULT 0,
                session_notes TEXT,
                FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters (id) ON DELETE SET NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // Project operations
    pub async fn create_project(&self, title: &str, genre: &str, description: Option<&str>) -> Result<Project, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        let project = Project {
            id: id.clone(),
            title: title.to_string(),
            genre: genre.to_string(),
            description: description.map(|s| s.to_string()),
            word_count: 0,
            target_word_count: None,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO projects (id, title, genre, description, word_count, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&project.id)
        .bind(&project.title)
        .bind(&project.genre)
        .bind(&project.description)
        .bind(project.word_count)
        .bind(project.created_at.to_rfc3339())
        .bind(project.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(project)
    }

    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>, sqlx::Error> {
        let row = sqlx::query("SELECT * FROM projects WHERE id = ?")
            .bind(project_id)
            .fetch_optional(&self.pool)
            .await?;

        if let Some(row) = row {
            Ok(Some(Project {
                id: row.get("id"),
                title: row.get("title"),
                genre: row.get("genre"),
                description: row.get("description"),
                word_count: row.get("word_count"),
                target_word_count: row.get("target_word_count"),
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))
                    .unwrap().with_timezone(&Utc),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn update_project_word_count(&self, project_id: &str, word_count: i32) -> Result<(), sqlx::Error> {
        sqlx::query("UPDATE projects SET word_count = ?, updated_at = ? WHERE id = ?")
            .bind(word_count)
            .bind(Utc::now().to_rfc3339())
            .bind(project_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // Chapter operations
    pub async fn create_chapter(&self, project_id: &str, number: i32, title: &str) -> Result<Chapter, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        let chapter = Chapter {
            id: id.clone(),
            project_id: project_id.to_string(),
            number,
            title: title.to_string(),
            content: String::new(),
            summary: None,
            word_count: 0,
            status: ChapterStatus::Planning,
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO chapters (id, project_id, number, title, content, word_count, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&chapter.id)
        .bind(&chapter.project_id)
        .bind(chapter.number)
        .bind(&chapter.title)
        .bind(&chapter.content)
        .bind(chapter.word_count)
        .bind("Planning")
        .bind(chapter.created_at.to_rfc3339())
        .bind(chapter.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(chapter)
    }

    pub async fn update_chapter_content(&self, chapter_id: &str, content: &str) -> Result<(), sqlx::Error> {
        let word_count = content.split_whitespace().count() as i32;
        
        sqlx::query("UPDATE chapters SET content = ?, word_count = ?, updated_at = ? WHERE id = ?")
            .bind(content)
            .bind(word_count)
            .bind(Utc::now().to_rfc3339())
            .bind(chapter_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_chapters_for_project(&self, project_id: &str) -> Result<Vec<Chapter>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM chapters WHERE project_id = ? ORDER BY number")
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;

        let mut chapters = Vec::new();
        for row in rows {
            let status = match row.get::<String, _>("status").as_str() {
                "Planning" => ChapterStatus::Planning,
                "Writing" => ChapterStatus::Writing,
                "Completed" => ChapterStatus::Completed,
                _ => ChapterStatus::Planning,
            };

            chapters.push(Chapter {
                id: row.get("id"),
                project_id: row.get("project_id"),
                number: row.get("number"),
                title: row.get("title"),
                content: row.get("content"),
                summary: row.get("summary"),
                word_count: row.get("word_count"),
                status,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))
                    .unwrap().with_timezone(&Utc),
            });
        }

        Ok(chapters)
    }

    // Character operations
    pub async fn create_character(&self, project_id: &str, name: &str, role: CharacterRole) -> Result<Character, sqlx::Error> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        let character = Character {
            id: id.clone(),
            project_id: project_id.to_string(),
            name: name.to_string(),
            description: None,
            role,
            traits: Vec::new(),
            backstory: None,
            goals: None,
            conflicts: None,
            appearance: None,
            created_at: now,
            updated_at: now,
        };

        let role_str = match character.role {
            CharacterRole::Protagonist => "Protagonist",
            CharacterRole::Antagonist => "Antagonist",
            CharacterRole::Supporting => "Supporting",
            CharacterRole::Minor => "Minor",
        };

        sqlx::query(
            "INSERT INTO characters (id, project_id, name, role, traits, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&character.id)
        .bind(&character.project_id)
        .bind(&character.name)
        .bind(role_str)
        .bind(serde_json::to_string(&character.traits).unwrap())
        .bind(character.created_at.to_rfc3339())
        .bind(character.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(character)
    }

    pub async fn get_characters_for_project(&self, project_id: &str) -> Result<Vec<Character>, sqlx::Error> {
        let rows = sqlx::query("SELECT * FROM characters WHERE project_id = ? ORDER BY created_at")
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;

        let mut characters = Vec::new();
        for row in rows {
            let role = match row.get::<String, _>("role").as_str() {
                "Protagonist" => CharacterRole::Protagonist,
                "Antagonist" => CharacterRole::Antagonist,
                "Supporting" => CharacterRole::Supporting,
                "Minor" => CharacterRole::Minor,
                _ => CharacterRole::Supporting,
            };

            let traits: Vec<String> = serde_json::from_str(&row.get::<String, _>("traits")).unwrap_or_default();

            characters.push(Character {
                id: row.get("id"),
                project_id: row.get("project_id"),
                name: row.get("name"),
                description: row.get("description"),
                role,
                traits,
                backstory: row.get("backstory"),
                goals: row.get("goals"),
                conflicts: row.get("conflicts"),
                appearance: row.get("appearance"),
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("created_at"))
                    .unwrap().with_timezone(&Utc),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<String, _>("updated_at"))
                    .unwrap().with_timezone(&Utc),
            });
        }

        Ok(characters)
    }

    pub async fn get_project_data(&self, project_id: &str) -> Result<Option<ProjectData>, sqlx::Error> {
        if let Some(project) = self.get_project(project_id).await? {
            let chapters = self.get_chapters_for_project(project_id).await?;
            let characters = self.get_characters_for_project(project_id).await?;
            
            // TODO: Add plot_points, goals, and sessions
            let plot_points = Vec::new();
            let goals = Vec::new();
            let recent_sessions = Vec::new();

            Ok(Some(ProjectData {
                project,
                chapters,
                characters,
                plot_points,
                goals,
                recent_sessions,
            }))
        } else {
            Ok(None)
        }
    }
}