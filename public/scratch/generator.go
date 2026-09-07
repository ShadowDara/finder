package scratch

import (
	"fmt"
	"strconv"
	"strings"
)

type CPPGenerator struct {
	indent           int
	output           strings.Builder
	currentSpriteIdx int
	currentStage     *Target
	currentSounds    []Sound
}

func NewCPPGenerator() *CPPGenerator {
	return &CPPGenerator{}
}

func (g *CPPGenerator) Generate(project *Project) string {
	g.output.Reset()
	g.indent = 0

	g.writeLine("#include <cmath>")
	g.writeLine("#include \"ScratchRuntime.hpp\"")
	g.writeLine("#include <raylib.h>")
	g.writeLine("#include \"Logger.hpp\"")
	g.writeLine("")

	g.writeLine("ScratchRuntime runtime;")
	g.writeLine("")

	g.writeLine("static void stopScript()")
	g.writeLine("{")
	g.indent++

	g.writeLine("log(\"Red flag clicked!\");")

	g.indent--
	g.writeLine("}")
	g.writeLine("")

	clickIndex := 0
	for _, target := range project.Targets {
		if target.IsStage {
			continue
		}
		g.currentSpriteIdx = clickIndex
		g.currentSounds = target.Sounds
		g.writeLine(fmt.Sprintf("static void sprite%dClickedScript()", clickIndex))
		g.writeLine("{")
		g.indent++
		for id, block := range target.Blocks {
			if block.TopLevel && block.Opcode == "event_whenthisspriteclicked" {
				g.generateScript(ParseScript(target.Blocks, id))
			}
		}
		g.indent--
		g.writeLine("}")
		g.writeLine("")
		clickIndex++
	}

	spriteIndex := 0
	for targetIndex, target := range project.Targets {
		g.writeLine(fmt.Sprintf("static void startScript%d()", targetIndex))
		g.writeLine("{")
		g.indent++
		g.writeLine("log(\"Green flag clicked!\");")

		if target.IsStage {
			g.currentStage = &target
		} else {
			g.currentStage = nil
			g.currentSpriteIdx = spriteIndex
			spriteIndex++
		}
		g.currentSounds = target.Sounds

		for id, block := range target.Blocks {
			if !block.TopLevel || (!target.IsStage && block.Opcode == "event_whenthisspriteclicked") {
				continue
			}
			g.generateScript(ParseScript(target.Blocks, id))
		}

		g.indent--
		g.writeLine("}")
		g.writeLine("")
	}

	g.writeLine("void ScratchRuntime::loadAssets()")
	g.writeLine("{")
	g.indent++
	for _, target := range project.Targets {
		for _, variable := range target.Variables {
			if len(variable) < 2 {
				continue
			}
			name, ok := variable[0].(string)
			if !ok {
				continue
			}
			if value, ok := variableNumber(variable[1]); ok {
				g.writeLine(fmt.Sprintf("runtime.variable(%q) = %g;", name, value))
			} else {
				g.warnUnsupported("non-numeric variable: " + name)
				g.writeLine(fmt.Sprintf("logWarning(%q);", "Non-numeric variable reset to 0: "+name))
				g.writeLine(fmt.Sprintf("runtime.variable(%q) = 0;", name))
			}
		}
	}
	for _, target := range project.Targets {
		for _, sound := range target.Sounds {
			g.writeLine(fmt.Sprintf(
				"runtime.loadSound(%q, RESOURCES_PATH \"%s\");",
				sound.Name,
				sound.MD5Ext,
			))
		}
	}

	spriteIndex = 0
	for _, target := range project.Targets {
		if target.IsStage {
			g.generateBackground(target)
			continue
		}

		g.writeLine("runtime.sprites.emplace_back();")
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).x = %g;", spriteIndex, target.X))
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).y = %g;", spriteIndex, target.Y))
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).direction = %g;", spriteIndex, target.Direction))
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).visible = %t;", spriteIndex, target.Visible))

		if len(target.Costumes) == 0 {
			spriteIndex++
			continue
		}

		costumeIndex := target.CurrentCostume
		if costumeIndex < 0 || costumeIndex >= len(target.Costumes) {
			costumeIndex = 0
		}

		costume := target.Costumes[costumeIndex]
		g.writeLine(fmt.Sprintf(
			"runtime.sprite(%d).loadCostume(RESOURCES_PATH \"%s\", %g, %g);",
			spriteIndex,
			assetFilename(costume),
			costume.RotationCenterX,
			costume.RotationCenterY,
		))
		spriteIndex++
	}

	g.indent--
	g.writeLine("}")
	g.writeLine("")

	g.writeLine("int main()")
	g.writeLine("{")
	g.indent++

	g.writeLine(
		`runtime.init(800, 600, "Scratch Project", 60);`,
	)

	g.writeLine("runtime.loadAssets();")

	for targetIndex := range project.Targets {
		g.writeLine(fmt.Sprintf("runtime.addStartCallback(startScript%d);", targetIndex))
	}
	g.writeLine("runtime.setStopCallback(stopScript);")
	spriteIndex = 0
	for _, target := range project.Targets {
		if target.IsStage {
			continue
		}
		g.writeLine(fmt.Sprintf("runtime.setSpriteClickCallback(%d, sprite%dClickedScript);", spriteIndex, spriteIndex))
		spriteIndex++
	}
	g.writeLine("")

	g.writeLine("while (!runtime.shouldClose())")
	g.writeLine("{")
	g.indent++

	g.writeLine("runtime.update();")
	g.writeLine("")

	g.writeLine("BeginDrawing();")
	g.writeLine("ClearBackground(RAYWHITE);")

	g.writeLine("runtime.draw();")

	g.writeLine("EndDrawing();")

	g.indent--
	g.writeLine("}")

	g.writeLine("")

	g.writeLine("runtime.shutdown();")
	g.writeLine("return 0;")

	g.indent--
	g.writeLine("}")

	return g.output.String()
}

