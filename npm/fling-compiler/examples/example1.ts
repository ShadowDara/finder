// examples/example1.ts
// A tour of the subset this compiler supports. Compile with:
//   npx ts-node src/cli.ts examples/example1.ts -o examples/example1.fling

function classify(x: number): string {
  if (x < 0) {
    return "negative";
  }
  if (x === 0) {
    return "zero";
  }
  return "positive";
}

function clampLabel(x: number): string {
  // ternary in a return position -- lowered to if/else automatically
  const label = x > 100 ? "big" : "small";
  return label;
}

function sumUpTo(n: number): number {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

const nums = [1, 2, 3, 4, 5];
let i = 0;
while (i < nums.length) {
  console.log("value:", nums[i], "->", classify(nums[i]));
  i++;
}

const person = { name: "Ada", age: 36 };
console.log(`Name: ${person.name}, age: ${person.age}`);

console.log("sum 1..10 =", sumUpTo(10));
console.log("5 % 2 =", 5 % 2); // compiled with swapped operands to counter bug B1
console.log("classify(-3) =", classify(-3));
console.log("clampLabel(250) =", clampLabel(250));
