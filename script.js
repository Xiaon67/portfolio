/* ==========================================================================
   KHRONOSAION — SITE SCRIPTS & ADMIN DASHBOARD
   ========================================================================== */

/* ==========================================================================
   1. DEFAULT CONFIG & STORAGE
   ========================================================================== */

const DEFAULT_CONFIG = {
    // Google OAuth Client ID
    googleClientId: "107414707667-rrj5rkoumorvfr0njftdu8vpfgf5g7ll.apps.googleusercontent.com",
    // Authorized emails permitted for admin management (case-insensitive)
    allowedEmails: [],

    /*
     * Projects shown in "The Lab / Projects" section.
     * Each project can include title, description, category, status, accent,
     * tags, and direct links (github, vercel, customLink, etc.).
     */
    experiments: [
        {
            title: "Interactive Web Tools Suite",
            description:
                "Fast, dependency-free utility web application suite designed for developer productivity, format conversions, code utilities, and text transformations.",
            category: "Web Systems",
            status: "Live",
            accent: "#10b981",
            tags: ["React", "Vite", "Tailwind CSS", "JavaScript", "Developer Tools"],
            github: "https://github.com/Xiaon67/tools-site",
        },
        {
            title: "Bespoke Portfolio & Code Runner",
            description:
                "High-performance personal developer site featuring an in-browser live code runner, tactile Web Audio synthesizer, multi-theme engine, and command palette.",
            category: "Creative Systems",
            status: "Live",
            accent: "#6366f1",
            tags: ["JavaScript", "HTML/CSS", "Web Audio API", "Interactive", "Bento Grid"],
            github: "https://github.com/Xiaon67/portfolio",
            customTitle: "Live Site",
            customUrl: "https://xiaon67.github.io/portfolio/",
        },
    ],

    STATUS_COLORS: {
        idea: "#8b5cf6",
        exploring: "#4a7dff",
        experiment: "#f59e0b",
        "in progress": "#10b981",
        "early stage": "#4a7dff",
        live: "#10b981",
        paused: "#9ca3af",
        archived: "#9ca3af",
    },
};

const STORAGE_KEYS = {
    PROJECTS: "khronosaion_projects_v5",
    AUTH_USER: "khronosaion_auth_user",
    GOOGLE_CLIENT_ID: "khronosaion_google_client_id",
    ALLOWED_EMAILS: "khronosaion_allowed_emails",
    THEME: "khronosaion_theme",
};

// Initialize active state
let currentProjects = loadProjects();
let currentAdminUser = loadAuthUser();
let googleClientId = localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID) || DEFAULT_CONFIG.googleClientId;
let allowedEmails = loadAllowedEmails();

function loadProjects() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.error("Failed to parse saved projects", e);
    }
    return [...DEFAULT_CONFIG.experiments];
}

function saveProjects(projects) {
    currentProjects = projects;
    try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
        console.error("Failed to save projects to localStorage", e);
    }
    renderLab();
}

function loadAuthUser() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Failed to parse auth user", e);
    }
    return null;
}

function loadAllowedEmails() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.ALLOWED_EMAILS);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error("Failed to parse allowed emails", e);
    }
    return [...DEFAULT_CONFIG.allowedEmails];
}

function saveAllowedEmails(emails) {
    allowedEmails = emails;
    try {
        localStorage.setItem(STORAGE_KEYS.ALLOWED_EMAILS, JSON.stringify(emails));
    } catch (e) {
        console.error("Failed to save allowed emails", e);
    }
}

/* ==========================================================================
   2. Helpers & Setup
   ========================================================================== */

document.documentElement.classList.add("js");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Theme Management
function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentTheme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeColorMeta(currentTheme);

    const toggleBtns = $$(".theme-toggle-btn");
    toggleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const active = document.documentElement.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
            const next = active === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem(STORAGE_KEYS.THEME, next);
            updateThemeColorMeta(next);
        });
    });
}

function updateThemeColorMeta(theme) {
    const meta = $("#meta-theme-color");
    if (meta) {
        meta.setAttribute("content", theme === "dark" ? "#0d0f12" : "#fafaf8");
    }
}
initTheme();

function escapeHTML(value) {
    if (!value) return "";
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

// Decode JWT token from Google Identity Services
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
}

/* ==========================================================================
   3. Navigation — scrolled state, active link, mobile menu
   ========================================================================== */

(function initNav() {
    const nav = $("#site-nav");
    if (!nav) return;
    const links = $$(".nav-link");

    let ticking = false;
    function updateNavState() {
        nav.classList.toggle("is-scrolled", window.scrollY > 24);
        ticking = false;
    }
    window.addEventListener(
        "scroll",
        () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateNavState);
            }
        },
        { passive: true }
    );
    updateNavState();

    if ("IntersectionObserver" in window) {
        const sectionByLink = new Map();
        links.forEach((link) => {
            const href = link.getAttribute("href");
            if (href && href.startsWith("#") && href.length > 1) {
                try {
                    const target = $(href);
                    if (target) sectionByLink.set(target, link);
                } catch (e) {}
            }
        });

        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    links.forEach((l) => l.classList.remove("is-active"));
                    const active = sectionByLink.get(entry.target);
                    if (active) active.classList.add("is-active");
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        sectionByLink.forEach((_link, section) => spy.observe(section));
    }

    const toggle = $("#nav-toggle");
    const menu = $("#mobile-menu");
    if (toggle && menu) {
        function setMenu(open) {
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            menu.hidden = !open;
        }

        toggle.addEventListener("click", () => {
            setMenu(toggle.getAttribute("aria-expanded") !== "true");
        });

        $$(".mobile-link", menu).forEach((link) =>
            link.addEventListener("click", () => setMenu(false))
        );
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !menu.hidden) {
                setMenu(false);
                toggle.focus();
            }
        });
    }
})();

/* ==========================================================================
   4. Scroll reveal
   ========================================================================== */

