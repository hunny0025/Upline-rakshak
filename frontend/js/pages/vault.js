// PWA AES-256-GCM Secure Vault using Web Crypto API
let _vaultKey = null;
let _vaultItems = [];

// Helper to encode/decode strings
const enc = new TextEncoder();
const dec = new TextDecoder();

// Helper to convert base64 to Uint8Array and vice-versa
function buf2b64(buf) {
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
function b642buf(b64) {
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Derive AES-256 key from a password using PBKDF2
async function deriveKey(password, saltBuffer) {
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        { "name": "PBKDF2", salt: saltBuffer, "iterations": 100000, "hash": "SHA-256" },
        keyMaterial, { "name": "AES-GCM", "length": 256 }, false, ["encrypt", "decrypt"]
    );
}

// Encrypt data
async function encryptData(text, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, key, enc.encode(text)
    );
    return { iv: buf2b64(iv), ciphertext: buf2b64(encrypted) };
}

// Decrypt data
async function decryptData(ciphertextB64, ivB64, key) {
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: b642buf(ivB64) }, key, b642buf(ciphertextB64)
        );
        return dec.decode(decrypted);
    } catch (e) {
        throw new Error("Invalid password or corrupted data");
    }
}


function renderVault() {
    // If not unlocked, show password prompt
    if (!_vaultKey) {
        return `
            <div class="header">
                <button class="icon-btn" onclick="Router.navigate('/dashboard')" aria-label="Back">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div class="header-title">Secure Vault</div>
                <div style="width:24px"></div>
            </div>
            
            <div class="content" style="padding-top:100px; text-align:center;">
                <div style="font-size:48px; margin-bottom:var(--space-md);">🔒</div>
                <h2 style="margin-bottom:var(--space-sm); color:var(--accent-gold);">AES-256-GCM Locked</h2>
                <p style="color:var(--text-muted); font-size:13px; margin-bottom:var(--space-xl);">
                    Enter your master password to unlock the local vault.<br>
                    If this is your first time, entering a password will create a new vault.
                </p>
                
                <div class="form-group" style="margin-bottom:var(--space-lg); text-align:left;">
                    <input type="password" id="vault-password" class="form-control" 
                           style="width:100%; background:var(--bg-card); border:1px solid var(--accent-gold); color:var(--text-main); padding:14px; border-radius:var(--radius-sm); text-align:center; font-size:18px; letter-spacing:2px;" 
                           placeholder="••••••••">
                </div>
                
                <button class="btn" style="width: 100%; padding:14px; border-radius: var(--radius-round); background:var(--accent-gold); color:#000; font-weight:bold;" onclick="unlockVault()">
                    Unlock Vault
                </button>
            </div>
        `;
    }

    // Vault Unlocked View
    let itemsHtml = '';
    if (_vaultItems.length === 0) {
        itemsHtml = `
            <div style="text-align:center; padding:var(--space-xl) 0;">
                <div style="font-size:32px; opacity:0.5; margin-bottom:var(--space-sm);">🗄️</div>
                <div style="color:var(--text-muted); font-size:14px;">Vault is empty. Add secure notes below.</div>
            </div>
        `;
    } else {
        itemsHtml = _vaultItems.map(item => `
            <div class="card" style="margin-bottom:var(--space-md); border-left:3px solid var(--accent-gold);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-sm);">
                    <h3 style="color:var(--accent-gold); margin:0; font-size:16px;">${item.title}</h3>
                    <button class="icon-btn" onclick="deleteVaultItem('${item.id}')" style="color:var(--accent-danger);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
                <div style="position:relative;">
                    <button id="reveal-btn-${item.id}" class="btn btn-sm" style="background:var(--bg-elevated); border:1px solid var(--border-subtle); color:var(--text-main); width:100%; display:block;" onclick="revealVaultItem('${item.id}')">
                        Reveal Ciphertext
                    </button>
                    <div id="secret-${item.id}" style="display:none; background:#000; padding:12px; border-radius:4px; font-family:monospace; font-size:13px; color:#10b981; word-break:break-all;">
                        Decrypting...
                    </div>
                </div>
            </div>
        `).join('');
    }

    return `
        <div class="header">
            <button class="icon-btn" onclick="lockVault()" aria-label="Lock">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </button>
            <div class="header-title" style="color:var(--accent-gold)">Vault Unlocked</div>
            <div style="width:24px"></div>
        </div>
        
        <div class="content" style="padding-top:80px">
            ${itemsHtml}
            
            <hr style="border-color:var(--border-subtle); margin:var(--space-xl) 0;">
            
            <h3 style="margin-bottom:var(--space-sm);">Add Encrypted Note</h3>
            <div class="form-group" style="margin-bottom:var(--space-sm);">
                <input type="text" id="vault-new-title" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="Title (e.g. Server Passwords)">
            </div>
            <div class="form-group" style="margin-bottom:var(--space-md);">
                <textarea id="vault-new-secret" class="form-control" style="width:100%; height:80px; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="Secret Content"></textarea>
            </div>
            <button class="btn" style="width: 100%; padding:14px; border-radius: var(--radius-round); background:var(--accent-gold); color:#000; font-weight:bold;" onclick="addVaultItem()">
                Encrypt & Save
            </button>
        </div>
    `;
}

