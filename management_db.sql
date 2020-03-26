DROP DATABASE IF EXISTS management_db;

CREATE DATABASE management_db;

USE management_db;

CREATE TABLE `department` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
);

CREATE TABLE `role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(30) NOT NULL UNIQUE,
  `salary` DECIMAL NOT NULL,
  `department_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE CASCADE
);

CREATE TABLE `employee` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `first_name` VARCHAR(30) NOT NULL,
  `last_name` VARCHAR(30) NOT NULL,
  `role_id` INT,
  `manager_id` INT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`manager_id`) REFERENCES employee(`id`) ON DELETE set null
);

-- will check to see if those keys exist in the role and department database 
-- if it doesn't that 

-- INSERT INTO employee SET first_name = "a", last_name = "b", role_id = 5, manager_id = 4;
INSERT INTO department (`name`) VALUES ("Sales");
INSERT INTO department (`name`) VALUES ("Legal");
INSERT INTO department (`name`) VALUES ("Engineering");
INSERT INTO department (`name`) VALUES ("Finance");

INSERT INTO `role` (title, salary, department_id) VALUES ("Sales Lead", 100000, 1);
INSERT INTO `role` (title, salary, department_id) VALUES ("Salesperson", 80000, 1);
INSERT INTO `role` (title, salary, department_id) VALUES ("Lead Engineer", 150000, 3);
INSERT INTO `role` (title, salary, department_id) VALUES ("Software Engineer", 120000, 3);
INSERT INTO `role` (title, salary, department_id) VALUES ("Accountant", 125000, 4);
INSERT INTO `role` (title, salary, department_id) VALUES ("Legal Team Lead", 250000, 2);
INSERT INTO `role` (title, salary, department_id) VALUES ("Lawyer", 190000, 2);

INSERT INTO employee (first_name, last_name, role_id) VALUES ("Ashley", "Rodriguez", 3); 
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("John", "Doe", 1, 1);
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("Mike", "Chan", 2, 2);
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("Kevin", "Tupik", 4, 1);   

SELECT * FROM department;
SELECT * FROM `role`;
SELECT * FROM employee;


-- View all employees
SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, CONCAT(e.first_name, " ", e.last_name) as manager
  FROM employee
  inner join `role` ON (employee.role_id = `role`.id)
  inner join department on `role`.department_id = department.id
  left join employee as e on employee.manager_id = e.id;

-- this places all the employees in the table along with their managers if they have one
SELECT * from employee left join employee as e on employee.manager_id = e.id;

SELECT e.id, CONCAT(e.first_name, " ", e.last_name) as manager FROM employee inner join employee as e on employee.manager_id = e.id GROUP BY manager;

select * from employee;


  