document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggling Logic ---
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        
        if (currentTheme === 'dark') {
            // Switch to Light Mode
            htmlElement.setAttribute('data-bs-theme', 'light');
            themeIcon.innerHTML = '<i class="bi bi-sun"></i>';
        } else {
            // Switch to Dark Mode
            htmlElement.setAttribute('data-bs-theme', 'dark');
            themeIcon.innerHTML = '<i class="bi bi-moon"></i>';
        }
    });

    // --- Bottom Navigation & Mode Switching Logic ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const modeViews = document.querySelectorAll('.mode-view');
    const modeSubtitle = document.getElementById('mode-subtitle');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Get the target mode from the clicked button's data attribute
            const targetMode = btn.getAttribute('data-mode');

            // 2. Reset all navigation buttons to inactive styles
            navButtons.forEach(nav => {
                nav.classList.remove('active', 'text-warning');
                nav.classList.add('text-secondary');
            });

            // 3. Set the clicked button to active styles
            btn.classList.add('active', 'text-warning');
            btn.classList.remove('text-secondary');

            // 4. Hide all calculator mode views
            modeViews.forEach(view => {
                view.classList.remove('active');
                view.classList.add('d-none');
            });

            // 5. Show the targeted mode view
            const activeView = document.getElementById(`${targetMode}-mode`);
            if (activeView) {
                activeView.classList.remove('d-none');
                activeView.classList.add('active');
            }

            // 6. Update the header subtitle text (capitalize first letter)
            const formattedModeName = targetMode.charAt(0).toUpperCase() + targetMode.slice(1);
            modeSubtitle.textContent = `${formattedModeName} Mode`;
        });
    });
});