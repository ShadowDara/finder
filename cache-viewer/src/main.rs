use std::{
    fs, io,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};

use crossterm::{
    event::{self, Event, KeyCode, KeyEvent, KeyModifiers},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};

use ratatui::{
    Terminal, backend::CrosstermBackend, layout::{Constraint, Direction, Layout}, style::{Color, Modifier, Style}, text::{Line, Span}, widgets::{Block, Borders, Clear, List, ListItem, ListState, Paragraph, Wrap},
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CacheEntry {
    date: String,
    locations: Vec<String>,
}

#[derive(Debug, Clone)]
struct CacheFile {
    path: PathBuf,
    name: String,
    entry: CacheEntry,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Screen {
    Files,
    Locations,
}

struct App {
    cache_dir: PathBuf,
    files: Vec<CacheFile>,

    selected_file: usize,
    selected_location: usize,

    screen: Screen,

    status: String,
    show_info: bool,
}

impl App {
    fn new() -> io::Result<Self> {
        let cache_dir = dirs::home_dir()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "Home directory not found"))?
            .join(".finder")
            .join("cache");

        let mut app = Self {
            cache_dir,
            files: Vec::new(),
            selected_file: 0,
            selected_location: 0,
            screen: Screen::Files,
            status: String::new(),
            show_info: false,
        };

        app.reload()?;

        Ok(app)
    }

    fn reload(&mut self) -> io::Result<()> {
        self.files.clear();

        if !self.cache_dir.exists() {
            fs::create_dir_all(&self.cache_dir)?;
        }

        for entry in fs::read_dir(&self.cache_dir)? {
            let entry = match entry {
                Ok(entry) => entry,
                Err(_) => continue,
            };

            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            if path.extension().and_then(|x| x.to_str()) != Some("json") {
                continue;
            }

            let contents = match fs::read_to_string(&path) {
                Ok(contents) => contents,
                Err(_) => continue,
            };

            let cache_entry: CacheEntry = match serde_json::from_str(&contents) {
                Ok(entry) => entry,
                Err(_) => continue,
            };

            let name = path
                .file_name()
                .and_then(|x| x.to_str())
                .unwrap_or("<unknown>")
                .to_string();

            self.files.push(CacheFile {
                path,
                name,
                entry: cache_entry,
            });
        }

        // Neueste Dateien zuerst.
        self.files.sort_by(|a, b| {
            let a_time = fs::metadata(&a.path)
                .and_then(|m| m.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH);

            let b_time = fs::metadata(&b.path)
                .and_then(|m| m.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH);

            b_time.cmp(&a_time)
        });

        if self.files.is_empty() {
            self.selected_file = 0;
        } else if self.selected_file >= self.files.len() {
            self.selected_file = self.files.len() - 1;
        }

        self.selected_location = 0;

        Ok(())
    }

    fn selected_file(&self) -> Option<&CacheFile> {
        self.files.get(self.selected_file)
    }

    fn selected_file_mut(&mut self) -> Option<&mut CacheFile> {
        self.files.get_mut(self.selected_file)
    }

    fn move_up(&mut self) {
        match self.screen {
            Screen::Files => {
                if self.selected_file > 0 {
                    self.selected_file -= 1;
                }
            }

            Screen::Locations => {
                if self.selected_location > 0 {
                    self.selected_location -= 1;
                }
            }
        }
    }

    fn move_down(&mut self) {
        match self.screen {
            Screen::Files => {
                if !self.files.is_empty() && self.selected_file + 1 < self.files.len() {
                    self.selected_file += 1;
                }
            }

            Screen::Locations => {
                if let Some(file) = self.selected_file() {
                    if !file.entry.locations.is_empty()
                        && self.selected_location + 1 < file.entry.locations.len()
                    {
                        self.selected_location += 1;
                    }
                }
            }
        }
    }

    fn open(&mut self) {
        if self.selected_file().is_some() {
            self.selected_location = 0;
            self.screen = Screen::Locations;
        }
    }

    fn back(&mut self) {
        self.screen = Screen::Files;
        self.selected_location = 0;
    }

    fn delete_selected(&mut self) {
        let Some(file) = self.selected_file().cloned() else {
            return;
        };

        match fs::remove_file(&file.path) {
            Ok(_) => {
                self.status = format!("Deleted {}", file.name);

                if let Err(err) = self.reload() {
                    self.status = format!("Reload failed: {err}");
                }
            }

            Err(err) => {
                self.status = format!("Delete failed: {err}");
            }
        }
    }

    fn refresh(&mut self) {
        match self.reload() {
            Ok(_) => {
                self.status = format!("Loaded {} cache files", self.files.len());
            }

            Err(err) => {
                self.status = format!("Reload failed: {err}");
            }
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    enable_raw_mode()?;

    let mut stdout = io::stdout();

    execute!(stdout, EnterAlternateScreen)?;

    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let result = run_app(&mut terminal);

    disable_raw_mode()?;

    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;

    terminal.show_cursor()?;

    if let Err(err) = result {
        eprintln!("Error: {err}");
    }

    Ok(())
}

fn run_app(terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> io::Result<()> {
    let mut app = App::new()?;

    loop {
        terminal.draw(|frame| {
            draw_ui(frame, &app);
        })?;

        if event::poll(Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if handle_key(&mut app, key)? {
                    break;
                }
            }
        }
    }

    Ok(())
}

fn handle_key(app: &mut App, key: KeyEvent) -> io::Result<bool> {
    // q / Ctrl+C beendet die Anwendung.
    if key.code == KeyCode::Char('q')
        || (key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL))
    {
        return Ok(true);
    }

    match key.code {
        KeyCode::Up | KeyCode::Char('k') => {
            app.move_up();
        }

        KeyCode::Down | KeyCode::Char('j') => {
            app.move_down();
        }

        KeyCode::Enter => {
            if app.screen == Screen::Files {
                app.open();
            }
        }

        KeyCode::Esc => {
            if app.screen == Screen::Locations {
                app.back();
            }
        }

        KeyCode::Char('i') => {
            app.show_info = true;
        }

        KeyCode::Char('r') => {
            app.refresh();
        }

        KeyCode::Char('d') => {
            if app.screen == Screen::Files {
                app.delete_selected();
            }
        }

        _ => {}
    }

    Ok(false)
}

fn centered_rect(
    percent_x: u16,
    percent_y: u16,
    area: ratatui::layout::Rect,
) -> ratatui::layout::Rect {
    let vertical = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(area);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(vertical[1])[1]
}

fn draw_info_popup(frame: &mut ratatui::Frame, app: &App) {
    let area = centered_rect(60, 50, frame.area());

    // Hintergrund des Popups löschen
    frame.render_widget(Clear, area);

    let content = vec![
        Line::from(vec![
            Span::styled(
                "Finder Cache",
                Style::default()
                    .fg(Color::Cyan)
                    .add_modifier(Modifier::BOLD),
            ),
        ]),
        Line::from(""),
        Line::from("A small TUI for browsing finder cache files."),
        Line::from(""),
        Line::from(vec![
            Span::styled("Cache directory: ", Style::default().fg(Color::Cyan)),
            Span::raw(app.cache_dir.display().to_string()),
        ]),
        Line::from(""),
        Line::from("Keys:"),
        Line::from("  ↑↓ / j k    Navigate"),
        Line::from("  Enter       Open"),
        Line::from("  d           Delete"),
        Line::from("  r           Refresh"),
        Line::from("  i           Info"),
        Line::from("  Esc         Close"),
        Line::from("  q           Quit"),
    ];

    let popup = Paragraph::new(content)
        .block(
            Block::default()
                .title(" Info ")
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Cyan)),
        )
        .style(Style::default().bg(Color::Black))
        .wrap(Wrap { trim: true });

    frame.render_widget(popup, area);
}


