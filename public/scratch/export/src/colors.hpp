// Header File with all ANSI Colors as Macros
// by Shadowdara
//
// licensed under Appache 2.0
//
// by
// https://github.com/ShadowDara/samengine
//
//
// More Infos
// https://shadowdara.github.io/docs#/cpplibs/ansicolors

#pragma once

#if USE_COLORS_AS_MACRO == 0
#if RM_ANSI_FROM_COLORNAME == 0

// Use as Raylib Macros

#define ANSI_END "\x1b[0m"
#define ANSI_BOLD "\x1b[1m"

#define ANSI_ITALIC "\x1b[3m"
#define ANSI_UNDERLINED "\x1b[4m"

#define ANSI_REVERSE_TEXT "\x1b[7m"

#define ANSI_NOT_UNDERLINED "\x1b[24m"

#define ANSI_POSITIVE_TEXT "\x1b[27m"

#define ANSI_BLACK "\x1b[30m"
#define ANSI_RED "\x1b[31m"
#define ANSI_GREEN "\x1b[32m"
#define ANSI_YELLOW "\x1b[33m"
#define ANSI_BLUE "\x1b[34m"
#define ANSI_PURPLE "\x1b[35m"
#define ANSI_CYAN "\x1b[36m"
#define ANSI_WHITE "\x1b[37m"

#define ANSI_BG_BLACK "\x1b[40m"
#define ANSI_BG_RED "\x1b[41m"
#define ANSI_BG_GREEN "\x1b[42m"
#define ANSI_BG_YELLOW "\x1b[43m"
#define ANSI_BG_BLUE "\x1b[44m"
#define ANSI_BG_PURPLE "\x1b[45m"
#define ANSI_BG_CYAN "\x1b[46m"
#define ANSI_BG_WHITE "\x1b[47m"

#define ANSI_BRIGHT_BLACK "\x1b[90m"
#define ANSI_BRIGHT_RED "\x1b[91m"
#define ANSI_BRIGHT_GREEM "\x1b[92m"
#define ANSI_BRIGHT_YELLOW "\x1b[93m"
#define ANSI_BRIGHT_BLUE "\x1b[94m"
#define ANSI_BRIGHT_PURPLE "\x1b[95m"
#define ANSI_BRIGHT_CYAN "\x1b[96m"
#define ANSI_BRIGHT_WHITE "\x1b[97m"

#define ANSI_BG_BRIGHT_BLACK "\x1b[100m"
#define ANSI_BG_BRIGHT_RED "\x1b[101m"
#define ANSI_BG_BRIGHT_GREEM "\x1b[102m"
#define ANSI_BG_BRIGHT_YELLOW "\x1b[103m"
#define ANSI_BG_BRIGHT_BLUE "\x1b[104m"
#define ANSI_BG_BRIGHT_PURPLE "\x1b[105m"
#define ANSI_BG_BRIGHT_CYAN "\x1b[106m"
#define ANSI_BG_BRIGHT_WHITE "\x1b[107m"

#else

// Use as Normal Macros

#define END "\x1b[0m"
#define BOLD "\x1b[1m"

#define ITALIC "\x1b[3m"
#define UNDERLINED "\x1b[4m"

#define REVERSE_TEXT "\x1b[7m"

#define NOT_UNDERLINED "\x1b[24m"

#define POSITIVE_TEXT "\x1b[27m"

#define BLACK "\x1b[30m"
#define RED "\x1b[31m"
#define GREEN "\x1b[32m"
#define YELLOW "\x1b[33m"
#define BLUE "\x1b[34m"
#define PURPLE "\x1b[35m"
#define CYAN "\x1b[36m"
#define WHITE "\x1b[37m"

#define BG_BLACK "\x1b[40m"
#define BG_RED "\x1b[41m"
#define BG_GREEN "\x1b[42m"
#define BG_YELLOW "\x1b[43m"
#define BG_BLUE "\x1b[44m"
#define BG_PURPLE "\x1b[45m"
#define BG_CYAN "\x1b[46m"
#define BG_WHITE "\x1b[47m"

#define BRIGHT_BLACK "\x1b[90m"
#define BRIGHT_RED "\x1b[91m"
#define BRIGHT_GREEM "\x1b[92m"
#define BRIGHT_YELLOW "\x1b[93m"
#define BRIGHT_BLUE "\x1b[94m"
#define BRIGHT_PURPLE "\x1b[95m"
#define BRIGHT_CYAN "\x1b[96m"
#define BRIGHT_WHITE "\x1b[97m"

#define BG_BRIGHT_BLACK "\x1b[100m"
#define BG_BRIGHT_RED "\x1b[101m"
#define BG_BRIGHT_GREEM "\x1b[102m"
#define BG_BRIGHT_YELLOW "\x1b[103m"
#define BG_BRIGHT_BLUE "\x1b[104m"
#define BG_BRIGHT_PURPLE "\x1b[105m"
#define BG_BRIGHT_CYAN "\x1b[106m"
#define BG_BRIGHT_WHITE "\x1b[107m"

#endif

// Use as const

#else

// Use as Const

#if RM_ANSI_FROM_COLORNAME == 1

// Use as Raylib Name Const

inline constexpr const char *ANSI_END = "\x1b[0m";
inline constexpr const char *ANSI_BOLD = "\x1b[1m";

inline constexpr const char *ANSI_ITALIC = "\x1b[3m";
inline constexpr const char *ANSI_UNDERLINED = "\x1b[4m";

inline constexpr const char *ANSI_REVERSE_TEXT = "\x1b[7m";

inline constexpr const char *ANSI_NOT_UNDERLINED = "\x1b[24m";

