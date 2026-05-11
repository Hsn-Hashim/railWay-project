const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
const body = document.querySelector("body"),
      sidebar = body.querySelector(".sidebar"),
      toggle = body.querySelector(".toggle");
      let qrInstance = null;


let currentUser = null;

async function checkAuth() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (!user || error) {
        window.location.href = "sign-in.html";
        return;
    }
    
    currentUser = user;
    fetchTrips();
}
window.fetchTrips = async function(departFilter = "", arriveFilter = "") {
    const container = document.getElementById('Container');
    const head = document.getElementById('head');
    
    head.textContent = 'Available Trips';

    // 1. نبني الفلاتر + مكان للنتائج داخل الـ Container
    // استخدمنا شرط 삼 (ternary operator) عشان نحافظ على الخيار محدد بعد ما يضغط بحث
    container.innerHTML = `
        <div id="tripFilters" style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
            <select id="departSelect" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; flex: 1; font-size: 16px;">
                <option value="">منطقة الخروج (لا تحديد)</option>
                <option value="Riyadh" ${departFilter === 'Riyadh' ? 'selected' : ''}>Riyadh</option>
                <option value="Jeddah" ${departFilter === 'Jeddah' ? 'selected' : ''}>Jeddah</option>
                <option value="Makkah" ${departFilter === 'Makkah' ? 'selected' : ''}>Makkah</option>
                <option value="Madina" ${departFilter === 'Madina' ? 'selected' : ''}>Madina</option>
                <option value="Dammam" ${departFilter === 'Dammam' ? 'selected' : ''}>Dammam</option>
                <option value="Al-Taif" ${departFilter === 'Al-Taif' ? 'selected' : ''}>Al-Taif</option>
                <option value="Abha" ${departFilter === 'Abha' ? 'selected' : ''}>Abha</option>
            </select>
            
            <select id="arriveSelect" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; flex: 1; font-size: 16px;">
                <option value="">منطقة الوصول (لا تحديد)</option>
                <option value="Riyadh" ${arriveFilter === 'Riyadh' ? 'selected' : ''}>Riyadh</option>
                <option value="Jeddah" ${arriveFilter === 'Jeddah' ? 'selected' : ''}>Jeddah</option>
                <option value="Makkah" ${arriveFilter === 'Makkah' ? 'selected' : ''}>Makkah</option>
                <option value="Madina" ${arriveFilter === 'Madina' ? 'selected' : ''}>Madina</option>
                <option value="Dammam" ${arriveFilter === 'Dammam' ? 'selected' : ''}>Dammam</option>
                <option value="Al-Taif" ${arriveFilter === 'Al-Taif' ? 'selected' : ''}>Al-Taif</option>
                <option value="Abha" ${arriveFilter === 'Abha' ? 'selected' : ''}>Abha</option>
            </select>
            
            <button class="sub-button" style="width: auto; margin: 0; padding: 10px 20px;" onclick="fetchTrips(document.getElementById('departSelect').value, document.getElementById('arriveSelect').value)">بحث</button>
        </div>
        <div id="tripsList">
            <p>جاري البحث...</p>
        </div>
    `;

    const tripsList = document.getElementById('tripsList');

    // 2. بناء استعلام قاعدة البيانات بشكل ديناميكي (Dynamic Query)
    let dbQuery = supabaseClient.from('trips').select('*');

    // إذا اختار منطقة خروج، نضيفها للشرط
    if (departFilter) {
        dbQuery = dbQuery.eq('depart', departFilter);
    }
    
    // إذا اختار منطقة وصول، نضيفها للشرط
    if (arriveFilter) {
        dbQuery = dbQuery.eq('arrive', arriveFilter);
    }

    // 3. تنفيذ الاستعلام النهائي
    const { data: trips, error } = await dbQuery;

    if (error) {
        tripsList.innerHTML = `<p style="color:red;">خطأ في جلب الرحلات: ${error.message}</p>`;
        return;
    }

    if (trips.length === 0) {
        tripsList.innerHTML = `<p>لا توجد رحلات متاحة بهذه المواصفات حالياً.</p>`;
        return;
    }

    tripsList.innerHTML = '';

    // 4. عرض النتائج المفلترة
    trips.forEach(trip => {
        const departure = new Date(trip.departure_time).toLocaleString();
        const arrival = new Date(trip.arrival_time).toLocaleString();

        const card = document.createElement('div');
        card.className = 'trip-card';
        card.innerHTML = `
            <div class="trip-info">
                <h3 style="color: #0056b3; margin-bottom: 10px;">${trip.depart} ➔ ${trip.arrive}</h3>
                <p><strong>Departure:</strong> ${departure}</p>
                <p><strong>Arrival:</strong> ${arrival}</p>
                <p><strong>Price:</strong> ${trip.price} SAR</p>
            </div>
            <button class="sub-button" style="width: auto; padding: 10px 20px;" onclick="bookTrip('${trip.id}')">Book Now</button>
        `;
        tripsList.appendChild(card);
    });
}
document.getElementById('logOut').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "sign-in.html";
});

      toggle.addEventListener("click", () =>{
        sidebar.classList.toggle("close")
      });
