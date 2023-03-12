if (!window.AbortController) {
  window.AbortController = function AbortController() {};
  window.AbortController.prototype.abort = Function.prototype;
}
