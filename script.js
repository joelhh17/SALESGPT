let chats = JSON.parse(localStorage.getItem("sales_agent_chats")) || [];
let currentChatId = chats.length ? chats[0].id : createNewChat(true);

window.onload = () => {
    renderChat();
    renderChatList();
    applyTheme();
    checkEmpty();
};

/* ---------- Chat Logic ---------- */
async function ask() {
    const input = document.getElementById("question");
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    input.value = "";
    input.style.height = "40px";
    saveChats();
    showTyping();
    checkEmpty();

    try {
        // Replace with your actual ngrok URL
        const response = await fetch("https://5033-2806-103e-2a-323d-3593-2a3f-c0d6-68d9.ngrok-free.app/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: question })
        });

        if (!response.ok) {
            throw new Error("API response error");
        }

        const data = await response.json();
        addMessage(data.response || "No response from API.", 'bot');

    } catch (error) {
        console.error(error);
        addMessage("Failed to connect to the API.", 'bot');
    }

    hideTyping();
    saveChats();
    checkEmpty();
}

function addMessage(text, sender) {
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ text, sender, time: new Date().toLocaleTimeString() });
    renderChat();
}

function renderChat() {
    const chatContainer = document.getElementById("chat-container");
    chatContainer.innerHTML = "";
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.sender}`;
        div.innerHTML = `${msg.text} <span class="timestamp">${msg.time}</span>`;
        chatContainer.appendChild(div);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/* ---------- Multichat ---------- */
function createNewChat(initial = false) {
    const id = Date.now();
    chats.unshift({ id, name: `Chat ${chats.length + 1}`, messages: [] });
    if (!initial) currentChatId = id;
    saveChats();
    renderChatList();
    if (!initial) renderChat();
    checkEmpty();
    return id;
}

function renderChatList() {
    const list = document.getElementById("chat-list");
    list.innerHTML = "";
    chats.forEach(c => {
        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");

        // Chat name button
        const btn = document.createElement("button");
        btn.textContent = c.name;
        btn.className = "chat-btn";
        btn.onclick = () => {
            currentChatId = c.id;
            renderChat();
            checkEmpty();
        };

        // Menu wrapper
        const menuWrapper = document.createElement("div");
        menuWrapper.className = "chat-menu-wrapper";

        // Three dots button
        const menuButton = document.createElement("button");
        menuButton.className = "menu-btn";
        menuButton.innerText = "⋯";
        menuButton.onclick = function () {
            toggleMenu(menuButton);
        };

        // Dropdown menu
        const chatMenu = document.createElement("div");
        chatMenu.className = "chat-menu hidden";

        // Rename button
        const renameBtn = document.createElement("button");
        renameBtn.innerText = "Rename";
        renameBtn.onclick = () => renameChat(c, btn);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.onclick = () => deleteChat(c.id);

        chatMenu.appendChild(renameBtn);
        chatMenu.appendChild(deleteBtn);
        menuWrapper.appendChild(menuButton);
        menuWrapper.appendChild(chatMenu);

        chatItem.appendChild(btn);
        chatItem.appendChild(menuWrapper);

        list.appendChild(chatItem);
    });
}


/* ---------- Prompt Suggestion ---------- */
function suggestPrompt(text) {
    const input = document.getElementById("question");
    input.value = text;
    input.focus();
}

/* ---------- Typing Animation ---------- */
function showTyping() {
    document.getElementById("typing").classList.remove("hidden");
}
function hideTyping() {
    document.getElementById("typing").classList.add("hidden");
}

/* ---------- Theme Switcher ---------- */
function applyTheme() {
    const stored = localStorage.getItem("theme") || "system";
    document.getElementById("themeSelector").value = stored;
    setTheme(stored);
}

function changeTheme() {
    const mode = document.getElementById("themeSelector").value;
    localStorage.setItem("theme", mode);
    setTheme(mode);
}

function setTheme(mode) {
    document.body.classList.remove("light", "oled");
    if (mode === "light") document.body.classList.add("light");
    else if (mode === "oled") document.body.classList.add("oled");
    else if (mode === "system") {
        if (window.matchMedia("(prefers-color-scheme: light)").matches) document.body.classList.add("light");
    }
}

/* ---------- Sidebar ---------- */
function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("hidden");
}

/* ---------- Settings ---------- */
function toggleSettings() {
    document.getElementById("settings-menu").classList.toggle("hidden");
}

function toggleThemeMenu() {
    document.getElementById("settings-menu").classList.toggle("hidden");
}

/* ---------- Auto-resize ---------- */
function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = (textarea.scrollHeight) + "px";
}

/* ---------- State ---------- */
function saveChats() {
    localStorage.setItem("sales_agent_chats", JSON.stringify(chats));
}

/* ---------- Input Centering ---------- */
function checkEmpty() {
    const chat = chats.find(c => c.id === currentChatId);
    const chatArea = document.getElementById("chat-area");
    const promptSuggestions = document.getElementById("prompt-suggestions");
    if (chat.messages.length === 0) {
        chatArea.style.justifyContent = "center";
        promptSuggestions.style.display = "flex";
    } else {
        chatArea.style.justifyContent = "flex-end";
        promptSuggestions.style.display = "none";
    }
}

/* ---------- Chat Options ---------- */
function toggleMenu(button) {
    const menu = button.nextElementSibling;
    menu.classList.toggle("hidden");
}

function renameChat(chat, btn) {
    // Create an input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = chat.name;
    input.className = "rename-input";

    // Replace button content with the input
    btn.replaceWith(input);
    input.focus();
    input.select();

    // Save on Enter or when losing focus
    input.addEventListener("blur", () => saveRename(chat, input));
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveRename(chat, input);
        }
    });
}

function saveRename(chat, input) {
    if (input.value.trim() !== "") {
        chat.name = input.value.trim();
        saveChats();
        renderChatList();
    } else {
        renderChatList();
    }
}


function deleteChat(id) {
    // Remove chat without confirmation
    chats = chats.filter(c => c.id !== id);
    if (currentChatId === id && chats.length > 0) {
        currentChatId = chats[0].id;
    } else if (chats.length === 0) {
        currentChatId = createNewChat(true);
    }
    saveChats();
    renderChatList();
    renderChat();
    checkEmpty();
}


