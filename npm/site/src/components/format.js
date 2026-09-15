document.getElementById('generate_sin').addEventListener("click", function () {
    const input1 = document.getElementById('input1');
    const content = formatTextToSingleLine(input1.value);
    do_copy(content)
});
