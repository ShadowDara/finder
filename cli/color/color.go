// Package color exposes simple ANSI color codes used for command-line
// output. Values are plain strings so they can be interpolated into
// printed messages. On Windows without ANSI support output may be
// uncoloured; consider using a proper terminal library if portability
// is required.
package color

const (
	Red     = "\x1b[31m"
	Green   = "\x1b[32m"
	Yellow  = "\x1b[33m"
	Blue    = "\x1b[34m"
	Magenta = "\x1b[35m"
	Cyan    = "\x1b[36m"
	Reset   = "\x1b[0m"
)
