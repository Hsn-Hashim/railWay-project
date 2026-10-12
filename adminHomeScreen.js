const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const body = document.querySelector("body"),
    sidebar = body.querySelector(".sidebar"),
    toggle = body.querySelector(".toggle");
let currentUser = null;


async function executeAccessControlContingency(incidentDetails = {}) {
    console.warn("[CONTINGENCY PLAN TRIGGERED - R3: Unverified Access Control]", incidentDetails);

    // Step 1: Immediate UI Lockdown & Defensive Wipe
    // Overwrites the DOM immediately to eliminate visual data leakage
    document.body.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f4f6f9; color:#333; padding:20px; box-sizing:border-box;">
      <div style="background:#ffffff; border-top: 5px solid #d90429; border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,0.1); max-width:480px; width:100%; padding:35px; text-align:center;">
        <div style="font-size:48px; color:#d90429; margin-bottom:15px; line-height:1;">
          &#9888;
        </div>
        <h2 style="margin:0 0 10px 0; color:#1f2937; font-size:22px; font-weight:700;">Security Alert: Access Denied</h2>
        <p style="margin:0 0 18px 0; color:#4b5563; font-size:14px; line-height:1.6;">
          Contingency Plan Activated: You do not possess verified administrative privileges to access this page. 
          Your session has been terminated and this unauthorized access attempt has been logged.
        </p>
        <div style="text-align:left; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px 14px; margin-bottom:22px; font-size:12px; color:#6b7280; font-family:monospace;">
          <div><strong>Incident ID:</strong> R3-SEC-${Date.now().toString(36).toUpperCase()}</div>
          <div><strong>Violation:</strong> ${incidentDetails.reason || 'Unverified Administrative Access Attempt'}</div>
          <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
        </div>
        <button id="btnReturnToSignIn" style="background:#1b3b6f; color:#ffffff; border:none; padding:12px 26px; border-radius:6px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.2s ease;">
          Return to Sign In
        </button>
      </div>
    </div>
  `;

    const returnBtn = document.getElementById('btnReturnToSignIn');
    if (returnBtn) {
        returnBtn.addEventListener('click', () => {
            window.location.replace("sign-in.html");
        });
    }

    // Step 2: Audit Incident Logging
    try {
        const auditLogEntry = {
            risk_id: "R3",
            risk_title: "Unverified access control",
            violation_type: incidentDetails.reason || "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
            timestamp: new Date().toISOString(),
            attempted_url: window.location.href,
            user_id: incidentDetails.userId || "UNAUTHENTICATED",
            user_agent: navigator.userAgent
        };

        // Save into local audit trail for inspection and verification
        const incidentHistory = JSON.parse(localStorage.getItem('railway_security_incident_logs') || '[]');
        incidentHistory.push(auditLogEntry);
        localStorage.setItem('railway_security_incident_logs', JSON.stringify(incidentHistory));

        // Optional Supabase logging attempt
        await supabaseClient.from('security_audit_logs').insert([auditLogEntry]).catch(() => { });
    } catch (logErr) {
        console.error("Audit logging error:", logErr);
    }

    // Step 3: Session Invalidation & Storage Wipe
    try {
        await supabaseClient.auth.signOut();
    } catch (authErr) {
        console.error("SignOut during contingency execution error:", authErr);
    }

    // Clear session storage to purge any sensitive memory cached tokens
    sessionStorage.clear();

    // Step 4: Graceful Redirection fallback
    setTimeout(() => {
        window.location.replace("sign-in.html");
    }, 3500);
}

async function checkAuth() {
    try {
        // 1. Verify active session with Supabase Auth
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (!user || authError) {
            console.warn("Unauthenticated attempt detected on admin page.");
            await executeAccessControlContingency({
                reason: "Unauthenticated Access Attempt (No Active Session)",
                userId: null
            });
            return;
        }

        // 2. Verify admin authorization in the 'admin' database table
        const { data: adminData, error: adminError } = await supabaseClient
            .from('admin')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (adminError || !adminData) {
            console.error("Access Denied: User account is not registered as an administrator.");
            await executeAccessControlContingency({
                reason: "Unauthorized Role Escalation (Non-Admin User ID: " + user.id + ")",
                userId: user.id
            });
            return;
        }

        // 3. User passed authorization check
        currentUser = user;
        showDashboard();
    } catch (err) {
        console.error("Unexpected error in checkAuth:", err);
        await executeAccessControlContingency({
            reason: "Access Verification Exception: " + err.message,
            userId: currentUser ? currentUser.id : null
        });
    }
}
window.showDashboard = async function () {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');

    head.innerText = 'Admin Dashboard Statistics';
    container.innerHTML = '<p>Analyzing data...</p>';

    try {
        // 1. جلب الأعداد الإجمالية (Users, Trips, Tickets)
        const { count: usersCount } = await supabaseClient.from('user').select('*', { count: 'exact', head: true });
        const { count: tripsCount } = await supabaseClient.from('trips').select('*', { count: 'exact', head: true });
        const { count: ticketsCount } = await supabaseClient.from('tickets').select('*', { count: 'exact', head: true });

        // 2. جلب كافة التذاكر والرحلات لحساب الدخل الزمني الفعلي
        const { data: allTickets, error: ticketsError } = await supabaseClient
            .from('tickets')
            .select('*');

        if (ticketsError) throw ticketsError;

        // جلب قائمة الرحلات لمعرفة السعر الفعلي لكل تذكرة مرتبطة برحلة
        const { data: tripsData, error: tripsError } = await supabaseClient
            .from('trips')
            .select('id, price');

        if (tripsError) throw tripsError;

        // بناء خريطة لأسعار الرحلات للوصول السريع إليها
        const tripPriceMap = {};
        (tripsData || []).forEach(trip => {
            tripPriceMap[trip.id] = Number(trip.price) || 0;
        });

        // إعدادات الوقت
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // حساب الدخل الفعلي بناءً على أسعار التذاكر الحقيقية
        let dailyIncome = 0;
        let weeklyIncome = 0;
        let monthlyIncome = 0;

        // إحصائية إضافية: الوجهة الأكثر طلباً
        const destinationStats = {};

        allTickets.forEach(ticket => {
            const ticketDate = new Date(ticket.departure_time);

            // جلب السعر الفعلي للتذكرة: من عمود price في التذكرة، أو من سعر الرحلة trip_id، أو 0 كقيمة افتراضية
            const actualTicketPrice = Number(ticket.price) || (ticket.trip_id ? tripPriceMap[ticket.trip_id] : 0) || 0;

            // حساب الدخل بناءً على السعر الحقيقي
            if (ticketDate >= startOfDay) dailyIncome += actualTicketPrice;
            if (ticketDate >= startOfWeek) weeklyIncome += actualTicketPrice;
            if (ticketDate >= startOfMonth) monthlyIncome += actualTicketPrice;

            // تتبع الوجهات
            const dest = ticket.arrive;
            if (dest) {
                destinationStats[dest] = (destinationStats[dest] || 0) + 1;
            }
        });

        const topDestination = Object.keys(destinationStats).reduce((a, b) => destinationStats[a] > destinationStats[b] ? a : b, "N/A");

        // 3. بناء واجهة الإحصائيات بتصميم شبكي (Grid)
        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                
                <div class="trip-card" style="flex-direction: column; text-align: center;">
                    <i class="fa-solid fa-users" style="font-size: 2em; color: #0056b3;"></i>
                    <h4 style="margin: 10px 0;">Users</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${usersCount}</p>
                </div>

                <div class="trip-card" style="flex-direction: column; text-align: center;">
                    <i class="fa-solid fa-train" style="font-size: 2em; color: #0056b3;"></i>
                    <h4 style="margin: 10px 0;">Total Trips</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${tripsCount}</p>
                </div>

                <div class="trip-card" style="flex-direction: column; text-align: center;">
                    <i class="fa-solid fa-ticket" style="font-size: 2em; color: #0056b3;"></i>
                    <h4 style="margin: 10px 0;">Active Tickets</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${ticketsCount}</p>
                </div>

                <div class="trip-card" style="flex-direction: column; text-align: center; border-left: 5px solid #28a745;">
                    <h4 style="color: #28a745;">Daily Income</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${dailyIncome} <span style="font-size: 0.6em;">SAR</span></p>
                </div>

                <div class="trip-card" style="flex-direction: column; text-align: center; border-left: 5px solid #28a745;">
                    <h4 style="color: #28a745;">Weekly Income</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${weeklyIncome} <span style="font-size: 0.6em;">SAR</span></p>
                </div>

                <div class="trip-card" style="flex-direction: column; text-align: center; border-left: 5px solid #28a745;">
                    <h4 style="color: #28a745;">Monthly Income</h4>
                    <p style="font-size: 1.5em; font-weight: bold;">${monthlyIncome} <span style="font-size: 0.6em;">SAR</span></p>
                </div>

                <div class="trip-card" style="grid-column: span 2; background: #f8f9fa;">
                    <div class="trip-info">
                        <h4 style="color: #333;"><i class="fa-solid fa-star" style="color: #ffc107;"></i> Insights</h4>
                        <p style="margin-top: 10px;"><strong>Top Destination:</strong> ${topDestination}</p>
                        <p><strong>Avg. Revenue per User:</strong> ${(monthlyIncome / (usersCount || 1)).toFixed(2)} SAR/Month</p>
                    </div>
                </div>

            </div>
        `;

    } catch (err) {
        console.error("Dashboard Error:", err);
        container.innerHTML = `<p style="color: red;">Couldn't load: ${err.message}</p>`;
    }
}


