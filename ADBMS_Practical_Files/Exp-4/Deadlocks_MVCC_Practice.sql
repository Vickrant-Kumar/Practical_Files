-- Drop table if exists
DROP TABLE IF EXISTS StudentEnrollments;

-- Create table
CREATE TABLE StudentEnrollments (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    course_id VARCHAR(10) NOT NULL,
    enrollment_date DATE NOT NULL
);

-- Insert sample data
INSERT INTO StudentEnrollments (student_id, student_name, course_id, enrollment_date)
VALUES
(1, 'Ashish', 'CSE101', '2024-06-01'),
(2, 'Smaran', 'CSE102', '2024-06-01'),
(3, 'Vaibhav', 'CSE103', '2024-06-01');

-- Part A: Simulate deadlock (you need 2 sessions manually)
START TRANSACTION;
UPDATE StudentEnrollments SET enrollment_date = '2024-07-01' WHERE student_id = 1;
UPDATE StudentEnrollments SET enrollment_date = '2024-07-02' WHERE student_id = 2;
COMMIT;

-- Part B: MVCC demonstration
START TRANSACTION;
SELECT * FROM StudentEnrollments WHERE student_id = 1;
UPDATE StudentEnrollments SET enrollment_date = '2024-07-10' WHERE student_id = 1;
COMMIT;

-- Part C: Compare locking vs MVCC
START TRANSACTION;
SELECT * FROM StudentEnrollments WHERE student_id = 1 FOR UPDATE;
UPDATE StudentEnrollments SET enrollment_date = '2024-07-15' WHERE student_id = 1;
COMMIT;

START TRANSACTION;
SELECT * FROM StudentEnrollments WHERE student_id = 1;
UPDATE StudentEnrollments SET enrollment_date = '2024-08-15' WHERE student_id = 1;
COMMIT;

-- Final table state
SELECT * FROM StudentEnrollments;
