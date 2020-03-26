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
  //console.log("connected to the MySQL server");
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
    case "View All Employees By Manager":
      viewEmployeesByManager();
      break;
    case "View Departments":
      viewDepartments();
      break;
    case "View Roles":
      viewRoles();
      break;
    case "Add Employee":
      addEmployee();
      break;
    case "Add Role":
      addRole();
      break;
    case "Add Department":
      addDepartment();
      break;
    case "Remove Employee":
      removeEmployee();
      break;
    case "Remove Role":
      removeRole();
      break;
    case "Remove Department":
      removeDepartment();
      break;
    case "Update Employee Role":
      updateEmployeeRole();
      break;
    case "Update Employee Manager":
      updateEmployeeManager();
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


//  view employees by department
async function viewEmployeesByDepartment() {
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

  // query the database
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

//  view employees by manager
async function viewEmployeesByManager() {
  let answer;
  let managers;
  try {
    const managersQuery = await querySync(connection, "SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) as manager FROM employee inner join employee as e on employee.manager_id = e.id GROUP BY manager;");
    managers = managersQuery.map(elem => elem.manager);
    answer = await inquirer.prompt(
      {
        type: "list",
        message: "Department Name: ",
        name: "manager",
        choices: managers
      }
    )
  } catch(err) {
    throw err;
  }

  //console.log(managers);

  // query the database
  const sql = "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, CONCAT(e.first_name, ' ', e.last_name) as manager"
            + " FROM employee" +
            " inner join role ON (employee.role_id = role.id)" + 
            " inner join department on role.department_id = department.id" +
            " left join employee as e on employee.manager_id = e.id" +
            " WHERE CONCAT(e.first_name, ' ', e.last_name) = ?";
  connection.query(sql, [answer.manager], (err, res, fields) => {
    if (err) throw err;
    console.table(res); // takes in array of objects with same properties
    startPrompt();
  });
}


function viewDepartments() {
  const sql = "SELECT name as 'Department' FROM department"
  connection.query(sql, (error, result) => {
    if (error) throw error;
    console.table(result)
    startPrompt();
  })
}

function viewRoles() {
  const sql = "SELECT title as role, salary FROM role";
  connection.query(sql, (error, result) => {
    if (error) throw error;
    console.table(result);
    startPrompt();
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

  // check that there are roles and departments first
  if (managers.length == 0){
    console.log("Please Insert a department first");
    startPrompt();
    return;
  } else if (roles.length == 0) {
    console.log("Please Insert a role first");
    startPrompt();
    return;
  }
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
  let manager_id;
  if (answer.manager !== "None"){
    manager_id = managerQuery.filter(elem => elem.name === answer.manager)[0].id;
  }
  
  let sql;
  let placeholder;
  if (answer.manager == "None") {
    sql = "INSERT INTO employee SET ?";
    placeholder = {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: role_id,
    };
  } else {
    sql = "INSERT INTO employee SET ?";
    placeholder = {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: role_id,
      manager_id: manager_id
    };
  }
  
  connection.query(sql, placeholder, (err, res, fields) => {
    if (err) {
      console.log("\nError: " + err.message);
      return;
    }
    console.log(`${answer.firstName} ${answer.lastName} added to Employees`);
    startPrompt(); // restart the prompt
  })
}


// adds role to database
async function addRole() {
  let departmentsQuery;
  let departmentsArray;
  let answer;
  try {
    departmentsQuery = await querySync(connection, "SELECT id, name FROM department", []);

    if (departmentsQuery.length == 0) {
      console.log("Please add a department first");
      startPrompt();
      return;
    }
    departmentsArray = departmentsQuery.map(elem => elem.name); // array of department names
    console.log(departmentsQuery);
    answer = await inquirer.prompt([
      {
        type: "input",
        message: "Role: ",
        name: "role"
      },
      {
        type: "input",
        message: "Salary: ",
        name: "salary",
        validate: function(value) {
          if (isNaN(parseInt(value))) return "Please input a number";
          return true;
        }
      },
      {
        type: "list",
        message: "What Department is this role under: ",
        choices: departmentsArray,
        name: "department"
      }
    ]);
  } catch(err) {
    throw err;
  }

  const departmentID = departmentsQuery.filter(elem => elem.name === answer.department)[0].id;
  const sql = "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)" 
  connection.query(sql, [answer.role, answer.salary, departmentID], (error, result) => {
    if(error) throw error;
    console.log(`${answer.role} added to roles`);
    startPrompt();
  })
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

async function removeEmployee() {
  let employeesQuery;
  let employeeArray;
  let answer;
  try {
    employeesQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee", []);
    employeeArray = employeesQuery.map(elem => elem.name);
    answer = await inquirer.prompt([
      {
        type: "list",
        message: "Choose Employee To Remove: ",
        name: "name",
        choices: employeeArray
      }
    ]);
  } catch(err) {
    throw err;
  }
  
  const employeeID = employeesQuery.filter(elem => elem.name === answer.name);
  // if there are more than one employee with same name
  if (employeeID.length > 1) { 
    const answers = await inquirer.prompt([
      {
        type: "list",
        message: "Choose id",
        name: "id",
        choices: employeeID.map(elem => elem.id)
      }
    ]);
    connection.query("DELETE FROM employee WHERE id = ?", [answers.id], (error, result) => {
      if (error) throw error;
      console.log(`Employee ${answers.id} deleted`);
      startPrompt();
    })

  } else {
    connection.query("DELETE FROM employee WHERE id = ?", [employeeID[0].id], (error, result) => {
      if (error) throw error;
      console.log(`${employeeID[0].name} deleted from employees`);
      startPrompt();
    })
  }  
}


async function removeRole() {
  let roleQuery;
  let roleArray;
  let answer;
  try {
    roleQuery = await querySync(connection, "SELECT id, title FROM role", []);
    roleArray = roleQuery.map(elem => elem.title);
    answer = await inquirer.prompt([
      {
        type: "list",
        message: "Choose Role To Remove: ",
        name: "title",
        choices: roleArray
      }
    ]);
  } catch(err) {
    throw err;
  }

  connection.query("DELETE FROM role WHERE title = ?", [answer.title], (error, result) => {
    if (error) throw error;
    console.log(`Role: ${answer.title} deleted`);
    startPrompt();
  })

}

async function removeDepartment() {
  let deptQuery;
  let deptArray;
  let answer;
  try {
    deptQuery = await querySync(connection, "SELECT id, name FROM department", []);
    deptArray = deptQuery.map(elem => elem.name);
    answer = await inquirer.prompt([
      {
        type: "list",
        message: "Choose Role To Remove: ",
        name: "name",
        choices: deptArray
      }
    ]);
  } catch(err) {
    throw err;
  }

  connection.query("DELETE FROM department WHERE name = ?", [answer.name], (error, result) => {
    if (error) throw error;
    console.log(`Department: ${answer.name} deleted`);
    console.log(result)
    startPrompt();
  });
}

// get list of employees
// input new role
// update
async function updateEmployeeRole() {
  let employeesQuery;
  let employeeArray;
  let answer;
  try {
    employeesQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee", []);
    roleQuery = await querySync(connection, "SELECT id, title FROM role", []);
    if (roleQuery.length == 0) {
      console.log("Please Insert roles or departments first");
      startPrompt();
      return;
    }
    employeeArray = employeesQuery.map(elem => elem.name);
    answer = await inquirer.prompt([
      {
        type: "list",
        message: "Choose Employee To Update Role: ",
        name: "name",
        choices: employeeArray
      },
      {
        type: "list",
        message: "Role: ",
        name: "role",
        choices: roleQuery.map(elem => elem.title)
      }
    ]);
  } catch(err) {
    throw err;
  }
  
  const employeeID = employeesQuery.filter(elem => elem.name === answer.name);
  const roleID = roleQuery.filter(elem => elem.title === answer.role)[0].id
  // if there are more than one employee with same name
  if (employeeID.length > 1) { 
    const answers = await inquirer.prompt([
      {
        type: "list",
        message: "Choose id of Employee there was more than one: ",
        name: "id",
        choices: employeeID.map(elem => elem.id)
      }
    ]);
    connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [roleID, answers.id], (error, result) => {
      if (error) throw error;
      console.log(`Employee role updated successfully`);
      startPrompt();
    })

  } else {
    connection.query("UPDATE employee SET role_id = ? WHERE id = ?", [roleID, employeeID[0].id], (error, result) => {
      if (error) throw error;
      console.log(`Employee Role updated successfully`);
      startPrompt();
    })
  }  
}


// update employeeManager 
// not building for possibility of employees with same name
async function updateEmployeeManager() {
  let employeeQuery = await querySync(connection, "SELECT id, CONCAT(first_name, ' ', last_name) as name FROM employee", []);
  let employeeArray = employeeQuery.map(elem => elem.name);
  let answers = await inquirer.prompt([
    {
      type: "list",
      message:"Choose Employee",
      name: "employee",
      choices: employeeArray
    },
  ])

  // get the available managers excluding name chosen above 
  let availableManagers = employeeQuery.map(elem => elem.name);
  availableManagers = availableManagers.filter(elem => elem !== answers.employee);
  availableManagers.unshift("None"); // option to have no manager
  
  // start new inquirer prompt asking who the manager is
  let answers2 = await inquirer.prompt([
    {
      type: "list",
      message: "Choose Manager: ",
      choices: availableManagers,
      name: "manager"
    }
  ]);

  if (answers2.manager === "None"){
    const employeeID = employeeQuery.filter(elem => elem.name === answers.employee)[0].id;
    connection.query("UPDATE employee SET manager_id = null WHERE id = ?", [employeeID], (error, results) => {
      if (error) throw error;
      console.log("Employee Manager Updated Sucessfully");
      startPrompt();
      return;
    });
  } else {
    //get manager_id
    const employeeID = employeeQuery.filter(elem => elem.name === answers.employee)[0].id;
    const managerID = employeeQuery.filter(elem => elem.name === answers2.manager)[0].id

    connection.query("UPDATE employee SET manager_id = ? WHERE id = ?", [managerID, employeeID], (error, result) => {
      if (error) throw error;
      console.log(`Employee Manager Updated Successfully`);
      startPrompt();
    })
  }
}


// function returns promise with results
function querySync(connection, sql, args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  })
}