async function activeBookings(){


    const { data: tickets, error } = await supabaseClient.from('tickets').select('*').eq('user_id',currentUser.id);
        const container = document.getElementById('Container');
         const head = document.getElementById('head');


     if (error) {
        container.innerHTML = `<p style="color:red;">Error occured!: ${error.message}</p>`;
        return;
    }
    
    const now = new Date();

const activeTickets = tickets.filter(ticket => {
    const ticketTime = new Date(ticket.departure_time); 
    return ticketTime > now;
});
head.textContent ='My Tickets';
if (activeTickets.length === 0){
    container.innerHTML = `<p>You don't active tickets now.</p>`;
    return;
}
container.innerHTML = '';
activeTickets.forEach(ticket => {
        const departure = new Date(ticket.departure_time).toLocaleString();

        const card = document.createElement('div');
        card.className = 'trip-card';
       card.innerHTML = `
    <div class="trip-info">
        <h3 style="color: #0056b3; margin-bottom: 10px;">${ticket.depart} ➔ ${ticket.arrive}</h3>
        <p><strong>Departure:</strong> ${departure}</p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="sub-button" style="margin: 0; width: 100%; padding: 10px 20px;" onclick="showQR('${ticket.id}','${ticket.depart}','${ticket.arrive}')">View Ticket</button>
        <button class="sub-button" style="margin: 0; width: 100%; padding: 10px 20px; background-color: #a90e0b;" onclick="deleteTicket('${ticket.id}')">Delete</button>
    </div>
`;
        container.appendChild(card);
    });
    

}

function showQR(ticketId) {
    // إظهار النافذة المنبثقة
    document.getElementById('qrPopup').classList.remove('hidden');

    const qrBox = document.getElementById('qrcodeBox');

    // إذا الباركود ما انطبع من قبل، ابنِه لأول مرة
    if (qrInstance === null) {
        qrInstance = new QRCode(qrBox, {
            text: ticketId, // النص اللي بيتحول لباركود (هنا حطينا رقم التذكرة)
            width: 200,     // العرض
            height: 200,    // الطول
            colorDark : "#000000", // لون الباركود
            colorLight : "#ffffff" // لون الخلفية
        });
    } else {
        // إذا مبني من قبل، امسح القديم وارسم الجديد برقم التذكرة الجديدة
        qrInstance.clear();
        qrInstance.makeCode(ticketId);
    }
}

