chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('dist.html', {
    bounds: {
      width: 800,
      height: 800
    }
  });
});
