-- Drop table if it already exists (for fresh run)
DROP TABLE IF EXISTS FeePayments;

-- Create FeePayments table
CREATE TABLE FeePayments (
    payment_id INT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) CHECK (amount > 0),
    payment_date DATE NOT NULL
);

------------------------------------------------
-- Part A: Insert Multiple Fee Payments
------------------------------------------------
BEGIN;

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (1, 'Ashish', 5000.00, '2024-06-01');

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (2, 'Smaran', 4500.00, '2024-06-02');

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (3, 'Vaibhav', 5500.00, '2024-06-03');

COMMIT;

SELECT * FROM FeePayments;

------------------------------------------------
-- Part B: Demonstrate ROLLBACK
------------------------------------------------
BEGIN;

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (4, 'Kiran', 6000.00, '2024-06-04');

-- This will fail (duplicate ID + negative amount)
INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (1, 'Ashish', -3000.00, '2024-06-05');

ROLLBACK;

SELECT * FROM FeePayments;

------------------------------------------------
-- Part C: Partial Failure (NULL value)
------------------------------------------------
BEGIN;

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (5, 'Ramesh', 4800.00, '2024-06-06');

-- This will fail (NULL not allowed)
INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (6, NULL, 5200.00, '2024-06-07');

ROLLBACK;

SELECT * FROM FeePayments;

------------------------------------------------
-- Part D: Verify ACID
------------------------------------------------
-- Atomicity + Consistency test
BEGIN;

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (7, 'Neha', 7000.00, '2024-06-08');

-- Duplicate ID causes rollback
INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (2, 'Duplicate', 9000.00, '2024-06-09');

ROLLBACK;

-- Valid transaction
BEGIN;

INSERT INTO FeePayments (payment_id, student_name, amount, payment_date)
VALUES (8, 'Pooja', 6500.00, '2024-06-10');

COMMIT;

-- Final table check (Durability shown here)
SELECT * FROM FeePayments;
