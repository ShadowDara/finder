import fs from "node:fs";
import path from "node:path";

interface Product {
  id: number;
  name: string;
  price: number;
}

export function build(): Product[] {
  const file = path.resolve("data/products.json");

  const products: Product[] = JSON.parse(fs.readFileSync(file, "utf8"));

  return products
    .filter((product) => product.price > 10)
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: Math.round(product.price * 100) / 100,
    }));
}

export default function Page(el: HTMLElement, products: Product[]) {
  el.innerHTML = products
    .map(
      (product) => `
        <article>
          <h2>${product.name}</h2>
          <strong>${product.price} €</strong>
        </article>
      `,
    )
    .join("");
}
