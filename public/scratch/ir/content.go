package ir

import (
	"github.com/shadowdara/finder/public/scratch"
)

type Program struct {
	Stage   *Stage
	Sprites []*Sprite
}

type Sprite struct {
	Name      string
	X         float64
	Y         float64
	Size      float64
	Direction float64

	Scripts []*Script

	Costumes []scratch.Costume
	Sounds   []scratch.Sound
}

type Script struct {
	Blocks []*IRBlock
}

type IRBlock struct {
	Opcode string
	Inputs []IRValue
	Fields map[string]string

	Next *IRBlock
}

type IRValue struct {
	Number *float64
	String *string
	Bool   *bool
	Block  *IRBlock
}
