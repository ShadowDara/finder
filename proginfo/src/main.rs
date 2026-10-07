// Config Viewer App
//
// Started 07.10.2026
//

use std::fmt::format;
use std::fs;

use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind};
use ratatui::Frame;
use ratatui::layout::{Constraint, Layout};
use ratatui::style::{Color, Modifier, Style, Stylize};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, ListItem, ListState, Paragraph};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Default)]
struct Root {
    confviewer: Config,
}

// Config for the porgram
#[derive(Debug, Deserialize, Serialize, Default)]
struct Config {
    #[serde(default)]
    default: bool,
}

impl Config {
    // function to load the config, returns a default config when the config is not available
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

    fn default() -> Self {
        Self { default: true }
    }
}

struct App {
    quit: bool,
    config: Config,
    config_loaded: bool,
    files: Vec<String>,
    file_state: ListState,
}

impl App {
    fn default() -> Self {
        Self {
            quit: false,
            config: Config::load(),
            config_loaded: false,
            files: vec![],
            file_state: ListState::default(),
        }
    }

    fn next(&mut self) {
        self.file_state.select_next();
    }

    fn previous(&mut self) {
        self.file_state.select_previous();
    }

    fn run_app(&mut self, terminal: &mut ratatui::DefaultTerminal) -> std::io::Result<()> {
        loop {
            terminal.draw(|frame| self.draw(frame))?;
            if handle_events(self)? {
                break Ok(());
            }
        }
    }

    fn render_files(frame: &mut Frame, area: Rect, app: &mut App) {
        let items = app
            .files
            .iter()
            .map(|file| ListItem::new(file.as_str()))
            .collect::<Vec<_>>();

        let list = List::new(items)
            .highlight_symbol("▶ ")
            .highlight_style(Style::default().fg(Color::Yellow));

        frame.render_stateful_widget(list, area, &mut app.file_state);
    }

    fn draw(&mut self, frame: &mut Frame) {
        use Constraint::{Fill, Length, Min};

        let vertical = Layout::vertical([Length(1), Min(0), Length(1)]);
        let [title_area, main_area, status_area] = vertical.areas(frame.area());
        let horizontal = Layout::horizontal([Fill(1); 2]);
        //let [left_area, right_area] = horizontal.areas(main_area);

        let status_tx_var = match self.config_loaded {
            true => "Config Loaded!",
            false => "Config not loaded",
        };

        frame.render_widget(
            Block::bordered().title("Title Bar More Content haha"),
            title_area,
        );
        frame.render_widget(Block::bordered().title(status_tx_var), status_area);
        frame.render_widget(Block::bordered().title("Left"), main_area);
        //frame.render_widget(Block::bordered().title("Right"), right_area);
    }
}

fn main() -> std::io::Result<()> {
    let mut terminal = ratatui::init();

    let mut app = App::default();
    let result = app.run_app(&mut terminal);

    ratatui::restore();

    result
}

fn handle_events(app: &mut App) -> std::io::Result<bool> {
    match event::read()? {
        Event::Key(key) if key.kind == KeyEventKind::Press => match key.code {
            KeyCode::Char('q') => return Ok(true),

            KeyCode::Down | KeyCode::Char('j') => {
                app.next();
            }

            KeyCode::Up | KeyCode::Char('k') => {
                app.previous();
            }

            // handle other key events
            _ => {}
        },
        // handle other events
        _ => {}
    }
    Ok(false)
}
