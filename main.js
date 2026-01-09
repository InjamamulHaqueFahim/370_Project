// ================= GLOBAL CONFIG =================
const API_BASE = "http://localhost:3000";
const STUDENT_ID = 101;

// ================= RUN ON PAGE LOAD =================
document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  initStudentDashboard();
  initMoodLog();
  initHabitTracker();
  initAppointments();
  initProfessionalDashboard();
  initAdminDashboard();
  initResourceSearch();
  initAnalyticsCharts();
  initNotifications();
  initRecommendations();
  initWeeklyHabitSummary();

});
document.addEventListener("DOMContentLoaded", initAnalyticsCharts);

// ================= LOGIN =================
function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const role = document.getElementById("role").value;
    if (!role) return alert("Select a role");

    if (role === "student") location.href = "student_dashboard.html";
    if (role === "professional") location.href = "professional_dashboard.html";
    if (role === "admin") location.href = "admin_dashboard.html";
  });
}

// ================= STUDENT DASHBOARD =================
function initStudentDashboard() {
  const moodEl = document.getElementById("dashboard-mood-summary");
  if (!moodEl) return;

  fetch(`${API_BASE}/mood-log/${STUDENT_ID}`)
    .then(r => r.json())
    .then(data => {
      if (data.length === 0) {
        moodEl.textContent = "No mood logged today.";
      } else {
        const today = new Date().toISOString().split("T")[0];
        const todayLog = data.find(log => log.log_date === today);

        if (!todayLog) {
          moodEl.textContent = "No mood logged today.";
        } else {
          moodEl.textContent = `Mood ${todayLog.mood_rating}/5, Stress ${todayLog.stress_level}`;
        }

      }
    });
}

// ==================== MOOD LOG FEATURE ====================
// This function handles the mood logging page functionality
// Students can record their daily mood, stress, energy, sleep, and emotions

/**
 * initMoodLog()
 * Purpose: Initialize the mood log page with form submission and data loading
 * Called by: DOMContentLoaded event listener when mood_log.html loads
 * 
 * Features:
 * - Loads and displays previous mood logs
 * - Handles form submission to save new mood logs
 * - Maps text values to numeric codes for database storage
 */
