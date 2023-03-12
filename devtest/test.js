window.addEventListener("scroll", e => {
  console.log("scroll", e.target);
});

document.querySelector("#main-content").addEventListener("scroll", e => {
  console.log("scroll", e.target, e.target.scrollTop);
});

document.querySelector("#main-content").addEventListener("scroll", e => {
  console.log("scroll", e.target, e.target.scrollTop);
});

fetch("/?api=2", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain"
  },
  body: "sdd"
});

var xhr = new XMLHttpRequest();
xhr.open("POST", "/?api=2", true);
xhr.setRequestHeader("X-APP-ID", "aaa");
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.send("dd");
