(function () {
  var sections = document.querySelectorAll('.tutorial-section');
  var navLinks = document.querySelectorAll('.tutorial-nav a');

  if (!sections.length || !navLinks.length || typeof IntersectionObserver === 'undefined') return;

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

  sections.forEach(function (s) { observer.observe(s); });
}());
