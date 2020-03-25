const mysql = require("mysql");
//const fs = require("fs");
const inquirer = require("inquirer");
const cTable = require('console.table');
const questions = require("./questions");


let connection = mysql.createConnection({
  host: 'localhost',
  user: process.env.mysqlUsername,
  password: process.env.mysqlPassword,
  database: 'management_db'
})


connection.connect(err => {
  if (err) {
    return console.error('error: ' + err.message);
  } 
  console.log("connected to the MySQL server");
  startPrompt();
})


// function that asks the user what to do
async function startPrompt() {
  const answers = await inquirer.prompt(questions);
  //console.log(answers);

  // switch depending on answer
  switch (answers.action) {
    case "View All Employees":
      viewAllEmployees();
      break;
    case "View All Employees By Department":
      viewEmployeesByDepartment();
      break;
    case "Add Department":
      addDepartment();
      break;
    case "Add Role":
      addRole();
      break;
    case "Add Employee":
      addEmployee();
      break;
    case "Quit":
      // close the database connection
      connection.end(err => {
        if (err) throw err;
        console.log("Goodbye");
      });   
  }
}


function viewAllEmployees() {
  const sql = "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, CONCAT(e.first_name, ' ', e.last_name) as manager"
            + " FROM employee" +
            " inner join role ON (employee.role_id = role.id)" + 
            " inner join department on role.department_id = department.id" +
            " left join employee as e on employee.manager_id = e.id";
  connection.query(sql, [], (err, res, fields) => {
    if (err) throw err;
    // console.log(res);
    console.table(res); // takes in array of objects with same properties
    startPrompt();
  });
}

// add department 
async function addDepartment() {
  let question = [
    {
      type: "input",
      message:"Department Name: ",
      name: "departmentName"
    }
  ]
  const answer = await inquirer.prompt(question);

  const sql = "INSERT INTO department SET ?";
  const placeholder = {name: answer.departmentName};
  connection.query(sql, placeholder, (err, res, fields) => {
    if (err) {
      console.log("\nError: " + err.message);
      return;
    }
    console.log(`${answer.departmentName} added to departments`);
    startPrompt(); // restart the prompt
  })
}

// add employee
async function addEmployee() {
  // get roles
  let roleQuery;
  let managerQuery;
  try {
    roleQuery = await querySync(connection, "SELECT id, title FROM role ORDER BY title", []);
    managerQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee ORDER BY name", []);
  } catch(err) {
    throw err;
  }
  
  const roles = roleQuery.map(elem => elem.title); // make array of strings which are the titles of the roles
  const managers = managerQuery.map(element => element.name);
  managers.unshift("None");

  let question = [
    {
      type: "input",
      message:"Employee First Name: ",
      name: "firstName"
    },
    {
      type: "input",
      message:"Employee Last Name: ",
      name: "lastName"
    },
    {
      type: "list",
      message:"Choose Role: ",
      choices: roles,
      name: "role"
    },
    {
      type: "list",
      message:"Choose Manager: ",
      choices: managers,
      name: "manager"
    }

  ]
  const answer = await inquirer.prompt(question);
  let role_id = roleQuery.filter(elem => elem.title === answer.role)[0].id;
  let manager_id = managerQuery.filter(elem => elem.name === answer.manager)[0].id;

  const sql = "INSERT INTO employee SET ?";
  const placeholder = {
    first_name: answer.firstName,
    last_name: answer.lastName,
    role_id: role_id,
    manager_id: manager_id
  };
  connection.query(sql, placeholder, (err, res, fields) => {
    if (err) {
      console.log("\nError: " + err.message);
      return;
    }
    console.log(`${answer.departmentName} added to departments`);
    startPrompt(); // restart the prompt
  })
}

async function viewEmployeesByDepartment() {
  // const departments = await querySync(connection, "SELECT name FROM department");
  // console.log(departments);
  let answer;
  let departments;
  try {
    departments = await querySync(connection, "SELECT name FROM department");
    departments = departments.map(elem => elem.name);
    answer = await inquirer.prompt(
      {
        type: "list",
        message: "Department Name: ",
        name: "department",
        choices: departments
      }
    )
  } catch(err) {
    throw err;
  }

  const sql = "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, CONCAT(e.first_name, ' ', e.last_name) as manager"
            + " FROM employee" +
            " inner join role ON (employee.role_id = role.id)" + 
            " inner join department on role.department_id = department.id" +
            " left join employee as e on employee.manager_id = e.id" +
            " WHERE department.name = ?";
  connection.query(sql, [answer.department], (err, res, fields) => {
    if (err) throw err;
    console.table(res); // takes in array of objects with same properties
    startPrompt();
  });
}





// function returns promise with results
function querySync(connection, sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, results) => {
      if (error) reject(err);
      resolve(results);
    });
  })
}