fn draw_ui(frame: &mut ratatui::Frame, app: &App) {
    let area = frame.area();

    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Min(1),
            Constraint::Length(2),
        ])
        .split(area);

    draw_header(frame, app, chunks[0]);

    match app.screen {
        Screen::Files => {
            draw_files(frame, app, chunks[1]);
        }

        Screen::Locations => {
            draw_locations(frame, app, chunks[1]);
        }
    }

    draw_footer(frame, app, chunks[2]);

    // Popup ganz zuletzt zeichnen
    if app.show_info {
        draw_info_popup(frame, app);
    }
}

fn draw_header(
    frame: &mut ratatui::Frame,
    app: &App,
    area: ratatui::layout::Rect,
) {
    let title = match app.screen {
        Screen::Files => " finder cache ".to_string(),

        Screen::Locations => {
            match app.selected_file() {
                Some(file) => format!(" {} ", file.name),
                None => " finder cache ".to_string(),
            }
        }
    };

    let paragraph = Paragraph::new(title)
        .style(
            Style::default()
                .fg(Color::Black)
                .bg(Color::Cyan)
                .add_modifier(Modifier::BOLD),
        )
        .block(Block::default().borders(Borders::ALL));

    frame.render_widget(paragraph, area);
}

fn draw_files(frame: &mut ratatui::Frame, app: &App, area: ratatui::layout::Rect) {
    let mut items = Vec::new();

    for file in &app.files {
        let locations = file.entry.locations.len();

        let line = Line::from(vec![
            Span::styled(
                format!("{:<40}", file.name),
                Style::default().fg(Color::White),
            ),
            Span::styled(
                format!("{:>5} locations", locations),
                Style::default().fg(Color::DarkGray),
            ),
        ]);

        items.push(ListItem::new(line));
    }

    if items.is_empty() {
        let paragraph = Paragraph::new(vec![
            Line::from(""),
            Line::from(Span::styled(
                "No cache files found.",
                Style::default().fg(Color::Yellow),
            )),
            Line::from(""),
            Line::from(app.cache_dir.display().to_string()),
        ])
        .block(Block::default().borders(Borders::ALL).title(" Cache "));

        frame.render_widget(paragraph, area);
        return;
    }

    let list = List::new(items)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(format!(" Cache files ({}) ", app.files.len())),
        )
        .highlight_style(
            Style::default()
                .bg(Color::Blue)
                .fg(Color::White)
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("> ");

    let mut state = ListState::default();

    state.select(Some(app.selected_file));

    frame.render_stateful_widget(list, area, &mut state);
}

