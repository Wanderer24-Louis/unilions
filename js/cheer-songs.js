document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".cheer-song-filters .filter-btn");
  const iframe = document.querySelector(".cheer-song-video iframe");

  if (!buttons.length || !iframe) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const videoId = button.getAttribute("data-video-id");
      if (videoId) {
        iframe.src = "https://www.youtube.com/embed/" + videoId + "?rel=0";
      }
    });
  });
});

