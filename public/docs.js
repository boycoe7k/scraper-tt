const origin = window.location.origin;
document.querySelectorAll('.origin').forEach(el => { el.textContent = origin; });
document.getElementById('baseUrl').textContent = origin;
document.getElementById('yearNow').textContent = new Date().getFullYear();
document.getElementById('copyBase').addEventListener('click', async event => {
  try {
    await navigator.clipboard.writeText(origin);
    event.currentTarget.textContent = 'Copied';
    setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1400);
  } catch {
    event.currentTarget.textContent = 'Select URL';
  }
});