func variableNumber(value any) (float64, bool) {
	switch value := value.(type) {
	case float64:
		return value, true
	case string:
		parsed, err := strconv.ParseFloat(value, 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func (g *CPPGenerator) generateBackground(target Target) {
	if len(target.Costumes) == 0 {
		return
	}

	for _, costume := range target.Costumes {
		g.writeLine("runtime.backdrops.emplace_back();")
		g.writeLine(fmt.Sprintf(
			"runtime.backdrops.back().loadCostume(RESOURCES_PATH \"%s\", %g, %g);",
			assetFilename(costume),
			costume.RotationCenterX,
			costume.RotationCenterY,
		))
	}

	if target.CurrentCostume >= 0 && target.CurrentCostume < len(target.Costumes) {
		g.writeLine(fmt.Sprintf("runtime.setBackdrop(%d);", target.CurrentCostume))
	}
}

func assetFilename(costume Costume) string {
	if costume.DataFormat == "svg" {
		return costume.AssetID + ".png"
	}

	return costume.MD5Ext
}

func (g *CPPGenerator) generateScript(script *Script) {
	for _, node := range script.Blocks {
		g.generateNode(node)
	}
}

func (g *CPPGenerator) generateNode(node *Node) {
	switch node.Opcode {

	case "event_whenflagclicked":
		// Hat erzeugt keinen direkten C++ Code.

	case "motion_movesteps":
		g.generateMoveSteps(node)

	case "motion_turnright":
		g.generateTurnRight(node)

	case "motion_turnleft":
		g.generateTurnLeft(node)

	case "looks_say":
		g.generateSay(node)

	case "looks_sayforsecs":
		g.generateSayForSeconds(node)

	case "sound_play":
		g.generatePlaySound(node)

	case "looks_switchbackdropto":
		g.generateSwitchBackdrop(node)

	case "looks_nextbackdrop":
		g.writeLine("runtime.nextBackdrop();")

	case "event_whenthisspriteclicked":
		// The callback wrapper handles this hat.

	case "control_wait_until":
		g.generateWaitUntil(node)

	case "control_wait":
		g.generateWait(node)

	case "looks_show":
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).visible = true;", g.currentSpriteIdx))

	case "looks_hide":
		g.writeLine(fmt.Sprintf("runtime.sprite(%d).visible = false;", g.currentSpriteIdx))

	case "motion_gotoxy":
		g.generateGoToXY(node)

	case "data_setvariableto":
		g.generateSetVariable(node)

	case "data_changevariableby":
		g.generateChangeVariable(node)

	case "control_repeat":
		g.generateRepeat(node)

	default:
		g.warnUnsupported(node.Opcode)
		g.writeLine(fmt.Sprintf(
			"logWarning(%q);",
			"Unsupported Scratch block: "+node.Opcode,
		))
	}
}

func (g *CPPGenerator) warnUnsupported(opcode string) {
	fmt.Printf("\033[33m[WARN]\033[0m unsupported Scratch block: %s\n", opcode)
}

func (g *CPPGenerator) warnMissingInput(opcode string, input string) {
	message := fmt.Sprintf("%s: missing input %s", opcode, input)
	fmt.Printf("\033[33m[WARN]\033[0m %s\n", message)
	g.writeLine(fmt.Sprintf("logWarning(%q);", message))
}

func (g *CPPGenerator) generateSetVariable(node *Node) {
	name := variableName(node)
	value, ok := node.Inputs["VALUE"]
	if name == "" || !ok {
		g.warnMissingInput("data_setvariableto", "VARIABLE or VALUE")
		return
	}
	g.writeLine(fmt.Sprintf("runtime.variable(%q) = %s;", name, g.generateNumericValue(value)))
}

func (g *CPPGenerator) generateChangeVariable(node *Node) {
	name := variableName(node)
	value, ok := node.Inputs["VALUE"]
	if name == "" || !ok {
		g.warnMissingInput("data_changevariableby", "VARIABLE or VALUE")
		return
	}
	g.writeLine(fmt.Sprintf("runtime.variable(%q) += %s;", name, g.generateNumericValue(value)))
}

func variableName(node *Node) string {
	field, ok := node.Fields["VARIABLE"]
	if !ok || len(field) == 0 {
		return ""
	}
	name, _ := field[0].(string)
	return name
}

func (g *CPPGenerator) generateMoveSteps(node *Node) {
	value, ok := node.Inputs["STEPS"]

	if !ok {
		g.warnMissingInput("motion_movesteps", "STEPS")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"runtime.sprite(%d).moveSteps(%s);",
		g.currentSpriteIdx,
		expr,
	))
}

func (g *CPPGenerator) generateGoToXY(node *Node) {
	x, xOK := node.Inputs["X"]
	y, yOK := node.Inputs["Y"]
	if !xOK || !yOK {
		g.warnMissingInput("motion_gotoxy", "X or Y")
		return
	}

	g.writeLine(fmt.Sprintf(
		"runtime.sprite(%d).x = %s;",
		g.currentSpriteIdx,
		g.generateValue(x),
	))
	g.writeLine(fmt.Sprintf(
		"runtime.sprite(%d).y = %s;",
		g.currentSpriteIdx,
		g.generateValue(y),
	))
}

func (g *CPPGenerator) generateTurnRight(node *Node) {
	value, ok := node.Inputs["DEGREES"]

	if !ok {
		g.warnMissingInput("motion_turnright", "DEGREES")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"runtime.sprite(%d).turnRight(%s);",
		g.currentSpriteIdx,
		expr,
	))
}