inline constexpr const char *ANSI_POSITIVE_TEXT = "\x1b[27m";

inline constexpr const char *ANSI_BLACK = "\x1b[30m";
inline constexpr const char *ANSI_RED = "\x1b[31m";
inline constexpr const char *ANSI_GREEN = "\x1b[32m";
inline constexpr const char *ANSI_YELLOW = "\x1b[33m";
inline constexpr const char *ANSI_BLUE = "\x1b[34m";
inline constexpr const char *ANSI_PURPLE = "\x1b[35m";
inline constexpr const char *ANSI_CYAN = "\x1b[36m";
inline constexpr const char *ANSI_WHITE = "\x1b[37m";

inline constexpr const char *ANSI_BG_BLACK = "\x1b[40m";
inline constexpr const char *ANSI_BG_RED = "\x1b[41m";
inline constexpr const char *ANSI_BG_GREEN = "\x1b[42m";
inline constexpr const char *ANSI_BG_YELLOW = "\x1b[43m";
inline constexpr const char *ANSI_BG_BLUE = "\x1b[44m";
inline constexpr const char *ANSI_BG_PURPLE = "\x1b[45m";
inline constexpr const char *ANSI_BG_CYAN = "\x1b[46m";
inline constexpr const char *ANSI_BG_WHITE = "\x1b[47m";

inline constexpr const char *ANSI_BRIGHT_BLACK = "\x1b[90m";
inline constexpr const char *ANSI_BRIGHT_RED = "\x1b[91m";
inline constexpr const char *ANSI_BRIGHT_GREEN = "\x1b[92m";
inline constexpr const char *ANSI_BRIGHT_YELLOW = "\x1b[93m";
inline constexpr const char *ANSI_BRIGHT_BLUE = "\x1b[94m";
inline constexpr const char *ANSI_BRIGHT_PURPLE = "\x1b[95m";
inline constexpr const char *ANSI_BRIGHT_CYAN = "\x1b[96m";
inline constexpr const char *ANSI_BRIGHT_WHITE = "\x1b[97m";

inline constexpr const char *ANSI_BG_BRIGHT_BLACK = "\x1b[100m";
inline constexpr const char *ANSI_BG_BRIGHT_RED = "\x1b[101m";
inline constexpr const char *ANSI_BG_BRIGHT_GREEN = "\x1b[102m";
inline constexpr const char *ANSI_BG_BRIGHT_YELLOW = "\x1b[103m";
inline constexpr const char *ANSI_BG_BRIGHT_BLUE = "\x1b[104m";
inline constexpr const char *ANSI_BG_BRIGHT_PURPLE = "\x1b[105m";
inline constexpr const char *ANSI_BG_BRIGHT_CYAN = "\x1b[106m";
inline constexpr const char *ANSI_BG_BRIGHT_WHITE = "\x1b[107m";

#else

// Use as Normal name Const

inline constexpr const char *END = "\x1b[0m";
inline constexpr const char *OLD = "\x1b[1m";

inline constexpr const char *ITALIC = "\x1b[3m";
inline constexpr const char *UNDERLINED = "\x1b[4m";

inline constexpr const char *REVERSE_TEXT = "\x1b[7m";

inline constexpr const char *NOT_UNDERLINED = "\x1b[24m";

inline constexpr const char *POSITIVE_TEXT = "\x1b[27m";

inline constexpr const char *BLACK = "\x1b[30m";
inline constexpr const char *RED = "\x1b[31m";
inline constexpr const char *GREEN = "\x1b[32m";
inline constexpr const char *YELLOW = "\x1b[33m";
inline constexpr const char *BLUE = "\x1b[34m";
inline constexpr const char *PURPLE = "\x1b[35m";
inline constexpr const char *CYAN = "\x1b[36m";
inline constexpr const char *WHITE = "\x1b[37m";

inline constexpr const char *BG_BLACK = "\x1b[40m";
inline constexpr const char *BG_RED = "\x1b[41m";
inline constexpr const char *BG_GREEN = "\x1b[42m";
inline constexpr const char *BG_YELLOW = "\x1b[43m";
inline constexpr const char *BG_BLUE = "\x1b[44m";
inline constexpr const char *BG_PURPLE = "\x1b[45m";
inline constexpr const char *BG_CYAN = "\x1b[46m";
inline constexpr const char *BG_WHITE = "\x1b[47m";

inline constexpr const char *BRIGHT_BLACK = "\x1b[90m";
inline constexpr const char *BRIGHT_RED = "\x1b[91m";
inline constexpr const char *BRIGHT_GREEN = "\x1b[92m";
inline constexpr const char *BRIGHT_YELLOW = "\x1b[93m";
inline constexpr const char *BRIGHT_BLUE = "\x1b[94m";
inline constexpr const char *BRIGHT_PURPLE = "\x1b[95m";
inline constexpr const char *BRIGHT_CYAN = "\x1b[96m";
inline constexpr const char *BRIGHT_WHITE = "\x1b[97m";

inline constexpr const char *BG_BRIGHT_BLACK = "\x1b[100m";
inline constexpr const char *BG_BRIGHT_RED = "\x1b[101m";
inline constexpr const char *BG_BRIGHT_GREEN = "\x1b[102m";
inline constexpr const char *BG_BRIGHT_YELLOW = "\x1b[103m";
inline constexpr const char *BG_BRIGHT_BLUE = "\x1b[104m";
inline constexpr const char *BG_BRIGHT_PURPLE = "\x1b[105m";
inline constexpr const char *BG_BRIGHT_CYAN = "\x1b[106m";
inline constexpr const char *BG_BRIGHT_WHITE = "\x1b[107m";

#endif

#endif
