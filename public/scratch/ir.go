package scratch

import (
	"fmt"
)

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
		Inputs:   block.Inputs,
		Fields:   block.Fields,
		Children: make(map[string][]*Node),
	}

	for name, input := range block.Inputs {
		childID := getBlockID(input)

		if childID == "" {
			continue
		}

		children := ParseChain(blocks, childID)

		if len(children) > 0 {
			node.Children[name] = children
		}
	}

	return node
}
func getBlockID(input any) string {
	values, ok := input.([]any)

	if !ok || len(values) < 2 {
		return ""
	}

	id, ok := values[1].(string)

	if !ok {
		return ""
	}

	return id
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

func PrintNode(node *Node, indent string) {
	fmt.Println(indent + node.Opcode)

	for name, children := range node.Children {
		fmt.Println(indent + "  " + name)

		for _, child := range children {
			PrintNode(child, indent+"    ")
		}
	}
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
	ValueNumber ValueKind = iota
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

	if !ok {
		return Value{}
	}

	if len(values) == 0 {
		return Value{}
	}

	// Scratch input type
	inputType, _ := values[0].(float64)

	switch int(inputType) {
	case 1:
		return parseLiteral(values)

	case 2:
		if len(values) >= 2 {
			if id, ok := values[1].(string); ok {
				node := parseBlock(blocks, id)

				return Value{
					Kind:  ValueBlock,
					Block: node,
				}
			}
		}
	}

	return Value{}
}
