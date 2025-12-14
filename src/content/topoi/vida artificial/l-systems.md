# L-System Visualization

---

```dataviewjs
const { exec } = require('child_process');
const button = dv.el('button', 'Open HTML File');
button.addEventListener('click', () => {
    const fullPath = app.vault.adapter.getBasePath() + '/l-system.html';
    exec(`open "${fullPath}"`); // Mac
    // exec(`start "" "${fullPath}"`); // Windows
    // exec(`xdg-open "${fullPath}"`); // Linux
});
```










---

<iframe src="https://www.eztree.dev/" allow="fullscreen" allowfullscreen="" style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>

---





