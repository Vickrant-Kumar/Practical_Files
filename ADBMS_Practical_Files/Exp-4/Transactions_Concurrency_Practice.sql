-- =========================================================
-- Practice 2: Transactions & Concurrency Control
-- =========================================================

-- Drop table if it exists (for fresh execution)
DROP TABLE IF EXISTS StudentEnrollments;

-- Create the StudentEnrollments table
CREATE TABLE StudentEnrollments (
    enrollment_id INT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    course_id VARCHAR(10) NOT NULL,
    enrollment_date DATE NOT NULL,
    CONSTRAINT unique_enrollment UNIQUE (student_name, course_id)
);

-------------------------------------------------------------
-- Part A: Prevent Duplicate Enrollments Using Locking
-------------------------------------------------------------
-- Insert sample records
INSERT INTO StudentEnrollments (enrollment_id, student_name, course_id, enrollment_date)
VALUES 
(1, 'Ashish', 'CSE101', '2024-07-01'),
(2, 'Smaran', 'CSE102', '2024-07-01'),
(3, 'Vaibhav', 'CSE101', '2024-07-01');

-- Try to insert duplicate enrollment for Ashish in CSE101
-- First insert will succeed
INSERT INTO StudentEnrollments (enrollment_id, student_name, course_id, enrollment_date)
VALUES (4, 'Ashish', 'CSE101', '2024-07-05');

-- Second insert will FAIL (duplicate student_name + course_id)
-- Simulates constraint violation in concurrent access
INSERT INTO StudentEnrollments (enrollment_id, student_name, course_id, enrollment_date)
VALUES (5, 'Ashish', 'CSE101', '2024-07-06');

-------------------------------------------------------------
-- Part B: Row-Level Locking with SELECT FOR UPDATE
-------------------------------------------------------------
-- User A
START TRANSACTION;

-- Locks the row for Ashish in CSE101
SELECT * FROM StudentEnrollments
WHERE student_name = 'Ashish' AND course_id = 'CSE101'
FOR UPDATE;

-- At this point, User A’s transaction is still open
-- User B tries to update the same row in another session

-- User B (in another transaction/session)
-- This will be BLOCKED until User A commits/rolls back
UPDATE StudentEnrollments
SET enrollment_date = '2024-07-10'
WHERE student_name = 'Ashish' AND course_id = 'CSE101';

-- User A finally commits
COMMIT;

-------------------------------------------------------------
-- Part C: Locking Preserves Consistency
-------------------------------------------------------------
-- Without locking (race condition simulation)
-- Imagine two users updating the same row simultaneously

-- User A (without lock)
START TRANSACTION;
UPDATE StudentEnrollments
SET enrollment_date = '2024-07-15'
WHERE enrollment_id = 1;
-- (Not committed yet)

-- User B (without lock) runs at the same time
START TRANSACTION;
UPDATE StudentEnrollments
SET enrollment_date = '2024-07-20'
WHERE enrollment_id = 1;
COMMIT;  -- User B commits first

-- User A commits after B
COMMIT;

-- Final value will be 2024-07-15 (User A overwrites User B)
-- This is a race condition without proper locking

-- With locking (safe)
START TRANSACTION;
SELECT * FROM StudentEnrollments
WHERE enrollment_id = 1
FOR UPDATE; -- User A locks row

UPDATE StudentEnrollments
SET enrollment_date = '2024-07-25'
WHERE enrollment_id = 1;
COMMIT;

-- User B trying to update the same row now will WAIT
-- until User A finishes. No race condition possible.

-- Final consistency check
SELECT * FROM StudentEnrollments;
