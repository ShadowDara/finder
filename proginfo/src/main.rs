// Config Viewer App
//
// Started 07.10.2026
//

use std::fs;
use std::path::PathBuf;

use crossterm::event::{self, Event, KeyCode, KeyEventKind};
use ratatui::Frame;
use ratatui::layout::{Constraint, Layout, Rect};
use ratatui::style::{Color, Style};
use ratatui::text::Text;
use ratatui::widgets::{
    Block, Borders, List, ListItem, ListState, Paragraph, Wrap,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Default)]
struct Root {
    confviewer: Config,
}

#[derive(Debug, Deserialize, Serialize, Default)]
struct Config {
    #[serde(default)]
    default: bool,
}

impl Config {
    fn load() -> Self {
        let path = match dirs::home_dir() {
            Some(home) => home.join(".finder/config.json"),
            None => return Self::default(),
        };

        let content = match fs::read_to_string(path) {
            Ok(content) => content,
            Err(_) => return Self::default(),
        };

        match serde_json::from_str::<Root>(&content) {
            Ok(root) => root.confviewer,
            Err(_) => Self::default(),
        }
    }
}

struct App {
    quit: bool,
    config: Config,
    config_loaded: bool,

    // Dateien
    files: Vec<PathBuf>,
    file_state: ListState,

    // Aktuell angezeigter Dateiinhalt
    content: String,
}

impl App {
    fn new() -> Self {
        let files = Self::load_files();

        let mut file_state = ListState::default();

        if !files.is_empty() {
            file_state.select(Some(0));
        }

        let mut app = Self {
            quit: false,
            config: Config::load(),
            config_loaded: false,
            files,
            file_state,
            content: String::new(),
        };

        // Erste Datei laden
        app.load_selected_file();

        app
    }

    /// Lädt alle .txt Dateien aus ~/.finder/proginfo/
    fn load_files() -> Vec<PathBuf> {
        let Some(home) = dirs::home_dir() else {
            return Vec::new();
        };

        let path = home.join(".finder").join("proginfo");

        let Ok(entries) = fs::read_dir(path) else {
            return Vec::new();
        };

        let mut files: Vec<PathBuf> = entries
            .filter_map(|entry| entry.ok())
            .map(|entry| entry.path())
            .filter(|path| {
                path.is_file()
                    && path
                        .extension()
                        .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"))
            })
            .collect();

        // Alphabetisch sortieren
        files.sort();

        files
    }

    /// Lädt den Inhalt der aktuell ausgewählten Datei
    fn load_selected_file(&mut self) {
        let Some(index) = self.file_state.selected() else {
            self.content.clear();
            return;
        };

        let Some(path) = self.files.get(index) else {
            self.content.clear();
            return;
        };

        self.content = match fs::read_to_string(path) {
            Ok(content) => content,
            Err(error) => format!("Fehler beim Lesen der Datei:\n\n{error}"),
        };
    }

    fn next(&mut self) {
        if self.files.is_empty() {
            return;
        }

        self.file_state.select_next();

        self.load_selected_file();
    }

    fn previous(&mut self) {
        if self.files.is_empty() {
            return;
        }

        self.file_state.select_previous();

        self.load_selected_file();
    }

    fn selected_filename(&self) -> String {
        let Some(index) = self.file_state.selected() else {
            return "No file selected".to_string();
        };

        let Some(path) = self.files.get(index) else {
            return "No file selected".to_string();
        };

        path.file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("Unknown")
            .to_string()
    }

    fn run_app(
        &mut self,
        terminal: &mut ratatui::DefaultTerminal,
    ) -> std::io::Result<()> {
        loop {
            terminal.draw(|frame| self.draw(frame))?;

            if handle_events(self)? {
                break Ok(());
            }
        }
    }

    fn render_files(
        frame: &mut Frame,
        area: Rect,
        app: &mut App,
    ) {
        let items = app
            .files
            .iter()
            .map(|path| {
                let name = path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("Unknown");

                ListItem::new(name)
            })
            .collect::<Vec<_>>();

        let list = List::new(items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(" Files "),
            )
            .highlight_symbol("▶ ")
            .highlight_style(
                Style::default().fg(Color::Yellow),
            );

        frame.render_stateful_widget(
            list,
            area,
            &mut app.file_state,
        );
    }

    fn render_content(
        frame: &mut Frame,
        area: Rect,
        app: &App,
    ) {
        let title = format!(" {} ", app.selected_filename());

        let paragraph = Paragraph::new(Text::from(app.content.as_str()))
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .title(title),
            )
            .wrap(Wrap { trim: false });

        frame.render_widget(paragraph, area);
    }

    fn draw(&mut self, frame: &mut Frame) {
        use Constraint::{Fill, Length, Min};

        let vertical =
            Layout::vertical([
                Length(1),
                Min(0),
                Length(1),
            ]);

        let [
            title_area,
            main_area,
            status_area,
        ] = vertical.areas(frame.area());

        let horizontal =
            Layout::horizontal([
                Constraint::Percentage(30),
                Constraint::Percentage(70),
            ]);

        let [left_area, right_area] =
            horizontal.areas(main_area);

        // Title
        frame.render_widget(
            Block::default()
                .borders(Borders::BOTTOM)
                .title(" Config Viewer "),
            title_area,
        );

        // File-Liste
        Self::render_files(
            frame,
            left_area,
            self,
        );

        // Dateiinhalt
        Self::render_content(
            frame,
            right_area,
            self,
        );

        // Status
        let status = if self.files.is_empty() {
            "Keine .txt Dateien gefunden"
        } else {
            "↑/k  ↓/j  |  q: quit"
        };

        frame.render_widget(
            Block::default()
                .borders(Borders::TOP)
                .title(status),
            status_area,
        );
    }
}

fn main() -> std::io::Result<()> {
    let mut terminal = ratatui::init();

    let mut app = App::new();

    let result = app.run_app(&mut terminal);

    ratatui::restore();

    result
}

fn handle_events(
    app: &mut App,
) -> std::io::Result<bool> {
    match event::read()? {
        Event::Key(key)
            if key.kind == KeyEventKind::Press =>
        {
            match key.code {
                KeyCode::Char('q') |
                KeyCode::Esc => {
                    return Ok(true);
                }

                KeyCode::Down |
                KeyCode::Char('j') => {
                    app.next();
                }

                KeyCode::Up |
                KeyCode::Char('k') => {
                    app.previous();
                }

                _ => {}
            }
        }

        _ => {}
    }

    Ok(false)
}
