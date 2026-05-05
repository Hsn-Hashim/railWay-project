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

async function fetchTrips() {
        head.textContent ='Available Trips';

    const { data: trips, error } = await supabaseClient.from('trips').select('*');
    const container = document.getElementById('Container');
    
    if (error) {
        container.innerHTML = `<p style="color:red;">خطأ في جلب الرحلات: ${error.message}</p>`;
        return;
    }

    if (trips.length === 0) {
        container.innerHTML = `<p>لا توجد رحلات متاحة حالياً.</p>`;
        return;
    }

    container.innerHTML = '';

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
                <button class="sub-button" style="width: auto; padding: 10px 20px;" onclick="bookTrip('${trip.id}')">Book Now</button>        `;
        container.appendChild(card);
    });
}
window.bookTrip = async function(tripId) {
    if (!currentUser) return;
    const trip = await getTripById(tripId);
    if (!trip) {
        console.error("no trip found");
        return;
    }
    if (trip.seats === 0){
        alert("Seats is full");
        return;
    }
  
    const { error } = await supabaseClient.from('tickets').insert([
        { 
            user_id: currentUser.id, 
            trip_id: trip.id, 
            departure_time: trip.departure_time, 
            depart: trip.depart, 
            arrive: trip.arrive 
        }
    ]);

    if (error) {
        console.error(error);
        alert("فشل الحجز: تأكد من أنك لم تحجز هذه الرحلة مسبقاً أو راجع الـ Console.");
    } else {

          const newSeats = trip.seats -1;
    const {data, error: SeatError} = await supabaseClient.from('trips').update({seats: newSeats}).eq('id', tripId) ;
    if (SeatError) {
        console.error("something went wrong");
        return;
        
    }
    alert("Bookins is made sccessfully")
    }
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
    const { data, error } = await supabaseClient
  .from('tickets')
  .delete()
  .eq('id', ticketId)
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
    head.textContent ='Profile Page';

    // 1. استهداف الحاوية عن طريق الـ id مباشرة (تأكد إن هذا هو اسم الـ id عندك)
    const container = document.getElementById('Container'); 
    
    if (!container) {
        console.error("لم يتم العثور على الحاوية. تأكد من مطابقة اسم الـ id.");
        return;
    }

    // 2. تفريغ الحاوية وبناء مساحة معزولة (padding بدل الأبعاد الكبيرة عشان ما نغطي السايد بار)
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 40px 20px;">
            <h2 style="margin-bottom: 20px;">Profile</h2>
            <div id="profile-content-box" style="width: 100%; max-width: 500px;">
                <!-- سيتم عرض الكرت هنا -->
            </div>
        </div>
    `;

    // 3. جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabaseClient
        .from('user')
        .select('name, national_id, phone, bDate')
        .eq('id', currentUser.id)
        .single();

    if (userError) {
        console.error("Error fetching user data:", userError);
        document.getElementById('profile-content-box').innerHTML = `<p style="color: red;">حدث خطأ في جلب بيانات المستخدم.</p>`;
        return;
    }

    // 4. جلب عدد الحجوزات
    const { count: ticketsCount } = await supabaseClient
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

    // 5. حساب العمر
    const birthDate = new Date(userData.bDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    // 6. بناء الكرت وعرضه
    const profileCard = document.createElement('div');
    profileCard.className = 'trip-card';
    profileCard.style.width = '100%'; 
    
    profileCard.innerHTML = `
        <div class="trip-info" style="font-size: 1.1em; line-height: 1.8;">
            <p style="margin-bottom: 10px;"><strong>Name:</strong> ${userData.name}</p>
            <p style="margin-bottom: 10px;"><strong>National ID:</strong> ${userData.national_id}</p>
            <p style="margin-bottom: 10px;"><strong>Phone:</strong> ${userData.phone}</p>
            <p style="margin-bottom: 10px;"><strong>Age:</strong> ${age} Years</p>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ddd;">
            <p style="color: #0056b3; font-size: 1.2em;"><strong>Total Bookings:</strong> ${ticketsCount || 0}</p>
        </div>
    `;

    document.getElementById('profile-content-box').appendChild(profileCard);
}
checkAuth();