package query

import "fmt"

// FuncArity lists every function the query language understands and how
// many arguments each one takes. Kept exported so validators/docs/editors
// can introspect the language without duplicating this list.
var FuncArity = map[string]int{
	"file":     1, // file(pattern)
	"folder":   1, // folder(pattern)
	"name":     1, // name(pattern) - matches the scanned directory's own name
	"command":  1, // command(shellCmd) - exit code 0 => true
	"size":     2, // size(min, max) - total recursive dir size, "" = unbounded
	"filesize": 3, // filesize(pattern, min, max) - size of first matching file
	"count":    3, // count(pattern, min, max) - number of matching files, "" = unbounded
	"sha256":   2, // sha256(pattern, hexHash)
	"sha512":   2, // sha512(pattern, hexHash)
}

type Parser struct {
	lex  *Lexer
	cur  Token
	peek *Token
}

func NewParser(src string) (*Parser, error) {
	p := &Parser{lex: NewLexer(src)}
	if err := p.advance(); err != nil {
		return nil, err
	}
	return p, nil
}

func (p *Parser) advance() error {
	t, err := p.lex.Next()
	if err != nil {
		return err
	}
	p.cur = t
	return nil
}

// Compile parses and validates a query string, returning its AST.
// It does NOT touch the filesystem - only syntax and function
// name/arity are checked here.
func Compile(src string) (Node, error) {
	if len(src) == 0 {
		return nil, fmt.Errorf("query ist leer")
	}
	p, err := NewParser(src)
	if err != nil {
		return nil, err
	}
	n, err := p.parseOr()
	if err != nil {
		return nil, err
	}
	if p.cur.Kind != TokEOF {
		return nil, fmt.Errorf("Position %d: unerwartetes Token %q nach Ende des Ausdrucks", p.cur.Pos, p.cur.Value)
	}
	return n, nil
}

func (p *Parser) parseOr() (Node, error) {
	left, err := p.parseAnd()
	if err != nil {
		return nil, err
	}
	for p.cur.Kind == TokOr {
		if err := p.advance(); err != nil {
			return nil, err
		}
		right, err := p.parseAnd()
		if err != nil {
			return nil, err
		}
		left = &OrNode{L: left, R: right}
	}
	return left, nil
}

func (p *Parser) parseAnd() (Node, error) {
	left, err := p.parseUnary()
	if err != nil {
		return nil, err
	}
	for p.cur.Kind == TokAnd {
		if err := p.advance(); err != nil {
			return nil, err
		}
		right, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		left = &AndNode{L: left, R: right}
	}
	return left, nil
}

func (p *Parser) parseUnary() (Node, error) {
	if p.cur.Kind == TokNot {
		if err := p.advance(); err != nil {
			return nil, err
		}
		x, err := p.parseUnary()
		if err != nil {
			return nil, err
		}
		return &NotNode{X: x}, nil
	}
	return p.parsePrimary()
}

func (p *Parser) parsePrimary() (Node, error) {
	switch p.cur.Kind {
	case TokLParen:
		if err := p.advance(); err != nil {
			return nil, err
		}
		inner, err := p.parseOr()
		if err != nil {
			return nil, err
		}
		if p.cur.Kind != TokRParen {
			return nil, fmt.Errorf("Position %d: erwartete ')'", p.cur.Pos)
		}
		if err := p.advance(); err != nil {
			return nil, err
		}
		return inner, nil
	case TokIdent:
		return p.parseCall()
	case TokEOF:
		return nil, fmt.Errorf("Position %d: unerwartetes Ende des Ausdrucks, Funktionsaufruf erwartet", p.cur.Pos)
	default:
		return nil, fmt.Errorf("Position %d: unerwartetes Token %q, Funktionsaufruf, '(' oder '!' erwartet", p.cur.Pos, p.cur.Value)
	}
}

func (p *Parser) parseCall() (Node, error) {
	name := p.cur.Value
	pos := p.cur.Pos
	arity, known := FuncArity[name]
	if !known {
		return nil, fmt.Errorf("Position %d: unbekannte Funktion %q (bekannt: file, folder, name, size, filesize, count, sha256, sha512, command)", pos, name)
	}
	if err := p.advance(); err != nil {
		return nil, err
	}
	if p.cur.Kind != TokLParen {
		return nil, fmt.Errorf("Position %d: erwartete '(' nach %q", p.cur.Pos, name)
	}
	if err := p.advance(); err != nil {
		return nil, err
	}
	var args []string
	if p.cur.Kind != TokRParen {
		for {
			switch p.cur.Kind {
			case TokString, TokNumber:
				args = append(args, p.cur.Value)
			default:
				return nil, fmt.Errorf("Position %d: erwartete String- oder Zahlen-Argument in %q(...)", p.cur.Pos, name)
			}
			if err := p.advance(); err != nil {
				return nil, err
			}
			if p.cur.Kind == TokComma {
				if err := p.advance(); err != nil {
					return nil, err
				}
				continue
			}
			break
		}
	}
	if p.cur.Kind != TokRParen {
		return nil, fmt.Errorf("Position %d: erwartete ')' oder ',' in %q(...)", p.cur.Pos, name)
	}
	if err := p.advance(); err != nil {
		return nil, err
	}
	if len(args) != arity {
		return nil, fmt.Errorf("Position %d: %q erwartet %d Argument(e), bekommen: %d", pos, name, arity, len(args))
	}
	return &CallNode{Name: name, Args: args, Pos: pos}, nil
}
