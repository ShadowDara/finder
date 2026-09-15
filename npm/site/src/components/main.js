function formatTextToSingleLine(text) {
    let formattedText = text.replace(/\t/g, '\\t').replace(/\n/g, '\\n');
    return formattedText;
}

function formatTextTomultiLine(text) {
    let formattedText = text.replace(/\\t/g, '\t').replace(/\\n/g, '\n');
    return formattedText;
}

function do_copy(content){
    document.getElementById('output').innerText = content;

    const copyButton = document.createElement("button");
    copyButton.id = 'b-copy';
    copyButton.innerText = 'Copy Text';

    document.getElementById('copy-button').innerHTML = '';
    document.getElementById('copy-button').appendChild(copyButton);

    copyButton.addEventListener("click", function () {
        navigator.clipboard.writeText(content).then(function () {
            copyButton.innerText = "Textk copied";
        })
    });
}
