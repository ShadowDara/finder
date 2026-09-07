const fs = require("fs/promises");

async function copy() {
    await fs.copyFile(".samengine/links.md", "pages/links.md");
    console.log("Copied links file!");
}

copy();
