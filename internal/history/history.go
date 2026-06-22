package history

// Function to Write the History to a File
func historyWriter(history []string, newentry string) {}

// Function to append a new Line to the History
func AppendHistory(line string) {
	history := ReadHistory()
	historyWriter(history, line)
}

// Function to read the History
func ReadHistory() []string {
	var content []string

	return content
}
