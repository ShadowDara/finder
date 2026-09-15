package query

import (
	"fmt"
	"strconv"
	"strings"
)

// Context is what a query expression is evaluated against. Finder's real
// implementation would back this with an actual directory; tests/tools can
// provide a fake. All methods operate relative to the directory currently
// being matched.
type Context interface {
	// MatchFile reports whether any entry directly inside the directory is a
	// file whose name matches pattern (Finder's usual exact -> regex -> glob
	// rule).
	MatchFile(pattern string) (bool, error)
	// MatchFolder reports whether any entry directly inside the directory is
	// a subfolder whose name matches pattern.
	MatchFolder(pattern string) (bool, error)
	// MatchName reports whether the directory's own name matches pattern.
	MatchName(pattern string) (bool, error)
	// DirSizeBytes returns the total recursive size of the directory.
	DirSizeBytes() (int64, error)
	// FileSizeBytes returns the size of the first direct file entry matching
	// pattern. ok is false if no such file exists.
	FileSizeBytes(pattern string) (size int64, ok bool, err error)
	// CountFiles returns how many direct file entries match pattern.
	CountFiles(pattern string) (int, error)
	// RunCommand runs cmd inside the directory and reports whether it
	// exited successfully.
	RunCommand(cmd string) (bool, error)
	// FileHash returns the given hash (algo is "sha256" or "sha512") of the
	// first direct file entry matching pattern, lower-case hex. ok is false
	// if no such file exists.
	FileHash(pattern, algo string) (hexHash string, ok bool, err error)
}

// Eval evaluates a compiled query AST against ctx, short-circuiting && / ||
// the same way Go itself does.
func Eval(n Node, ctx Context) (bool, error) {
	switch v := n.(type) {
	case *OrNode:
		l, err := Eval(v.L, ctx)
		if err != nil {
			return false, err
		}
		if l {
			return true, nil
		}
		return Eval(v.R, ctx)
	case *AndNode:
		l, err := Eval(v.L, ctx)
		if err != nil {
			return false, err
		}
		if !l {
			return false, nil
		}
		return Eval(v.R, ctx)
	case *NotNode:
		x, err := Eval(v.X, ctx)
		if err != nil {
			return false, err
		}
		return !x, nil
	case *CallNode:
		return evalCall(v, ctx)
	default:
		return false, fmt.Errorf("unbekannter Knotentyp %T", n)
	}
}

func evalCall(c *CallNode, ctx Context) (bool, error) {
	switch c.Name {
	case "file":
		return ctx.MatchFile(c.Args[0])
	case "folder":
		return ctx.MatchFolder(c.Args[0])
	case "name":
		return ctx.MatchName(c.Args[0])
	case "command":
		return ctx.RunCommand(c.Args[0])
	case "size":
		total, err := ctx.DirSizeBytes()
		if err != nil {
			return false, err
		}
		return withinBounds(total, c.Args[0], c.Args[1])
	case "filesize":
		sz, ok, err := ctx.FileSizeBytes(c.Args[0])
		if err != nil {
			return false, err
		}
		if !ok {
			return false, nil
		}
		return withinBounds(sz, c.Args[1], c.Args[2])
	case "count":
		n, err := ctx.CountFiles(c.Args[0])
		if err != nil {
			return false, err
		}
		return withinIntBounds(n, c.Args[1], c.Args[2])
	case "sha256":
		h, ok, err := ctx.FileHash(c.Args[0], "sha256")
		if err != nil {
			return false, err
		}
		return ok && strings.EqualFold(h, c.Args[1]), nil
	case "sha512":
		h, ok, err := ctx.FileHash(c.Args[0], "sha512")
		if err != nil {
			return false, err
		}
		return ok && strings.EqualFold(h, c.Args[1]), nil
	default:
		return false, fmt.Errorf("unbekannte Funktion %q", c.Name)
	}
}

// ParseSizeString parses strings like "10KB", "1.5MB", "500B", "2GB".
// An empty string means "no bound" and is handled by the caller.
func ParseSizeString(s string) (int64, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, fmt.Errorf("leere Größenangabe")
	}
	units := []struct {
		suffix string
		mult   float64
	}{
		{"GB", 1024 * 1024 * 1024},
		{"MB", 1024 * 1024},
		{"KB", 1024},
		{"B", 1},
	}
	upper := strings.ToUpper(s)
	for _, u := range units {
		if strings.HasSuffix(upper, u.suffix) {
			numPart := strings.TrimSpace(s[:len(s)-len(u.suffix)])
			f, err := strconv.ParseFloat(numPart, 64)
			if err != nil {
				return 0, fmt.Errorf("ungültige Größenangabe %q", s)
			}
			return int64(f * u.mult), nil
		}
	}
	// kein Suffix -> als reine Byte-Zahl interpretieren
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("ungültige Größenangabe %q (erwarte z.B. \"10KB\", \"1.5MB\")", s)
	}
	return int64(f), nil
}

func withinBounds(value int64, minStr, maxStr string) (bool, error) {
	if minStr != "" {
		min, err := ParseSizeString(minStr)
		if err != nil {
			return false, err
		}
		if value < min {
			return false, nil
		}
	}
	if maxStr != "" {
		max, err := ParseSizeString(maxStr)
		if err != nil {
			return false, err
		}
		if value > max {
			return false, nil
		}
	}
	return true, nil
}

func withinIntBounds(value int, minStr, maxStr string) (bool, error) {
	if minStr != "" {
		min, err := strconv.Atoi(strings.TrimSpace(minStr))
		if err != nil {
			return false, fmt.Errorf("ungültige Ganzzahl %q", minStr)
		}
		if value < min {
			return false, nil
		}
	}
	if maxStr != "" {
		max, err := strconv.Atoi(strings.TrimSpace(maxStr))
		if err != nil {
			return false, fmt.Errorf("ungültige Ganzzahl %q", maxStr)
		}
		if value > max {
			return false, nil
		}
	}
	return true, nil
}
