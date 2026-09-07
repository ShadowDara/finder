package scratch

import (
	"encoding/json"
	"fmt"
	"os"
)

type Project struct {
	Targets    []Target  `json:"targets"`
	Monitors   []Monitor `json:"monitors"`
	Extensions []string  `json:"extensions"`
	Meta       Meta      `json:"meta"`
}

type Target struct {
	IsStage        bool               `json:"isStage"`
	Name           string             `json:"name"`
	Variables      map[string][]any   `json:"variables"`
	Lists          map[string][]any   `json:"lists"`
	Broadcasts     map[string]string  `json:"broadcasts"`
	Blocks         map[string]Block   `json:"blocks"`
	Comments       map[string]Comment `json:"comments"`
	Costumes       []Costume          `json:"costumes"`
	Sounds         []Sound            `json:"sounds"`
	CurrentCostume int                `json:"currentCostume"`
	LayerOrder     int                `json:"layerOrder"`
	Visible        bool               `json:"visible"`
	X              float64            `json:"x"`
	Y              float64            `json:"y"`
	Size           float64            `json:"size"`
	Direction      float64            `json:"direction"`
	Draggable      bool               `json:"draggable"`
	RotationStyle  string             `json:"rotationStyle"`
}

type Block struct {
	Opcode   string           `json:"opcode"`
	Next     string           `json:"next"`
	Parent   string           `json:"parent"`
	Inputs   map[string]any   `json:"inputs"`
	Fields   map[string][]any `json:"fields"`
	Shadow   bool             `json:"shadow"`
	TopLevel bool             `json:"topLevel"`
	X        float64          `json:"x"`
	Y        float64          `json:"y"`
}

type Comment struct {
	BlockID   string  `json:"blockId"`
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Width     float64 `json:"width"`
	Height    float64 `json:"height"`
	Minimized bool    `json:"minimized"`
	Text      string  `json:"text"`
}

type Costume struct {
	AssetID          string  `json:"assetId"`
	Name             string  `json:"name"`
	MD5Ext           string  `json:"md5ext"`
	DataFormat       string  `json:"dataFormat"`
	RotationCenterX  float64 `json:"rotationCenterX"`
	RotationCenterY  float64 `json:"rotationCenterY"`
	BitmapResolution int     `json:"bitmapResolution,omitempty"`
}

type Sound struct {
	AssetID     string `json:"assetId"`
	Name        string `json:"name"`
	MD5Ext      string `json:"md5ext"`
	SampleCount int    `json:"sampleCount"`
	Rate        int    `json:"rate"`
	DataFormat  string `json:"dataFormat"`
}

type Monitor struct {
	ID         string         `json:"id"`
	Mode       string         `json:"mode"`
	Opcode     string         `json:"opcode"`
	Params     map[string]any `json:"params"`
	Value      any            `json:"value"`
	Width      int            `json:"width"`
	Height     int            `json:"height"`
	X          int            `json:"x"`
	Y          int            `json:"y"`
	Visible    bool           `json:"visible"`
	SliderMin  float64        `json:"sliderMin"`
	SliderMax  float64        `json:"sliderMax"`
	SliderStep float64        `json:"sliderStep"`
}

type Meta struct {
	Semver string `json:"semver"`
	Vm     string `json:"vm"`
	Agent  string `json:"agent"`
}

func Parse(data []byte) (*Project, error) {
	var project Project

	if err := json.Unmarshal(data, &project); err != nil {
		return nil, fmt.Errorf("parse scratch project: %w", err)
	}

	return &project, nil
}

func ParseFile(path string) (*Project, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}

	return Parse(data)
}
