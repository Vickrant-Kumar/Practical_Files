BEGIN;

DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Departments;

CREATE TABLE Departments (
    dept_id   INT PRIMARY KEY,
    dept_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Courses (
    course_id   INT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    dept_id     INT NOT NULL,
    FOREIGN KEY (dept_id) REFERENCES Departments(dept_id)
);

INSERT INTO Departments (dept_id, dept_name) VALUES
(1, 'Computer Science'),
(2, 'Electrical'),
(3, 'Mechanical'),
(4, 'Civil'),
(5, 'Electronics');

INSERT INTO Courses (course_id, course_name, dept_id) VALUES
(101, 'DBMS',               1),
(102, 'Operating Systems',  1),
(103, 'Algorithms',         1),
(104, 'Computer Networks',  1),

(201, 'Power Systems',      2),
(202, 'Digital Circuits',   2),
(203, 'Control Systems',    2),

(301, 'Thermodynamics',     3),
(302, 'Fluid Mechanics',    3),

(401, 'Structural Engineering', 4),
(402, 'Surveying',              4),

(501, 'Embedded Systems',   5),
(502, 'VLSI Design',        5);

COMMIT;

SELECT dept_name
FROM Departments
WHERE dept_id IN (
    SELECT dept_id
    FROM Courses
    GROUP BY dept_id
    HAVING COUNT(*) > 2
)
ORDER BY dept_name;

