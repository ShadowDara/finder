package config

import (
	"encoding/json"
	"os"

	"github.com/shadowdara/finder/pub/json5"
)

type Config struct {
	ProjectScripts map[string]string `json:"projectscripts"`
}

func LoadConfig() Config {
	data, err := os.ReadFile("bt.jsonc")
	if err != nil {
		return Config{ProjectScripts: map[string]string{}}
	}

	var cfg Config
	data = []byte(json5.PreprocessJSON5(string(data)))

	err = json.Unmarshal(data, &cfg)
	if err != nil {
		panic(err)
	}

	return cfg
}
