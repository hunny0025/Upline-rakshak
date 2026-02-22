/* ===== Network & Comms Hub Page ===== */

function renderNetwork() {
    const page = document.createElement('div');
    page.className = 'page network-page page-scroll';

    // Get connection state
    const isOnline = navigator.onLine;
    const forcedOffline = localStorage.getItem('upline_forced_offline') === 'true';
    const showAsOffline = forcedOffline || !isOnline;

    const contact1 = localStorage.getItem('upline_contact1') || '';
    const contact2 = localStorage.getItem('upline_contact2') || '';

    // Save contacts handler
    window._saveContacts = function () {
        const c1 = document.getElementById('contact1_input').value;
        const c2 = document.getElementById('contact2_input').value;
        localStorage.setItem('upline_contact1', c1);
        localStorage.setItem('upline_contact2', c2);
        showToast('Emergency Contacts Saved');
    };

    // Bluetooth Mesh simulator handler
    window._openMeshSim = function () {
        showToast('Demo: Opening Bluetooth P2P Mesh Network...');
    };

    page.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">📡 Network & Comms</h1>
            <p class="page-subtitle">Central hub for offline connection and SOS settings</p>
        </div>

        <div style="padding: 0 var(--space-md) var(--space-xl) var(--space-md);">
        
            <!-- Global Status -->
            <div style="
                background: ${showAsOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
                border: 1px solid ${showAsOffline ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
                border-radius: var(--radius-lg);
                padding: var(--space-md);
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--space-lg);
            ">
                <div>
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">System Status</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${showAsOffline ? 'var(--color-emergency)' : 'var(--accent-teal)'}">
                        ${showAsOffline ? 'Offline (Mesh/SMS Only)' : 'Online (Connected)'}
                    </div>
                </div>
                <div style="font-size: 28px;">${showAsOffline ? '✈' : '🌐'}</div>
            </div>

            <!-- Bluetooth Mesh Portal -->
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">P2P Mesh Network</div>
            <div onclick="_openMeshSim()" style="
                background: rgba(249, 115, 22, 0.08);
                border: 1px solid rgba(249, 115, 22, 0.4);
                border-radius: var(--radius-lg);
                padding: var(--space-md);
                display: flex;
                align-items: center;
                gap: var(--space-md);
                margin-bottom: var(--space-xl);
                cursor: pointer;
            ">
                <div style="
                    width: 56px; height: 56px;
                    border-radius: var(--radius-md);
                    background: rgba(249, 115, 22, 0.2);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 28px; flex-shrink: 0;
                ">📡</div>
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: 700; color: var(--accent-primary); margin-bottom: 2px;">Open Mesh Chat</div>
                    <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">Chat with nearby devices without internet using Google Nearby Connections.</div>
                </div>
                <div style="font-size: 24px; color: rgba(249, 115, 22, 0.5);">→</div>
            </div>

            <!-- Emergency Contacts -->
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Zero-Data SMS SOS</div>
            <div style="
                background: var(--bg-card);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                padding: var(--space-md);
            ">
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: var(--space-md);">
                    These contacts will receive an automated SMS with your GPS location when you trigger the SOS button or when your battery hits 5%.
                </p>

                <div class="form-group" style="margin-bottom: var(--space-sm);">
                    <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Primary Contact</label>
                    <input type="tel" id="contact1_input" value="${contact1}" placeholder="+91 XXXXX XXXXX" style="
                        width: 100%; padding: 12px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid var(--border-subtle);
                        border-radius: var(--radius-sm);
                        color: var(--text-primary);
                        font-family: inherit;
                    ">
                </div>

                <div class="form-group" style="margin-bottom: var(--space-md);">
                    <label style="font-size: 12px; color: var(--text-secondary); display: block; margin-bottom: 4px;">Secondary Contact</label>
                    <input type="tel" id="contact2_input" value="${contact2}" placeholder="+91 XXXXX XXXXX" style="
                        width: 100%; padding: 12px;
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid var(--border-subtle);
                        border-radius: var(--radius-sm);
                        color: var(--text-primary);
                        font-family: inherit;
                    ">
                </div>

                <button class="btn btn-primary" style="width: 100%;" onclick="_saveContacts()">
                    Save Contacts
                </button>
            </div>
        </div>
    `;

    return page;
}
