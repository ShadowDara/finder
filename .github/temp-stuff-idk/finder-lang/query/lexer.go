// Package query implements a tiny boolean expression language for Finder's
// new "query" template field. It lets a template express match conditions
// that the structured files/folders/size schema cannot: OR, NOT, grouping,
// and counting/thresholds.
//
// Grammar (EBNF):
//
//	Query      := OrExpr
//	OrExpr     := AndExpr { "||" AndExpr }
//	AndExpr    := UnaryExpr { "&&" UnaryExpr }
//	UnaryExpr  := "!" UnaryExpr | Primary
//	Primary    := "(" OrExpr ")" | FuncCall
//	FuncCall   := Ident "(" [ ArgList ] ")"
//	ArgList    := Arg { "," Arg }
//	Arg        := String | Number
//	Ident      := letter { letter | digit | "_" }
//	String     := '"' ... '"'   (backslash escapes)
//	Number     := digits [ "." digits ]
//
// Whitespace between tokens is insignificant. There are no comments; a
// query is always a single expression.
package query

import (
	"fmt"
	"strings"
)

type TokenKind int

const (
	TokEOF TokenKind = iota
	TokIdent
	TokString
	TokNumber
	TokLParen
	TokRParen
	TokComma
	TokNot  // !
	TokAnd  // &&
	TokOr   // ||
)

type Token struct {
	Kind  TokenKind
	Value string
	Pos   int
}

type Lexer struct {
	src []rune
	pos int
}

func NewLexer(src string) *Lexer {
	return &Lexer{src: []rune(src)}
}

func (l *Lexer) peek() rune {
	if l.pos >= len(l.src) {
		return 0
	}
	return l.src[l.pos]
}

func (l *Lexer) peekAt(off int) rune {
	if l.pos+off >= len(l.src) {
		return 0
	}
	return l.src[l.pos+off]
}

func (l *Lexer) skipSpace() {
	for l.pos < len(l.src) {
		c := l.src[l.pos]
		if c == ' ' || c == '\t' || c == '\n' || c == '\r' {
			l.pos++
			continue
		}
		break
	}
}

func isIdentStart(r rune) bool {
	return r == '_' || (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z')
}

func isIdentPart(r rune) bool {
	return isIdentStart(r) || (r >= '0' && r <= '9')
}

func isDigit(r rune) bool { return r >= '0' && r <= '9' }

// Next returns the next token in the stream.
func (l *Lexer) Next() (Token, error) {
	l.skipSpace()
	start := l.pos
	if l.pos >= len(l.src) {
		return Token{Kind: TokEOF, Pos: start}, nil
	}
	c := l.src[l.pos]

	switch {
	case c == '(':
		l.pos++
		return Token{Kind: TokLParen, Value: "(", Pos: start}, nil
	case c == ')':
		l.pos++
		return Token{Kind: TokRParen, Value: ")", Pos: start}, nil
	case c == ',':
		l.pos++
		return Token{Kind: TokComma, Value: ",", Pos: start}, nil
	case c == '!':
		l.pos++
		return Token{Kind: TokNot, Value: "!", Pos: start}, nil
	case c == '&':
		if l.peekAt(1) == '&' {
			l.pos += 2
			return Token{Kind: TokAnd, Value: "&&", Pos: start}, nil
		}
		return Token{}, fmt.Errorf("Position %d: einzelnes '&' ist nicht erlaubt, meintest du '&&'?", start)
	case c == '|':
		if l.peekAt(1) == '|' {
			l.pos += 2
			return Token{Kind: TokOr, Value: "||", Pos: start}, nil
		}
		return Token{}, fmt.Errorf("Position %d: einzelnes '|' ist nicht erlaubt, meintest du '||'?", start)
	case c == '"':
		return l.lexString()
	case isDigit(c):
		return l.lexNumber()
	case isIdentStart(c):
		return l.lexIdent()
	default:
		return Token{}, fmt.Errorf("Position %d: unerwartetes Zeichen %q", start, string(c))
	}
}

func (l *Lexer) lexString() (Token, error) {
	start := l.pos
	l.pos++ // skip opening quote
	var sb strings.Builder
	for l.pos < len(l.src) {
		c := l.src[l.pos]
		if c == '\\' && l.pos+1 < len(l.src) {
			next := l.src[l.pos+1]
			switch next {
			case '"':
				sb.WriteRune('"')
			case '\\':
				sb.WriteRune('\\')
			default:
				sb.WriteRune('\\')
				sb.WriteRune(next)
			}
			l.pos += 2
			continue
		}
		if c == '"' {
			l.pos++
			return Token{Kind: TokString, Value: sb.String(), Pos: start}, nil
		}
		sb.WriteRune(c)
		l.pos++
	}
	return Token{}, fmt.Errorf("Position %d: nicht geschlossenes String-Literal", start)
}

func (l *Lexer) lexNumber() (Token, error) {
	start := l.pos
	for l.pos < len(l.src) && isDigit(l.src[l.pos]) {
		l.pos++
	}
	if l.pos < len(l.src) && l.src[l.pos] == '.' {
		l.pos++
		for l.pos < len(l.src) && isDigit(l.src[l.pos]) {
			l.pos++
		}
	}
	return Token{Kind: TokNumber, Value: string(l.src[start:l.pos]), Pos: start}, nil
}

func (l *Lexer) lexIdent() (Token, error) {
	start := l.pos
	for l.pos < len(l.src) && isIdentPart(l.src[l.pos]) {
		l.pos++
	}
	return Token{Kind: TokIdent, Value: string(l.src[start:l.pos]), Pos: start}, nil
}
