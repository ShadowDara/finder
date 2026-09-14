let theme_mode = 1
var mode = localStorage.getItem('mode')

//

const info_pop_up = `<div class="modal-content"><span class="closeBtn">&times;</span>
    <h2>Shadowdara.github.io</h2>
    <div>
        <p><a href="/generators"><button>Home</button></a></p>
        <p><a href="https://github.com/ShadowDara/Shadowdara.github.io"><button>Source</button></a></p>
        <p><button id="switch_theme">Theme: <div id="theme"></div></button></p>
    </div>
</div>`

const infos = document.getElementById("infos");

infos.innerHTML = info_pop_up

switch_mode()

const openBtn = document.getElementById("openInfoBtn");
const closeBtn = document.querySelector(".closeBtn");

openBtn.onclick = function () {
    infos.style.display = "block";
}

closeBtn.onclick = function () {
    infos.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == infos) {
        infos.style.display = "none";
    }
}

//

if (mode == 'dark') {
    theme_mode = 2
    switch_mode()
}

function switch_mode() {
    if (theme_mode == 1) {
        document.documentElement.style.setProperty("--bg-color", "rgb(255, 255, 255)");
        document.documentElement.style.setProperty("--bar-bg-color", "rgb(231, 231, 231)");
        document.documentElement.style.setProperty("--text-color", "#000000");
        document.documentElement.style.setProperty("--title-color", "rgb(0, 0, 0)");
        document.documentElement.style.setProperty("--pp-title-color", "rgb(235, 90, 0)");
        document.documentElement.style.setProperty("--pop-up-bg-color", "rgba(196, 196, 196, 1)");
        document.getElementById("theme").innerText = "Light";
        localStorage.setItem('mode', 'light');
    }
    else if (theme_mode == 2) {
        document.documentElement.style.removeProperty("--bg-color");
        document.documentElement.style.removeProperty("--bar-bg-color");
        document.documentElement.style.removeProperty("--text-color");
        document.documentElement.style.removeProperty("--title-color");
        document.documentElement.style.removeProperty("--pp-title-color");
        document.documentElement.style.removeProperty("--pop-up-bg-color");
        document.getElementById("theme").innerText = "Dark";
        localStorage.setItem('mode', 'dark');
    }
}

document.getElementById('switch_theme').addEventListener("click", function () {
    theme_mode += 1
    if (theme_mode >= 3) {
        theme_mode = 1
    }
    switch_mode()
});
