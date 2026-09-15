package query

// Node is any node in the parsed query expression tree.
type Node interface {
	String() string
}

type OrNode struct{ L, R Node }

func (n *OrNode) String() string { return "(" + n.L.String() + " || " + n.R.String() + ")" }

type AndNode struct{ L, R Node }

func (n *AndNode) String() string { return "(" + n.L.String() + " && " + n.R.String() + ")" }

type NotNode struct{ X Node }

func (n *NotNode) String() string { return "!" + n.X.String() }

type CallNode struct {
	Name string
	Args []string
	Pos  int
}

func (n *CallNode) String() string {
	s := n.Name + "("
	for i, a := range n.Args {
		if i > 0 {
			s += ", "
		}
		s += `"` + a + `"`
	}
	return s + ")"
}
