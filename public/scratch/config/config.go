package config

import (
	"errors"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	// Server ServerConfig `yaml:"server"`
	// Log    LogConfig    `yaml:"log"`
	Indir      string `yaml:"indir"`
	Outdir     string `yaml:"outdir"`
	ScriptPath string `yaml:"scriptpath"`
	CacheDir   string `yaml:"cachedir"`
}

type ServerConfig struct {
	Host string `yaml:"host"`
	Port int    `yaml:"port"`
}

type LogConfig struct {
	Level string `yaml:"level"`
}

func Default() Config {
	return Config{
		// Server: ServerConfig{
		// 	Host: "localhost",
		// 	Port: 8080,
		// },
		// Log: LogConfig{
		// 	Level: "info",
		// },
		Indir:      "input",
		Outdir:     "output",
		ScriptPath: "script.sh",
		CacheDir:   "scratchcache",
	}
}

func Load(path string) (Config, error) {
	cfg := Default()

	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			// Config-Datei existiert nicht:
			// einfach Defaults verwenden.
			return cfg, nil
		}

		return cfg, err
	}

	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, err
	}

	return cfg, nil
}
