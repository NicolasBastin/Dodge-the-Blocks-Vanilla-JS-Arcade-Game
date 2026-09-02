function OpenSettings() {
  document.getElementById("overlay").style.display = "flex";
}

function CloseSettings() {
  document.getElementById("overlay").style.display = "none";
}

let volume = document.getElementById('volume-slider');
volume.addEventListener("input", function(e) {
    musique.volume = e.currentTarget.value / 100;
})