(function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    const siblingIndex = new Map();
    items.forEach((item) => {
        const parent = item.parentElement;
        const index = siblingIndex.get(parent) ?? 0;
        item.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 60}ms`);
        siblingIndex.set(parent, index + 1);
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.01, rootMargin: "80px 0px 80px 0px" }
    );

    items.forEach((item) => observer.observe(item));

    // Failsafe timer: ensures every element becomes visible even if observer is bypassed
    setTimeout(() => {
        items.forEach((item) => item.classList.add("is-visible"));
    }, 350);
})();

/* ==========================================================================
   5. The Lab — Render projects & interactive cards
   ========================================================================== */

const ICONS = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
    vercel: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
};

let activeLabFilter = "all";

function renderLabFilters() {
    const filterContainer = $("#lab-filters");
    if (!filterContainer) return;

    const rawCategories = currentProjects.map((p) => p.category).filter(Boolean);
    const uniqueCategories = ["all", ...new Set(rawCategories)];

    filterContainer.innerHTML = uniqueCategories
        .map((cat) => {
            const label = cat === "all" ? "All Projects" : cat;
            const activeClass = cat.toLowerCase() === activeLabFilter.toLowerCase() ? " is-active" : "";
            return `<button type="button" class="filter-pill${activeClass}" data-filter="${escapeHTML(cat)}">${escapeHTML(label)}</button>`;
        })
        .join("");

    $$(".filter-pill", filterContainer).forEach((pill) => {
        pill.addEventListener("click", () => {
            activeLabFilter = pill.getAttribute("data-filter");
            renderLabFilters();
            renderLab();
        });
    });
}

function renderLab() {
    renderLabFilters();
    const grid = $("#lab-grid");
    if (!grid) return;

    const filteredProjects = activeLabFilter === "all"
        ? currentProjects
        : currentProjects.filter((p) => (p.category || "").toLowerCase() === activeLabFilter.toLowerCase());

    if (!filteredProjects.length) {
        grid.innerHTML = '<p class="noscript-note">No experiments found for this filter.</p>';
        return;
    }

    const isAdmin = Boolean(currentAdminUser);

    grid.innerHTML = filteredProjects
        .map((item, index) => {
            const statusColor =
                DEFAULT_CONFIG.STATUS_COLORS[String(item.status).toLowerCase()] ?? "#9ca3af";
            const accent = item.accent ? ` style="--lab-accent: ${escapeHTML(item.accent)}"` : "";

            // Tech stack tags
            let tagsHtml = "";
            if (Array.isArray(item.tags) && item.tags.length > 0) {
                tagsHtml = `<div class="lab-tags">${item.tags.map((t) => `<span class="lab-tag">${escapeHTML(t)}</span>`).join("")}</div>`;
            }

            // Badges & direct external links (GitHub, Vercel, Live, etc.)
            let linksHtml = "";
            if (item.github || item.vercel || item.customUrl) {
                linksHtml += '<div class="lab-links">';
                if (item.github) {
                    linksHtml += `<a href="${escapeHTML(item.github)}" target="_blank" rel="noopener noreferrer" class="project-link-badge project-link-github" title="View Source Code on GitHub">${ICONS.github} GitHub</a>`;
                }
                if (item.vercel) {
                    linksHtml += `<a href="${escapeHTML(item.vercel)}" target="_blank" rel="noopener noreferrer" class="project-link-badge project-link-vercel" title="Live Deployment on Vercel">${ICONS.vercel} Vercel</a>`;
                }
                if (item.customUrl) {
                    const customLabel = item.customTitle ? escapeHTML(item.customTitle) : "Live Link";
                    linksHtml += `<a href="${escapeHTML(item.customUrl)}" target="_blank" rel="noopener noreferrer" class="project-link-badge" title="${customLabel}">${ICONS.link} ${customLabel}</a>`;
                }
                linksHtml += "</div>";
            }

            const actualIndex = currentProjects.indexOf(item);
            const editButtonHtml = isAdmin
                ? `<button class="lab-edit-btn" data-index="${actualIndex}" title="Edit this project" aria-label="Edit project">${ICONS.edit}</button>`
                : "";

            // Bento Grid asymmetric layout classes
            let bentoClass = "bento-card-half";
            if (index === 0) bentoClass = "bento-card-featured";
            else if (index === 1) bentoClass = "bento-card-side";

            let pipelineHtml = "";

            return `
                <article class="lab-card bento-card spotlight-card ${bentoClass}"${accent}>
                    <div class="lab-meta">
                        <span class="lab-category">${escapeHTML(item.category || "Project")}</span>
                        <span class="lab-status">
                            <span class="lab-status-dot" style="--status-color: ${statusColor}"></span>
                            ${escapeHTML(item.status || "In progress")}
                        </span>
                    </div>
                    <div class="lab-card-header">
                        <h3 class="lab-title">${escapeHTML(item.title)}</h3>
                        ${editButtonHtml}
                    </div>
                    <p class="lab-description">${escapeHTML(item.description)}</p>
                    ${pipelineHtml}
                    ${tagsHtml}
                    ${linksHtml}
                </article>`;
        })
        .join("");

    $$(".lab-card", grid).forEach((card, index) => {
        card.setAttribute("data-reveal", "");
        card.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 60}ms`);
        card.classList.add("is-visible");
    });

    // Dynamic mouse spotlight tracking
    $$(".spotlight-card", grid).forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        });
    });

    // Wire up edit buttons
    $$(".lab-edit-btn", grid).forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute("data-index"), 10);
            openProjectModal(index);
        });
    });

    // Wire up architecture telemetry inspector
    initTelemetryInspector();
}

/* ==========================================================================
   6. ADMIN AUTHENTICATION & GOOGLE SIGN-IN
   ========================================================================== */

function updateAdminUI() {
    const adminBar = $("#admin-bar");
    const adminAuthBtn = $("#admin-auth-btn");
    const adminAuthBtnMobile = $("#admin-auth-btn-mobile");
    const adminEmailDisplay = $("#admin-email-display");

    if (currentAdminUser) {
        if (adminBar) adminBar.hidden = false;
        if (adminAuthBtn) {
            adminAuthBtn.textContent = "Admin Active";
            adminAuthBtn.classList.add("btn-active");
        }
        if (adminAuthBtnMobile) adminAuthBtnMobile.textContent = "Admin Active";
        if (adminEmailDisplay) adminEmailDisplay.textContent = currentAdminUser.email || "Authorized Admin";
    } else {
        if (adminBar) adminBar.hidden = true;
        if (adminAuthBtn) {
            adminAuthBtn.textContent = "Admin Login";
            adminAuthBtn.classList.remove("btn-active");
        }
        if (adminAuthBtnMobile) adminAuthBtnMobile.textContent = "Admin Login";
        if (adminEmailDisplay) adminEmailDisplay.textContent = "";
    }
    renderLab();
}

function handleGoogleCredentialResponse(response) {
    const errorEl = $("#auth-error");
    if (errorEl) errorEl.hidden = true;

    if (!response || !response.credential) {
        showAuthError("Google Sign-In failed. Please try again.");
        return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
        showAuthError("Could not retrieve profile information from Google account.");
        return;
    }

    const email = payload.email.toLowerCase().trim();

    // Check authorization: if allowedEmails is specified, verify membership.
    // If no emails are configured yet, the first signer is designated as admin or allowed to configure.
    if (allowedEmails.length > 0) {
        const isAllowed = allowedEmails.some((allowed) => allowed.toLowerCase().trim() === email);
        if (!isAllowed) {
            showAuthError(`Access denied. The Google account (${email}) is not in the authorized admin list.`);
            return;
        }
    } else {
        // Auto-allow first authenticated user and save as authorized
        allowedEmails = [email];
        saveAllowedEmails(allowedEmails);
    }

    // Success!
    currentAdminUser = {
        name: payload.name || payload.given_name || "Admin",
        email: email,
        picture: payload.picture || "",
    };

    try {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentAdminUser));
    } catch (e) {
        console.error("Failed to store auth session", e);
    }

    closeModal($("#auth-modal"));
    updateAdminUI();
}

function showAuthError(message) {
    const errorEl = $("#auth-error");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
    }
}

