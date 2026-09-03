package config

import (
	"encoding/json"
	"os"
)

type Config struct {
	OutputType string
}

func NewConfig() Config {
	return Config{
		OutputType: "normal",
	}
}

type SavedConfig struct {
	Port          int  `json:"port"`
	Cache         bool `json:"cache"`
	CreateCacheDB bool `json:"create_cache_db"`
	// Host  string `json:"host"`
	// Debug bool   `json:"debug"`
}

func LoadConfig(path string) SavedConfig {
	config := SavedConfig{
		// deine Default-Werte
		Port:          8080,
		Cache:         false,
		CreateCacheDB: false,
		// Host:  "localhost",
		// Debug: false,
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return config
	}

	if err := json.Unmarshal(data, &config); err != nil {
		return config
	}

	return config
}
