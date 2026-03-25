use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;

mod models;
mod database;

use models::*;
use database::Database;

// Global state for the database using Arc<Mutex<>> for Send + Sync
pub struct AppState {
    pub db: Arc<Mutex<Option<Database>>>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
    done: bool,
}

#[tauri::command]
async fn init_database(state: State<'_, AppState>) -> Result<(), String> {
    println!("🔧 Starting database initialization...");
    
    // Use an in-memory database for now to test functionality
    let db_path = ":memory:";
    
    println!("📂 Database path: {}", db_path);
    
    let db = Database::new(&db_path).await
        .map_err(|e| {
            println!("❌ Database initialization failed: {}", e);
            format!("Failed to initialize database: {}", e)
        })?;
    
    let mut db_lock = state.db.lock().await;
    *db_lock = Some(db);
    
    println!("✅ Database initialized successfully");
    Ok(())
}

#[tauri::command]
async fn create_project(
    state: State<'_, AppState>,
    title: String,
    genre: String,
    description: Option<String>,
) -> Result<Project, String> {
    println!("📝 Creating project: title='{}', genre='{}', description={:?}", title, genre, description);
    
    let db_guard = state.db.lock().await;
    let db = db_guard.as_ref().ok_or_else(|| {
        println!("❌ Database not initialized when creating project");
        "Database not initialized".to_string()
    })?;
    
    let result = db.create_project(&title, &genre, description.as_deref()).await
        .map_err(|e| {
            println!("❌ Failed to create project: {}", e);
            format!("Failed to create project: {}", e)
        });
    
    match &result {
        Ok(project) => println!("✅ Project created successfully with ID: {}", project.id),
        Err(e) => println!("❌ Project creation failed: {}", e),
    }
    
    result
}

#[tauri::command]
async fn get_project_data(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Option<ProjectData>, String> {
    let db_guard = state.db.lock().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.get_project_data(&project_id).await
        .map_err(|e| format!("Failed to get project data: {}", e))
}

#[tauri::command]
async fn update_chapter_content(
    state: State<'_, AppState>,
    chapter_id: String,
    content: String,
    project_id: String,
) -> Result<(), String> {
    let db_guard = state.db.lock().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    // Update chapter content
    db.update_chapter_content(&chapter_id, &content).await
        .map_err(|e| format!("Failed to update chapter: {}", e))?;
    
    // Update project word count
    let chapters = db.get_chapters_for_project(&project_id).await
        .map_err(|e| format!("Failed to get chapters: {}", e))?;
    
    let total_words: i32 = chapters.iter().map(|c| c.word_count).sum();
    db.update_project_word_count(&project_id, total_words).await
        .map_err(|e| format!("Failed to update project word count: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn create_character(
    state: State<'_, AppState>,
    project_id: String,
    name: String,
    role: String,
) -> Result<Character, String> {
    let db_guard = state.db.lock().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    let character_role = match role.as_str() {
        "protagonist" => CharacterRole::Protagonist,
        "antagonist" => CharacterRole::Antagonist,
        "supporting" => CharacterRole::Supporting,
        "minor" => CharacterRole::Minor,
        _ => CharacterRole::Supporting,
    };
    
    db.create_character(&project_id, &name, character_role).await
        .map_err(|e| format!("Failed to create character: {}", e))
}

#[tauri::command]
async fn create_chapter(
    state: State<'_, AppState>,
    project_id: String,
    number: i32,
    title: String,
) -> Result<Chapter, String> {
    let db_guard = state.db.lock().await;
    let db = db_guard.as_ref().ok_or("Database not initialized")?;
    
    db.create_chapter(&project_id, number, &title).await
        .map_err(|e| format!("Failed to create chapter: {}", e))
}

#[tauri::command]
async fn generate_ai_content(
    state: State<'_, AppState>,
    prompt: String,
    context: Option<String>,
    project_id: Option<String>,
) -> Result<String, String> {
    let mut enhanced_prompt = prompt.clone();
    
    // Add project context if available
    if let Some(pid) = project_id {
        let db_guard = state.db.lock().await;
        if let Some(db) = db_guard.as_ref() {
            if let Ok(Some(project_data)) = db.get_project_data(&pid).await {
                // Build AI context with characters and plot
                let mut context_info = format!("Genre: {}\n", project_data.project.genre);
                
                if !project_data.characters.is_empty() {
                    context_info.push_str("Characters:\n");
                    for character in &project_data.characters {
                        context_info.push_str(&format!(
                            "- {} ({}): {}\n",
                            character.name,
                            match character.role {
                                CharacterRole::Protagonist => "Protagonist",
                                CharacterRole::Antagonist => "Antagonist",
                                CharacterRole::Supporting => "Supporting",
                                CharacterRole::Minor => "Minor",
                            },
                            character.description.as_deref().unwrap_or("No description")
                        ));
                    }
                }
                
                enhanced_prompt = format!("{}\n\nContext:\n{}\n\nText to continue:\n{}", 
                    match context.as_deref() {
                        Some("continue_writing") => "Continue this story naturally, maintaining consistency with the established characters and genre.",
                        Some("character_development") => "Suggest character development ideas based on the established characters and story context.",
                        Some("plot_development") => "Suggest plot developments that would create engaging narrative tension.",
                        _ => "Continue this story naturally."
                    },
                    context_info,
                    prompt
                );
            }
        }
    }

    // Call Ollama API
    let client = reqwest::Client::new();
    let request_body = OllamaRequest {
        model: "llama3.2:1b".to_string(),
        prompt: enhanced_prompt,
        stream: false,
    };

    match client
        .post("http://localhost:11434/api/generate")
        .json(&request_body)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<OllamaResponse>().await {
                    Ok(ollama_response) => {
                        let cleaned_response = ollama_response.response
                            .trim()
                            .lines()
                            .filter(|line| !line.trim().is_empty())
                            .collect::<Vec<&str>>()
                            .join(" ");
                        
                        Ok(cleaned_response)
                    }
                    Err(e) => Err(format!("Failed to parse Ollama response: {}", e)),
                }
            } else {
                Err("Ollama service is not available. Please ensure Ollama is running and the model is loaded.".to_string())
            }
        }
        Err(e) => Err(format!("Failed to connect to Ollama: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            init_database,
            create_project,
            get_project_data,
            update_chapter_content,
            create_character,
            create_chapter,
            generate_ai_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}