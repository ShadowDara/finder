import { describe, expect, test } from "vitest";
import { FarbtTextError, render } from "./index";

describe("farbtext", () => {
  test("simple color", () => {
    const out = render("[red]Hallo[/red]");

    expect(out).toBe("\x1b[31mHallo\x1b[0m");
  });

  test("plain text unchanged", () => {
    const out = render("Hallo Welt");

    expect(out).toBe("Hallo Welt");
  });

  test("multiple tags in one bracket", () => {
    const out = render("[red bold]Hi[/red bold]");

    expect(out).toBe("\x1b[31;1mHi\x1b[0m");
  });

  test("nesting reapplies remaining styles", () => {
    const out = render("[red]a[bold]b[/bold]c[/red]");

    expect(out).toBe("\x1b[31ma\x1b[1mb\x1b[0m\x1b[31mc\x1b[0m");
  });

  test("generic close pops last", () => {
    const out = render("[green]Hi[/]");

    expect(out).toBe("\x1b[32mHi\x1b[0m");
  });

  test("unclosed tag auto resets", () => {
    const out = render("[blue]Hi");

    expect(out).toBe("\x1b[34mHi\x1b[0m");
  });

  test("escaped brackets are literal", () => {
    const out = render(String.raw`\[red\] ist kein Tag`);

    expect(out).toBe("[red] ist kein Tag");
  });

  test("unknown tag errors", () => {
    expect(() => render("[glibberish]x[/glibberish]")).toThrowError(
      new FarbtTextError({
        type: "UnknownTag",
        name: "glibberish",
        pos: 0,
      }),
    );
  });

  test("unterminated tag errors", () => {
    expect(() => render("[red Hallo")).toThrowError(
      new FarbtTextError({
        type: "UnterminatedTag",
        pos: 0,
      }),
    );
  });

  test("unmatched close errors", () => {
    expect(() => render("[red]Hi[/green]")).toThrowError(
      new FarbtTextError({
        type: "UnmatchedClose",
        name: "green",
        pos: 8,
      }),
    );
  });

  test("background color", () => {
    const out = render("[bg_yellow]x[/bg_yellow]");

    expect(out).toBe("\x1b[43mx\x1b[0m");
  });
});