fn draw_locations(frame: &mut ratatui::Frame, app: &App, area: ratatui::layout::Rect) {
    let Some(file) = app.selected_file() else {
        return;
    };

    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(5), Constraint::Min(1)])
        .split(area);

    let info = Paragraph::new(vec![
        Line::from(vec![
            Span::styled("Date: ", Style::default().fg(Color::Cyan)),
            Span::raw(&file.entry.date),
        ]),
        Line::from(vec![
            Span::styled("Locations: ", Style::default().fg(Color::Cyan)),
            Span::raw(file.entry.locations.len().to_string()),
        ]),
        Line::from(vec![
            Span::styled("File: ", Style::default().fg(Color::Cyan)),
            Span::raw(file.path.display().to_string()),
        ]),
    ])
    .block(
        Block::default()
            .borders(Borders::ALL)
            .title(" Cache entry "),
    );

    frame.render_widget(info, chunks[0]);

    let items: Vec<ListItem> = file
        .entry
        .locations
        .iter()
        .map(|location| ListItem::new(Line::from(location.as_str())))
        .collect();

    if items.is_empty() {
        let paragraph = Paragraph::new("No locations.")
            .block(Block::default().borders(Borders::ALL).title(" Locations "));

        frame.render_widget(paragraph, chunks[1]);
        return;
    }

    let list = List::new(items)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(format!(" Locations ({}) ", file.entry.locations.len())),
        )
        .highlight_style(
            Style::default()
                .bg(Color::Blue)
                .fg(Color::White)
                .add_modifier(Modifier::BOLD),
        )
        .highlight_symbol("> ");

    let mut state = ListState::default();

    state.select(Some(app.selected_location));

    frame.render_stateful_widget(list, chunks[1], &mut state);
}

fn draw_footer(frame: &mut ratatui::Frame, app: &App, area: ratatui::layout::Rect) {
    let help = match app.screen {
        Screen::Files => " ↑↓/jk navigate Enter open d delete r refresh q quit ",

        Screen::Locations => " ↑↓/jk navigate   Esc back   r refresh   q quit ",
    };

    let text = if app.status.is_empty() {
        help.to_string()
    } else {
        format!(" {}   |   {} ", app.status, help.trim())
    };

    let footer = Paragraph::new(text)
        .style(Style::default().fg(Color::DarkGray))
        .wrap(Wrap { trim: true });

    frame.render_widget(footer, area);
}
