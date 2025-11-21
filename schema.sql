-- Full SQL schema
DROP TABLE IF EXISTS deal_members;
DROP TABLE IF EXISTS barrier_members;
DROP TABLE IF EXISTS deal;
DROP TABLE IF EXISTS barrier;
DROP TABLE IF EXISTS employee;

CREATE TABLE employee (
  code TEXT PRIMARY KEY,
  name TEXT,
  email TEXT
);

CREATE TABLE barrier (
  code TEXT PRIMARY KEY,
  name TEXT,
  approver_code TEXT REFERENCES employee(code)
);

CREATE TABLE barrier_members (
  barrier_code TEXT REFERENCES barrier(code),
  member_code TEXT REFERENCES employee(code),
  deal_id TEXT,
  PRIMARY KEY (barrier_code, member_code)
);

CREATE TABLE deal (
  code TEXT PRIMARY KEY,
  name TEXT,
  approver_code TEXT REFERENCES employee(code)
);

CREATE TABLE deal_members (
  deal_code TEXT REFERENCES deal(code),
  member_code TEXT REFERENCES employee(code),
  role TEXT,
  PRIMARY KEY (deal_code, member_code)
);
