package scratch

import "fmt"

func PrintNode(node *Node, indent string) {
	fmt.Println(indent + node.Opcode)

	// Inputs ausgeben
	for name, value := range node.Inputs {
		fmt.Printf(
			"%s  %s: %s\n",
			indent,
			name,
			printValue(value),
		)
	}

	// Children ausgeben
	for name, children := range node.Children {
		fmt.Println(indent + "  " + name)

		for _, child := range children {
			PrintNode(child, indent+"    ")
		}
	}
}

func printValue(value Value) string {
	switch value.Kind {
	case ValueNumber:
		return fmt.Sprintf("%g", value.Number)

	case ValueString:
		return fmt.Sprintf("%q", value.String)

	case ValueBool:
		return fmt.Sprintf("%t", value.Bool)

	case ValueVariable:
		return "$" + value.Name

	case ValueBlock:
		if value.Block == nil {
			return "<nil>"
		}

		return "<" + value.Block.Opcode + ">"

	default:
		return "<invalid>"
	}
}