function initMoodLog() {
  // Get references to DOM elements
  // getElementById() returns the element with the specified ID, or null if not found
  const form = document.getElementById("mood-form");      // The form element
  const list = document.getElementById("mood-log-list");  // The <ul> to display logs

  // Early return pattern: If elements don't exist, we're not on the mood log page
  // This prevents errors when this function runs on other pages
  if (!form || !list) return;

  // Mapping objects: Convert dropdown text values to numeric codes
  // The database stores numbers, but the UI shows text for better UX
  const stressMap = { Low: 1, Medium: 2, High: 3 };      // Stress level mapping
  const sleepMap = { Poor: 1, Average: 2, Good: 3 };     // Sleep quality mapping

  /**
   * load()
   * Inner function to fetch and display mood logs from the API
   * Called when page loads and after saving a new log
   */
  function load() {
    // Fetch mood logs from the backend API
    // fetch() returns a Promise that resolves to the Response object
    // Template literal `${}` inserts the STUDENT_ID into the URL
    fetch(`${API_BASE}/mood-log/${STUDENT_ID}`)
      .then(r => r.json())  // Parse the JSON response body
      .then(data => {       // data is now an array of mood log objects
        // Clear the existing list before adding new items
        list.innerHTML = "";

        // Loop through each mood log and create a list item
        // forEach() executes a function for each element in the array
        data.forEach(log => {
          // Create a new <li> element
          const li = document.createElement("li");

          // Set the text content using template literals
          // Displays: "2026-01-06 | Mood 4 | Stress 2"
          li.textContent = `${log.log_date} | Mood ${log.mood_rating} | Stress ${log.stress_level}`;

          // Add the <li> to the <ul>
          list.appendChild(li);
        });
      });
  }

  /**
   * Form submission event handler
   * Triggered when user clicks "Save Mood Log" button
   */
  form.addEventListener("submit", async e => {
    // Prevent default form submission behavior (page reload)
    e.preventDefault();

    // Build the payload object to send to the API
    // This collects all form field values and formats them for the backend
    const payload = {
      std_id: STUDENT_ID,  // Global constant defined at top of file

      // Get today's date in YYYY-MM-DD format
      // new Date() creates a Date object for current time
      // toISOString() converts to "2026-01-06T15:30:00.000Z" format
      // split("T")[0] takes only the date part before the "T"
      log_date: new Date().toISOString().split("T")[0],

      // Get mood rating value and convert to number
      // getElementById() gets the <select> element
      // .value gets the selected option's value
      // Number() converts string to number
      mood_rating: Number(document.getElementById("mood-rating").value),

      // Get stress level text and map to number using stressMap
      // Example: "Low" becomes 1, "Medium" becomes 2, "High" becomes 3
      stress_level: stressMap[document.getElementById("stress-level").value],

      // Get energy level and convert to number
      energy_level: Number(document.getElementById("energy-level").value),

      // Get sleep quality text and map to number using sleepMap
      sleep_quantity: sleepMap[document.getElementById("sleep-quality").value],

      // Get emotion tag as string (no conversion needed)
      emotional_status: document.getElementById("emotion").value,

      // Get notes text from textarea
      notes: document.getElementById("note").value
    };

    // Send POST request to save the mood log
    // await pauses execution until the Promise resolves
    await fetch(`${API_BASE}/mood-log`, {
      method: "POST",                              // HTTP method
      headers: { "Content-Type": "application/json" },  // Tell server we're sending JSON
      body: JSON.stringify(payload)                // Convert JavaScript object to JSON string
    });

    // Reset the form to clear all input fields
    form.reset();

    // Reload the mood logs to show the newly added entry
    load();

    // Show success message to user
    alert("Mood saved");
  });

  // Load mood logs when page first loads
  load();
}

// ==================== HABIT TRACKER FEATURE ====================
// This function handles the daily habit tracking functionality
// Students can check off which healthy habits they completed today

/**
 * initHabitTracker()
 * Purpose: Initialize the habit tracker page with habit list and form submission
 * Called by: DOMContentLoaded event listener when habit_tracker.html loads
 * 
 * Current Implementation: Uses static/hardcoded habits for demo purposes
 * Future Enhancement: Fetch habits from GET /habits API endpoint
 */