function initGoogleSignIn() {
    const container = $("#google-btn-container");
    if (!container) return;

    container.innerHTML = "";

    if (!googleClientId) {
        container.innerHTML = `
            <div style="text-align: center; width: 100%;">
                <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 12px;">
                    Google OAuth Client ID is not configured yet.
                </p>
                <button type="button" class="btn btn-sm btn-primary" id="open-config-from-auth">Configure Google Auth</button>
            </div>`;
        const cfgBtn = $("#open-config-from-auth");
        if (cfgBtn) {
            cfgBtn.addEventListener("click", () => {
                closeModal($("#auth-modal"));
                openAdminSettingsModal();
            });
        }
        return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
        });

        window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "pill",
            text: "signin_with",
            logo_alignment: "left",
            width: 280,
        });
    } else {
        container.innerHTML = `<p style="color: var(--muted); font-size: 0.85rem;">Loading Google Sign-In SDK...</p>`;
        setTimeout(initGoogleSignIn, 500);
    }
}

/* ==========================================================================
   7. MODAL DIALOG CONTROLS (PROJECT EDITOR, AUTH & CONFIG)
   ========================================================================== */

function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
}

// Project Modal (Add / Edit)
function openProjectModal(index = -1) {
    const modal = $("#project-modal");
    if (!modal) return;

    const titleEl = $("#project-modal-title");
    const eyebrowEl = $("#project-modal-eyebrow");
    const indexInput = $("#project-edit-index");
    const titleInput = $("#project-title");
    const categoryInput = $("#project-category");
    const statusSelect = $("#project-status");
    const accentInput = $("#project-accent");
    const descInput = $("#project-description");
    const githubInput = $("#project-github");
    const vercelInput = $("#project-vercel");
    const customTitleInput = $("#project-custom-title");
    const customUrlInput = $("#project-custom-url");
    const deleteBtn = $("#project-delete-btn");

    if (index >= 0 && currentProjects[index]) {
        const item = currentProjects[index];
        if (titleEl) titleEl.textContent = "Edit Project";
        if (eyebrowEl) eyebrowEl.textContent = "Update Existing Project";
        indexInput.value = index;
        titleInput.value = item.title || "";
        categoryInput.value = item.category || "";
        statusSelect.value = item.status || "In progress";
        accentInput.value = item.accent || "";
        descInput.value = item.description || "";
        githubInput.value = item.github || "";
        vercelInput.value = item.vercel || "";
        customTitleInput.value = item.customTitle || "";
        customUrlInput.value = item.customUrl || "";
        if (deleteBtn) deleteBtn.hidden = false;
    } else {
        if (titleEl) titleEl.textContent = "Add New Project";
        if (eyebrowEl) eyebrowEl.textContent = "New Portfolio Project";
        indexInput.value = -1;
        titleInput.value = "";
        categoryInput.value = "Artificial Intelligence";
        statusSelect.value = "In progress";
        accentInput.value = "";
        descInput.value = "";
        githubInput.value = "";
        vercelInput.value = "";
        customTitleInput.value = "";
        customUrlInput.value = "";
        if (deleteBtn) deleteBtn.hidden = true;
    }

    openModal(modal);
    setTimeout(() => titleInput.focus(), 50);
}

function openAdminSettingsModal() {
    const modal = $("#admin-settings-modal");
    if (!modal) return;

    const clientIdInput = $("#cfg-google-client-id");
    const allowedEmailsInput = $("#cfg-allowed-emails");

    if (clientIdInput) clientIdInput.value = googleClientId || "";
    if (allowedEmailsInput) allowedEmailsInput.value = allowedEmails.join(", ");

    openModal(modal);
}

// Global modal backdrop close & escape listener
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        $$(".modal-backdrop:not([hidden])").forEach((m) => closeModal(m));
    }
});

$$(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal(backdrop);
    });
});

/* ==========================================================================
   8. EVENT LISTENERS SETUP
   ========================================================================== */

(function initEvents() {
    // Auth buttons
    const authBtn = $("#admin-auth-btn");
    const authBtnMobile = $("#admin-auth-btn-mobile");
    const authModal = $("#auth-modal");
    const authModalClose = $("#auth-modal-close");

    const openAuth = () => {
        if (currentAdminUser) {
            // Already logged in, open settings or manage
            openAdminSettingsModal();
        } else {
            initGoogleSignIn();
            openModal(authModal);
        }
    };

    if (authBtn) authBtn.addEventListener("click", openAuth);
    if (authBtnMobile) authBtnMobile.addEventListener("click", openAuth);
    if (authModalClose) authModalClose.addEventListener("click", () => closeModal(authModal));

    // Admin bar actions
    const addProjectBtn = $("#add-project-btn");
    const adminSettingsBtn = $("#admin-settings-btn");
    const adminLogoutBtn = $("#admin-logout-btn");

    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", () => openProjectModal(-1));
    }
    if (adminSettingsBtn) {
        adminSettingsBtn.addEventListener("click", openAdminSettingsModal);
    }
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", () => {
            currentAdminUser = null;
            localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
            updateAdminUI();
        });
    }

    // Project modal form submit & delete
    const projectForm = $("#project-form");
    const projectModal = $("#project-modal");
    const projectModalClose = $("#project-modal-close");
    const projectCancelBtn = $("#project-cancel-btn");
    const projectDeleteBtn = $("#project-delete-btn");

    if (projectModalClose) projectModalClose.addEventListener("click", () => closeModal(projectModal));
    if (projectCancelBtn) projectCancelBtn.addEventListener("click", () => closeModal(projectModal));

    if (projectDeleteBtn) {
        projectDeleteBtn.addEventListener("click", () => {
            const index = parseInt($("#project-edit-index").value, 10);
            if (index >= 0 && index < currentProjects.length) {
                if (confirm(`Are you sure you want to delete "${currentProjects[index].title}"?`)) {
                    currentProjects.splice(index, 1);
                    saveProjects(currentProjects);
                    closeModal(projectModal);
                }
            }
        });
    }

    if (projectForm) {
        projectForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const index = parseInt($("#project-edit-index").value, 10);
            const projectData = {
                title: $("#project-title").value.trim(),
                category: $("#project-category").value.trim() || "Artificial Intelligence",
                status: $("#project-status").value,
                accent: $("#project-accent").value.trim(),
                description: $("#project-description").value.trim(),
                github: $("#project-github").value.trim(),
                vercel: $("#project-vercel").value.trim(),
                customTitle: $("#project-custom-title").value.trim(),
                customUrl: $("#project-custom-url").value.trim(),
            };

            if (index >= 0 && index < currentProjects.length) {
                currentProjects[index] = projectData;
            } else {
                currentProjects.unshift(projectData); // Add to top
            }

            saveProjects(currentProjects);
            closeModal(projectModal);
        });
    }

    // Admin settings form submit
    const adminSettingsForm = $("#admin-settings-form");
    const adminSettingsModal = $("#admin-settings-modal");
    const adminSettingsClose = $("#admin-settings-close");
    const adminSettingsCancel = $("#admin-settings-cancel");

    if (adminSettingsClose) adminSettingsClose.addEventListener("click", () => closeModal(adminSettingsModal));
    if (adminSettingsCancel) adminSettingsCancel.addEventListener("click", () => closeModal(adminSettingsModal));

    if (adminSettingsForm) {
        adminSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const clientId = $("#cfg-google-client-id").value.trim();
            const emailsRaw = $("#cfg-allowed-emails").value;

            googleClientId = clientId;
            localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, clientId);

            const emails = emailsRaw
                .split(",")
                .map((em) => em.trim().toLowerCase())
                .filter(Boolean);
            saveAllowedEmails(emails);

            closeModal(adminSettingsModal);
            alert("Configuration saved successfully.");
        });
    }

    // Export Config Button in Admin Settings
    const exportConfigBtn = $("#export-config-btn");
    const exportConfigText = $("#export-config-text");
    if (exportConfigBtn && exportConfigText) {
        exportConfigBtn.addEventListener("click", () => {
            const formatted = JSON.stringify(currentProjects, null, 4);
            exportConfigText.value = `experiments: ${formatted},`;
            exportConfigText.hidden = false;
            exportConfigText.select();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(exportConfigText.value).then(() => {
                    alert("Config copied to clipboard! Paste it into script.js DEFAULT_CONFIG.experiments and commit to deploy.");
                }).catch(() => {});
            }
        });
    }

    // Discreet Footer Admin Trigger & Keyboard Shortcut (Ctrl+Shift+A)
    const footerAdminLink = $("#footer-admin-link");
    if (footerAdminLink) {
        footerAdminLink.addEventListener("click", (e) => {
            e.preventDefault();
            openAuth();
        });
    }

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
            e.preventDefault();
            openAuth();
        }
    });

    // Copy Email Action in CTA
    const copyEmailBtn = $("#copy-email-btn");
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener("click", () => {
            const email = copyEmailBtn.getAttribute("data-email") || "khronosaion@gmail.com";
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    const originalHtml = copyEmailBtn.innerHTML;
                    copyEmailBtn.innerHTML = `<span>Copied: ${escapeHTML(email)}</span>`;
                    setTimeout(() => {
                        copyEmailBtn.innerHTML = originalHtml;
                    }, 2400);
                }).catch(() => {
                    window.location.href = `mailto:${email}`;
                });
            } else {
                window.location.href = `mailto:${email}`;
            }
        });
    }

    // Initial render
    updateAdminUI();
    renderLab();
})();

