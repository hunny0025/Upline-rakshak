// PWA Medical ID Generator (Offline QR)
let qrInstance = null;

function renderMedicalId() {
    const data = JSON.parse(localStorage.getItem('upline_medical_id')) || {};

    // If no data, show setup form
    setTimeout(() => {
        if (data.name) {
            generateWebQR(data);
        }
    }, 100);

    return `
        <div class="header">
            <button class="icon-btn" onclick="Router.navigate('/dashboard')" aria-label="Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="header-title">Medical ID & QR</div>
            <button class="icon-btn" onclick="toggleMedicalIdEdit()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
        </div>
        
        <div class="content" style="padding-top:80px">
            <div id="medical-id-view" style="display: ${data.name ? 'block' : 'none'}">
                <div class="card" style="text-align:center; padding:var(--space-xl) var(--space-md);">
                    <canvas id="qr-canvas" style="background:#fff; padding:10px; border-radius:8px; margin-bottom:var(--space-lg); width:200px; height:200px;"></canvas>
                    <h2 style="color:var(--accent-primary); text-transform:uppercase; margin-bottom:var(--space-md);">${data.name || ''}</h2>
                    <hr style="border-color:var(--border-subtle); margin-bottom:var(--space-md);">
                    
                    <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm);">
                        <span style="color:var(--text-muted);">Blood Group</span>
                        <strong>${data.bloodGroup || '-'}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm);">
                        <span style="color:var(--text-muted);">Allergies</span>
                        <strong>${data.allergies || 'None'}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm);">
                        <span style="color:var(--text-muted);">Conditions</span>
                        <strong>${data.conditions || 'None'}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm);">
                        <span style="color:var(--text-muted);">Emergency</span>
                        <strong>${data.contact || '-'}</strong>
                    </div>
                </div>
                <p style="text-align:center; color:var(--text-muted); font-size:12px; margin-top:var(--space-lg);">
                    Display this QR to first responders or mesh peers to instantly transfer your critical medical payload.
                </p>
            </div>

            <div id="medical-id-edit" style="display: ${data.name ? 'none' : 'block'}">
                <h3 style="margin-bottom:var(--space-sm);">Setup Your Emergency ID</h3>
                <p style="color:var(--text-muted); font-size:13px; margin-bottom:var(--space-lg);">
                    This data is stored entirely OFFLINE on your device. It generates a QR code that first responders can scan if you are unconscious.
                </p>
                
                <div class="form-group" style="margin-bottom:var(--space-md);">
                    <label style="display:block; margin-bottom:var(--space-xs); font-size:12px; color:var(--text-muted);">Full Name</label>
                    <input type="text" id="mid-name" value="${data.name || ''}" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="John Doe">
                </div>
                
                <div class="form-group" style="margin-bottom:var(--space-md);">
                    <label style="display:block; margin-bottom:var(--space-xs); font-size:12px; color:var(--text-muted);">Blood Group</label>
                    <input type="text" id="mid-bg" value="${data.bloodGroup || ''}" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="O+">
                </div>
                
                <div class="form-group" style="margin-bottom:var(--space-md);">
                    <label style="display:block; margin-bottom:var(--space-xs); font-size:12px; color:var(--text-muted);">Known Allergies</label>
                    <input type="text" id="mid-alg" value="${data.allergies || ''}" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="Penicillin, Peanuts">
                </div>
                
                <div class="form-group" style="margin-bottom:var(--space-md);">
                    <label style="display:block; margin-bottom:var(--space-xs); font-size:12px; color:var(--text-muted);">Medical Conditions</label>
                    <input type="text" id="mid-cond" value="${data.conditions || ''}" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="Asthma, Type 1 Diabetes">
                </div>
                
                <div class="form-group" style="margin-bottom:var(--space-xl);">
                    <label style="display:block; margin-bottom:var(--space-xs); font-size:12px; color:var(--text-muted);">Emergency Contact (Phone)</label>
                    <input type="tel" id="mid-phone" value="${data.contact || ''}" class="form-control" style="width:100%; background:var(--bg-card); border:1px solid var(--border-subtle); color:var(--text-main); padding:10px; border-radius:var(--radius-sm);" placeholder="+1 234 567 8900">
                </div>
                
                <button class="btn btn-primary" style="width: 100%; padding:14px; border-radius: var(--radius-round);" onclick="saveMedicalId()">
                    Save & Generate QR
                </button>
            </div>
        </div>
    `;
}

window.toggleMedicalIdEdit = function () {
    const view = document.getElementById('medical-id-view');
    const edit = document.getElementById('medical-id-edit');
    if (view && edit) {
        view.style.display = 'none';
        edit.style.display = 'block';
    }
};

window.saveMedicalId = function () {
    const name = document.getElementById('mid-name').value.trim();
    if (!name) {
        showToast("Name is required");
        return;
    }

    const data = {
        name: name,
        bloodGroup: document.getElementById('mid-bg').value.trim(),
        allergies: document.getElementById('mid-alg').value.trim(),
        conditions: document.getElementById('mid-cond').value.trim(),
        contact: document.getElementById('mid-phone').value.trim()
    };

    localStorage.setItem('upline_medical_id', JSON.stringify(data));
    showToast("Medical ID saved securely");

    // Re-render
    Router.navigate('/medical-id');
};

function generateWebQR(data) {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;

    if (typeof QRious === 'undefined') {
        console.warn("QRious library not loaded");
        return;
    }

    const payload = JSON.stringify({
        name: data.name,
        bg: data.bloodGroup,
        alg: data.allergies,
        cond: data.conditions,
        em1: data.contact
    });

    qrInstance = new QRious({
        element: canvas,
        value: payload,
        size: 300,
        level: 'M',
        background: 'white',
        foreground: 'black'
    });
}
window.renderMedicalId = renderMedicalId;
