// === State Management ===
var state = {
    currentView: 'sessions',
    sessions: [],
    currentSession: null,
    brain: {},
    vault: [],
    currentVault: null,
    quests: [],
    status: {},
    skills: [],
    searchQuery: '',
    searchResults: [],
    pollInterval: 5000,
    preferences: {
        theme: 'dark',
        layout: 'list',
        pollInterval: 5000
    }
};

// === Utility Functions ===
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function truncate(str, len) {
    if (!str || str.length <= len) return str || '';
    return str.substring(0, len) + '...';
}

function formatDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    return d.toLocaleString();
}

function formatDuration(seconds) {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
}

// === API Helper ===
async function api(path, method, body) {
    try {
        var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        var res = await fetch(path, opts);
        if (!res.ok) {
            var errorText = await res.text();
            throw new Error('API error ' + res.status + ': ' + errorText);
        }
        var contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await res.json();
        }
        return { raw: await res.text() };
    } catch (e) {
        console.error('API error:', path, e);
        throw e;
    }
}

// === Rendering Functions ===
function renderContent(html) {
    var content = document.getElementById('content');
    if (content) {
        content.innerHTML = html;
    }
}

function renderLoading() {
    renderContent('<div class="loading"><div class="loading-text">Loading...</div></div>');
}

function renderError(message, title) {
    renderContent(
        '<div class="error">' +
        '<div class="error-icon">⚠️</div>' +
        '<div class="error-title">' + (title || 'Error') + '</div>' +
        '<div class="error-message">' + message + '</div>' +
        '<button class="error-retry" onclick="location.reload()">Retry</button>' +
        '</div>'
    );
}

function renderEmpty(message, title) {
    renderContent(
        '<div class="empty">' +
        '<div class="empty-icon">📭</div>' +
        '<div class="empty-title">' + (title || 'Nothing here') + '</div>' +
        '<div class="empty-message">' + message + '</div>' +
        '</div>'
    );
}

function renderSessions() {
    var html = '<div class="session-list">';
    if (state.sessions.length === 0) {
        html += '<div class="loading">No sessions found</div>';
    } else {
        state.sessions.forEach(function(s) {
            html += '<div class="session-card" data-id="' + s.id + '">' +
                '<div class="session-title">' + escapeHtml(s.title || 'Untitled') + '</div>' +
                '<div class="session-meta">' +
                    '<span>' + escapeHtml(s.cwd || '') + '</span>' +
                    '<span>' + formatDate(s.timestamp) + '</span>' +
                    '<span>' + s.messageCount + ' messages</span>' +
                '</div>' +
                (s.preview ? '<div class="session-preview">' + escapeHtml(s.preview) + '</div>' : '') +
            '</div>';
        });
    }
    html += '</div>';
    renderContent(html);

    // Add click handlers
    document.querySelectorAll('.session-card').forEach(function(card) {
        card.addEventListener('click', function() {
            loadSessionDetail(card.dataset.id);
        });
    });
}

function renderSessionDetail(session) {
    var html = '<div class="session-detail">' +
        '<div class="detail-header">' +
            '<h2>' + escapeHtml(session.header?.id || 'Session') + '</h2>' +
            '<div class="detail-meta">' +
                '<span>Model: ' + escapeHtml(session.header?.modelId || '-') + '</span>' +
                '<span>Provider: ' + escapeHtml(session.header?.provider || '-') + '</span>' +
                '<span>Duration: ' + escapeHtml(session.duration || '-') + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="message-list">';

    if (session.messages && session.messages.length > 0) {
        session.messages.forEach(function(msg) {
            html += '<div class="message">' +
                '<div class="message-header">' +
                    '<span class="message-role ' + msg.role + '">' + msg.role + '</span>' +
                    '<span class="message-time">' + formatDate(msg.timestamp) + '</span>' +
                '</div>' +
                '<div class="message-content">';

            if (msg.content) {
                html += '<pre>' + escapeHtml(msg.content) + '</pre>';
            }

            if (msg.toolCalls && msg.toolCalls.length > 0) {
                msg.toolCalls.forEach(function(tc) {
                    html += '<div class="tool-call">' +
                        '<div class="tool-call-header">' +
                            '<span class="tool-call-name">' + escapeHtml(tc.name) + '</span>' +
                            '<span class="tool-call-status ' + (tc.isError ? 'error' : 'success') + '">' +
                                (tc.isError ? 'Error' : 'Success') +
                            '</span>' +
                        '</div>' +
                        '<div class="tool-call-body">' +
                            'Args: ' + escapeHtml(JSON.stringify(tc.arguments || {})) +
                            (tc.result ? '<br>Result: ' + escapeHtml(JSON.stringify(tc.result)) : '') +
                        '</div>' +
                    '</div>';
                });
            }

            html += '</div></div>';
        });
    } else {
        html += '<div class="loading">No messages</div>';
    }

    html += '</div></div>';
    renderContent(html);
}