/* ==========================================================================
   9. Marquee
   ========================================================================== */

(function initMarquee() {
    const marquee = $("[data-marquee]");
    if (!marquee || prefersReducedMotion) return;

    const pause = () => marquee.classList.add("is-paused");
    const resume = () => marquee.classList.remove("is-paused");

    marquee.addEventListener("pointerenter", pause);
    marquee.addEventListener("pointerleave", resume);
    marquee.addEventListener("focusin", pause);
    marquee.addEventListener("focusout", resume);

    marquee.addEventListener(
        "touchstart",
        () => {
            marquee.classList.toggle("is-paused");
        },
        { passive: true }
    );
})();

/* ==========================================================================
   10. Cursor glow
   ========================================================================== */

(function initCursorGlow() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches || prefersReducedMotion) return;

    const glow = $("#cursor-glow");
    if (!glow) return;

    let rafId = null;

    window.addEventListener(
        "pointermove",
        (event) => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                glow.style.transform = `translate3d(${event.clientX - 210}px, ${
                    event.clientY - 210
                }px, 0)`;
                glow.style.opacity = "1";
                rafId = null;
            });
        },
        { passive: true }
    );

    document.addEventListener("pointerleave", () => {
        glow.style.opacity = "0";
    });
})();

/* ==========================================================================
   11. Interactive Constellation Canvas
   ========================================================================== */

(function initParticles() {
    const canvas = $("#particles-canvas");
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }, { passive: true });

    const particleCount = Math.min(Math.floor((width * height) / 18000), 60);
    const particles = [];
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981"];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.8 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener("pointermove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const lineOpacity = isDark ? 0.12 : 0.08;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const spd = window.__particleSpeed || 1;
            const pCol = window.__particleColor || p.color;
            p.x += p.vx * spd;
            p.y += p.vy * spd;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = pCol;
            ctx.globalAlpha = isDark ? 0.7 : 0.5;
            ctx.fill();

            // Connect neighboring particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = pCol;
                    ctx.globalAlpha = (1 - dist / 120) * lineOpacity;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            // Connect to mouse pointer
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 140) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = pCol;
                ctx.globalAlpha = (1 - mdist / 140) * (lineOpacity * 2.2);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    draw();
})();

/* ==========================================================================
   7. KINETIC BRAND ENGINE & INTERACTIVE HERO CONSOLE
   ========================================================================== */