func (g *CPPGenerator) generateTurnLeft(node *Node) {
	value, ok := node.Inputs["DEGREES"]

	if !ok {
		g.warnMissingInput("motion_turnleft", "DEGREES")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"runtime.sprite(%d).turnLeft(%s);",
		g.currentSpriteIdx,
		expr,
	))
}

func (g *CPPGenerator) generateValue(value Value) string {
	switch value.Kind {

	case ValueNumber:
		return fmt.Sprintf("%g", value.Number)

	case ValueString:
		return fmt.Sprintf("%q", value.String)

	case ValueBool:
		if value.Bool {
			return "true"
		}

		return "false"

	case ValueVariable:
		return fmt.Sprintf("runtime.variable(%q)", value.Name)

	case ValueBlock:
		if value.Block == nil {
			return "0"
		}

		return g.generateExpression(value.Block)

	default:
		g.warnUnsupported("invalid value")
		return `runtime.unsupportedValue("invalid value")`
	}
}

func (g *CPPGenerator) generateNumericValue(value Value) string {
	if value.Kind == ValueString {
		if number, err := strconv.ParseFloat(value.String, 64); err == nil {
			return fmt.Sprintf("%g", number)
		}
	}

	return g.generateValue(value)
}

func (g *CPPGenerator) generateExpression(node *Node) string {
	switch node.Opcode {

	case "data_variable":
		name := variableName(node)
		if name == "" {
			g.warnMissingInput("data_variable", "VARIABLE")
			return `runtime.unsupportedValue("data_variable without name")`
		}
		return fmt.Sprintf("runtime.variable(%q)", name)

	case "operator_add":
		return g.binaryOperator(node, "+")

	case "operator_subtract":
		return g.binaryOperator(node, "-")

	case "operator_multiply":
		return g.binaryOperator(node, "*")

	case "operator_divide":
		return g.binaryOperator(node, "/")

	case "operator_gt":
		return g.binaryOperator(node, ">")

	case "operator_lt":
		return g.binaryOperator(node, "<")

	case "operator_equals":
		return g.binaryOperator(node, "==")

	default:
		g.warnUnsupported("value block: " + node.Opcode)
		return fmt.Sprintf("runtime.unsupportedValue(%q)", "Unsupported Scratch value: "+node.Opcode)
	}
}

func (g *CPPGenerator) binaryOperator(
	node *Node,
	operator string,
) string {
	leftName, rightName := "NUM1", "NUM2"
	if node.Opcode == "operator_gt" || node.Opcode == "operator_lt" || node.Opcode == "operator_equals" {
		leftName, rightName = "OPERAND1", "OPERAND2"
	}
	left, leftOK := node.Inputs[leftName]
	right, rightOK := node.Inputs[rightName]

	if !leftOK || !rightOK {
		g.warnMissingInput("operator_"+operator, "left or right operand")
		return "0"
	}

	return fmt.Sprintf(
		"(%s %s %s)",
		g.generateNumericValue(left),
		operator,
		g.generateNumericValue(right),
	)
}

