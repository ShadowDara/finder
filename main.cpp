/**
 * finder - C++20 reimplementation
 * Original Go project: https://github.com/shadowdara/finder
 * License: GPL-3.0
 *
 * A CLI tool to locate projects based on predefined folder/file
 * structure templates (JSON files).
 */

#include <algorithm>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <format>
#include <iostream>
#include <optional>
#include <ranges>
#include <span>
#include <string>
#include <string_view>
#include <vector>

// Polyfill std::println for GCC 13 (libstdc++ may lack <print>)
template<typename... Args>
static void println(std::ostream& os, std::format_string<Args...> fmt, Args&&... args) {
    os << std::format(fmt, std::forward<Args>(args)...) << '\n';
}
template<typename... Args>
static void println(std::format_string<Args...> fmt, Args&&... args) {
    std::cout << std::format(fmt, std::forward<Args>(args)...) << '\n';
}
static void println(std::string_view s = "") { std::cout << s << '\n'; }
template<typename... Args>
static void print(std::format_string<Args...> fmt, Args&&... args) {
    std::cout << std::format(fmt, std::forward<Args>(args)...);
}

// ── Minimal JSON5 / JSON parser ──────────────────────────────────────────────
// We only need: string fields, bool fields, and arrays of objects with a
// "name" field.  No external dependency needed.

#include <sstream>
#include <stdexcept>
#include <unordered_map>

namespace fs = std::filesystem;

// ---------------------------------------------------------------------------
// Very small hand-rolled JSON parser (subset sufficient for finder templates)
// ---------------------------------------------------------------------------

struct JsonValue;
using JsonObject = std::unordered_map<std::string, JsonValue>;
using JsonArray  = std::vector<JsonValue>;

struct JsonValue {
    enum class Kind { Null, Bool, String, Array, Object };
    Kind kind = Kind::Null;
    bool        b{};
    std::string s{};
    JsonArray   arr{};
    JsonObject  obj{};
};

// Strip JSON5 line comments (//) and block comments (/* */)
static std::string stripComments(std::string_view src) {
    std::string out;
    out.reserve(src.size());
    std::size_t i = 0;
    while (i < src.size()) {
        if (i + 1 < src.size() && src[i] == '/' && src[i+1] == '/') {
            while (i < src.size() && src[i] != '\n') ++i;
        } else if (i + 1 < src.size() && src[i] == '/' && src[i+1] == '*') {
            i += 2;
            while (i + 1 < src.size() && !(src[i] == '*' && src[i+1] == '/')) ++i;
            if (i + 1 < src.size()) i += 2;
        } else if (src[i] == '"') {
            // copy string literal verbatim
            out += src[i++];
            while (i < src.size() && src[i] != '"') {
                if (src[i] == '\\') { out += src[i++]; }
                if (i < src.size()) out += src[i++];
            }
            if (i < src.size()) out += src[i++]; // closing "
        } else {
            out += src[i++];
        }
    }
    return out;
}

class JsonParser {
    std::string_view src_;
    std::size_t      pos_ = 0;

    void skipWs() {
        while (pos_ < src_.size() && std::isspace((unsigned char)src_[pos_])) ++pos_;
    }
    char peek() { skipWs(); return pos_ < src_.size() ? src_[pos_] : '\0'; }
    char consume() { return pos_ < src_.size() ? src_[pos_++] : '\0'; }
    void expect(char c) {
        skipWs();
        if (pos_ >= src_.size() || src_[pos_] != c)
            throw std::runtime_error(std::format("Expected '{}' at pos {}", c, pos_));
        ++pos_;
    }

    std::string parseString() {
        expect('"');
        std::string r;
        while (pos_ < src_.size() && src_[pos_] != '"') {
            if (src_[pos_] == '\\') { ++pos_; }
            if (pos_ < src_.size()) r += src_[pos_++];
        }
        expect('"');
        return r;
    }