(function initBespokeExperience() {
    // 1. Kinetic Brand Letters for "KhronosAion"
    const brandContainer = $("#hero-title");
    if (brandContainer) {
        const nameText = "Khronos Aion";
        brandContainer.classList.add("hero-brand");
        
        const lettersHtml = nameText
            .split("")
            .map((char, i) => {
                if (char === " ") {
                    return `<span class="brand-space" style="display:inline-block;width:0.35em;">&nbsp;</span>`;
                }
                const rot = ((i % 3) - 1) * 2;
                return `<span class="brand-char" style="--char-rot: ${rot}; --i: ${i};">${escapeHTML(char)}</span>`;
            })
            .join("");

        brandContainer.innerHTML = `<div class="hero-brand-aura" aria-hidden="true"></div>${lettersHtml}`;

        // Interactive wave on hover
        const chars = $$(".brand-char", brandContainer);
        chars.forEach((char, index) => {
            char.addEventListener("mouseenter", () => {
                char.style.transform = "translateY(-12px) scale(1.18)";
                if (chars[index - 1]) {
                    chars[index - 1].style.transform = "translateY(-5px) scale(1.06)";
                }
                if (chars[index + 1]) {
                    chars[index + 1].style.transform = "translateY(-5px) scale(1.06)";
                }
            });
            char.addEventListener("mouseleave", () => {
                setTimeout(() => {
                    char.style.transform = "";
                    if (chars[index - 1]) chars[index - 1].style.transform = "";
                    if (chars[index + 1]) chars[index + 1].style.transform = "";
                }, 120);
            });
        });
    }

    // 2. Rotating Hero Status Engine
    const statusTextEl = $("#hero-status-text");
    if (statusTextEl) {
        const statuses = [
            "Active Exploration: Autonomous Systems & Creative Tech",
            "Core Project: Interactive Web Tools Suite (tools-site)",
            "Personal Platform: Bespoke Portfolio & Code Runner",
            "Focus: Clean Code, Dependency-Free Utilities, Fast Web",
            "Guiding Principle: Curiosity > Traditional Roadmaps"
        ];
        let statusIndex = 0;
        setInterval(() => {
            statusIndex = (statusIndex + 1) % statuses.length;
            statusTextEl.style.opacity = "0";
            statusTextEl.style.transform = "translateY(-4px)";
            setTimeout(() => {
                statusTextEl.textContent = statuses[statusIndex];
                statusTextEl.style.opacity = "1";
                statusTextEl.style.transform = "translateY(0)";
            }, 250);
        }, 4200);
    }

    // 3. Interactive Hero Terminal Console
    const termBody = $("#term-output");
    const termTabs = $$(".term-tab");
    const termPills = $$(".term-quick-pill");

    const terminalTabsContent = {
        "system.sh": `
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> uname -a</div>
<div class="term-line"><span class="term-output">Linux aion-box 6.8.9-custom-rt #1 SMP PREEMPT_DYNAMIC x86_64</span></div>
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> ./check_status.sh</div>
<div class="term-line"><span class="term-success">● STACK ONLINE</span> &mdash; Node.js, PyTorch 2.4, JAX, Rust toolchain</div>
<div class="term-line"><span class="term-output">Memory Footprint: <span class="term-highlight">Private GPU + Edge Tensor Cores</span></span></div>
<div class="term-line"><span class="term-output">Core Philosophy: <span class="term-success">Zero telemetry &bull; Curiosity-driven &bull; Full-stack agency</span></span></div>
`,
        "tools-site.jsx": `
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> cd ~/projects/tools-site &amp;&amp; npm run build</div>
<div class="term-line"><span class="term-output">vite v5.4.2 building for production...</span></div>
<div class="term-line"><span class="term-success">✓</span> 34 modules transformed.</div>
<div class="term-line"><span class="term-highlight">dist/assets/index.js</span>  48.12 kB │ gzip: 14.80 kB</div>
<div class="term-line"><span class="term-success">✓ built in 118ms</span> &bull; <a href="https://github.com/Xiaon67/tools-site" target="_blank" style="color:#38bdf8;text-decoration:underline;">github.com/Xiaon67/tools-site</a></div>
`,
        "portfolio.js": `
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> git remote -v</div>
<div class="term-line"><span class="term-output">origin  https://github.com/Xiaon67/portfolio.git (fetch)</span></div>
<div class="term-line"><span class="term-output">origin  https://github.com/Xiaon67/portfolio.git (push)</span></div>
<div class="term-line"><span class="term-success">✓</span> Architecture: <span class="term-highlight">Vanilla JS &bull; Zero heavy frameworks &bull; Tactile WebAudio</span></div>
<div class="term-line"><span class="term-success">✓</span> Live Pages: <a href="https://xiaon67.github.io/portfolio/" target="_blank" style="color:#38bdf8;text-decoration:underline;">https://xiaon67.github.io/portfolio/</a></div>
`,
        "live-runner.js": `
<div class="term-line"><span class="term-highlight">// VISITOR LIVE CODE RUNNER — CHANGE SITE LOOKS IN REAL-TIME</span></div>
<div class="term-line"><span class="term-output">Execute built-in commands or raw JavaScript below to alter the DOM, CSS, &amp; theme!</span></div>
<div class="term-line"><span class="term-info">Preset Themes:</span> <span class="term-code-snippet">theme cyberpunk</span> &bull; <span class="term-code-snippet">theme matrix</span> &bull; <span class="term-code-snippet">theme synthwave</span> &bull; <span class="term-code-snippet">theme solar</span> &bull; <span class="term-code-snippet">theme monochrome</span> &bull; <span class="term-code-snippet">theme reset</span></div>
<div class="term-line"><span class="term-info">Custom Colors:</span> <span class="term-code-snippet">accent #00f0ff</span> &bull; <span class="term-code-snippet">accent #ff007f</span> &bull; <span class="term-code-snippet">accent gold</span></div>
<div class="term-line"><span class="term-info">Warp Particles:</span> <span class="term-code-snippet">speed 5</span> &bull; <span class="term-code-snippet">speed 1</span></div>
<div class="term-line"><span class="term-info">Typography:</span> <span class="term-code-snippet">font mono</span> &bull; <span class="term-code-snippet">font serif</span> &bull; <span class="term-code-snippet">font sans</span></div>
<div class="term-line"><span class="term-success">Direct JavaScript:</span> <span class="term-code-snippet">document.body.style.filter = "hue-rotate(90deg)"</span></div>
`
    };

    if (termBody && termTabs.length) {
        termTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                termTabs.forEach((t) => t.classList.remove("is-active"));
                tab.classList.add("is-active");
                const targetKey = tab.getAttribute("data-tab");
                if (terminalTabsContent[targetKey]) {
                    termBody.innerHTML = terminalTabsContent[targetKey];
                }
            });
        });
    }

    // Command history for up/down arrow recall
    const cmdHistory = [];
    let historyIndex = -1;

    function executeCommand(rawCmd) {
        if (!termBody) return;
        const cmd = String(rawCmd).trim();
        if (!cmd) return;

        cmdHistory.push(cmd);
        historyIndex = cmdHistory.length;

        // Print command prompt line
        termBody.insertAdjacentHTML(
            "beforeend",
            `<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> ${escapeHTML(cmd)}</div>`
        );

        const lower = cmd.toLowerCase();

        // 1. HELP
        if (lower === "help") {
            termBody.insertAdjacentHTML(
                "beforeend",
                `<div class="term-line"><span class="term-info">🤖 AGENT DEMO:</span> <span class="term-highlight">agent run</span> (simulates autonomous cognitive loop)</div>
<div class="term-line"><span class="term-info">⚡ THEMES:</span> <span class="term-highlight">theme cyberpunk</span>, <span class="term-highlight">theme matrix</span>, <span class="term-highlight">theme synthwave</span>, <span class="term-highlight">theme solar</span>, <span class="term-highlight">theme monochrome</span>, <span class="term-highlight">theme reset</span></div>
<div class="term-line"><span class="term-info">🎨 ACCENT:</span> <span class="term-highlight">accent #00f0ff</span>, <span class="term-highlight">accent #ff0055</span>, <span class="term-highlight">accent lime</span></div>
<div class="term-line"><span class="term-info">🚀 PARTICLES:</span> <span class="term-highlight">speed 5</span> (warp drive), <span class="term-highlight">speed 1</span> (default)</div>
<div class="term-line"><span class="term-info">🔤 FONTS:</span> <span class="term-highlight">font mono</span>, <span class="term-highlight">font serif</span>, <span class="term-highlight">font sans</span></div>
<div class="term-line"><span class="term-info">✨ GLOW:</span> <span class="term-highlight">glow max</span>, <span class="term-highlight">glow off</span></div>
<div class="term-line"><span class="term-info">🔊 AUDIO:</span> <span class="term-highlight">sound toggle</span>, <span class="term-highlight">sound on</span>, <span class="term-highlight">sound off</span></div>
<div class="term-line"><span class="term-info">📜 PRESETS:</span> <span class="term-highlight">sysinfo</span>, <span class="term-highlight">projects</span>, <span class="term-highlight">skills</span>, <span class="term-highlight">contact</span>, <span class="term-highlight">clear</span></div>
<div class="term-line"><span class="term-success">💻 CODE RUNNER:</span> Type raw JS, e.g. <span class="term-code-snippet">document.body.style.filter = "invert(1)"</span></div>`
            );
        }
        // 2. CLEAR
        else if (lower === "clear") {
            termBody.innerHTML = `<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> Console cleared. Ready for input.</div>`;
        }
        // 3. AGENT SIMULATION
        else if (lower === "agent" || lower.startsWith("agent ")) {
            termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-highlight">[AI-RUNNER]</span> Spawning autonomous cognitive loop...</div>`);
            SoundEngine.playClick();
            const reasoningSteps = [
                { text: "Ingesting multi-modal context (14.8k tokens/s, zero-copy DMA mapped)...", type: "term-output" },
                { text: "Selective state-space recurrence scan: O(1) state convergence verified across 1M tokens.", type: "term-info" },
                { text: "Monte-Carlo rollout planner: 12-hop tree search evaluated across 6 candidate paths.", type: "term-highlight" },
                { text: "Optimal route selected with 98.4% confidence score.", type: "term-success" },
                { text: "Sandbox tool dispatch: Formal proof generated & verified in 3.1ms. Solution synthesized.", type: "term-success" }
            ];
            let stepIdx = 0;
            const reasoningTimer = setInterval(() => {
                if (stepIdx < reasoningSteps.length) {
                    const s = reasoningSteps[stepIdx++];
                    termBody.insertAdjacentHTML("beforeend", `<div class="term-line">&bull; <span class="${s.type}">${escapeHTML(s.text)}</span></div>`);
                    termBody.scrollTop = termBody.scrollHeight;
                    SoundEngine.playClick();
                } else {
                    clearInterval(reasoningTimer);
                    termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> <span class="term-success">Task completed successfully.</span></div>`);
                    termBody.scrollTop = termBody.scrollHeight;
                    SoundEngine.playChime();
                }
            }, 360);
        }
        // 4. SOUND TOGGLE
        else if (lower.startsWith("sound")) {
            const isMutedNow = SoundEngine.toggleMute();
            termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Audio effects are now <strong>${isMutedNow ? "MUTED" : "ACTIVE"}</strong></div>`);
        }
        // 5. THEME
        else if (lower.startsWith("theme ") || lower === "matrix" || lower === "cyberpunk" || lower === "synthwave" || lower === "solar" || lower === "monochrome") {
            let tName = lower.startsWith("theme ") ? lower.replace("theme ", "").trim() : lower;
            if (tName === "reset" || tName === "default") {
                document.documentElement.removeAttribute("data-theme");
                document.documentElement.style.removeProperty("--grad-ai");
                document.documentElement.style.removeProperty("--grad-text");
                document.documentElement.style.removeProperty("--glow-color");
                document.body.style.fontFamily = "";
                document.body.style.filter = "";
                window.__particleSpeed = 1;
                window.__particleColor = null;
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Reset appearance to default look.</div>`);
            } else {
                document.documentElement.setAttribute("data-theme", tName);
                if (tName === "matrix") window.__particleColor = "#00ff66";
                else if (tName === "cyberpunk") window.__particleColor = "#00f0ff";
                else if (tName === "synthwave") window.__particleColor = "#ff71ce";
                else if (tName === "solar") window.__particleColor = "#f97316";
                else window.__particleColor = null;
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Theme morphed to <strong class="term-highlight">${escapeHTML(tName.toUpperCase())}</strong></div>`);
                SoundEngine.playChime();
            }
        }
        // 6. ACCENT
        else if (lower.startsWith("accent ")) {
            const color = cmd.substring(7).trim();
            document.documentElement.style.setProperty("--grad-ai", `linear-gradient(135deg, ${color} 0%, #a855f7 100%)`);
            document.documentElement.style.setProperty("--grad-text", `linear-gradient(135deg, ${color} 0%, #38bdf8 100%)`);
            window.__particleColor = color;
            termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Site accent gradient updated to <strong style="color:${escapeHTML(color)}">${escapeHTML(color)}</strong></div>`);
            SoundEngine.playChime();
        }
        // 7. SPEED
        else if (lower.startsWith("speed ")) {
            const factor = parseFloat(cmd.substring(6).trim()) || 1;
            window.__particleSpeed = factor;
            termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Warp drive velocity factor set to <strong>${factor}x</strong></div>`);
            SoundEngine.playChime();
        }
        // 8. FONT
        else if (lower.startsWith("font ")) {
            const f = lower.substring(5).trim();
            if (f === "mono") document.body.style.fontFamily = "'Fira Code', monospace";
            else if (f === "serif" || f === "cinzel") document.body.style.fontFamily = "'Cinzel', serif";
            else if (f === "sans") document.body.style.fontFamily = "'Inter', sans-serif";
            termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Active typography set to <strong>${escapeHTML(f)}</strong></div>`);
        }
        // 9. GLOW
        else if (lower.startsWith("glow ")) {
            const g = lower.substring(5).trim();
            if (g === "max" || g === "high") {
                document.documentElement.style.setProperty("--glow-color", "rgba(0, 240, 255, 0.75)");
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Ambient glow intensity boosted to 200%.</div>`);
            } else {
                document.documentElement.style.setProperty("--glow-color", "transparent");
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">✓</span> Ambient glow muted.</div>`);
            }
        }
        // 8. BUILT-IN INFO TABS
        else if (lower === "sysinfo") {
            termBody.insertAdjacentHTML("beforeend", terminalTabsContent["system.sh"]);
        } else if (lower === "projects") {
            termBody.insertAdjacentHTML("beforeend", `
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> ls -la ./projects</div>
<div class="term-line"><span class="term-success">drwxr-xr-x</span>  <a href="https://github.com/Xiaon67/tools-site" target="_blank" class="term-highlight" style="text-decoration:underline;">tools-site/</a> (Developer productivity utility suite)</div>
<div class="term-line"><span class="term-success">drwxr-xr-x</span>  <a href="https://github.com/Xiaon67/portfolio" target="_blank" class="term-highlight" style="text-decoration:underline;">portfolio/</a> (Bespoke terminal portfolio engine)</div>`);
        } else if (lower === "skills") {
            termBody.insertAdjacentHTML("beforeend", `
<div class="term-line"><span class="term-prompt">khronos@aion:~$</span> cat ~/.capabilities</div>
<div class="term-line"><span class="term-output">AI: <span class="term-success">PyTorch, JAX, LLMs, RAG, Multi-Agent Systems, Agents</span></span></div>
<div class="term-line"><span class="term-output">Engineering: <span class="term-highlight">Python, Rust, C++, Linux, Docker, Modern JS</span></span></div>`);
        } else if (lower === "contact") {
            termBody.insertAdjacentHTML("beforeend", `
<div class="term-line"><span class="term-success">khronos@enthusiast.dev</span> &mdash; Open to research discussions and collaborations.</div>
<div class="term-line"><span class="term-output">GitHub: <a href="https://github.com/Xiaon67" target="_blank" style="color:#38bdf8;text-decoration:underline;">https://github.com/Xiaon67</a></span></div>`);
        }
        // 9. RAW JAVASCRIPT CODE RUNNER!
        else {
            try {
                const evalRes = window.eval(cmd);
                let display = evalRes;
                if (typeof evalRes === "object" && evalRes !== null) {
                    display = JSON.stringify(evalRes);
                } else if (evalRes === undefined) {
                    display = "undefined (executed successfully)";
                }
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-success">=&gt;</span> <span class="term-output">${escapeHTML(String(display))}</span></div>`);
            } catch (err) {
                termBody.insertAdjacentHTML("beforeend", `<div class="term-line"><span class="term-error">&#9888; Eval Error:</span> <span class="term-output">${escapeHTML(err.message)}</span></div>`);
            }
        }

        termBody.scrollTop = termBody.scrollHeight;
    }

    // Expose global helper methods for visitors typing JS
    window.setTheme = (name) => executeCommand(`theme ${name}`);
    window.setAccent = (color) => executeCommand(`accent ${color}`);
    window.setSpeed = (factor) => executeCommand(`speed ${factor}`);
    window.resetTheme = () => executeCommand("theme reset");
    window.runAgent = () => executeCommand("agent run");

    // Wire up code runner input form
    const termForm = $("#term-form");
    const termInput = $("#term-input");
    if (termForm && termInput) {
        termForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const val = termInput.value.trim();
            if (val) {
                executeCommand(val);
                termInput.value = "";
            }
        });

        // Shell command history with Up/Down arrow keys
        termInput.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                if (cmdHistory.length > 0 && historyIndex > 0) {
                    historyIndex--;
                    termInput.value = cmdHistory[historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                if (historyIndex < cmdHistory.length - 1) {
                    historyIndex++;
                    termInput.value = cmdHistory[historyIndex];
                } else {
                    historyIndex = cmdHistory.length;
                    termInput.value = "";
                }
            }
        });
    }

    // Wire up preset quick pills
    if (termPills.length) {
        termPills.forEach((pill) => {
            pill.addEventListener("click", () => {
                const cmd = pill.getAttribute("data-cmd");
                if (cmd) executeCommand(cmd);
            });
        });
    }

    // 4. Spotlight physics on all interactive cards
    $$(".skill-card, .research-card, .card, .bento-card").forEach((card) => {
        card.classList.add("spotlight-card");
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        });
    });
})();

