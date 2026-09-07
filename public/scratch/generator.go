package scratch

import (
	"fmt"
	"strings"
)

type CPPGenerator struct {
	indent int
	output strings.Builder
}

func NewCPPGenerator() *CPPGenerator {
	return &CPPGenerator{}
}

func (g *CPPGenerator) Generate(script *Script) string {
	g.output.Reset()
	g.indent = 0

	g.writeLine("#include <raylib.h>")
	g.writeLine("#include <iostream>")
	g.writeLine("")
	g.writeLine("int main() {")
	g.indent++

	g.writeLine("InitWindow(800, 600, \"Scratch Project\");")
	g.writeLine("SetTargetFPS(60);")
	g.writeLine("")

	g.generateScript(script)

	g.writeLine("while (!WindowShouldClose()) {")
	g.indent++

	g.writeLine("BeginDrawing();")
	g.writeLine("ClearBackground(RAYWHITE);")

	g.indent--
	g.writeLine("}")

	g.writeLine("CloseWindow();")
	g.writeLine("return 0;")

	g.indent--
	g.writeLine("}")

	return g.output.String()
}

func (g *CPPGenerator) generateScript(script *Script) {
	for _, node := range script.Blocks {
		g.generateNode(node)
	}
}

func (g *CPPGenerator) generateNode(node *Node) {
	switch node.Opcode {

	case "event_whenflagclicked":
		// Der Hat selbst erzeugt erstmal keinen C++ Code.

	case "motion_movesteps":
		g.generateMoveSteps(node)

	case "motion_turnright":
		g.generateTurnRight(node)

	case "looks_say":
		g.generateSay(node)

	case "control_repeat":
		g.generateRepeat(node)

	default:
		g.writeLine(fmt.Sprintf(
			"// TODO: %s",
			node.Opcode,
		))
	}
}

func (g *CPPGenerator) generateMoveSteps(node *Node) {
	value, ok := node.Inputs["STEPS"]
	if !ok {
		g.writeLine("// motion_movesteps: missing STEPS")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"spriteX += %s;",
		expr,
	))
}

func (g *CPPGenerator) generateTurnRight(node *Node) {
	value, ok := node.Inputs["DEGREES"]
	if !ok {
		g.writeLine("// motion_turnright: missing DEGREES")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"spriteDirection += %s;",
		expr,
	))
}

func (g *CPPGenerator) generateValue(value Value) string {
	switch value.Kind {

	case ValueNumber:
		return fmt.Sprintf("%g", value.Number)

	case ValueString:
		return fmt.Sprintf(
			"%q",
			value.String,
		)

	case ValueBool:
		if value.Bool {
			return "true"
		}

		return "false"

	case ValueVariable:
		return value.Name

	case ValueBlock:
		return g.generateExpression(value.Block)

	default:
		return "0"
	}
}

func (g *CPPGenerator) generateExpression(node *Node) string {
	switch node.Opcode {

	case "operator_add":
		return g.binaryOperator(node, "+")

	case "operator_subtract":
		return g.binaryOperator(node, "-")

	case "operator_multiply":
		return g.binaryOperator(node, "*")

	case "operator_divide":
		return g.binaryOperator(node, "/")

	default:
		return "0"
	}
}

func (g *CPPGenerator) binaryOperator(
	node *Node,
	operator string,
) string {
	left, leftOK := node.Inputs["NUM1"]
	right, rightOK := node.Inputs["NUM2"]

	if !leftOK || !rightOK {
		return "0"
	}

	return fmt.Sprintf(
		"(%s %s %s)",
		g.generateValue(left),
		operator,
		g.generateValue(right),
	)
}

func (g *CPPGenerator) generateSay(node *Node) {
	value, ok := node.Inputs["MESSAGE"]
	if !ok {
		g.writeLine("// looks_say: missing MESSAGE")
		return
	}

	message := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"std::cout << %s << std::endl;",
		message,
	))
}

func (g *CPPGenerator) generateRepeat(node *Node) {
	times, ok := node.Inputs["TIMES"]

	if !ok {
		g.writeLine("// control_repeat: missing TIMES")
		return
	}

	expr := g.generateValue(times)

	g.writeLine(fmt.Sprintf(
		"for (int i = 0; i < %s; i++) {",
		expr,
	))

	g.indent++

	for _, child := range node.Children["SUBSTACK"] {
		g.generateNode(child)
	}

	g.indent--

	g.writeLine("}")
}

func (g *CPPGenerator) writeLine(line string) {
	g.output.WriteString(
		strings.Repeat("    ", g.indent),
	)

	g.output.WriteString(line)
	g.output.WriteString("\n")
}
