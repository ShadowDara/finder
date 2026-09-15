// JS Code for creating Github README Pictures for both
// ligth and Darkmode

document.getElementById('generate').addEventListener("click", async function () {
    const link1 = document.getElementById('link1')
    const link2 = document.getElementById('link2')
    const link3 = document.getElementById('link3')

    const template_content = `<picture><source srcset="${link1.value}" media="(prefers-color-scheme: dark)" /><source srcset="${link2.value}" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)" /><img src="${link3.value}" />></picture>`;

    document.getElementById('output').innerText = template_content;

    document.getElementById('copy-button').innerHTML = "<button id='b-copy'>Copy Link</button>";

    document.getElementById('b-copy').addEventListener("click", async function () {
        navigator.clipboard.writeText(template_content).then(function () {
            document.getElementById("b-copy").innerText = "Link copied";
        })
    })
});
