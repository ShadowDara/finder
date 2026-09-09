import { escapeHtml, jsx, raw, Fragment } from "../jsx-runtime";
import "./mcappstyle.css";

export default function render() {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/worlds">Worlds</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