    JsonValue parseValue() {
        char c = peek();
        JsonValue v;
        if (c == '"') {
            v.kind = JsonValue::Kind::String;
            v.s    = parseString();
        } else if (c == '[') {
            v.kind = JsonValue::Kind::Array;
            consume(); // '['
            while (peek() != ']') {
                v.arr.push_back(parseValue());
                if (peek() == ',') consume();
            }
            consume(); // ']'
        } else if (c == '{') {
            v.kind = JsonValue::Kind::Object;
            consume(); // '{'
            while (peek() != '}') {
                std::string key = parseString();
                expect(':');
                v.obj[key] = parseValue();
                if (peek() == ',') consume();
            }
            consume(); // '}'
        } else if (src_.substr(pos_, 4) == "true") {
            v.kind = JsonValue::Kind::Bool; v.b = true;  pos_ += 4;
        } else if (src_.substr(pos_, 5) == "false") {
            v.kind = JsonValue::Kind::Bool; v.b = false; pos_ += 5;
        } else if (src_.substr(pos_, 4) == "null") {
            v.kind = JsonValue::Kind::Null; pos_ += 4;
        } else {
            throw std::runtime_error(std::format("Unexpected char '{}' at pos {}", c, pos_));
        }
        return v;
    }

public:
    explicit JsonParser(std::string_view sv) : src_(sv) {}
    JsonValue parse() { return parseValue(); }
};

static JsonValue parseJson5File(const fs::path& p) {
    std::ifstream f(p);
    if (!f) throw std::runtime_error("Cannot open: " + p.string());
    std::string raw((std::istreambuf_iterator<char>(f)),
                     std::istreambuf_iterator<char>());
    std::string stripped = stripComments(raw);
    JsonParser  parser(stripped);
    return parser.parse();
}

// ---------------------------------------------------------------------------
// Template structure
// ---------------------------------------------------------------------------

struct EntryInfo { std::string name; };

struct Template {
    std::string name;
    std::string description;
    std::vector<EntryInfo> files;
    std::vector<EntryInfo> folders;
    std::string command;
    bool invertCommand = false;
    std::string sourcePath; // path to the .json5 file
};

static std::optional<std::string> getString(const JsonObject& obj, std::string_view key) {
    auto it = obj.find(std::string(key));
    if (it == obj.end() || it->second.kind != JsonValue::Kind::String) return std::nullopt;
    return it->second.s;
}
static bool getBool(const JsonObject& obj, std::string_view key, bool def = false) {
    auto it = obj.find(std::string(key));
    if (it == obj.end() || it->second.kind != JsonValue::Kind::Bool) return def;
    return it->second.b;
}
static std::vector<EntryInfo> getEntries(const JsonObject& obj, std::string_view key) {
    std::vector<EntryInfo> result;
    auto it = obj.find(std::string(key));
    if (it == obj.end() || it->second.kind != JsonValue::Kind::Array) return result;
    for (const auto& item : it->second.arr) {
        if (item.kind != JsonValue::Kind::Object) continue;
        if (auto n = getString(item.obj, "name")) result.push_back({*n});
    }
    return result;
}

static std::optional<Template> loadTemplate(const fs::path& p) {
    try {
        auto root = parseJson5File(p);
        if (root.kind != JsonValue::Kind::Object) return std::nullopt;
        const auto& obj = root.obj;
        Template t;
        t.name        = getString(obj, "name").value_or("*");
        t.description = getString(obj, "description").value_or("");
        t.command     = getString(obj, "command").value_or("");
        t.invertCommand = getBool(obj, "invert_command");
        t.files   = getEntries(obj, "files");
        t.folders = getEntries(obj, "folders");
        t.sourcePath = p.string();
        return t;
    } catch (const std::exception& ex) {
        println(std::cerr, "Warning: failed to parse {}: {}", p.string(), ex.what());
        return std::nullopt;
    }
}

// ---------------------------------------------------------------------------
// Template discovery
// ---------------------------------------------------------------------------

