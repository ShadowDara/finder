package main

import (
	"fmt"
	"os"
	"strconv"

	lua "github.com/yuin/gopher-lua"
)

func callTool(L *lua.LState, name string, args ...lua.LValue) (lua.LValue, error) {
	c := L.GetGlobal("c")
	if c == lua.LNil {
		return nil, fmt.Errorf("global 'c' not found")
	}

	funcs := L.GetField(c, "funcs")
	if funcs == lua.LNil {
		return nil, fmt.Errorf("'c.funcs' not found")
	}

	fn := L.GetField(funcs, name)
	if fn == lua.LNil {
		return nil, fmt.Errorf("tool %q not found", name)
	}

	if fn.Type() != lua.LTFunction {
		return nil, fmt.Errorf("tool %q is not a function", name)
	}

	err := L.CallByParam(
		lua.P{
			Fn:      fn,
			NRet:    1,
			Protect: true,
		},
		args...,
	)

	if err != nil {
		return nil, err
	}

	result := L.Get(-1)
	L.Pop(1)

	return result, nil
}

func main() {
	L := lua.NewState()
	defer L.Close()

	// Lua laden
	if err := L.DoFile("config.lua"); err != nil {
		panic(err)
	}

	// CLI prüfen
	if len(os.Args) < 2 {
		fmt.Println("Usage: program <tool> [args...]")
		return
	}

	// Erstes Argument = Toolname
	toolName := os.Args[1]

	// Restliche Argumente = Tool-Argumente
	var luaArgs []lua.LValue

	for _, arg := range os.Args[2:] {
		// Versuche Zahl
		if n, err := strconv.ParseFloat(arg, 64); err == nil {
			luaArgs = append(luaArgs, lua.LNumber(n))
			continue
		}

		// Sonst String
		luaArgs = append(luaArgs, lua.LString(arg))
	}

	// Tool aufrufen
	result, err := callTool(L, toolName, luaArgs...)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	os.Exit(int(lua.LVAsNumber(result)))
}