/* ==========================================================================
   8. TACTILE WEB AUDIO SYNTHESIZER (ZERO ASSETS)
   ========================================================================== */

const SoundEngine = (function() {
    let audioCtx = null;
    let isMuted = localStorage.getItem("khronos_sound_muted") !== "false";

    function getCtx() {
        if (!audioCtx && typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playClick() {
        if (isMuted) return;
        const ctx = getCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(320, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.02);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.02);
        } catch (e) {}
    }

    function playChime() {
        if (isMuted) return;
        const ctx = getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                gain.gain.setValueAtTime(0.06, now + idx * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.04);
                osc.stop(now + idx * 0.04 + 0.18);
            });
        } catch (e) {}
    }

    function playWhoosh() {
        if (isMuted) return;
        const ctx = getCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(140, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem("khronos_sound_muted", isMuted ? "true" : "false");
        updateSoundUI();
        if (!isMuted) playChime();
        return !isMuted;
    }

    function updateSoundUI() {
        const btn = $("#sound-toggle-btn");
        if (!btn) return;
        btn.setAttribute("aria-label", isMuted ? "Unmute sound effects" : "Mute sound effects");
        btn.innerHTML = isMuted
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    }

    return { getCtx, playClick, playChime, playWhoosh, toggleMute, isMuted: () => isMuted, updateSoundUI };
})();