window.fetchAdminTrips = async function () {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');

    head.innerText = 'Trips Management';
    container.innerHTML = '<p>Loading...</p>';

    try {
        const { data: trips, error: tripsError } = await supabaseClient.from('trips').select('*').order('departure_time', { ascending: true });
        if (tripsError) throw tripsError;

        const { data: trains, error: trainsError } = await supabaseClient.from('trains').select('*');
        if (trainsError) throw trainsError;

        const cities = ["Riyadh", "Jeddah", "Makkah", "Madina", "Dammam", "Al-Taif", "Abha"];
        let cityOptions = cities.map(c => `<option value="${c}">${c}</option>`).join('');

        let trainOptions = trains.map(t => {
            const statusLabel = t.stats ? '' : ' (Under maintenance)';
            const trainDisplayName = t.name || `Train ${t.id}`;
            return `<option value="${t.id}" data-seats="${t.seats}" data-stats="${t.stats}">${trainDisplayName}${statusLabel}</option>`;
        }).join('');

        let html = `
            <div style="margin-bottom: 20px;">
                <button class="sub-button" style="width: auto; background-color: #28a745; display: inline-flex; align-items: center; gap: 8px;" onclick="openModal('addTripModal')">
                    <i class='bx bx-plus'></i> Add new trip
                </button>
            </div>
            <div id="tripsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        `;

        trips.forEach(trip => {
            const departure = new Date(trip.departure_time).toLocaleString();
            const arrival = new Date(trip.arrival_time).toLocaleString();
            // البحث عن اسم القطار لعرضه في الكرت بدلاً من الـ ID
            const trainObj = trains.find(t => t.id == trip.train_id);
            const trainName = trainObj ? (trainObj.name || `Train ${trainObj.id}`) : `Train ${trip.train_id}`;

            html += `
                <div class="trip-card" style="flex-direction: column; align-items: stretch;">
                    <div class="trip-info">
                        <h3 style="color: #0056b3; margin-bottom: 10px;">${trip.depart} ➔ ${trip.arrive}</h3>
                        <p><strong>Departure:</strong> ${departure}</p>
                        <p><strong>Arrival:</strong> ${arrival}</p>
                        <p><strong>Price:</strong> ${trip.price} SAR</p>
                        <p><strong>Seats:</strong> ${trip.seats} | <strong>Train:</strong> ${trainName}</p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="sub-button" style="margin:0; flex:1; background-color: #0056b3;" onclick="openEditModal('${trip.id}')">Edit</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;" onclick="openDeleteConfirm('${trip.id}')">Delete</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        html += `
            <div id="addTripModal" class="hidden modal-overlay">${renderTripForm('add', cityOptions, trainOptions)}</div>
            <div id="editTripModal" class="hidden modal-overlay">${renderTripForm('edit', cityOptions, trainOptions)}</div>
            <div id="deleteConfirmModal" class="hidden modal-overlay">
                <div class="modal-box" style="max-width: 400px; text-align: center;">
                    <i class='bx bx-error-circle' style="font-size: 4em; color: #a90e0b;"></i>
                    <h2 style="margin: 15px 0;">Confirmation</h2>
                    <p>Are you sure you want to cancel this trip? This action cannot be reversed.</p>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmDeleteBtn" class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;">Yes, Delete</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ccc; color: #333;" onclick="closeModal('deleteConfirmModal')">Go back</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        setupEventListeners();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color: red;">Error occured: ${error.message}</p>`;
    }
};

function renderTripForm(type, cityOptions, trainOptions) {
    const isEdit = type === 'edit';
    const inputStyle = "width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; background-color: #fff;";

    return `
        <div class="modal-box">
            <h2 style="margin-bottom: 20px;">${isEdit ? 'Edit trip information' : 'Add new trip'}</h2>
            <form id="${type}TripForm">
                <input type="hidden" id="${type}-id">
                
                ${!isEdit ? `
                <div class="textInput">
                    <label>Depart station</label>
                    <select id="${type}-depart" required style="${inputStyle}">
                        <option value="" disabled selected>select city</option>
                        ${cityOptions}
                    </select>
                </div>
                <div class="textInput">
                    <label>Arrive station</label>
                    <select id="${type}-arrive" required style="${inputStyle}">
                        <option value="" disabled selected>select city</option>
                        ${cityOptions}
                    </select>
                </div>
                ` : ''}
                
                <div class="textInput">
                    <label>Used train</label>
                    <select id="${type}-train" required style="${inputStyle}">
                        <option value="" disabled selected>select train</option>
                        ${trainOptions}
                    </select>
                </div>
                
                <div class="textInput"><label>Price (SAR)</label><input type="number" id="${type}-price" required min="1"></div>
                <div class="textInput"><label>Depart time</label><input type="datetime-local" id="${type}-departure-time" required></div>
                <div class="textInput"><label>Arrive time</label><input type="datetime-local" id="${type}-arrival-time" required></div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="sub-button" style="margin: 0; flex: 1;">save</button>
                    <button type="button" class="sub-button" style="margin: 0; flex: 1; background-color: #ccc; color: #333;" onclick="closeModal('${type}TripModal')">close</button>
                </div>
            </form>
        </div>
    `;
}

function setupEventListeners() {
    // مستمع الإضافة
    document.getElementById('addTripForm')?.addEventListener('submit', (e) => handleTripSubmit(e, 'add'));
    // مستمع التعديل
    document.getElementById('editTripForm')?.addEventListener('submit', (e) => handleTripSubmit(e, 'edit'));
}

async function handleTripSubmit(e, type) {
    e.preventDefault();
    const isEdit = type === 'edit';
    const trainSelect = document.getElementById(`${type}-train`);
    const selectedOption = trainSelect.options[trainSelect.selectedIndex];

    // التحقق من الصيانة
    if (selectedOption.getAttribute('data-stats') === 'false') {
        alert("رفض: القطار المختار تحت الصيانة."); return;
    }

    const data = {
        train_id: trainSelect.value,
        price: document.getElementById(`${type}-price`).value,
        departure_time: new Date(document.getElementById(`${type}-departure-time`).value).toISOString(),
        arrival_time: new Date(document.getElementById(`${type}-arrival-time`).value).toISOString(),
        seats: selectedOption.getAttribute('data-seats')
    };

    if (!isEdit) {
        data.depart = document.getElementById('add-depart').value;
        data.arrive = document.getElementById('add-arrive').value;
    }

    const query = isEdit ?
        supabaseClient.from('trips').update(data).eq('id', document.getElementById('edit-id').value) :
        supabaseClient.from('trips').insert([data]);

    const { error } = await query;
    if (error) alert("Error: " + error.message);
    else { alert("executed sccessfully"); closeModal(`${type}TripModal`); fetchAdminTrips(); }
}

// دالة فتح التعديل وتعبئة البيانات
window.openEditModal = async function (tripId) {
    const { data: trip } = await supabaseClient.from('trips').select('*').eq('id', tripId).single();
    if (trip) {
        document.getElementById('edit-id').value = trip.id;
        document.getElementById('edit-train').value = trip.train_id;
        document.getElementById('edit-price').value = trip.price;
        // تحويل التاريخ ليتوافق مع input datetime-local
        document.getElementById('edit-departure-time').value = new Date(trip.departure_time).toISOString().slice(0, 16);
        document.getElementById('edit-arrival-time').value = new Date(trip.arrival_time).toISOString().slice(0, 16);
        openModal('editTripModal');
    }
};

window.openDeleteConfirm = function (tripId) {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.onclick = async () => {
        const { error } = await supabaseClient.from('trips').delete().eq('id', tripId);
        if (error) alert(error.message);
        else { closeModal('deleteConfirmModal'); fetchAdminTrips(); }
    };
    openModal('deleteConfirmModal');
};

// دوال مساعدة للتحكم بالظهور
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');


window.fetchTrains = async function () {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');

    head.innerText = 'Trains Management';
    container.innerHTML = '<p>Loading...</p>';

    try {
        const { data: trains, error: trainsError } = await supabaseClient.from('trains').select('*');
        if (trainsError) throw trainsError;

        const now = new Date().toISOString();
        const { data: activeTrips, error: tripsError } = await supabaseClient
            .from('trips')
            .select('train_id')
            .gt('departure_time', now);

        if (tripsError) throw tripsError;

        if (trains.length === 0) {
            container.innerHTML = '<p>No trains on system.</p>';
            return;
        }

        container.innerHTML = '';

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        grid.style.gap = '20px';
        grid.style.marginTop = '20px';

        trains.forEach(train => {
            const trainTripsCount = activeTrips.filter(trip => trip.train_id === train.id).length;

            // هنا التعديل: استخدمنا اسم العمود الفعلي حقك stats
            const isWorking = train.stats;
            const btnColor = isWorking ? '#0056b3' : '#a90e0b';
            const btnText = isWorking ? 'Send to maintenance' : 'Send back from maintenance';
            const statusText = isWorking ? '<span style="color: #28a745;">Available</span>' : '<span style="color: #a90e0b;">Under maintenance</span>';

            const card = document.createElement('div');
            card.className = 'trip-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: #333;"><i class="bx bxs-train" style="color: #555;"></i> Train ${train.name}</h3>
                    <strong>${statusText}</strong>
                </div>
                <p style="margin-bottom: 10px;"><strong>Seats:</strong> ${train.seats || 0} </p>
                <p style="margin-bottom: 15px;"><strong>current trips scheduled:</strong> ${trainTripsCount} trips</p>
                
                <button class="sub-button" style="margin: 0; background-color: ${btnColor}; transition: 0.3s;" onclick="toggleTrainStatus('${train.id}', ${isWorking})">
                    ${btnText}
                </button>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color: red;">Error occured: ${error.message}</p>`;
    }
}

window.toggleTrainStatus = async function (trainId, currentStatus) {
    const newStatus = !currentStatus;

    // التعديل هنا لعملية التحديث: stats
    const { error } = await supabaseClient
        .from('trains')
        .update({ stats: newStatus })
        .eq('id', trainId);

    if (error) {
        console.error("Error updating train status:", error);
        alert("فشل تحديث حالة القطار. راجع الـ Console.");
    } else {
        fetchTrains();
    }
}
document.getElementById('logOutAdmin').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "sign-in.html";
});

window.fetchCustomers = async function () {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');

    head.innerText = 'Customers & Tickets Management';
    container.innerHTML = '<p>Customer data and tickets loading...</p>';

    try {
        // 1. جلب كل التذاكر الموجودة
        const { data: tickets, error: ticketsError } = await supabaseClient
            .from('tickets')
            .select('*')
            .order('departure_time', { ascending: false }); // التذاكر الأحدث أو الأقرب أولاً

        if (ticketsError) throw ticketsError;

        // 2. جلب بيانات كل المستخدمين لمطابقتها مع التذاكر
        const { data: users, error: usersError } = await supabaseClient
            .from('user')
            .select('id, name, national_id');

        if (usersError) throw usersError;

        if (tickets.length === 0) {
            container.innerHTML = '<p>No tickets available on the system.</p>';
            return;
        }

        // 3. بناء واجهة التذاكر
        let html = `
            <div id="ticketsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        `;

        tickets.forEach(ticket => {
            // البحث عن بيانات العميل صاحب التذكرة
            const customer = users.find(u => u.id === ticket.user_id) || { name: 'غير معروف', national_id: 'N/A' };
            const departure = new Date(ticket.departure_time).toLocaleString();

            html += `
                <div class="trip-card" style="flex-direction: column; align-items: stretch;">
                    <div class="trip-info">
                        <h3 style="color: #0056b3; margin-bottom: 10px;"><i class="fa-solid fa-ticket"></i> Ticket #${ticket.id.slice(0, 8)}</h3>
                        <p><strong>Name:</strong> ${customer.name}</p>
                        <p><strong>National id:</strong> ${customer.national_id}</p>
                        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                        <p><strong>Trip:</strong> ${ticket.depart} ➔ ${ticket.arrive}</p>
                        <p><strong>Depart time:</strong> ${departure}</p>
                    </div>
                    <div style="margin-top: 15px;">
                        <button class="sub-button" style="margin:0; width: 100%; background-color: #a90e0b;" onclick="openTicketDeleteConfirm('${ticket.id}', '${ticket.trip_id}')">Delete ticket</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // 4. إضافة نافذة تأكيد الإلغاء
        html += `
            <div id="deleteTicketModal" class="hidden modal-overlay">
                <div class="modal-box" style="max-width: 400px; text-align: center;">
                    <i class='bx bx-error-circle' style="font-size: 4em; color: #a90e0b;"></i>
                    <h2 style="margin: 15px 0;">Confirmation</h2>
                    <p>Are you sure you want to cancel this ticket? The seat will be reclaimed for the flight and this action cannot be reversed.</p>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmTicketDeleteBtn" class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;">Yes, delete the ticket</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ccc; color: #333;" onclick="closeModal('deleteTicketModal')">Go back</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error("Error fetching customers/tickets:", error);
        container.innerHTML = `<p style="color: red;">Error occured: ${error.message}</p>`;
    }
};

window.openTicketDeleteConfirm = function (ticketId, tripId) {
    const confirmBtn = document.getElementById('confirmTicketDeleteBtn');

    // إسناد وظيفة الحذف للزر عند الضغط على تأكيد
    confirmBtn.onclick = async () => {
        try {
            // 1. حذف التذكرة
            const { error: deleteError } = await supabaseClient
                .from('tickets')
                .delete()
                .eq('id', ticketId);

            if (deleteError) throw deleteError;

            // 2. تحديث عدد الكراسي في جدول الرحلات
            // نجلب الرحلة أولاً عشان نعرف المقاعد الحالية
            const { data: trip, error: fetchTripError } = await supabaseClient
                .from('trips')
                .select('seats')
                .eq('id', tripId)
                .single();

            if (trip && !fetchTripError) {
                const newSeats = trip.seats + 1;
                await supabaseClient
                    .from('trips')
                    .update({ seats: newSeats })
                    .eq('id', tripId);
            }

            // إغلاق النافذة وإعادة تحميل التذاكر
            closeModal('deleteTicketModal');
            fetchCustomers();

        } catch (error) {
            console.error("Error deleting ticket:", error);
            alert("Error occured on deleting: " + error.message);
        }
    };

    // إظهار نافذة التأكيد
    openModal('deleteTicketModal');
};

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close")
});



checkAuth();
