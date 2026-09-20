import renderDockview from "../src/dockview/render";
import "dockview/dist/styles/dockview.css";
import "../src/dockview/dockview.css";

export default function render(el: HTMLDivElement) {
  renderDockview(el);
}
