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
	// Server Port
	Port int `json:"port"`
	// Save the Cache
	Cache bool `json:"cache"`
	// Create Cache Git DB
	CreateCacheDB bool `json:"create_cache_db"`
	// How instances of finder at the same time by create cache for all
	FinderInstances int `json:"finder_instances"`
}

func LoadConfig(path string) SavedConfig {
	config := SavedConfig{
		// deine Default-Werte
		Port:            8080,
		Cache:           false,
		CreateCacheDB:   false,
		FinderInstances: 8,
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
