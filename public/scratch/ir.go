package scratch

import "strconv"

type Script struct {
	Blocks []*Node
}

type Node struct {
	Opcode string

	Inputs map[string]Value
	Fields map[string][]any

	Children map[string][]*Node
}

func parseBlock(
	blocks map[string]Block,
	id string,
) *Node {
	block, ok := blocks[id]
	if !ok {
		return nil
	}

	node := &Node{
		Opcode:   block.Opcode,
		Inputs:   make(map[string]Value),
		Fields:   block.Fields,
		Children: make(map[string][]*Node),
	}

	// Inputs parsen
	for name, input := range block.Inputs {
		// fmt.Printf("DEBUG INPUT %s: %#v\n", name, input)

		value := parseInput(blocks, input)

		if value.Kind != ValueInvalid {
			node.Inputs[name] = value
		}

		// SUBSTACK, SUBSTACK2 usw.
		if childID := getBlockID(input); childID != "" {
			children := ParseChain(blocks, childID)

			if len(children) > 0 {
				node.Children[name] = children
			}
		}
	}

	return node
}

func getBlockID(input any) string {
	values, ok := input.([]any)
	if !ok || len(values) < 2 {
		return ""
	}

	// Input-Typ
	inputType, ok := values[0].(float64)
	if !ok {
		return ""
	}

	switch int(inputType) {
	case 2, 3:
		if id, ok := values[1].(string); ok {
			return id
		}
	}

	return ""
}

func ParseScript(
	blocks map[string]Block,
	startID string,
) *Script {
	script := &Script{}

	currentID := startID

	for currentID != "" {
		block, ok := blocks[currentID]

		if !ok {
			break
		}

		node := parseBlock(blocks, currentID)

		if node != nil {
			script.Blocks = append(
				script.Blocks,
				node,
			)
		}

		currentID = block.Next
	}

	return script
}

func ParseChain(
	blocks map[string]Block,
	startID string,
) []*Node {
	var nodes []*Node

	currentID := startID

	for currentID != "" {
		block, ok := blocks[currentID]

		if !ok {
			break
		}

		node := parseBlock(blocks, currentID)

		if node != nil {
			nodes = append(nodes, node)
		}

		currentID = block.Next
	}

	return nodes
}

type ValueKind int

const (
	ValueInvalid ValueKind = iota

	ValueNumber
	ValueString
	ValueBool
	ValueVariable
	ValueBlock
)

type Value struct {
	Kind ValueKind

	Number float64
	String string
	Bool   bool
	Name   string

	Block *Node
}

func parseInput(
	blocks map[string]Block,
	input any,
) Value {
	values, ok := input.([]any)
	if !ok || len(values) == 0 {
		return Value{Kind: ValueInvalid}
	}

	inputType, ok := values[0].(float64)
	if !ok {
		return Value{Kind: ValueInvalid}
	}

	switch int(inputType) {

	case 1:
		if len(values) >= 2 {
			if id, ok := values[1].(string); ok {
				if node := parseBlock(blocks, id); node != nil {
					return Value{Kind: ValueBlock, Block: node}
				}
			}
		}

		// Literal
		return parseLiteral(values)

	case 2:
		// Reporter-Block
		if len(values) < 2 {
			return Value{Kind: ValueInvalid}
		}

		id, ok := values[1].(string)
		if !ok {
			return Value{Kind: ValueInvalid}
		}

		node := parseBlock(blocks, id)
		if node == nil {
			return Value{Kind: ValueInvalid}
		}

		return Value{
			Kind:  ValueBlock,
			Block: node,
		}

	case 3:
		// Block + Shadow
		if len(values) < 2 {
			return Value{Kind: ValueInvalid}
		}

		id, ok := values[1].(string)
		if !ok {
			return Value{Kind: ValueInvalid}
		}

		node := parseBlock(blocks, id)
		if node == nil {
			return Value{Kind: ValueInvalid}
		}

		return Value{
			Kind:  ValueBlock,
			Block: node,
		}

	case 12:
		if len(values) >= 2 {
			if name, ok := values[1].(string); ok {
				return Value{Kind: ValueVariable, Name: name}
			}
		}
	}

	return Value{Kind: ValueInvalid}
}

func parseLiteral(values []any) Value {
	if len(values) < 2 {
		return Value{Kind: ValueInvalid}
	}

	raw, ok := values[1].([]any)
	if !ok || len(raw) < 2 {
		return Value{Kind: ValueInvalid}
	}

	// Scratch primitive type
	primitiveType, ok := raw[0].(float64)
	if !ok {
		return Value{Kind: ValueInvalid}
	}

	value := raw[1]

	switch int(primitiveType) {
	case 4:
		if v, ok := value.(string); ok {
			number, err := strconv.ParseFloat(v, 64)
			if err != nil {
				return Value{Kind: ValueInvalid}
			}

			return Value{
				Kind:   ValueNumber,
				Number: number,
			}
		}

	case 10:
		// String
		if v, ok := value.(string); ok {
			return Value{
				Kind:   ValueString,
				String: v,
			}
		}
	}

	return Value{Kind: ValueInvalid}
}
