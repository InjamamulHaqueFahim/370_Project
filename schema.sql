CREATE DATABASE IF NOT EXISTS campus_wellness;
USE campus_wellness;

-- ============ USER / STUDENT ============
CREATE TABLE IF NOT EXISTS User (
  user_id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  phone VARCHAR(30),
  role VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS Student (
  user_id INT PRIMARY KEY,
  std_id INT UNIQUE,
  department VARCHAR(100),
  semester VARCHAR(30),
  FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- ============ MOOD LOG ============
CREATE TABLE IF NOT EXISTS Mood_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  std_id INT NOT NULL,
  log_date DATE NOT NULL,
  mood_rating INT,
  stress_level INT,
  energy_level INT,
  sleep_quantity INT,
  emotional_status VARCHAR(100),
  notes TEXT,
  FOREIGN KEY (std_id) REFERENCES Student(std_id)
);

-- ============ HABITS ============
CREATE TABLE IF NOT EXISTS Habit (
  habit_id INT AUTO_INCREMENT PRIMARY KEY,
  habit_name VARCHAR(100) NOT NULL,
  category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS Habit_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  std_id INT NOT NULL,
  habit_id INT NOT NULL,
  log_date DATE NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (std_id) REFERENCES Student(std_id),
  FOREIGN KEY (habit_id) REFERENCES Habit(habit_id)
);

-- ============ APPOINTMENTS (optional but useful) ============
CREATE TABLE IF NOT EXISTS Appointment (
  appoint_id INT AUTO_INCREMENT PRIMARY KEY,
  std_id INT NOT NULL,
  appointment_type VARCHAR(50) NOT NULL,
  professional_name VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  reason TEXT,
  session_note TEXT,
  FOREIGN KEY (std_id) REFERENCES Student(std_id)
);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS Notification (
  n_id INT AUTO_INCREMENT PRIMARY KEY,
  std_id INT NOT NULL,
  msg VARCHAR(255) NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  appointment_reminder TINYINT(1) DEFAULT 0,
  mood_reminder TINYINT(1) DEFAULT 0,
  habit_reminder TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (std_id) REFERENCES Student(std_id)
);


-- ============ SEED DEMO DATA ============
INSERT INTO User (user_id, name, email, password, phone, role)
VALUES (1, 'Sample Student', 'sample@student.com', 'demo', '0000000000', 'student')
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO Student (user_id, std_id, department, semester)
VALUES (1, 101, 'CSE', '5')
ON DUPLICATE KEY UPDATE std_id = std_id;

-- habits seed
INSERT INTO Habit (habit_name, category)
VALUES
('Sleep before 12 AM', 'Sleep'),
('Exercise / Walk', 'Fitness'),
('Drink enough water', 'Lifestyle'),
('Study 2 hours', 'Academic'),
('Pray or Meditate', 'Spiritual')
ON DUPLICATE KEY UPDATE habit_name = habit_name;

-- mood seed
INSERT INTO Mood_log
(std_id, log_date, mood_rating, stress_level, energy_level, sleep_quantity, emotional_status, notes)
VALUES
(101, CURDATE(), 4, 2, 3, 2, 'Calm', 'Seed mood entry')
ON DUPLICATE KEY UPDATE log_id = log_id;

INSERT INTO Notification (std_id, msg, is_read, appointment_reminder)
VALUES (101, 'Welcome to Campus Wellness!', 0, 0);



