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
checkAuth();