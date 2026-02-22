package config

type Config struct {
	OutputType string
}

func NewConfig() Config {
	return Config{
		OutputType: "normal",
	}
}