function initHabitTracker() {
  const habitForm = document.getElementById("habit-form");
  const habitList = document.getElementById("habit-list");

  if (!habitForm || !habitList) return;

  const today = new Date().toISOString().split("T")[0];

  // Fetch habits and logged habits concurrently
  Promise.all([
    fetch(`${API_BASE}/habits`).then(res => res.json()),
    fetch(`${API_BASE}/habit-log/${STUDENT_ID}?log_date=${today}`).then(res => res.json())
  ])
    .then(([allHabits, loggedHabits]) => {
      habitList.innerHTML = "";

      // Create a Set of completed habit IDs for fast lookup
      const completedIds = new Set(loggedHabits.map(log => log.habit_id));

      allHabits.forEach(habit => {
        const isChecked = completedIds.has(habit.habit_id) ? "checked" : "";
        const li = document.createElement("li");
        li.innerHTML = `
          <label>
            <input type="checkbox" value="${habit.habit_id}" ${isChecked}>
            ${habit.habit_name}
          </label>
        `;
        habitList.appendChild(li);
      });
    })
    .catch(err => console.error("Failed to load habits:", err));

  habitForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const checkedInputs = habitList.querySelectorAll("input[type='checkbox']:checked");

    const habit_ids = Array.from(checkedInputs).map(input => Number(input.value));
    const payload = {
      std_id: STUDENT_ID,
      habit_ids: habit_ids,
      log_date: today
    };

    try {
      const res = await fetch(`${API_BASE}/habit-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Habits updated successfully!");
      } else {
        throw new Error("Failed to save habits");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving habits. Please try again.");
    }
  });
}



// ==================== APPOINTMENTS FEATURE ====================
// This function handles appointment booking and viewing
// Students can book appointments with wellness professionals and view their status

/**
 * initAppointments()
 * Purpose: Initialize the appointments page with booking form and appointments list
 * Called by: DOMContentLoaded event listener when appointments.html loads
 * 
 * Features:
 * - Toggle visibility of booking form
 * - Submit new appointment bookings
 * - Load and display existing appointments
 */
function initAppointments() {
  // Get references to DOM elements
  const form = document.getElementById("appointment-form");          // Booking form
  const list = document.getElementById("appointment-list");          // Appointments list
  const toggleBtn = document.getElementById("new-appointment-toggle"); // Toggle button
  const section = document.getElementById("new-appointment-section"); // Form container

  /**
   * Toggle button click handler
   * Shows/hides the booking form when button is clicked
   */
  toggleBtn.addEventListener("click", () => {
    // Ternary operator: condition ? valueIfTrue : valueIfFalse
    // If section is hidden ("none"), show it ("block"), otherwise hide it ("none")
    section.style.display = section.style.display === "none" ? "block" : "none";
  });

  /**
   * loadAppointments()
   * Async function to fetch and display appointments from the API
   * Called when page loads and after booking a new appointment
   */
  async function loadAppointments() {
    // Fetch appointments for the current student
    // await pauses execution until the Promise resolves
    const res = await fetch(`${API_BASE}/appointments/${STUDENT_ID}`);

    // Parse the JSON response
    const data = await res.json();

    // Clear existing list items
    list.innerHTML = "";

    // Handle empty state: Show message if no appointments exist
    if (data.length === 0) {
      list.innerHTML = "<li>No upcoming appointments.</li>";
      return;  // Exit function early
    }

    // Loop through appointments and create list items
    // forEach() executes a function for each appointment
    data.forEach(a => {
      // Create a new <li> element
      const li = document.createElement("li");

      // Set text content with appointment details
      // Template literal formats: "2026-01-10 14:00 – Dr. Rahman (Pending)"
      li.textContent = `${a.appointment_date} ${a.appointment_time} – ${a.professional_name} (${a.status})`;

      // Add to the list
      list.appendChild(li);
    });
  }

  /**
   * Form submission event handler
   * Triggered when user clicks "Confirm Booking" button
   */
  form.addEventListener("submit", async e => {
    // Prevent default form submission behavior
    e.preventDefault();

    // Build the payload object with form data
    // Each field is extracted from its corresponding input element
    const payload = {
      std_id: STUDENT_ID,  // Current student ID

      // Get value from appointment type dropdown
      appointment_type: document.getElementById("ap-type").value,

      // Get professional name from text input
      professional_name: document.getElementById("ap-name").value,

      // Get date from date picker (format: YYYY-MM-DD)
      appointment_date: document.getElementById("ap-date").value,

      // Get time from time picker (format: HH:MM)
      appointment_time: document.getElementById("ap-time").value,

      // Get optional reason from textarea
      reason: document.getElementById("ap-reason").value
    };

    // Send POST request to create the appointment
    await fetch(`${API_BASE}/appointments`, {
      method: "POST",                              // HTTP POST method
      headers: { "Content-Type": "application/json" },  // JSON content type
      body: JSON.stringify(payload)                // Convert object to JSON string
    });

    // Show success message
    alert("Appointment booked!");

    // Reset form fields to empty
    form.reset();

    // Hide the booking form
    section.style.display = "none";

    // Reload appointments list to show the new appointment
    loadAppointments();
  });

  // Load appointments when page first loads
  loadAppointments();
}


// ================= PROFESSIONAL DASHBOARD =================
function initProfessionalDashboard() {
  const list = document.getElementById("pro-today-appointments");
  if (!list) return;

  fetch(`${API_BASE}/professional/today`)
    .then(res => res.json())
    .then(data => {
      list.innerHTML = "";

      if (!data.length) {
        list.innerHTML = "<li>No appointments scheduled for today.</li>";
        return;
      }

      data.forEach(ap => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${ap.appointment_time}</strong> – ${ap.professional_name}
          <br>Status: <em>${ap.status}</em>
          <br>
          <button onclick="updateAppointmentStatus(${ap.appoint_id}, 'Approved')">Approve</button>
          <button onclick="updateAppointmentStatus(${ap.appoint_id}, 'Cancelled')">Reject</button>
        `;
        list.appendChild(li);
      });
    });
}