func (g *CPPGenerator) generateRepeat(node *Node) {
	times, ok := node.Inputs["TIMES"]

	if !ok {
		g.warnMissingInput("control_repeat", "TIMES")
		return
	}

	expr := g.generateValue(times)

	g.writeLine(fmt.Sprintf(
		"for (int i = 0; i < %s; ++i)",
		expr,
	))

	g.writeLine("{")
	g.indent++

	for _, child := range node.Children["SUBSTACK"] {
		g.generateNode(child)
	}

	g.indent--
	g.writeLine("}")
}

func (g *CPPGenerator) generateSay(node *Node) {
	value, ok := node.Inputs["MESSAGE"]

	if !ok {
		g.warnMissingInput("looks_say", "MESSAGE")
		return
	}

	expr := g.generateValue(value)

	g.writeLine(fmt.Sprintf(
		"TraceLog(LOG_INFO, \"Scratch say: %%s\", %s);",
		expr,
	))
}

func (g *CPPGenerator) generateSayForSeconds(node *Node) {
	message, messageOK := node.Inputs["MESSAGE"]
	seconds, secondsOK := node.Inputs["SECS"]
	if !messageOK || !secondsOK {
		g.warnMissingInput("looks_sayforsecs", "MESSAGE or SECS")
		return
	}
	g.writeLine(fmt.Sprintf("runtime.sprite(%d).sayForSeconds(%s, %s);", g.currentSpriteIdx, g.generateValue(message), g.generateValue(seconds)))
}

func (g *CPPGenerator) generatePlaySound(node *Node) {
	value, ok := node.Inputs["SOUND_MENU"]
	if !ok || value.Block == nil {
		g.warnMissingInput("sound_play", "SOUND_MENU")
		return
	}

	fields := value.Block.Fields["SOUND_MENU"]
	if len(fields) == 0 {
		g.warnMissingInput("sound_play", "SOUND_MENU name")
		return
	}

	name, ok := fields[0].(string)
	if !ok {
		g.warnMissingInput("sound_play", "SOUND_MENU name")
		return
	}

	for _, sound := range g.currentSounds {
		if sound.Name == name {
			g.writeLine(fmt.Sprintf("runtime.playSound(%q);", name))
			return
		}
	}

	g.warnUnsupported("sound: " + name)
	g.writeLine(fmt.Sprintf("logWarning(%q);", "Unknown sound: "+name))
}

func (g *CPPGenerator) generateSwitchBackdrop(node *Node) {
	if g.currentStage == nil {
		g.warnUnsupported("looks_switchbackdropto outside Stage")
		g.writeLine("logWarning(\"looks_switchbackdropto outside Stage\");")
		return
	}

	value, ok := node.Inputs["BACKDROP"]
	if !ok || value.Block == nil {
		g.warnMissingInput("looks_switchbackdropto", "BACKDROP")
		return
	}

	fields := value.Block.Fields["BACKDROP"]
	if len(fields) == 0 {
		g.warnMissingInput("looks_switchbackdropto", "BACKDROP name")
		return
	}
	name, ok := fields[0].(string)
	if !ok {
		g.warnMissingInput("looks_switchbackdropto", "BACKDROP name")
		return
	}

	for index, costume := range g.currentStage.Costumes {
		if costume.Name == name {
			g.writeLine(fmt.Sprintf("runtime.setBackdrop(%d);", index))
			return
		}
	}

	g.warnUnsupported("backdrop: " + name)
	g.writeLine(fmt.Sprintf("logWarning(%q);", "Unknown backdrop: "+name))
}

func (g *CPPGenerator) generateWaitUntil(node *Node) {
	condition, ok := node.Inputs["CONDITION"]
	if !ok {
		g.warnMissingInput("control_wait_until", "CONDITION")
		return
	}
	g.writeLine(fmt.Sprintf("if (!runtime.waitUntil([&]() { return %s; })) return;", g.generateValue(condition)))
}

func (g *CPPGenerator) generateWait(node *Node) {
	duration, ok := node.Inputs["DURATION"]
	if !ok {
		g.warnMissingInput("control_wait", "DURATION")
		return
	}

	g.writeLine(fmt.Sprintf(
		"if (!runtime.waitSeconds(%s)) return;",
		g.generateNumericValue(duration),
	))
}

func (g *CPPGenerator) writeLine(line string) {
	g.output.WriteString(
		strings.Repeat("    ", g.indent),
	)

	g.output.WriteString(line)
	g.output.WriteString("\n")
}