static fs::path builtinTemplateDir() {
    // Next to the executable in a "templates" sub-folder
    fs::path exe = fs::current_path(); // fallback
    // Try to find the templates directory relative to the binary location
    // In development: ./templates/
    for (auto& candidate : {fs::path("templates"),
                             fs::path(".finder/templates"),
                             exe / "templates"}) {
        if (fs::is_directory(candidate)) return candidate;
    }
    return "templates";
}

static fs::path userTemplateDir() {
    const char* home = nullptr;
#ifdef _WIN32
    home = std::getenv("APPDATA");
#else
    home = std::getenv("XDG_CONFIG_HOME");
    if (!home) home = std::getenv("HOME");
#endif
    if (!home) return "";
#ifdef _WIN32
    return fs::path(home) / "finder" / "templates";
#else
    return fs::path(home) / ".config" / "finder" / "templates";
#endif
}

static std::vector<Template> loadTemplatesFromDir(const fs::path& dir) {
    std::vector<Template> result;
    if (!fs::is_directory(dir)) return result;
    for (const auto& entry : fs::recursive_directory_iterator(dir)) {
        if (!entry.is_regular_file()) continue;
        auto ext = entry.path().extension().string();
        if (ext != ".json5" && ext != ".json") continue;
        if (auto t = loadTemplate(entry.path())) result.push_back(std::move(*t));
    }
    return result;
}

static std::vector<Template> loadAllTemplates() {
    auto result = loadTemplatesFromDir(builtinTemplateDir());
    auto user   = loadTemplatesFromDir(userTemplateDir());
    result.insert(result.end(),
                  std::make_move_iterator(user.begin()),
                  std::make_move_iterator(user.end()));
    return result;
}

static std::optional<Template> findTemplateByName(const std::vector<Template>& templates,
                                                   std::string_view name) {
    for (const auto& t : templates) {
        // derive template key from filename (without extension)
        fs::path p(t.sourcePath);
        std::string key = p.stem().string();
        if (key == name) return t;
    }
    return std::nullopt;
}

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

// nameMatches supports "*" wildcard (any name)
static bool nameMatches(const std::string& pattern, const std::string& name) {
    if (pattern == "*") return true;
    return pattern == name;
}

static bool directoryMatchesTemplate(const fs::path& dir, const Template& tmpl) {
    // Check required folders
    for (const auto& req : tmpl.folders) {
        bool found = false;
        for (const auto& entry : fs::directory_iterator(dir)) {
            if (!entry.is_directory()) continue;
            if (nameMatches(req.name, entry.path().filename().string())) {
                found = true;
                break;
            }
        }
        if (!found) return false;
    }
    // Check required files
    for (const auto& req : tmpl.files) {
        bool found = false;
        for (const auto& entry : fs::directory_iterator(dir)) {
            if (!entry.is_regular_file()) continue;
            if (nameMatches(req.name, entry.path().filename().string())) {
                found = true;
                break;
            }
        }
        if (!found) return false;
    }
    return true;
}

static bool runCommand(const std::string& cmd, const fs::path& dir) {
    if (cmd.empty()) return true;
    std::string full;
#ifdef _WIN32
    full = std::format("cd /d \"{}\" && {}", dir.string(), cmd);
#else
    full = std::format("cd '{}' && {}", dir.string(), cmd);
#endif
    int ret = std::system(full.c_str());
    return (ret == 0);
}

static std::vector<fs::path> searchDirectory(const fs::path& root, const Template& tmpl) {
    std::vector<fs::path> matches;
    std::error_code ec;
    for (const auto& entry : fs::recursive_directory_iterator(root,
             fs::directory_options::skip_permission_denied, ec)) {
        if (!entry.is_directory()) continue;
        try {
            if (!directoryMatchesTemplate(entry.path(), tmpl)) continue;
            // Handle command filter
            if (!tmpl.command.empty()) {
                bool ok = runCommand(tmpl.command, entry.path());
                bool include = tmpl.invertCommand ? !ok : ok;
                if (!include) continue;
            }
            matches.push_back(entry.path());
        } catch (...) {
            // skip unreadable dirs
        }
    }
    return matches;
}