function updateStatus(id, status) {
  fetch(`${API_BASE}/appointments/status/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  }).then(() => location.reload());
}






// ==================== RESOURCES FEATURE ====================
// This function handles the wellness resources page
// Students can search and browse self-help materials

/**
 * initResourceSearch()
 * Purpose: Initialize the search functionality on the resources page
 * Called by: DOMContentLoaded event listener when resources.html loads
 * 
 * Features:
 * - Real-time search/filter of resource cards
 * - Case-insensitive text matching
 * - Shows/hides cards based on search query
 */
function initResourceSearch() {
  // Get reference to the search input element
  const input = document.getElementById("resource-search");

  // Early return: Only run on resources page
  if (!input) return;

  // Get all resource cards on the page
  // querySelectorAll() returns a NodeList of all elements with class "resource-card"
  const cards = document.querySelectorAll(".resource-card");

  /**
   * Input event listener
   * Triggered every time the user types in the search box
   * This provides real-time filtering as the user types
   */
  input.addEventListener("input", () => {
    // Get the current search query and convert to lowercase
    // toLowerCase() makes the search case-insensitive
    const q = input.value.toLowerCase();

    // Loop through each resource card
    // forEach() executes a function for each card
    cards.forEach(c => {
      // Check if the card's text content includes the search query
      // textContent gets all text inside the element (title, description, category)
      // includes() returns true if the text contains the query
      const matches = c.textContent.toLowerCase().includes(q);

      // Show or hide the card based on whether it matches
      // Ternary operator: if matches, display as "block", otherwise "none"
      c.style.display = matches ? "block" : "none";
    });
  });
}

// ================= ANALYTICS =================
// ================= ANALYTICS =================
function initAnalyticsCharts() {
  // ===== MOOD TREND =====
  const moodCanvas = document.getElementById("moodChart");
  if (moodCanvas && typeof Chart !== "undefined") {
    fetch(`${API_BASE}/mood-log/${STUDENT_ID}`)
      .then(r => r.json())
      .then(logs => {
        // fallback sample data if DB empty
        const data = logs.length ? logs : [
          { log_date: "Mon", mood_rating: 3 },
          { log_date: "Tue", mood_rating: 4 },
          { log_date: "Wed", mood_rating: 2 },
          { log_date: "Thu", mood_rating: 4 },
          { log_date: "Fri", mood_rating: 5 }
        ];

        new Chart(moodCanvas, {
          type: "line",
          data: {
            labels: data.map(l => l.log_date),
            datasets: [{
              label: "Mood Trend",
              data: data.map(l => l.mood_rating),
              borderWidth: 2
            }]
          }
        });
      })
      .catch(console.error);
  }

  // ===== HABIT COMPLETION =====
  const habitCanvas = document.getElementById("habitChart");
  if (habitCanvas && typeof Chart !== "undefined") {
    new Chart(habitCanvas, {
      type: "bar",
      data: {
        labels: ["Sleep", "Exercise", "Water", "Study", "Meditation"],
        datasets: [{
          label: "Completion %",
          data: [80, 60, 90, 70, 50]
        }]
      }
    });
  }

  // ===== STRESS BREAKDOWN =====
  const stressCanvas = document.getElementById("stressChart");
  if (stressCanvas && typeof Chart !== "undefined") {
    new Chart(stressCanvas, {
      type: "pie",
      data: {
        labels: ["Low", "Medium", "High"],
        datasets: [{
          data: [4, 3, 2]
        }]
      }
    });
  }
}

function initNotifications() {
  const list = document.getElementById("notification-list");
  if (!list) return;

  fetch(`${API_BASE}/notifications/${STUDENT_ID}`)
    .then(res => res.json())
    .then(data => {
      list.innerHTML = "";

      if (!data.length) {
        list.innerHTML = "<li>No notifications</li>";
        return;
      }

      data.forEach(n => {
        const li = document.createElement("li");
        li.textContent = n.msg;

        if (!n.is_read) {
          li.style.fontWeight = "bold";
          li.addEventListener("click", async () => {
            await fetch(`${API_BASE}/notifications/read/${n.n_id}`, {
              method: "PUT"
            });
            li.style.fontWeight = "normal";
          });
        }

        list.appendChild(li);
      });
    });
}
function initRecommendations() {
  const box = document.getElementById("recommendation-text");
  if (!box) return;

  fetch(`${API_BASE}/mood-log/${STUDENT_ID}`)
    .then(res => res.json())
    .then(logs => {
      if (!logs.length) return;

      const latest = logs[0];
      let messages = [];

      if (latest.stress_level === 3) {
        messages.push("You seem stressed. Consider reviewing exam stress management resources.");
      }

      if (latest.sleep_quantity === 1) {
        messages.push("Poor sleep detected. Try improving your sleep routine.");
      }

      if (latest.mood_rating <= 2) {
        messages.push("It's okay to have a bad day. Take a short break and be kind to yourself.");
      }

      box.textContent = messages.length
        ? messages.join(" ")
        : "You're doing well! Keep maintaining your healthy habits.";
    });
}

function initWeeklyHabitSummary() {
  const el = document.getElementById("weekly-habit-summary");
  if (!el) return;

  fetch(`${API_BASE}/habits`)
    .then(res => res.json())
    .then(habits => {
      const totalHabits = habits.length;

      fetch(`${API_BASE}/habit-log/${STUDENT_ID}`)
        .then(res => res.json())
        .then(logs => {
          const completed = logs.length;
          const percent = totalHabits
            ? Math.round((completed / (totalHabits * 7)) * 100)
            : 0;

          el.textContent = `You completed approximately ${percent}% of your habits this week.`;
        });
    });
}

function updateAppointmentStatus(appointId, newStatus) {
  fetch(`${API_BASE}/appointments/status/${appointId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  })
    .then(res => res.json())
    .then(() => {
      alert(`Appointment ${newStatus}`);
      initProfessionalDashboard(); // refresh list
    })
    .catch(err => {
      console.error(err);
      alert("Failed to update status");
    });
}
function initAdminDashboard() {
  const studentCount = document.getElementById("student-count");
  const professionalCount = document.getElementById("professional-count");
  const appointmentCount = document.getElementById("appointment-count");

  // If we're not on admin dashboard, stop
  if (!studentCount || !professionalCount || !appointmentCount) return;

  fetch(`${API_BASE}/admin/stats`)
    .then(r => r.json())
    .then(data => {
      studentCount.textContent = data.students;
      professionalCount.textContent = data.professionals;
      appointmentCount.textContent = data.appointments;
    })
    .catch(err => {
      console.error("Failed to load admin stats:", err);
    });
}



//DEMO FLOW (remember this)
//Login as student → show mood + habits
//Book appointment → show pending
//Login as professional → approve
//Back to student → status updated
//Show analytics + recommendation
//Admin dashboard → stats

// cd ~/Documents/370\ project/campus-wellness_frontend/sql
//ls
// mysql -u root -p campus_wellness < schema.sql
//USE campus_wellness;
//SHOW TABLES;
//in another terminal 
//cd ~/Documents/370\ project/backend
//node server.js                     



