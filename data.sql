-------------------------------------------------------
-- CLEAN TABLES (safe to re-run)
-------------------------------------------------------

DELETE FROM deal_members;
DELETE FROM barrier_members;
DELETE FROM deal;
DELETE FROM barrier;
DELETE FROM employee;

-------------------------------------------------------
-- EMPLOYEES
-------------------------------------------------------

INSERT INTO employee (code, name, email) VALUES
('E001', 'Amit', 'amit@ubs685.onmicrosoft.com'),
('E002', 'cb', 'cb@ubs685.onmicrosoft.com'),
('E003', 'ad', 'ad@ubs685.onmicrosoft.com'),
('E004', 'dk', 'dk@ubs685.onmicrosoft.com'),
('E005', 'js', 'js@ubs685.onmicrosoft.com');

-------------------------------------------------------
-- BARRIERS
-------------------------------------------------------

INSERT INTO barrier (code, name, approver_code) VALUES
('B001', 'Permanent Barrier', 'E001'),
('B002', 'OTB', 'E002');

-------------------------------------------------------
-- BARRIER MEMBERS
-------------------------------------------------------

INSERT INTO barrier_members (barrier_code, member_code, status, on_date, off_date, deal_code) VALUES
('B001', 'E003', 'Behind the barrier', '2025-03-10', null, NULL),
('B001', 'E004', 'Above the barrier','2025-03-10', '2025-06-30', NULL),
('B002', 'E005', 'Crossed','2025-03-10', '2025-06-30', 'D001'),
('B002', 'E003', 'Crossed','2025-03-10', '2025-06-30', 'D002');

-------------------------------------------------------
-- DEALS
-------------------------------------------------------

INSERT INTO deal (code, name, approver_code) VALUES
('D001', 'Acquisition of ABC Corp', 'E002'),
('D002', 'Merger with QRS Ltd', 'E001'),
('D003', 'Divestiture of XYZ Unit', 'E004');

-------------------------------------------------------
-- DEAL MEMBERS
-------------------------------------------------------

INSERT INTO deal_members (deal_code, member_code, role) VALUES
('D001', 'E001', 'Deal Lead'),
('D001', 'E003', 'Analyst'),
('D002', 'E002', 'Deal Lead'),
('D002', 'E005', 'Research'),
('D003', 'E004', 'Deal Lead'),
('D003', 'E003', 'Finance Advisor');