// ---------------------------------------------------------------------------
// ANSI colour helpers
// ---------------------------------------------------------------------------

namespace color {
    constexpr std::string_view reset  = "\033[0m";
    constexpr std::string_view green  = "\033[32m";
    constexpr std::string_view cyan   = "\033[36m";
    constexpr std::string_view yellow = "\033[33m";
    constexpr std::string_view bold   = "\033[1m";
}

static bool supportsColor() {
#ifdef _WIN32
    return false;
#else
    const char* term = std::getenv("TERM");
    if (!term) return false;
    return std::string_view(term) != "dumb";
#endif
}

static std::string c(std::string_view ansi, std::string_view text) {
    if (!supportsColor()) return std::string(text);
    return std::format("{}{}{}", ansi, text, color::reset);
}

// ---------------------------------------------------------------------------
// Sub-commands
// ---------------------------------------------------------------------------

static void cmdSearch(const std::vector<Template>& allTemplates, std::string_view name) {
    auto tmplOpt = findTemplateByName(allTemplates, name);
    if (!tmplOpt) {
        println(std::cerr, "Error: template '{}' not found.", name);
        println(std::cerr, "Run 'finder check' to list available templates.");
        std::exit(1);
    }
    const auto& tmpl = *tmplOpt;
    if (!tmpl.description.empty()) {
        println("Searching for: {} ({})",
                     c(color::bold, tmpl.name),
                     c(color::cyan, tmpl.description));
    } else {
        println("Searching for: {}", c(color::bold, tmpl.name));
    }

    fs::path searchRoot = fs::current_path();
    auto matches = searchDirectory(searchRoot, tmpl);

    if (matches.empty()) {
        println("No matches found in {}", searchRoot.string());
        return;
    }

    println("\nFound {} match(es):", matches.size());
    for (const auto& p : matches) {
        println("  {}", c(color::green, p.string()));
    }
}

static void cmdCheck(const std::vector<Template>& allTemplates) {
    if (allTemplates.empty()) {
        println("No templates found.");
        println("Place .json5 files in ./templates/ or ~/.config/finder/templates/");
        return;
    }
    println("{} template(s) available:\n", allTemplates.size());
    for (const auto& t : allTemplates) {
        fs::path p(t.sourcePath);
        std::string key = p.stem().string();
        print("  {} {}", c(color::yellow, key), c(color::bold, t.name));
        if (!t.description.empty()) print(" — {}", t.description);
        println("");
        if (!t.folders.empty()) {
            print("    folders: ");
            for (const auto& f : t.folders) print("{} ", f.name);
            println("");
        }
        if (!t.files.empty()) {
            print("    files:   ");
            for (const auto& f : t.files) print("{} ", f.name);
            println("");
        }
    }
}

static void printUsage() {
    println("Usage: finder <template-name>");
    println("       finder check");
    println("");
    println("Commands:");
    println("  <template-name>   Search current directory using the given template");
    println("  check             List all available templates");
    println("");
    println("Templates are loaded from:");
    println("  ./templates/                  (built-in, relative to CWD)");
    println("  ~/.config/finder/templates/   (user-defined)");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

int main(int argc, char* argv[]) {
    std::span<char*> args(argv, static_cast<std::size_t>(argc));

    if (args.size() < 2) {
        printUsage();
        return 1;
    }

    std::string_view subcmd = args[1];

    auto allTemplates = loadAllTemplates();

    if (subcmd == "check") {
        cmdCheck(allTemplates);
    } else if (subcmd == "--help" || subcmd == "-h") {
        printUsage();
    } else {
        cmdSearch(allTemplates, subcmd);
    }

    return 0;
}
