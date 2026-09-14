document.getElementById('generate_mul').addEventListener("click", function () {
    const input = document.getElementById('input');
    const content = formatTextTomultiLine(input.value);
    do_copy(content)
});