function renderBrain() {
    var html = '';
    var types = ['learning', 'behavior', 'preference', 'identity', 'user', 'context', 'task', 'reminder'];
    types.forEach(function(type) {
        var entries = state.brain[type] || [];
        if (entries.length > 0) {
            html += '<div class="brain-section">' +
                '<div class="brain-section-header">' +
                    '<span>' + type.charAt(0).toUpperCase() + type.slice(1) + '</span>' +
                    '<span class="brain-count">' + entries.length + '</span>' +
                '</div>';
            entries.forEach(function(e) {
                html += '<div class="brain-entry">' +
                    '<div class="entry-type">' + escapeHtml(e.type) + '</div>' +
                    '<div class="entry-text">' + escapeHtml(e.text) + '</div>' +
                    '<div class="entry-meta">Created: ' + formatDate(e.created) + '</div>' +
                '</div>';
            });
            html += '</div>';
        }
    });
    if (!html) {
        html = '<div class="loading">No brain entries</div>';
    }
    renderContent(html);
}

function renderVault() {
    var html = '<div class="vault-list">';
    if (state.vault.length === 0) {
        html += '<div class="loading">No vault notes</div>';
    } else {
        state.vault.forEach(function(v) {
            html += '<div class="vault-card" data-slug="' + v.slug + '">' +
                '<div class="vault-title">' + escapeHtml(v.name) + '</div>' +
                '<div class="vault-meta">' +
                    '<span class="vault-type-badge">' + escapeHtml(v.type) + '</span>' +
                    '<span>' + formatDate(v.created) + '</span>' +
                '</div>' +
            '</div>';
        });
    }
    html += '</div>';
    renderContent(html);

    document.querySelectorAll('.vault-card').forEach(function(card) {
        card.addEventListener('click', function() {
            loadVaultNote(card.dataset.slug);
        });
    });
}

function renderVaultNote(note) {
    var html = '<div class="session-detail">' +
        '<div class="detail-header">' +
            '<h2>' + escapeHtml(note.name) + '</h2>' +
            '<div class="detail-meta">' +
                '<span>Type: ' + escapeHtml(note.type) + '</span>' +
                '<span>Slug: ' + escapeHtml(note.slug) + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="message-content">' +
            '<pre>' + escapeHtml(note.content) + '</pre>' +
        '</div>' +
    '</div>';
    renderContent(html);
}

function renderQuests() {
    var html = '<div class="quest-list">';
    if (state.quests.length === 0) {
        html += '<div class="loading">No quests</div>';
    } else {
        state.quests.forEach(function(q) {
            html += '<div class="quest-card ' + (q.status === 'done' ? 'completed' : '') + '">' +
                '<div>' +
                    '<div class="quest-description">' + escapeHtml(q.description) + '</div>' +
                    '<div class="quest-status ' + q.status + '">' + q.status + '</div>' +
                '</div>' +
                (q.status !== 'done' ? '<button class="quest-btn" data-id="' + q.id + '">Complete</button>' : '') +
            '</div>';
        });
    }
    html += '</div>';
    renderContent(html);

    document.querySelectorAll('.quest-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            completeQuest(btn.dataset.id);
        });
    });
}

function renderSkills() {
    var html = '<div class="skill-list">';
    if (state.skills.length === 0) {
        html += '<div class="loading">No skills</div>';
    } else {
        state.skills.forEach(function(s) {
            html += '<div class="skill-card">' +
                '<div class="skill-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="skill-desc">' + escapeHtml(s.description || '') + '</div>' +
                '<button class="skill-btn" data-name="' + s.name + '">Trigger</button>' +
            '</div>';
        });
    }
    html += '</div>';
    renderContent(html);

    document.querySelectorAll('.skill-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            triggerSkill(btn.dataset.name);
        });
    });
}

function renderConfig() {
    var html = '<div class="config-list">';
    var config = state.status || {};
    Object.keys(config).forEach(function(key) {
        html += '<div class="config-item">' +
            '<span class="config-key">' + escapeHtml(key) + '</span>' +
            '<span class="config-value">' + escapeHtml(String(config[key])) + '</span>' +
        '</div>';
    });
    html += '</div>';
    renderContent(html);
}

function renderSearchResults(results) {
    var html = '<div class="session-list">';
    if (results.length === 0) {
        html += '<div class="loading">No results found</div>';
    } else {
        results.forEach(function(r) {
            html += '<div class="session-card" data-type="' + r.type + '" data-id="' + r.id + '">' +
                '<div class="session-title">' + escapeHtml(r.title || 'Untitled') + '</div>' +
                '<div class="session-meta">' +
                    '<span>' + r.type + '</span>' +
                    '<span>' + formatDate(r.timestamp) + '</span>' +
                '</div>' +
                (r.snippet ? '<div class="session-preview">' + escapeHtml(r.snippet) + '</div>' : '') +
            '</div>';
        });
    }
    html += '</div>';
    renderContent(html);

    document.querySelectorAll('.session-card').forEach(function(card) {
        card.addEventListener('click', function() {
            if (card.dataset.type === 'session') {
                loadSessionDetail(card.dataset.id);
            }
        });
    });
}

