const express = require("express");
const cors = require("cors");
const pool = require("./db"); //to import database connection

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- HEALTH CHECK --------------------
app.get("/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({ status: "OK", database: "connected", result: rows[0].result });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: err.message });
  }
});

// ==================== MOOD LOG ENDPOINTS ====================
// These endpoints handle daily mood tracking for students
// Students can log their mood, stress, energy, sleep quality, and emotions

/**
 * POST /mood-log
 * Purpose: Save a new mood log entry for a student
 * 
 * Request Body (JSON):
 * {
 *   std_id: number,           // Student ID (required)
 *   log_date: string,         // Date in YYYY-MM-DD format (required)
 *   mood_rating: number,      // Mood scale 1-5 (optional)
 *   stress_level: number,     // Stress: 1=Low, 2=Medium, 3=High (optional)
 *   energy_level: number,     // Energy scale 1-5 (optional)
 *   sleep_quantity: number,   // Sleep: 1=Poor, 2=Average, 3=Good (optional)
 *   emotional_status: string, // Emotion tag like "Calm", "Anxious" (optional)
 *   notes: string            // Free text notes (optional)
 * }
 * 
 * Response:
 * - 201: { message: "Mood log saved" }
 * - 400: { message: "std_id and log_date are required" }
 * - 500: { message: "error message" }
 * 
 * Database: Inserts into Mood_log table
 */
