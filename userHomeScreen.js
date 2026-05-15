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
      const { data: userData, error: userError } = await supabaseClient
    .from('user')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (userError || !userData) {
    console.error("Access Denied: User is not a user.");
    alert("you are now allowed to enter this page.");

    await supabaseClient.auth.signOut();
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

  
    container.innerHTML = `
        <div id="tripFilters" style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
            <select id="departSelect" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; flex: 1; font-size: 16px;">
                <option value="">Depart from (No selection)</option>
                <option value="Riyadh" ${departFilter === 'Riyadh' ? 'selected' : ''}>Riyadh</option>
                <option value="Jeddah" ${departFilter === 'Jeddah' ? 'selected' : ''}>Jeddah</option>
                <option value="Makkah" ${departFilter === 'Makkah' ? 'selected' : ''}>Makkah</option>
                <option value="Madina" ${departFilter === 'Madina' ? 'selected' : ''}>Madina</option>
                <option value="Dammam" ${departFilter === 'Dammam' ? 'selected' : ''}>Dammam</option>
                <option value="Al-Taif" ${departFilter === 'Al-Taif' ? 'selected' : ''}>Al-Taif</option>
                <option value="Abha" ${departFilter === 'Abha' ? 'selected' : ''}>Abha</option>
            </select>
            
            <select id="arriveSelect" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; flex: 1; font-size: 16px;">
                <option value="">Arrive to (No selection)</option>
                <option value="Riyadh" ${arriveFilter === 'Riyadh' ? 'selected' : ''}>Riyadh</option>
                <option value="Jeddah" ${arriveFilter === 'Jeddah' ? 'selected' : ''}>Jeddah</option>
                <option value="Makkah" ${arriveFilter === 'Makkah' ? 'selected' : ''}>Makkah</option>
                <option value="Madina" ${arriveFilter === 'Madina' ? 'selected' : ''}>Madina</option>
                <option value="Dammam" ${arriveFilter === 'Dammam' ? 'selected' : ''}>Dammam</option>
                <option value="Al-Taif" ${arriveFilter === 'Al-Taif' ? 'selected' : ''}>Al-Taif</option>
                <option value="Abha" ${arriveFilter === 'Abha' ? 'selected' : ''}>Abha</option>
            </select>
            
            <button class="sub-button" style="width: auto; margin: 0; padding: 10px 20px;" onclick="fetchTrips(document.getElementById('departSelect').value, document.getElementById('arriveSelect').value)">Search</button>
        </div>
        <div id="tripsList">
            <p>Searching...</p>
        </div>
    `;

    const tripsList = document.getElementById('tripsList');

    let dbQuery = supabaseClient.from('trips').select('*');

    if (departFilter) {
        dbQuery = dbQuery.eq('depart', departFilter);
    }
    
    if (arriveFilter) {
        dbQuery = dbQuery.eq('arrive', arriveFilter);
    }

    const { data: trips, error } = await dbQuery;

    if (error) {
        tripsList.innerHTML = `<p style="color:red;">Error while fetching: ${error.message}</p>`;
        return;
    }

    if (trips.length === 0) {
        tripsList.innerHTML = `<p>No trips found.</p>`;
        return;
    }

    tripsList.innerHTML = '';

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
                <p><strong>Available seats:</strong> ${trip.seats} </p>

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
window.bookTrip = async function(tripId) {
    if (!currentUser) return;

    const trip = await getTripById(tripId);
    if (!trip) {
        console.error("No trip found");
        return;
    }

    if (trip.seats <= 0) {
        alert("Sorry! No Available seats.");
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
        console.error("Booking Error:", error);
        alert("Error occured while booking.");
    } else {
        const newSeats = trip.seats - 1;
        const { error: seatError } = await supabaseClient
            .from('trips')
            .update({ seats: newSeats })
            .eq('id', tripId);

        if (seatError) {
            console.error("Seat Update Error:", seatError);
            return;
        }

        alert("A Ticket has been booked sccessfully!\nCheck your ticket in tickets page.");
        fetchTrips();
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
        alert("Error occured!\nFailed to delete the ticket");
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
    const { data: trip, error } = await supabaseClient
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single(); 

    if (error) {
        console.error("Error fetching trip:", error.message);
        return null;
    }

    return trip;
}
window.showProfile = async function() {
    if (!currentUser) return;

    const container = document.getElementById('Container'); 
    const head = document.getElementById('head');
    
    if (!container) {
        console.error("لم يتم العثور على حاوية Container.");
        return;
    }

    head.innerText = 'Profile Settings';
    container.innerHTML = '<p>Loading...</p>';

    const { data: userData, error: userError } = await supabaseClient
        .from('user')
        .select('name, national_id, phone, bDate')
        .eq('id', currentUser.id)
        .single();

    if (userError) {
        console.error("Error fetching user data:", userError);
        container.innerHTML = `<p style="color: red;">failed to get user data.</p>`;
        return;
    }

    const { count: ticketsCount } = await supabaseClient
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

    container.innerHTML = `
        <div style="display: flex; justify-content: center; width: 100%;">
            <form id="editProfileForm" class="trip-card" style="width: 100%; max-width: 500px; flex-direction: column; align-items: stretch; gap: 10px;">
                
                <div class="textInput">
                    <label>Full Name</label>
                    <input type="text" id="edit-name" value="${userData.name}" required>
                </div>
                
                <div class="textInput">
                    <label>National ID (Unchangeable)</label>
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

    document.getElementById('editProfileForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const newName = document.getElementById('edit-name').value;
        const newPhone = document.getElementById('edit-phone').value;
        const newBdate = document.getElementById('edit-bdate').value;

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
            alert("Error while making the edit.");
        } else {
            alert("sccessfully edited!");
            showProfile(); 
        }
    });
}
checkAuth();