// === API Calls ===
async function loadSessions() {
    try {
        var data = await api('/api/sessions');
        state.sessions = data.sessions || [];
        if (state.currentView === 'sessions') {
            renderSessions();
        }
    } catch (e) {
        console.error('Failed to load sessions:', e);
        if (state.currentView === 'sessions') {
            renderError('Failed to load sessions: ' + e.message, 'Session Load Error');
        }
    }
}

async function loadSessionDetail(id) {
    renderLoading();
    try {
        var data = await api('/api/sessions/' + id);
        state.currentSession = data;
        renderSessionDetail(data);
    } catch (e) {
        console.error('Failed to load session:', e);
        renderError('Failed to load session: ' + e.message, 'Session Detail Error');
    }
}

async function loadBrain() {
    try {
        var data = await api('/api/brain');
        state.brain = data;
        if (state.currentView === 'brain') {
            renderBrain();
        }
    } catch (e) {
        console.error('Failed to load brain:', e);
        if (state.currentView === 'brain') {
            renderError('Failed to load brain: ' + e.message, 'Brain Load Error');
        }
    }
}

async function loadVault() {
    try {
        var data = await api('/api/vault');
        state.vault = data.notes || [];
        if (state.currentView === 'vault') {
            renderVault();
        }
    } catch (e) {
        console.error('Failed to load vault:', e);
        if (state.currentView === 'vault') {
            renderError('Failed to load vault: ' + e.message, 'Vault Load Error');
        }
    }
}

async function loadVaultNote(slug) {
    renderLoading();
    try {
        var data = await api('/api/vault/' + slug);
        state.currentVault = data.note;
        renderVaultNote(data.note);
    } catch (e) {
        console.error('Failed to load vault note:', e);
        renderError('Failed to load vault note: ' + e.message, 'Vault Note Error');
    }
}

async function loadQuests() {
    try {
        var data = await api('/api/quests');
        state.quests = data.quests || [];
        if (state.currentView === 'quests') {
            renderQuests();
        }
    } catch (e) {
        console.error('Failed to load quests:', e);
        if (state.currentView === 'quests') {
            renderError('Failed to load quests: ' + e.message, 'Quest Load Error');
        }
    }
}

async function loadStatus() {
    try {
        var data = await api('/api/status');
        state.status = data;
        // Update header
        var badge = document.getElementById('model-badge');
        if (badge) {
            badge.textContent = 'Model: ' + (data.model || '-');
        }
        var elapsed = document.getElementById('elapsed-time');
        if (elapsed) {
            elapsed.textContent = '⏱️ ' + formatDuration(data.uptime || 0);
        }
        var lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        }
    } catch (e) {
        console.error('Failed to load status:', e);
        var statusDot = document.getElementById('status-indicator');
        if (statusDot) {
            statusDot.classList.add('offline');
            statusDot.classList.remove('loading');
        }
    }
}

async function loadSkills() {
    try {
        var data = await api('/api/skills');
        state.skills = data.skills || [];
        if (state.currentView === 'skills') {
            renderSkills();
        }
    } catch (e) {
        console.error('Failed to load skills:', e);
        if (state.currentView === 'skills') {
            renderError('Failed to load skills: ' + e.message, 'Skills Load Error');
        }
    }
}

async function completeQuest(id) {
    try {
        await api('/api/quest/complete/' + id, 'POST');
        // Remove from state
        state.quests = state.quests.filter(function(q) { return q.id !== id; });
        renderQuests();
    } catch (e) {
        console.error('Failed to complete quest:', e);
    }
}

async function triggerSkill(name) {
    try {
        await api('/api/skill/trigger/' + name, 'POST');
        alert('Skill triggered: ' + name);
    } catch (e) {
        console.error('Failed to trigger skill:', e);
    }
}

async function search(query) {
    if (!query || query.length < 2) {
        if (state.currentView === 'sessions') {
            renderSessions();
        }
        return;
    }
    try {
        var data = await api('/api/search?q=' + encodeURIComponent(query));
        renderSearchResults(data.results || []);
    } catch (e) {
        console.error('Search failed:', e);
    }
}

// === Navigation ===
function navigate(view) {
    state.currentView = view;
    // Update sidebar
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.toggle('active', item.dataset.view === view);
    });
    // Load data and render
    switch (view) {
        case 'sessions': loadSessions(); renderSessions(); break;
        case 'brain': loadBrain(); renderBrain(); break;
        case 'vault': loadVault(); renderVault(); break;
        case 'quests': loadQuests(); renderQuests(); break;
        case 'skills': loadSkills(); renderSkills(); break;
        case 'config': renderConfig(); break;
        default: renderLoading();
    }
}

// === Event Listeners ===
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigate(item.dataset.view);
        });
    });

    // Search input
    var searchInput = document.getElementById('search-input');
    var searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        var query = this.value;
        searchTimeout = setTimeout(function() {
            search(query);
        }, 300);
    });

    // Initial load
    navigate('sessions');

    // Start polling
    setInterval(function() {
        loadStatus();
    }, 5000);

    // Start quest polling every 10s
    setInterval(function() {
        loadQuests();
    }, 10000);
});
