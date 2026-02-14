package loader

func GetBlockedTemplateNames() map[string]string {
	m := map[string]string{
		"check": "Check all templates if their syntax is correct",
		"help": "Display this help Message",
		"list": "List all Templates Files",
	}

	return m
}