/* ==========================================================================
   9. COMMAND PALETTE (CMD+K / CTRL+K) ENGINE
   ========================================================================== */

(function initCommandPalette() {
    const overlay = $("#cmdk-overlay");
    const searchInput = $("#cmdk-search");
    const itemsList = $("#cmdk-items-list");
    const triggerBtn = $("#cmdk-trigger-btn");
    const soundBtn = $("#sound-toggle-btn");

    if (soundBtn) {
        soundBtn.addEventListener("click", () => SoundEngine.toggleMute());
        SoundEngine.updateSoundUI();
    }

    if (!overlay || !searchInput || !itemsList) return;

    let selectedIndex = 0;

    const paletteActions = [
        // Navigation
        { title: "Go to Hero & Terminal", group: "Navigation", tag: "#hero", icon: "arrow", action: () => scrollToSection("#hero") },
        { title: "Go to Introduction", group: "Navigation", tag: "#introduction", icon: "arrow", action: () => scrollToSection("#introduction") },
        { title: "Go to Technical Skills", group: "Navigation", tag: "#skills", icon: "arrow", action: () => scrollToSection("#skills") },
        { title: "Go to Journey", group: "Navigation", tag: "#journey", icon: "arrow", action: () => scrollToSection("#journey") },
        { title: "Go to The Lab & Projects", group: "Navigation", tag: "#lab", icon: "arrow", action: () => scrollToSection("#lab") },
        { title: "Go to Research Areas", group: "Navigation", tag: "#research", icon: "arrow", action: () => scrollToSection("#research") },
        { title: "Go to Philosophy", group: "Navigation", tag: "#philosophy", icon: "arrow", action: () => scrollToSection("#philosophy") },
        { title: "Go to Contact", group: "Navigation", tag: "#contact", icon: "arrow", action: () => scrollToSection("#contact") },

        // Themes
        { title: "Theme: Cyberpunk Neon", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.setTheme("cyberpunk"); SoundEngine.playChime(); } },
        { title: "Theme: Matrix Phosphor Green", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.setTheme("matrix"); SoundEngine.playChime(); } },
        { title: "Theme: Synthwave 80s", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.setTheme("synthwave"); SoundEngine.playChime(); } },
        { title: "Theme: Solar Ember", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.setTheme("solar"); SoundEngine.playChime(); } },
        { title: "Theme: Monochrome Minimalist", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.setTheme("monochrome"); SoundEngine.playChime(); } },
        { title: "Theme: Reset to Default", group: "Themes", tag: "theme", icon: "sparkle", action: () => { window.resetTheme(); SoundEngine.playChime(); } },

        // Quick Actions
        { title: "Copy Email (khronos@enthusiast.dev)", group: "Actions", tag: "clipboard", icon: "copy", action: () => {
            navigator.clipboard.writeText("khronos@enthusiast.dev");
            SoundEngine.playChime();
            alert("Copied khronos@enthusiast.dev to clipboard!");
        }},
        { title: "Open GitHub Profile (Xiaon67)", group: "Actions", tag: "external", icon: "github", action: () => window.open("https://github.com/Xiaon67", "_blank") },
        { title: "Warp Constellations (5x Speed)", group: "Actions", tag: "particles", icon: "zap", action: () => { window.setSpeed(5); SoundEngine.playChime(); } },
        { title: "Toggle Tactile Audio Effects", group: "Actions", tag: "sound", icon: "sound", action: () => SoundEngine.toggleMute() }
    ];

    let filtered = [...paletteActions];

    function scrollToSection(selector) {
        const el = $(selector);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    }

    function renderList() {
        if (!filtered.length) {
            itemsList.innerHTML = `<div style="padding:16px;text-align:center;color:var(--muted);font-size:0.85rem;">No matching commands found.</div>`;
            return;
        }

        let currentGroup = "";
        let html = "";
        filtered.forEach((item, index) => {
            if (item.group !== currentGroup) {
                currentGroup = item.group;
                html += `<div class="cmdk-group-title">${escapeHTML(currentGroup)}</div>`;
            }
            const isSel = index === selectedIndex ? " is-selected" : "";
            html += `
                <div class="cmdk-item${isSel}" data-index="${index}">
                    <div class="cmdk-item-left">
                        <svg class="cmdk-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>
                        <span>${escapeHTML(item.title)}</span>
                    </div>
                    <span class="cmdk-item-tag">${escapeHTML(item.tag)}</span>
                </div>`;
        });
        itemsList.innerHTML = html;

        $$(".cmdk-item", itemsList).forEach((el) => {
            el.addEventListener("mouseenter", () => {
                const idx = parseInt(el.getAttribute("data-index"), 10);
                selectedIndex = idx;
                updateSelectedClass();
                SoundEngine.playClick();
            });
            el.addEventListener("click", () => {
                const idx = parseInt(el.getAttribute("data-index"), 10);
                if (filtered[idx]) {
                    closePalette();
                    filtered[idx].action();
                }
            });
        });
    }

    function updateSelectedClass() {
        $$(".cmdk-item", itemsList).forEach((el) => {
            const idx = parseInt(el.getAttribute("data-index"), 10);
            el.classList.toggle("is-selected", idx === selectedIndex);
        });
    }

    function openPalette() {
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        searchInput.value = "";
        filtered = [...paletteActions];
        selectedIndex = 0;
        renderList();
        SoundEngine.playWhoosh();
        setTimeout(() => searchInput.focus(), 60);
    }

    function closePalette() {
        overlay.classList.remove("is-open");
        overlay.setAttribute("aria-hidden", "true");
        SoundEngine.playWhoosh();
    }

    if (triggerBtn) {
        triggerBtn.addEventListener("click", openPalette);
    }

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closePalette();
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase().trim();
        filtered = paletteActions.filter((item) =>
            item.title.toLowerCase().includes(query) ||
            item.group.toLowerCase().includes(query) ||
            item.tag.toLowerCase().includes(query)
        );
        selectedIndex = 0;
        renderList();
        SoundEngine.playClick();
    });

    // Keyboard navigation
    window.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (overlay.classList.contains("is-open")) closePalette();
            else openPalette();
            return;
        }

        if (!overlay.classList.contains("is-open")) return;

        if (e.key === "Escape") {
            e.preventDefault();
            closePalette();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIndex = (selectedIndex + 1) % filtered.length;
                updateSelectedClass();
                SoundEngine.playClick();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (filtered.length > 0) {
                selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
                updateSelectedClass();
                SoundEngine.playClick();
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                const action = filtered[selectedIndex].action;
                closePalette();
                action();
            }
        }
    });

    const termInputEl = $("#term-input");
    if (termInputEl) {
        termInputEl.addEventListener("keydown", () => SoundEngine.playClick());
    }
})();



