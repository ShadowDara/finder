//go:build !windows

package main

import (
	"os"
	"os/exec"

	"github.com/creack/pty"
)

// unixPTY wraps creack/pty to satisfy our PTY interface on Unix systems.
type unixPTY struct {
	f *os.File
}

func (u *unixPTY) Read(buf []byte) (int, error)  { return u.f.Read(buf) }
func (u *unixPTY) Write(buf []byte) (int, error) { return u.f.Write(buf) }
func (u *unixPTY) Close() error                  { return u.f.Close() }

func (u *unixPTY) Resize(cols, rows int) error {
	return pty.Setsize(u.f, &pty.Winsize{
		Cols: uint16(cols),
		Rows: uint16(rows),
	})
}

// startPTY creates a Unix PTY hosting the given command.
func startPTY(command string, cols, rows int) (PTY, error) {
	cmd := exec.Command(command)
	f, err := pty.StartWithSize(cmd, &pty.Winsize{
		Cols: uint16(cols),
		Rows: uint16(rows),
	})
	if err != nil {
		return nil, err
	}
	return &unixPTY{f: f}, nil
}
