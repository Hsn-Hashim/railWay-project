const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const body = document.querySelector("body"),
  sidebar = body.querySelector(".sidebar"),
  toggle = body.querySelector(".toggle");
let currentUser = null;

async function checkAuth() {
  // 1. التحقق من وجود جلسة (Session) نشطة للمستخدم
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

  if (!user || authError) {
    window.location.href = "sign-in.html";
    return;
  }

  // 2. التحقق من وجود المستخدم في جدول الإداريين (admin)
  // نستخدم maybeSingle عشان لو ما لقى نتيجة ما يرمي خطأ برمجي، بل يرجع null
  const { data: adminData, error: adminError } = await supabaseClient
    .from('admin')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError || !adminData) {
    console.error("Access Denied: User is not an admin.");
    alert("غير مصرح لك بالدخول إلى هذه الصفحة.");

    // تسجيل خروجه فوراً وطرده لصفحة تسجيل الدخول
    await supabaseClient.auth.signOut();
    window.location.href = "sign-in.html";
    return;
  }

  // 3. إذا اجتاز الشروط، نحفظ بياناته ونعرض الواجهة الافتراضية
  currentUser = user;
  showDashboard(); // استدعاء الدالة الافتراضية عند نجاح الدخول
}
window.showDashboard = async function() {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.innerText = 'Admin Dashboard Statistics';
    container.innerHTML = '<p>جاري تحليل البيانات واستخراج الإحصائيات...</p>';

    try {
        // 1. جلب الأعداد الإجمالية (Users, Trips, Tickets)
        const { count: usersCount } = await supabaseClient.from('user').select('*', { count: 'exact', head: true });
        const { count: tripsCount } = await supabaseClient.from('trips').select('*', { count: 'exact', head: true });
        const { count: ticketsCount } = await supabaseClient.from('tickets').select('*', { count: 'exact', head: true });

        // 2. جلب كافة التذاكر لحساب الدخل الزمني
        const { data: allTickets, error: ticketsError } = await supabaseClient.from('tickets').select('departure_time, depart, arrive');

        if (ticketsError) throw ticketsError;

        // إعدادات الوقت
        const now = new Date();
        const startOfDay = new Date(now.setHours(0,0,0,0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // حساب الدخل (بافتراض 250 ريال لكل رحلة)
        const tripValue = 250;
        let dailyIncome = 0;
        let weeklyIncome = 0;
        let monthlyIncome = 0;

        // إحصائية إضافية: الوجهة الأكثر طلباً
        const destinationStats = {};

        allTickets.forEach(ticket => {
            const ticketDate = new Date(ticket.departure_time);
            
            // حساب الدخل
            if (ticketDate >= startOfDay) dailyIncome += tripValue;
            if (ticketDate >= startOfWeek) weeklyIncome += tripValue;
            if (ticketDate >= startOfMonth) monthlyIncome += tripValue;

            // تتبع الوجهات
            const dest = ticket.arrive;
            destinationStats[dest] = (destinationStats[dest] || 0) + 1;
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
        container.innerHTML = `<p style="color: red;">تعذر تحميل الإحصائيات: ${err.message}</p>`;
    }
}
window.fetchAdminTrips = async function() {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.innerText = 'Trips Management';
    container.innerHTML = '<p>جاري تحميل البيانات...</p>';

    try {
        const { data: trips, error: tripsError } = await supabaseClient.from('trips').select('*').order('departure_time', { ascending: true });
        if (tripsError) throw tripsError;

        const { data: trains, error: trainsError } = await supabaseClient.from('trains').select('*');
        if (trainsError) throw trainsError;

        const cities = ["Riyadh", "Jeddah", "Makkah", "Madina", "Dammam", "Al-Taif", "Abha"];
        let cityOptions = cities.map(c => `<option value="${c}">${c}</option>`).join('');

        let trainOptions = trains.map(t => {
            const statusLabel = t.stats ? '' : ' (تحت الصيانة)';
            return `<option value="${t.id}" data-seats="${t.seats}" data-stats="${t.stats}">Train ${t.id}${statusLabel}</option>`;
        }).join('');

        // بناء واجهة العرض
        let html = `
            <div style="margin-bottom: 20px;">
                <button class="sub-button" style="width: auto; background-color: #28a745; display: inline-flex; align-items: center; gap: 8px;" onclick="openModal('addTripModal')">
                    <i class='bx bx-plus'></i> إضافة رحلة جديدة
                </button>
            </div>
            <div id="tripsGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        `;

        trips.forEach(trip => {
            const departure = new Date(trip.departure_time).toLocaleString();
            const arrival = new Date(trip.arrival_time).toLocaleString();
            html += `
                <div class="trip-card" style="flex-direction: column; align-items: stretch;">
                    <div class="trip-info">
                        <h3 style="color: #0056b3; margin-bottom: 10px;">${trip.depart} ➔ ${trip.arrive}</h3>
                        <p><strong>Departure:</strong> ${departure}</p>
                        <p><strong>Arrival:</strong> ${arrival}</p>
                        <p><strong>Price:</strong> ${trip.price} SAR</p>
                        <p><strong>Seats:</strong> ${trip.seats} | <strong>Train:</strong> #${trip.train_id}</p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ffc107; color: #333;" onclick="openEditModal('${trip.id}')">تعديل</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;" onclick="openDeleteConfirm('${trip.id}')">إلغاء</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // إضافة المودالات (Add, Edit, Delete) أسفل الحاوية
        html += `
            <div id="addTripModal" class="hidden modal-overlay">${renderTripForm('add', cityOptions, trainOptions)}</div>
            <div id="editTripModal" class="hidden modal-overlay">${renderTripForm('edit', cityOptions, trainOptions)}</div>
            <div id="deleteConfirmModal" class="hidden modal-overlay">
                <div class="modal-box" style="max-width: 400px; text-align: center;">
                    <i class='bx bx-error-circle' style="font-size: 4em; color: #a90e0b;"></i>
                    <h2 style="margin: 15px 0;">تأكيد الإلغاء</h2>
                    <p>هل أنت متأكد من رغبتك في إلغاء هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmDeleteBtn" class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;">نعم، إلغاء</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ccc; color: #333;" onclick="closeModal('deleteConfirmModal')">تراجع</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        setupEventListeners();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color: red;">حدث خطأ: ${error.message}</p>`;
    }
};


window.fetchAdminTrips = async function() {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.innerText = 'Trips Management';
    container.innerHTML = '<p>جاري تحميل البيانات...</p>';

    try {
        const { data: trips, error: tripsError } = await supabaseClient.from('trips').select('*').order('departure_time', { ascending: true });
        if (tripsError) throw tripsError;

        const { data: trains, error: trainsError } = await supabaseClient.from('trains').select('*');
        if (trainsError) throw trainsError;

        const cities = ["Riyadh", "Jeddah", "Makkah", "Madina", "Dammam", "Al-Taif", "Abha"];
        let cityOptions = cities.map(c => `<option value="${c}">${c}</option>`).join('');

        // التعديل هنا: عرض اسم القطار (t.name) بدلاً من الـ ID
        let trainOptions = trains.map(t => {
            const statusLabel = t.stats ? '' : ' (تحت الصيانة)';
            const trainDisplayName = t.name || `Train ${t.id}`; // يستخدم الاسم إذا وجد، وإلا يطبع رقم القطار بشكل مرتب
            return `<option value="${t.id}" data-seats="${t.seats}" data-stats="${t.stats}">${trainDisplayName}${statusLabel}</option>`;
        }).join('');

        let html = `
            <div style="margin-bottom: 20px;">
                <button class="sub-button" style="width: auto; background-color: #28a745; display: inline-flex; align-items: center; gap: 8px;" onclick="openModal('addTripModal')">
                    <i class='bx bx-plus'></i> إضافة رحلة جديدة
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
                        <button class="sub-button" style="margin:0; flex:1; background-color: #0056b3;" onclick="openEditModal('${trip.id}')">تعديل</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;" onclick="openDeleteConfirm('${trip.id}')">إلغاء</button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // إضافة المودالات
        html += `
            <div id="addTripModal" class="hidden modal-overlay">${renderTripForm('add', cityOptions, trainOptions)}</div>
            <div id="editTripModal" class="hidden modal-overlay">${renderTripForm('edit', cityOptions, trainOptions)}</div>
            <div id="deleteConfirmModal" class="hidden modal-overlay">
                <div class="modal-box" style="max-width: 400px; text-align: center;">
                    <i class='bx bx-error-circle' style="font-size: 4em; color: #a90e0b;"></i>
                    <h2 style="margin: 15px 0;">تأكيد الإلغاء</h2>
                    <p>هل أنت متأكد من رغبتك في إلغاء هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmDeleteBtn" class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;">نعم، إلغاء</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ccc; color: #333;" onclick="closeModal('deleteConfirmModal')">تراجع</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        setupEventListeners();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color: red;">حدث خطأ: ${error.message}</p>`;
    }
};

function renderTripForm(type, cityOptions, trainOptions) {
    const isEdit = type === 'edit';
    const inputStyle = "width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; background-color: #fff;";

    return `
        <div class="modal-box">
            <h2 style="margin-bottom: 20px;">${isEdit ? 'تعديل بيانات الرحلة' : 'إضافة رحلة جديدة'}</h2>
            <form id="${type}TripForm">
                <input type="hidden" id="${type}-id">
                
                ${!isEdit ? `
                <div class="textInput">
                    <label>منطقة الخروج</label>
                    <select id="${type}-depart" required style="${inputStyle}">
                        <option value="" disabled selected>اختر المدينة</option>
                        ${cityOptions}
                    </select>
                </div>
                <div class="textInput">
                    <label>منطقة الوصول</label>
                    <select id="${type}-arrive" required style="${inputStyle}">
                        <option value="" disabled selected>اختر المدينة</option>
                        ${cityOptions}
                    </select>
                </div>
                ` : ''}
                
                <div class="textInput">
                    <label>القطار المستخدم</label>
                    <select id="${type}-train" required style="${inputStyle}">
                        <option value="" disabled selected>اختر القطار</option>
                        ${trainOptions}
                    </select>
                </div>
                
                <div class="textInput"><label>السعر (SAR)</label><input type="number" id="${type}-price" required min="1"></div>
                <div class="textInput"><label>وقت الإقلاع</label><input type="datetime-local" id="${type}-departure-time" required></div>
                <div class="textInput"><label>وقت الوصول</label><input type="datetime-local" id="${type}-arrival-time" required></div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="sub-button" style="margin: 0; flex: 1;">حفظ</button>
                    <button type="button" class="sub-button" style="margin: 0; flex: 1; background-color: #ccc; color: #333;" onclick="closeModal('${type}TripModal')">إغلاق</button>
                </div>
            </form>
        </div>
    `;
}

// إعداد المستمعات للأحداث
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
    if (error) alert("خطأ: " + error.message);
    else { alert("تمت العملية بنجاح"); closeModal(`${type}TripModal`); fetchAdminTrips(); }
}

// دالة فتح التعديل وتعبئة البيانات
window.openEditModal = async function(tripId) {
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

window.openDeleteConfirm = function(tripId) {
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


window.fetchTrains = async function() {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.innerText = 'Trains Management';
    container.innerHTML = '<p>جاري جلب بيانات القطارات...</p>';

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
            container.innerHTML = '<p>لا توجد قطارات مسجلة في النظام.</p>';
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
            const btnText = isWorking ? 'إرسال للصيانة' : 'إخراج من الصيانة';
            const statusText = isWorking ? '<span style="color: #28a745;">متاح</span>' : '<span style="color: #a90e0b;">تحت الصيانة</span>';

            const card = document.createElement('div');
            card.className = 'trip-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: #333;"><i class="bx bxs-train" style="color: #555;"></i> Train ${train.name}</h3>
                    <strong>${statusText}</strong>
                </div>
                <p style="margin-bottom: 10px;"><strong>السعة:</strong> ${train.seats || 0} مقعد</p>
                <p style="margin-bottom: 15px;"><strong>الرحلات الحالية:</strong> ${trainTripsCount} رحلة نشطة</p>
                
                <button class="sub-button" style="margin: 0; background-color: ${btnColor}; transition: 0.3s;" onclick="toggleTrainStatus('${train.id}', ${isWorking})">
                    ${btnText}
                </button>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color: red;">حدث خطأ: ${error.message}</p>`;
    }
}

window.toggleTrainStatus = async function(trainId, currentStatus) {
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

window.fetchCustomers = async function() {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.innerText = 'Customers & Tickets Management';
    container.innerHTML = '<p>جاري تحميل بيانات العملاء والتذاكر...</p>';

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
            container.innerHTML = '<p>لا توجد تذاكر محجوزة في النظام حالياً.</p>';
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
                        <h3 style="color: #0056b3; margin-bottom: 10px;"><i class="fa-solid fa-ticket"></i> تذكرة #${ticket.id.slice(0,8)}</h3>
                        <p><strong>العميل:</strong> ${customer.name}</p>
                        <p><strong>رقم الهوية:</strong> ${customer.national_id}</p>
                        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                        <p><strong>الرحلة:</strong> ${ticket.depart} ➔ ${ticket.arrive}</p>
                        <p><strong>وقت الإقلاع:</strong> ${departure}</p>
                    </div>
                    <div style="margin-top: 15px;">
                        <button class="sub-button" style="margin:0; width: 100%; background-color: #a90e0b;" onclick="openTicketDeleteConfirm('${ticket.id}', '${ticket.trip_id}')">إلغاء التذكرة</button>
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
                    <h2 style="margin: 15px 0;">تأكيد إلغاء التذكرة</h2>
                    <p>هل أنت متأكد من رغبتك في إلغاء هذه التذكرة؟ سيتم استرجاع المقعد للرحلة ولن يمكن التراجع عن هذا الإجراء.</p>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="confirmTicketDeleteBtn" class="sub-button" style="margin:0; flex:1; background-color: #a90e0b;">نعم، إلغاء التذكرة</button>
                        <button class="sub-button" style="margin:0; flex:1; background-color: #ccc; color: #333;" onclick="closeModal('deleteTicketModal')">تراجع</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

    } catch (error) {
        console.error("Error fetching customers/tickets:", error);
        container.innerHTML = `<p style="color: red;">حدث خطأ أثناء جلب البيانات: ${error.message}</p>`;
    }
};

// دالة التعامل مع حذف التذكرة من طرف الأدمن
window.openTicketDeleteConfirm = function(ticketId, tripId) {
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
            alert("حدث خطأ أثناء إلغاء التذكرة: " + error.message);
        }
    };
    
    // إظهار نافذة التأكيد
    openModal('deleteTicketModal');
};

toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close")
});



checkAuth();
