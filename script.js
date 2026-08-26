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
     * and direct links (github, vercel, customLink, etc.).
     */
    experiments: [
        {
            title: "KAT-Coder CLI",
            description:
                "Local AI coding agent and developer workflow engine running entirely on private hardware.",
            category: "Local AI",
            status: "In progress",
            accent: "#4a7dff",
            github: "https://github.com",
            vercel: "https://vercel.com",
        },
        {
            title: "Autonomous Agent Orchestrator",
            description:
                "Exploring hierarchical task decomposition and long-horizon multi-step reasoning.",
            category: "Artificial Intelligence",
            status: "Experiment",
            accent: "#8b5cf6",
            github: "https://github.com",
        },
        {
            title: "Generative Interface Playground",
            description:
                "Dynamically generating reactive UI components based on real-time agent output.",
            category: "Creative Coding",
            status: "Exploring",
            accent: "#10b981",
            vercel: "https://vercel.com",
        },
        {
            title: "Vector Memory & Retrieval Index",
            description:
                "Lightweight embedding store and hybrid search pipeline for personalized context recall.",
            category: "Research",
            status: "Early stage",
            accent: "#f59e0b",
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
    PROJECTS: "khronosaion_projects_v2",
    AUTH_USER: "khronosaion_auth_user",
    GOOGLE_CLIENT_ID: "khronosaion_google_client_id",
    ALLOWED_EMAILS: "khronosaion_allowed_emails",
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
            const target = $(link.getAttribute("href"));
            if (target) sectionByLink.set(target, link);
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
})();

/* ==========================================================================
   4. Scroll reveal
   ========================================================================== */

(function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length || !("IntersectionObserver" in window)) return;

    const siblingIndex = new Map();
    items.forEach((item) => {
        const parent = item.parentElement;
        const index = siblingIndex.get(parent) ?? 0;
        item.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 90}ms`);
        siblingIndex.set(parent, index + 1);
    });

    if (prefersReducedMotion) {
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
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((item) => observer.observe(item));
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

function renderLab() {
    const grid = $("#lab-grid");
    if (!grid) return;

    if (!currentProjects.length) {
        grid.innerHTML = '<p class="noscript-note">No projects added yet. Admin can add projects via the admin panel above.</p>';
        return;
    }

    const isAdmin = Boolean(currentAdminUser);

    grid.innerHTML = currentProjects
        .map((item, index) => {
            const statusColor =
                DEFAULT_CONFIG.STATUS_COLORS[String(item.status).toLowerCase()] ?? "#9ca3af";
            const accent = item.accent ? ` style="--lab-accent: ${escapeHTML(item.accent)}"` : "";

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

            const editButtonHtml = isAdmin
                ? `<button class="lab-edit-btn" data-index="${index}" title="Edit this project" aria-label="Edit project">${ICONS.edit}</button>`
                : "";

            return `
                <article class="lab-card"${accent}>
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
                    ${linksHtml}
                </article>`;
        })
        .join("");

    $$(".lab-card", grid).forEach((card, index) => {
        card.setAttribute("data-reveal", "");
        card.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 70}ms`);
        card.classList.add("is-visible");
    });

    // Wire up edit buttons
    $$(".lab-edit-btn", grid).forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const index = parseInt(btn.getAttribute("data-index"), 10);
            openProjectModal(index);
        });
    });
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

    // Initial render
    updateAdminUI();
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
