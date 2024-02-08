require('dotenv').config();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const { connect } = require('../routes/manage.routes');
const table1 = "employees";
const table2 = "customers";
const table3 = "vehicles";
const table4 = "sales";
const table5 = "maintenance";
const table6 = "login";

let pool = mysql.createPool({
    connectionLimit: 100,
    port     : process.env.DB_PORT,
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    database : process.env.DB_NAME,
    password : process.env.DB_PASS
});

// function populateData(){
//     const hashPassword = (password) => {
//         return bcrypt.hashSync(password, 10);
//       };

//     const employees = [
//         { EmployeeId: 1, Email: 'arjun@123', Password: hashPassword('123') }
//       ];

//       pool.getConnection((err, connection) => {
//         if(err) throw err;
      
//       employees.forEach((employee) => {
//         connection.query(`INSERT INTO ${table6} SET ?`, employee, (err, result) => {
//           if (err) {
//             console.error('Error inserting employee:', err);
//             return;
//           }
//           console.log('Employee inserted:', result.insertId);
//         });
//       });
      
//       connection.end((err) => {
//         if (err) {
//           console.error('Error closing connection:', err);
//           return;
//         }
//         console.log('Connection closed');
//       });
//     });
// }
// populateData();

exports.home = (req, res) => {
    let emailVal = req.session.emailVal;
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT FirstName, LastName, Email, Phone, Position, Salary FROM ${table1} WHERE Email = ?`,
            [emailVal],
            (err, userResult, fields) => {
                if (err) {
                    console.error('Error querying user data:', err);
                    connection.release();
                    return res.status(500).send('Internal server error');
                }

                if (userResult.length === 0) {
                    connection.release();
                    return res.status(404).send('User not found');
                }

                var { FirstName, LastName, Email, Phone, Position, Salary } = userResult[0];
                req.session.FirstName = FirstName;
                req.session.LastName = LastName;
                console.log("User data:", FirstName, LastName, Email, Phone, Position, Salary);

                connection.query(
                    `SELECT COUNT(*) AS employeeCount FROM ${table1} GROUP BY EmployeeID;`,
                    (err, result, fields) => {
                        if (err) {
                            console.error('Error querying counts:', err);
                            connection.release();
                            return res.status(500).send('Internal server error');
                        }

                        var employeeCount = result[0].employeeCount;
                        console.log("Employee count:", employeeCount);

                        connection.query(
                            `SELECT COUNT(*) AS vehicleCount FROM ${table3} GROUP BY VehicleID;`,
                            (err, result, fields) => {
                                if (err) {
                                    console.error('Error querying counts:', err);
                                    connection.release();
                                    return res.status(500).send('Internal server error');
                                }

                                var vehicleCount = result[0].vehicleCount;
                                console.log("Vehicle count:", vehicleCount);

                                connection.query(
                                    `SELECT COUNT(*) AS saleCount FROM ${table4} GROUP BY SaleID;`,
                                    (err, result, fields) => {
                                        if (err) {
                                            console.error('Error querying counts:', err);
                                            connection.release();
                                            return res.status(500).send('Internal server error');
                                        }

                                        var saleCount = result[0].saleCount;
                                        console.log("Sales count:", saleCount);

                                        connection.query(
                                            `SELECT COUNT(*) AS customerCount FROM ${table2} GROUP BY CustomerID;`,
                                            (err, result, fields) => {
                                                connection.release();
                                                if (err) {
                                                    console.error('Error querying counts:', err);
                                                    return res.status(500).send('Internal server error');
                                                }

                                                var customerCount = result[0].customerCount;
                                                console.log("Customer count:", customerCount);

                                                res.render("index", {
                                                    FirstName,
                                                    LastName,
                                                    Email,
                                                    Phone,
                                                    Position,
                                                    Salary,
                                                    employeeCount,
                                                    vehicleCount,
                                                    saleCount,
                                                    customerCount
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
}

exports.login = (req,res)=>{
    if(req.session.loggedIn)
    res.redirect("/");
    else
    res.render("login",{errorHeading: undefined,errorMesg: undefined});
}

exports.postLogin = (req, res) => {
    const { email, password } = req.body;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * FROM ${table6} WHERE Email = ? LIMIT 1`,
            [email],
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is",result,result.length);

                if (result.length === 0 || !bcrypt.compareSync(password, result[0].Password)) {
                    // Invalid credentials
                    console.log("Invalid Email or Password");
                    res.render("login",{errorHeading: "User not Found!",errorMesg: "This user does not exist. Try creating a new account!"});
                }
                else{
                    req.session.loggedIn = true;
                    req.session.emailVal = email;
                    res.redirect('/');
                }
            }
        );
    });
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('login',{errorHeading: "Logged Out!",errorMesg: "You have logged out successfully."});
    });
};

// Test createAccount and postCreateAccount after creating the create-employee.ejs.
exports.createAccount = (req,res)=>{
    res.render("create-account");
}

exports.postCreateAccount = (req,res)=>{
    const { email, password } = req.body;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `INSERT INTO ${table6} (email,password) VALUES('${email}','${password}');`,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is",result,result.length);

                res.render("/create-emp");
            }
        );
    });
}

exports.createEmployee = (req,res)=>{
    res.render("create-employee");
}

exports.employees = (req,res)=>{
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;
    res.render("employees",{FirstName,LastName});
}

exports.vehicles = (req,res)=>{
    res.render("vehicles");
}

exports.sales = (req,res)=>{
    res.render("sales");
}

exports.customers = (req,res)=>{
    res.render("customers");
}

exports.tables = (req,res)=>{
    res.render("tables");
}

exports.error = (req,res)=>{
    res.render("404");
}
