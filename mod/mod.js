(() => {
  window._mod = mod;
  if (window.__REACT_RENDERED__) {
    window._mod();
  }

  function mod() {
    let text = "";
    if (navigator.language.startsWith("zh")) {
      text = `<a
        href="https://twitter.com/hashtag/FreeChina"
        style='font-family:"Microsoft Yahei";'
      >不自由，毋宁死！</a>`;
    } else {
      text = `<img src="/dict/icons/Flag_of_Ukraine.svg" style="display: inline;height: 16px;" />
        <a href="https://twitter.com/hashtag/StandWithUkraine">We Stand With Ukraine</a>`;
    }
    let footerHtml = `<div class="mod" style="text-align: center;">${text}</div>`;
    Array.from(document.querySelectorAll(".home-footer")).forEach((el) => {
      el.innerHTML = footerHtml;
    });
  }
})();
