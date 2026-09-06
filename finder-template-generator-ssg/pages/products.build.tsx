import fs from "node:fs";
import path from "node:path";

export interface Product {
  id: number;
  name: string;
  price: number;
}

export async function build(): Promise<Product[]> {
  const file = path.resolve("data/products.json");

  const products = JSON.parse(fs.readFileSync(file, "utf8")) as Product[];

  return products;
}