/* ==========================================================================
   11. AGENT ARCHITECTURE TELEMETRY INSPECTOR
   ========================================================================== */

function initTelemetryInspector() {
    const steps = $$(".bento-step");
    const drawer = $("#telemetry-drawer");
    if (!steps.length || !drawer) return;

    const stepTelemetry = {
        "percept stream": {
            title: "Multi-Modal Percept Ingestion Stream",
            metrics: ["Throughput: 14.8k tok/s", "Latency: 0.9ms", "Buffer: Zero-copy DMA"],
            code: `{ "stream_id": "tok_99182", "modality": "interleaved_multimodal", "entropy": 0.412, "state": "streaming" }`
        },
        "state-space filter": {
            title: "Mamba / SSM Selective Scan Layer",
            metrics: ["Recurrence: O(1) Constant", "Decay λ: 0.985", "Context Horizon: 1,000,000+"],
            code: `SSMHiddenState {\n  dim: 4096,\n  d_state: 64,\n  kernel: "selective_scan_cuda",\n  active_mem_mb: 18.4\n}`
        },
        "latent planner": {
            title: "Recursive Monte-Carlo Rollout Planner",
            metrics: ["Tree Depth: 12-hop", "Search Policy: UCB1 Heuristic", "Confidence: 97.4%"],
            code: `PlanTree {\n  candidates: 6,\n  best_route: ["hypothesis_test", "sandbox_eval", "synthesis"],\n  pruned_nodes: 34\n}`
        },
        "tool synthesis": {
            title: "Autonomous Dynamic Tool Sandbox Dispatch",
            metrics: ["Sandbox: gVisor Isolated", "Exec Time: 3.2ms", "Verification: Passed"],
            code: `DispatchResult {\n  sandbox: "sandbox-0",\n  exit_code: 0,\n  stdout: "Verified formal proof & synthesized response."\n}`
        }
    };

    steps.forEach((step) => {
        step.classList.add("is-clickable");
        step.setAttribute("title", "Click to inspect node telemetry");
        step.onclick = () => {
            const rawKey = step.textContent.trim().toLowerCase();
            const data = stepTelemetry[rawKey] || {
                title: step.textContent.trim(),
                metrics: ["Latency: 4.1ms", "Telemetry: Clean", "Status: Active"],
                code: `{ "node": "${escapeHTML(step.textContent.trim())}", "state": "operational" }`
            };

            steps.forEach((s) => s.classList.remove("is-active"));
            step.classList.add("is-active");

            const chipsHtml = data.metrics.map((m) => `<span class="telemetry-stat-chip">${escapeHTML(m)}</span>`).join("");
            drawer.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="color:#38bdf8;font-weight:600;">Node Telemetry: ${escapeHTML(data.title)}</span>
                    <button id="close-telemetry" style="color:var(--muted);font-size:0.75rem;cursor:pointer;">✕ close</button>
                </div>
                <div class="telemetry-stat-chips">${chipsHtml}</div>
                <pre style="background:rgba(0,0,0,0.3);padding:8px 10px;border-radius:6px;overflow-x:auto;color:#a5b4fc;font-size:0.72rem;"><code>${escapeHTML(data.code)}</code></pre>
            `;
            drawer.classList.add("is-open");
            SoundEngine.playClick();

            const closeBtn = $("#close-telemetry");
            if (closeBtn) {
                closeBtn.onclick = () => {
                    drawer.classList.remove("is-open");
                    steps.forEach((s) => s.classList.remove("is-active"));
                    SoundEngine.playClick();
                };
            }
        };
    });
}

initTelemetryInspector();