app.post("/mood-log", async (req, res) => {
  try {
    // Destructure all fields from request body
    // This extracts the JSON data sent from the frontend
    const {
      std_id,              // Student ID
      log_date,            // Date of the mood log
      mood_rating,         // How the student feels (1-5)
      stress_level,        // Stress level (1-3)
      energy_level,        // Energy level (1-5)
      sleep_quantity,      // Sleep quality (1-3)
      emotional_status,    // Emotion tag (e.g., "Calm")
      notes,              // Optional notes
    } = req.body;

    // Validation: Ensure required fields are present
    // std_id and log_date are mandatory for tracking who logged what and when
    if (!std_id || !log_date) {
      return res.status(400).json({ message: "std_id and log_date are required" });
    }

    // SQL INSERT statement with placeholders (?)
    // Placeholders prevent SQL injection attacks
    const sql = `
      INSERT INTO Mood_log
      (std_id, log_date, mood_rating, stress_level, energy_level, sleep_quantity, emotional_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the SQL query with parameterized values
    // pool.execute() safely inserts values into placeholders
    // The ?? operator (nullish coalescing) sets undefined values to null
    // This allows optional fields to be stored as NULL in the database
    await pool.execute(sql, [
      std_id,                    // First ? placeholder
      log_date,                  // Second ? placeholder
      mood_rating ?? null,       // If undefined, store NULL
      stress_level ?? null,      // If undefined, store NULL
      energy_level ?? null,      // If undefined, store NULL
      sleep_quantity ?? null,    // If undefined, store NULL
      emotional_status ?? null,  // If undefined, store NULL
      notes ?? null,            // If undefined, store NULL
    ]);

    // Send success response with 201 status (Created)
    res.status(201).json({ message: "Mood log saved" });
  } catch (err) {
    // If any error occurs (database error, etc.), send 500 status
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /mood-log/:std_id
 * Purpose: Retrieve all mood logs for a specific student
 * 
 * URL Parameter:
 * - std_id: Student ID (e.g., /mood-log/101)
 * 
 * Response:
 * - 200: Array of mood log objects, ordered by date (newest first)
 *   Example: [
 *     {
 *       log_id: 1,
 *       std_id: 101,
 *       log_date: "2026-01-06",
 *       mood_rating: 4,
 *       stress_level: 2,
 *       energy_level: 3,
 *       sleep_quantity: 2,
 *       emotional_status: "Calm",
 *       notes: "Good day overall"
 *     },
 *     ...
 *   ]
 * - 500: { message: "error message" }
 * 
 * Used by: Frontend to display mood history and analytics
 */
app.get("/mood-log/:std_id", async (req, res) => {
  try {
    // Extract std_id from URL parameter
    // req.params contains all URL parameters (e.g., :std_id)
    const { std_id } = req.params;

    // Query database for all mood logs of this student
    // ORDER BY log_date DESC returns newest logs first
    // pool.execute returns [rows, fields], we only need rows
    const [rows] = await pool.execute(
      "SELECT * FROM Mood_log WHERE std_id = ? ORDER BY log_date DESC",
      [std_id]  // Replace ? with std_id value
    );

    // Send the array of mood logs as JSON response
    // If no logs exist, returns empty array []
    res.json(rows);
  } catch (err) {
    // Handle any database or server errors
    res.status(500).json({ message: err.message });
  }
});

// ==================== HABITS ENDPOINTS ====================
// These endpoints handle habit tracking functionality
// Students can view available habits and log which ones they completed each day

/**
 * GET /habits
 * Purpose: Retrieve the master list of all available habits
 * 
 * Response:
 * - 200: Array of habit objects
 *   Example: [
 *     { habit_id: 1, habit_name: "Sleep before 12 AM", category: "Sleep" },
 *     { habit_id: 2, habit_name: "Exercise / Walk", category: "Fitness" },
 *     ...
 *   ]
 * - 500: { message: "error message" }
 * 
 * Database: Selects from Habit table
 * Used by: Frontend to display habit checkboxes
 */
app.get("/habits", async (req, res) => {
  try {
    // Query all habits from the Habit table
    // pool.query() is used for simple SELECT queries without parameters
    // Returns habits ordered by habit_id for consistent display
    const [rows] = await pool.query("SELECT habit_id, habit_name, category FROM Habit ORDER BY habit_id");

    // Send the array of habits as JSON
    res.json(rows);
  } catch (err) {
    // Handle database errors
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /habit-log/:std_id?log_date=YYYY-MM-DD
 * Purpose: Retrieve which habits a student completed on a specific date
 * 
 * URL Parameter:
 * - std_id: Student ID (e.g., /habit-log/101)
 * 
 * Query Parameter (optional):
 * - log_date: Date in YYYY-MM-DD format (defaults to today if not provided)
 *   Example: /habit-log/101?log_date=2026-01-06
 * 
 * Response:
 * - 200: Array of completed habit logs
 *   Example: [
 *     { habit_id: 1, completed: 1 },
 *     { habit_id: 3, completed: 1 },
 *     ...
 *   ]
 * - 500: { message: "error message" }
 * 
 * Database: Selects from Habit_Log table
 * Used by: Frontend to pre-check completed habits when viewing a specific date
 */
app.get("/habit-log/:std_id", async (req, res) => {
  try {
    // Extract student ID from URL parameter
    const { std_id } = req.params;

    // Get log_date from query string, or default to today's date
    // req.query contains URL query parameters (e.g., ?log_date=2026-01-06)
    // new Date().toISOString().split("T")[0] formats date as YYYY-MM-DD
    const log_date = req.query.log_date || new Date().toISOString().split("T")[0];

    // Query habit logs for this student on this specific date
    // Only returns habits that were marked as completed
    const [rows] = await pool.execute(
      `SELECT habit_id, completed
       FROM Habit_Log
       WHERE std_id = ? AND log_date = ?`,
      [std_id, log_date]  // Replace ? placeholders with actual values
    );

    // Return the list of completed habits
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /habit-log
 * Purpose: Save which habits a student completed on a specific date
 * 
 * Request Body (JSON):
 * {
 *   std_id: number,         // Student ID (required)
 *   habit_ids: number[],    // Array of completed habit IDs (required)
 *   log_date: string        // Date in YYYY-MM-DD format (required)
 * }
 * Example: { std_id: 101, habit_ids: [1, 3, 5], log_date: "2026-01-06" }
 * 
 * Response:
 * - 200: { message: "Habit log saved" }
 * - 400: { message: "std_id, habit_ids[], and log_date are required" }
 * - 500: { message: "error message" }
 * 
 * Database: 
 * - First DELETES existing logs for that date (allows resubmission/updates)
 * - Then INSERTS new logs with completed=1
 * 
 * Approach: Delete-and-insert pattern ensures clean updates
 */
app.post("/habit-log", async (req, res) => {
  // Extract data from request body
  const { std_id, habit_ids, log_date } = req.body;

  // Validation: Ensure all required fields are present and valid
  // habit_ids must be an array with at least one element
  if (!std_id || !Array.isArray(habit_ids) || !log_date) {
    return res.status(400).json({ message: "std_id, habit_ids[], and log_date are required" });
  }

  try {
    // STEP 1: Delete any existing habit logs for this student on this date
    // This allows users to resubmit/update their habits for the same day
    // Without this, we'd get duplicate entries or need complex update logic
    await pool.execute("DELETE FROM Habit_Log WHERE std_id = ? AND log_date = ?", [std_id, log_date]);

    // STEP 2: Insert new habit logs for each checked habit
    // Prepare the INSERT statement
    const insertSql = `
      INSERT INTO Habit_Log (std_id, habit_id, log_date, completed)
      VALUES (?, ?, ?, 1)
    `;

    // Loop through each habit ID and insert a record
    // completed is hardcoded to 1 (true) since we only store completed habits
    for (const hid of habit_ids) {
      await pool.execute(insertSql, [std_id, hid, log_date]);
    }

    // Send success response
    res.json({ message: "Habit log saved" });
  } catch (err) {
    // Handle any database errors
    res.status(500).json({ message: err.message });
  }
});

// ==================== APPOINTMENTS ENDPOINTS ====================
// These endpoints handle appointment booking and management
// Students can book appointments with professionals (counselors, doctors, etc.)
// Professionals can view and update appointment status

/**
 * POST /appointments
 * Purpose: Create a new appointment booking
 * 
 * Request Body (JSON):
 * {
 *   std_id: number,              // Student ID (required)
 *   appointment_type: string,    // Type: "Counselor", "Doctor", "Nutritionist" (required)
 *   professional_name: string,   // Name of the professional (required)
 *   appointment_date: string,    // Date in YYYY-MM-DD format (required)
 *   appointment_time: string,    // Time in HH:MM format (required)
 *   reason: string              // Reason for appointment (optional)
 * }
 * 
 * Response:
 * - 201: { message: "Appointment created" }
 * - 400: { message: "Missing required appointment fields" }
 * - 500: { message: "error message" }
 * 
 * Database:
 * - Inserts into Appointment table with status='Pending'
 * - Creates a notification for the student
 * 
 * Side Effect: Automatically sends notification to student
 */
app.post("/appointments", async (req, res) => {
  try {
    // Extract appointment details from request body
    const { std_id, appointment_type, professional_name, appointment_date, appointment_time, reason } = req.body;

    // Validation: Ensure all required fields are present
    if (!std_id || !appointment_type || !professional_name || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: "Missing required appointment fields" });
    }

    // Insert the appointment into the database
    // Status is automatically set to 'Pending' for new appointments
    // Professionals will later approve/cancel/complete it
    await pool.execute(
      `INSERT INTO Appointment
       (std_id, appointment_type, professional_name, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [std_id, appointment_type, professional_name, appointment_date, appointment_time, reason ?? null]
    );

    // Create a notification to inform the student about the booking
    // This notification will appear in the student's notification list
    await pool.execute(
      `INSERT INTO Notification
       (std_id, msg, is_read, appointment_reminder, mood_reminder, habit_reminder)
       VALUES (?, ?, 0, 1, 0, 0)`,
      [
        std_id,  // Who gets the notification
        `Appointment booked with ${professional_name} on ${appointment_date} at ${appointment_time}`  // Message text
      ]
    );

    // Send success response with 201 status (Created)
    res.status(201).json({ message: "Appointment created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /appointments/:std_id
 * Purpose: Retrieve all appointments for a specific student
 * 
 * URL Parameter:
 * - std_id: Student ID (e.g., /appointments/101)
 * 
 * Response:
 * - 200: Array of appointment objects, ordered by date (newest first)
 *   Example: [
 *     {
 *       appoint_id: 1,
 *       std_id: 101,
 *       appointment_type: "Counselor",
 *       professional_name: "Dr. Rahman",
 *       appointment_date: "2026-01-10",
 *       appointment_time: "14:00:00",
 *       status: "Pending",
 *       reason: "Stress management",
 *       session_note: null
 *     },
 *     ...
 *   ]
 * - 500: { message: "error message" }
 * 
 * Used by: Student dashboard to display upcoming appointments
 */
app.get("/appointments/:std_id", async (req, res) => {
  try {
    // Extract student ID from URL parameter
    const { std_id } = req.params;

    // Query all appointments for this student
    // ORDER BY ensures newest appointments appear first
    const [rows] = await pool.execute(
      `SELECT * FROM Appointment
       WHERE std_id = ?
       ORDER BY appointment_date DESC, appointment_time DESC`,
      [std_id]
    );

    // Return the list of appointments
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
//professional dashboard
app.get("/professional/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [rows] = await pool.execute(
      `SELECT * FROM Appointment
       WHERE appointment_date = ?
       ORDER BY appointment_time`,
      [today]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//admin dashboard 

//admin dashboard 
app.get("/admin/stats", async (req, res) => {
  try {
    const [[students]] = await pool.query("SELECT COUNT(*) AS count FROM Student");
    const [[professionals]] = await pool.query("SELECT COUNT(*) AS count FROM User WHERE role = 'professional'");
    const [[appointments]] = await pool.query("SELECT COUNT(*) AS count FROM Appointment");

    res.json({
      students: students.count,
      professionals: professionals.count,
      appointments: appointments.count
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ message: err.message });
  }
});
app.get("/notifications/:std_id", async (req, res) => {
  try {
    const { std_id } = req.params;
    const [rows] = await pool.execute(
      `SELECT * FROM Notification
       WHERE std_id = ?
       ORDER BY n_id DESC`,
      [std_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
app.put("/notifications/read/:n_id", async (req, res) => {
  try {
    const { n_id } = req.params;
    await pool.execute(
      `UPDATE Notification SET is_read = 1 WHERE n_id = ?`,
      [n_id]
    );
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/appointments/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Cancelled", "Completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  await pool.execute(
    "UPDATE Appointment SET status = ? WHERE appoint_id = ?",
    [status, id]
  );

  res.json({ message: "Status updated" });
});
// UPDATE appointment status (approve / cancel / complete)
app.put("/appointments/status/:appoint_id", async (req, res) => {
  try {
    const { appoint_id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["Approved", "Cancelled", "Completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await pool.execute(
      "UPDATE Appointment SET status = ? WHERE appoint_id = ?",
      [status, appoint_id]
    );

    res.json({ message: "Appointment status updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


