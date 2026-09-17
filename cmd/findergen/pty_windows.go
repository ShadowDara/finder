//go:build windows

package main

import (
	"github.com/UserExistsError/conpty"
)

// conPTY wraps the UserExistsError/conpty library to satisfy our PTY interface.
type conPTY struct {
	c *conpty.ConPty
}

func (p *conPTY) Read(buf []byte) (int, error)  { return p.c.Read(buf) }
func (p *conPTY) Write(buf []byte) (int, error) { return p.c.Write(buf) }
func (p *conPTY) Close() error                  { return p.c.Close() }

func (p *conPTY) Resize(cols, rows int) error {
	return p.c.Resize(cols, rows)
}

// startPTY creates a Windows ConPTY hosting the given command.
func startPTY(command string, cols, rows int) (PTY, error) {
	c, err := conpty.Start(command,
		conpty.ConPtyDimensions(cols, rows),
	)
	if err != nil {
		return nil, err
	}
	return &conPTY{c: c}, nil
}