window.unlockVault = async function () {
    const pwd = document.getElementById('vault-password').value;
    if (!pwd) return;

    showToast("Decrypting vault...");
    try {
        let meta = JSON.parse(localStorage.getItem('upline_vault_meta'));
        let data = JSON.parse(localStorage.getItem('upline_vault_data')) || [];

        if (!meta) {
            // First time setup
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            _vaultKey = await deriveKey(pwd, salt);

            // Create a verification payload
            const verifyText = "UPLINE_VAULT_OK";
            const ver = await encryptData(verifyText, _vaultKey);

            meta = { salt: buf2b64(salt), verifyIv: ver.iv, verifyCiphertext: ver.ciphertext };
            localStorage.setItem('upline_vault_meta', JSON.stringify(meta));
            _vaultItems = [];
            showToast("New AES vault created");
        } else {
            // Existing vault
            const salt = b642buf(meta.salt);
            _vaultKey = await deriveKey(pwd, salt);

            // Verify password using the securely stored verification payload
            if (meta.verifyCiphertext) {
                const check = await decryptData(meta.verifyCiphertext, meta.verifyIv, _vaultKey);
                if (check !== "UPLINE_VAULT_OK") throw new Error("Verification failed");
            } else if (data.length > 0) {
                // Fallback for older vaults
                await decryptData(data[0].ciphertext, data[0].iv, _vaultKey);
            }
            _vaultItems = data;
            showToast("Vault unlocked");
        }

        Router.navigate('/vault'); // re-render
    } catch (e) {
        showToast("Access Denied: Incorrect Password");
        _vaultKey = null;
    }
};

window.lockVault = function () {
    _vaultKey = null;
    _vaultItems = [];
    showToast("Vault Locked 🔒");
    Router.navigate('/vault');
};

window.addVaultItem = async function () {
    const title = document.getElementById('vault-new-title').value.trim();
    const secret = document.getElementById('vault-new-secret').value.trim();

    if (!title || !secret) {
        showToast("Title and Secret required");
        return;
    }
    if (!_vaultKey) return;

    try {
        const encrypted = await encryptData(secret, _vaultKey);

        const newItem = {
            id: 'v_' + Date.now(),
            title: title,
            iv: encrypted.iv,
            ciphertext: encrypted.ciphertext,
            timestamp: Date.now()
        };

        _vaultItems.unshift(newItem);
        localStorage.setItem('upline_vault_data', JSON.stringify(_vaultItems));

        showToast("Note Encrypted & Saved");
        Router.navigate('/vault');
    } catch (e) {
        console.error(e);
        showToast("Encryption failed");
    }
};

window.revealVaultItem = async function (id) {
    const item = _vaultItems.find(i => i.id === id);
    if (!item || !_vaultKey) return;

    const btn = document.getElementById(`reveal-btn-${id}`);
    const sec = document.getElementById(`secret-${id}`);

    if (sec.style.display === 'block') {
        sec.style.display = 'none';
        btn.style.display = 'block';
        sec.innerHTML = "Decrypting...";
        return;
    }

    try {
        btn.style.display = 'none';
        sec.style.display = 'block';
        const plaintext = await decryptData(item.ciphertext, item.iv, _vaultKey);
        // Replace newlines with <br> to format securely
        sec.innerHTML = plaintext.replace(/\n/g, '<br>');
    } catch (e) {
        sec.innerHTML = "<span style='color:red'>Decryption Error</span>";
    }
};

window.deleteVaultItem = function (id) {
    if (confirm("Permanently delete this encrypted note?")) {
        _vaultItems = _vaultItems.filter(i => i.id !== id);
        localStorage.setItem('upline_vault_data', JSON.stringify(_vaultItems));
        showToast("Item deleted");
        Router.navigate('/vault');
    }
};

window.renderVault = renderVault;
