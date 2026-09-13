import { renderCreator } from "../src/creator/main";
import "./../src/creator/style.css";

export default function render(el: HTMLDivElement, data: string) {
  renderCreator(el, data);
}
