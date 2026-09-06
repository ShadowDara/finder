export interface Product {
  id: number;
  name: string;
  price: number;
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