function closeQR() {
    document.getElementById('qrPopup').classList.add('hidden');
}
async function deleteTicket(ticketId){
    const { data: deletedTicket, error: deleteError } = await supabaseClient
  .from('tickets')
  .delete()
  .eq('id', ticketId)
  .select()
  .single();
  if (deleteError) {
        console.error("Error deleting ticket:", deleteError);
        alert("حدث خطأ أثناء إلغاء التذكرة.");
        return; 
    }

    if (deletedTicket) {
        const tripId = deletedTicket.trip_id;
        const trip = await getTripById(tripId); 

        if (trip) {
            const newSeats = trip.seats + 1;

            const { error: updateError } = await supabaseClient
                .from('trips')
                .update({ seats: newSeats })
                .eq('id', tripId);

            if (updateError) {
                console.error("Error updating seats after deletion:", updateError);
            }
        }
    }
  await activeBookings();
  
}
async function BookingHistory(){


    const { data: tickets, error } = await supabaseClient.from('tickets').select('*').eq('user_id',currentUser.id);
        const container = document.getElementById('Container');
         const head = document.getElementById('head');


     if (error) {
        container.innerHTML = `<p style="color:red;">Error occured!: ${error.message}</p>`;
        return;
    }
    
    const now = new Date();

const activeTickets = tickets.filter(ticket => {
    const ticketTime = new Date(ticket.departure_time); 
    return ticketTime < now;
});
head.textContent ='My Ticket History';
if (activeTickets.length === 0){
    container.innerHTML = `<p>You don't any Previous tickets.</p>`;
    return;
}
container.innerHTML = '';
activeTickets.forEach(ticket => {
        const departure = new Date(ticket.departure_time).toLocaleString();

        const card = document.createElement('div');
        card.className = 'trip-card';
       card.innerHTML = `
    <div class="trip-info">
        <h3 style="color: #0056b3; margin-bottom: 10px;">${ticket.depart} ➔ ${ticket.arrive}</h3>
        <p><strong>Departure:</strong> ${departure}</p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="sub-button" style="margin: 0; width: 100%; padding: 10px 20px;" onclick="showQR('${ticket.id}','${ticket.depart}','${ticket.arrive}')">View Ticket</button>
    </div>
`;
        container.appendChild(card);
    });
    

}
async function getTripById(tripId) {
    // 1. الاتصال بجدول الرحلات والبحث عن الرحلة بالـ ID
    const { data: trip, error } = await supabaseClient
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single(); // نستخدم single لأننا نبي رحلة واحدة فقط، مو مصفوفة

    // 2. معالجة الأخطاء لو ما لقينا الرحلة
    if (error) {
        console.error("Error fetching trip:", error.message);
        return null;
    }

    // 3. إرجاع بيانات الرحلة عشان تستخدمها في مكان ثاني
    return trip;
}
window.showProfile = async function() {
    if (!currentUser) return;

    // استهداف الحاوية وتغيير العنوان الرئيسي
    const container = document.getElementById('Container'); 
    const head = document.getElementById('head');
    
    if (!container) {
        console.error("لم يتم العثور على حاوية Container.");
        return;
    }

    head.innerText = 'Profile Settings';
    container.innerHTML = '<p>جاري تحميل البيانات...</p>';

    // جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabaseClient
        .from('user')
        .select('name, national_id, phone, bDate')
        .eq('id', currentUser.id)
        .single();

    if (userError) {
        console.error("Error fetching user data:", userError);
        container.innerHTML = `<p style="color: red;">حدث خطأ في جلب بيانات المستخدم.</p>`;
        return;
    }

    // جلب عدد الحجوزات
    const { count: ticketsCount } = await supabaseClient
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

    // بناء النموذج وعرضه
    container.innerHTML = `
        <div style="display: flex; justify-content: center; width: 100%;">
            <form id="editProfileForm" class="trip-card" style="width: 100%; max-width: 500px; flex-direction: column; align-items: stretch; gap: 10px;">
                
                <div class="textInput">
                    <label>Full Name</label>
                    <input type="text" id="edit-name" value="${userData.name}" required>
                </div>
                
                <div class="textInput">
                    <label>National ID (غير قابل للتعديل)</label>
                    <input type="text" value="${userData.national_id}" disabled style="background-color: #f0f0f0; cursor: not-allowed;">
                </div>
                
                <div class="textInput">
                    <label>Phone Number</label>
                    <input type="tel" id="edit-phone" value="${userData.phone}" required>
                </div>
                
                <div class="textInput">
                    <label>Date of Birth</label>
                    <input type="date" id="edit-bdate" value="${userData.bDate}" required>
                </div>

                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
                <p style="color: #0056b3; font-size: 1.1em; margin-bottom: 15px;"><strong>Total Bookings:</strong> ${ticketsCount || 0}</p>
                
                <button type="submit" class="sub-button" style="margin: 0;">Save Changes</button>
            </form>
        </div>
    `;

    // تفعيل عملية التحديث عند إرسال النموذج
    document.getElementById('editProfileForm').addEventListener('submit', async function(event) {
        event.preventDefault(); // منع تحديث الصفحة

        const newName = document.getElementById('edit-name').value;
        const newPhone = document.getElementById('edit-phone').value;
        const newBdate = document.getElementById('edit-bdate').value;

        // إرسال البيانات الجديدة لقاعدة البيانات
        const { error: updateError } = await supabaseClient
            .from('user')
            .update({ 
                name: newName, 
                phone: newPhone, 
                bDate: newBdate 
            })
            .eq('id', currentUser.id);

        if (updateError) {
            console.error("Error updating profile:", updateError);
            alert("حدث خطأ أثناء حفظ التعديلات.");
        } else {
            alert("تم حفظ التعديلات بنجاح!");
            showProfile(); // إعادة تحميل الواجهة لعرض البيانات المحدثة
        }
    });
}
checkAuth();