const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
const body = document.querySelector("body"),
      sidebar = body.querySelector(".sidebar"),
      toggle = body.querySelector(".toggle");

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
            <button class="sub-button" style="width: auto; padding: 10px 20px;" onclick="bookTrip('${trip.id}')">Book Now</button>
        `;
        container.appendChild(card);
    });
}

window.bookTrip = async function(tripId) {
    if (!currentUser) return;

    const { error } = await supabaseClient.from('tickets').insert([
        { user_id: currentUser.id, trip_id: tripId }
    ]);

    if (error) {
        console.error(error);
        alert("فشل الحجز: تأكد من أنك لم تحجز هذه الرحلة مسبقاً أو راجع الـ Console.");
    } else {
        alert("تم الحجز بنجاح!");
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
        <button class="sub-button" style="margin: 0; width: 100%; padding: 10px 20px;" onclick="showQR('${ticket.id}')">View Ticket</button>
        <button class="sub-button" style="margin: 0; width: 100%; padding: 10px 20px; background-color: #a90e0b;" onclick="deleteTicket('${ticket.id}')">Delete</button>
    </div>
`;
        container.appendChild(card);
    });
    

}
      

checkAuth();