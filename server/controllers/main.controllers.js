require('dotenv').config();
const { escape } = require('html-escaper');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const table1 = "employees";
const table2 = "customers";
const table3 = "vehicles";
const table4 = "sales";
const table6 = "login";

let pool = mysql.createPool({
    connectionLimit: 100,
    port     : process.env.DB_PORT,
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    database : process.env.DB_NAME,
    password : process.env.DB_PASS
});

// Function to escape HTML characters to prevent XSS HACKING
function escapeHTML(text) {
    if (typeof text !== 'string') {
        return text; // Return the input value if it's not a string
    }
    return escape(text);
}

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

                // Sanitize user input to prevent XSS attacks
                FirstName = escapeHTML(FirstName);
                LastName = escapeHTML(LastName);
                Email = escapeHTML(Email);
                Phone = escapeHTML(Phone);
                Position = escapeHTML(Position);
                Salary = escapeHTML(Salary);

                req.session.FirstName = FirstName;
                req.session.LastName = LastName;
                console.log("User data:", FirstName, LastName, Email, Phone, Position, Salary);

                connection.query(
                    `SELECT COUNT(*) AS employeeCount FROM ${table1} WHERE Status='active';`,
                    (err, result, fields) => {
                        if (err) {
                            console.error('Error querying counts:', err);
                            connection.release();
                            return res.status(500).send('Internal server error');
                        }

                        var employeeCount = result[0].employeeCount;
                        console.log("Employee count:", employeeCount);

                        connection.query(
                            `SELECT COUNT(*) AS vehicleCount FROM ${table3} WHERE Status='active';`,
                            (err, result, fields) => {
                                if (err) {
                                    console.error('Error querying counts:', err);
                                    connection.release();
                                    return res.status(500).send('Internal server error');
                                }

                                var vehicleCount = result[0].vehicleCount;
                                console.log("Vehicle count:", vehicleCount);

                                connection.query(
                                    `SELECT COUNT(*) AS saleCount FROM ${table4} WHERE Status='confirmed';`,
                                    (err, result, fields) => {
                                        if (err) {
                                            console.error('Error querying counts:', err);
                                            connection.release();
                                            return res.status(500).send('Internal server error');
                                        }

                                        var saleCount = result[0].saleCount;
                                        console.log("Sales count:", saleCount);

                                        connection.query(
                                            `SELECT COUNT(*) AS customerCount FROM ${table2} WHERE Status='active';`,
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
                                                    customerCount,
                                                    pageTitle: 'Dashboard'
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
    res.render("login",{errorHeading: undefined,errorMesg: undefined, pageTitle: 'Login'});
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
            `SELECT * FROM ${table6} WHERE Email = ? AND Status = ? LIMIT 1`,
            [email, 'active'],
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is",result,result.length);

                if (result.length === 0 || !bcrypt.compareSync(password, result[0].Password)) {
                    // Invalid credentials
                    req.session.loggedIn = false;
                    console.log("Invalid Email or Password");
                    res.render("login",{errorHeading: "User not Found!",errorMesg: "This user does not exist. Try creating a new account!",pageTitle: 'Login'});
                }
                else{
                    req.session.loggedIn = true;
                    req.session.emailVal = result[0].Email;
                    req.session.employeeID = result[0].EmployeeID;
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
        res.render('login',{errorHeading: "Logged Out!",errorMesg: "You have logged out successfully.", pageTitle: 'Login'});
    });
};

///////////////
// Employees //
/////////////
// To add a new employee from dashboard
exports.createEmployee = (req,res)=>{
    let Email = req.session.emailVal;
    let EmployeeID = req.session.employeeID;
    res.render("create-employee",{EmployeeID, FirstName:undefined,LastName:undefined,Email,Address:undefined,Phone:undefined,Position:undefined,Salary:undefined, pageTitle: 'Create Employee',heading: "Create Employee"});
}

exports.postCreateEmployee = (req, res) => {
    let fromCreateAccount = req.session.fromCreateAccount;
    let email = req.session.emailVal;
    let employeeID = req.session.employeeID;
    let editEmployeeID = req.session.editEmployeeID;
    let { FirstName, LastName, Phone, Position, Salary, Address } = req.body;

    let sqlQuery;
    let queryParams;

    console.log("From Create Account",fromCreateAccount);

    if (fromCreateAccount) {
        sqlQuery = `INSERT INTO ${table1} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        queryParams = [employeeID, FirstName, LastName, email, Address, Phone, Position, Salary, 'active'];
    } else {
        sqlQuery = `UPDATE ${table1}
                    SET FirstName=?, LastName=?, Phone=?, Position=?, Salary=?, Address=?
                    WHERE EmployeeID=?`;
        queryParams = [FirstName, LastName, Phone, Position, Salary, Address, editEmployeeID];
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            sqlQuery,
            queryParams,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                res.redirect("/employees");
            }
        );
    });
}


exports.createAccount = (req,res)=>{
    res.render("create-account",{pageTitle: 'Create Account'});
}

exports.postCreateAccount = (req, res) => {
    const { email, password } = req.body;

    const hashPassword = async(password) => {
        let pass = await bcrypt.hash(password, 10); // Use asynchronous bcrypt.hash
        return pass;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        hashPassword(password)
            .then((hashedPassword) => {
                connection.query(
                    `INSERT INTO ${table6} (Email, Password) VALUES (?, ?);`,
                    [email, hashedPassword],
                    (err, result, fields) => {
                        if (err) {
                            console.error('Error querying the database:', err);
                            connection.release();
                            return res.status(500).send('Internal server error');
                        }

                        // Select from database after successful insertion
                        connection.query(
                            `SELECT * FROM ${table6} WHERE Email = ?;`,
                            [email],
                            (err, result, fields) => {
                                connection.release();
                                if (err) {
                                    console.error('Error querying the database:', err);
                                    return res.status(500).send('Internal server error');
                                }

                                if (result.length === 0) {
                                    return res.status(404).send('User not found'); // Handle case where user is not found
                                }

                                req.session.emailVal = result[0].Email;
                                req.session.employeeID = result[0].EmployeeID;
                                req.session.fromCreateAccount = true;
                                console.log("redirecting to create employee page");
                                res.redirect("/create-employee");
                            }
                        );
                    }
                );
            })
            .catch((error) => {
                console.error('Error hashing password:', error);
                connection.release();
                return res.status(500).send('Internal server error');
            });
    });
}


// Shows the Edit Employee Page
exports.editEmployee = (req, res) => {
    let empID = req.params.id;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        // Use parameterized query to prevent SQL injection
        connection.query(
            `SELECT * FROM ${table1} WHERE EmployeeID = ?`,
            [empID],
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("This is result and result length", result, result.length);
                if (result.length === 0) {
                    return res.status(404).send('Employee not found');
                }

                // Sanitize user inputs to prevent XSS attacks
                const { EmployeeID, FirstName, LastName, Email, Address, Phone, Position, Salary } = result[0];
                req.session.editEmployeeID = EmployeeID;

                // Pass sanitized data to the template
                res.render("create-employee", {
                    EmployeeID: escapeHTML(EmployeeID),
                    FirstName: escapeHTML(FirstName),
                    LastName: escapeHTML(LastName),
                    Email: escapeHTML(Email),
                    Address: escapeHTML(Address),
                    Phone: escapeHTML(Phone),
                    Position: escapeHTML(Position),
                    Salary: escapeHTML(Salary),
                    pageTitle: 'Edit Employee',
                    heading: "Edit Employee"
                });
            }
        );
    });
}


exports.deleteEmployee = (req,res)=>{
    let empID = req.params.id;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }
    
        console.log('Connected to DB as ID ' + connection.threadId);
    
        // First query to update the status in ${table1}
        connection.query(
            `UPDATE ${table1} SET Status = 'inactive' WHERE EmployeeID = ?`,
            [empID],
            (err, result, fields) => {
                if (err) {
                    console.error('Error updating status in table1:', err);
                    connection.release();
                    return res.status(500).send('Internal server error');
                }
    
                // Second nested query to update the status in ${table6}
                connection.query(
                    `UPDATE ${table6} SET Status = 'inactive' WHERE EmployeeID = ?`,
                    [empID],
                    (err, result, fields) => {
                        connection.release();
                        if (err) {
                            console.error('Error updating status in table6:', err);
                            return res.status(500).send('Internal server error');
                        }
                        res.redirect("/employees");
                    }
                );
            }
        );
    });
    
}

exports.employees = (req, res) => {
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * from ${table1} WHERE Status='active'`,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is", result, result.length);

                // Sanitize FirstName and LastName before rendering
                FirstName = escapeHTML(FirstName);
                LastName = escapeHTML(LastName);

                res.render("employees", { FirstName, LastName, result, pageTitle: 'Employees' });
            }
        );
    });
}


///////////////
// Vehicles //
/////////////
exports.addVehicle = (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            'SELECT MAX(VehicleID) AS MaxVehicleID FROM ??',
            [table3],
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                let vehicleID = result[0].MaxVehicleID;
                res.render("add-vehicle", {
                    Model: undefined,
                    Manufacturer: undefined,
                    VehicleYear: undefined,
                    Price: undefined,
                    VehicleID: vehicleID + 1,
                    pageTitle: "Add Vehicle",
                    heading: "Add Vehicle"
                });
            }
        );
    });
}

exports.postAddVehicle = (req, res) => {
    let { Model, Manufacturer, VehicleYear, Price } = req.body;
    let fromEditVehicle = req.session.fromEditVehicle;
    let vehicleID = req.session.vehicleID;

    // Validate inputs to prevent XSS attacks
    if (typeof Model !== 'string' || typeof Manufacturer !== 'string' || typeof VehicleYear !== 'string' || typeof Price !== 'string') {
        console.error('Invalid input types');
        return res.status(400).send('Invalid input types');
    }

    // Validate VehicleYear to prevent XSS attacks
    if (!(/^\d{4}$/.test(VehicleYear))) {
        console.error('Invalid VehicleYear:', VehicleYear);
        return res.status(400).send('Invalid VehicleYear');
    }

    // Validate Price to prevent XSS attacks
    if (!(/^\d+(\.\d{1,2})?$/.test(Price))) {
        console.error('Invalid Price:', Price);
        return res.status(400).send('Invalid Price');
    }

    let sqlQuery, queryParams;
    if (!fromEditVehicle) {
        sqlQuery = `INSERT INTO ${table3} (Model, Manufacturer, VehicleYear, Price) VALUES (?, ?, ?, ?)`;
        queryParams = [Model, Manufacturer, VehicleYear, Price];
    } else {
        // Validate vehicleID to prevent SQL injection
        if (!(/^\d+$/.test(vehicleID))) {
            console.error('Invalid vehicleID:', vehicleID);
            return res.status(400).send('Invalid vehicleID');
        }
        sqlQuery = `UPDATE ${table3} SET Model=?, Manufacturer=?, VehicleYear=?, Price=? WHERE VehicleID=?`;
        queryParams = [Model, Manufacturer, VehicleYear, Price, vehicleID];
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            sqlQuery,
            queryParams,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                res.redirect("/vehicles");
            }
        );
    });
}

// Show the Edit Vehicle Page
exports.editVehicle = (req, res) => {
    let vehID = req.params.id;

    // Validate vehID to prevent XSS attacks
    if (!(/^\d+$/.test(vehID))) {
        console.error('Invalid vehicle ID:', vehID);
        return res.status(400).send('Invalid vehicle ID');
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * FROM ${table3} WHERE VehicleID = ?`,
            [vehID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                // Ensure result is not empty before accessing its properties
                if (result.length === 0) {
                    console.error('Vehicle not found:', vehID);
                    return res.status(404).send('Vehicle not found');
                }

                console.log("This is result and result length", result, result.length);
                const { Model, Manufacturer, VehicleYear, Price, VehicleID } = result[0];
                req.session.vehicleID = VehicleID;
                req.session.fromEditVehicle = true;
                res.render("add-vehicle", { VehicleID, Model, Manufacturer, VehicleYear, Price, pageTitle: 'Edit Vehicle', heading: "Edit Vehicle" });
            }
        );
    });
}

exports.deleteVehicle = (req, res) => {
    let vehID = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `UPDATE ${table3} SET Status = 'inactive' WHERE VehicleID = ?`,
            [vehID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                res.redirect("/vehicles");
            }
        );
    });
}

exports.vehicles = (req, res) => {
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * from ${table3} WHERE Status='active';`,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is", result, result.length);

                // Sanitize FirstName and LastName before rendering
                FirstName = escapeHTML(FirstName);
                LastName = escapeHTML(LastName);

                res.render("vehicles", { FirstName, LastName, result, pageTitle: 'Vehicles' });
            }
        );
    });
}


///////////////
// Customers //
/////////////
exports.addCustomer = (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT MAX(CustomerID) AS MaxCustomerID FROM ${table2};`,
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                let customerID = result[0].MaxCustomerID;

                // Sanitize customerID to prevent XSS
                customerID = escapeHTML(customerID);

                res.render("add-customer", {
                    FirstName: undefined,
                    LastName: undefined,
                    Email: undefined,
                    Phone: undefined,
                    Address: undefined,
                    CustomerID: customerID + 1, // Sanitized customerID
                    pageTitle: "Add Customer",
                    heading: "Add Customer"
                });
            }
        );
    });
}

exports.postAddCustomer = (req, res) => {
    let { FirstName, LastName, Email, Phone, Address } = req.body;
    let fromEditCustomer = req.session.fromEditCustomer;
    let customerID = req.session.customerID;

    // Sanitize input variables to prevent SQL injection
    FirstName = escapeHTML(FirstName);
    LastName = escapeHTML(LastName);
    Email = escapeHTML(Email);
    Phone = escapeHTML(Phone);
    Address = escapeHTML(Address);

    console.log("From Edit Customer",fromEditCustomer);

    if (!fromEditCustomer) {
        sqlQuery = `INSERT INTO ${table2} (FirstName, LastName, Email, Phone, Address) VALUES (?, ?, ?, ?, ?)`;
        queryParams = [FirstName, LastName, Email, Phone, Address];
    } else {
        sqlQuery = `UPDATE ${table2}
                    SET FirstName=?, LastName=?, Email=?, Phone=?, Address=?
                    WHERE CustomerID=?`;
        queryParams = [FirstName, LastName, Email, Phone, Address, customerID];
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            sqlQuery,
            queryParams,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                res.redirect("/customers");
            }
        );
    });
}

// Show the Edit Vehicle Page
exports.editCustomer = (req, res) => {
    let cusID = req.params.id;

    // Sanitize cusID to prevent SQL injection
    cusID = parseInt(cusID);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * FROM ${table2} WHERE CustomerID = ?`,
            [cusID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("This is result and result length", result, result.length);
                const { CustomerID, FirstName, LastName, Email, Phone, Address } = result[0];
                req.session.customerID = CustomerID;
                req.session.fromEditCustomer = true;
                res.render("add-customer", { CustomerID, FirstName, LastName, Email, Phone, Address, pageTitle: 'Edit Customer', heading: "Edit Customer" });
            }
        );
    });
}

exports.deleteCustomer = (req, res) => {
    let cusID = req.params.id;

    // Sanitize cusID to prevent SQL injection
    cusID = parseInt(cusID);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `UPDATE ${table2} SET Status = 'inactive' WHERE CustomerID = ?`,
            [cusID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                res.redirect("/customers");
            }
        );
    });
}

exports.customers = (req, res) => {
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * FROM ${table2} WHERE Status='active';`,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is", result, result.length);

                // Sanitize FirstName and LastName before rendering
                FirstName = escapeHTML(FirstName);
                LastName = escapeHTML(LastName);

                res.render("customers", { FirstName, LastName, result, pageTitle: 'Customers' });
            }
        );
    });
}


///////////////
// Sales //
/////////////

exports.addSale = (req, res) => {
    let saleID, custValues, vehicleValues, empValues;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT MAX(SaleID) AS MaxSaleID FROM ${table4};`,
            (err, result, fields) => {
                if (err) {
                    connection.release();
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                saleID = result[0].MaxSaleID;

                connection.query(
                    `SELECT CustomerID FROM ${table2} WHERE Status='active';`,
                    (err, result, fields) => {
                        if (err) {
                            connection.release();
                            console.error('Error querying the database:', err);
                            return res.status(500).send('Internal server error');
                        }
                        custValues = result;

                        connection.query(
                            `SELECT VehicleID FROM ${table3} WHERE Status='active';`,
                            (err, result, fields) => {
                                if (err) {
                                    connection.release();
                                    console.error('Error querying the database:', err);
                                    return res.status(500).send('Internal server error');
                                }
                                vehicleValues = result;

                                connection.query(
                                    `SELECT EmployeeID FROM ${table1} WHERE Status='active';`,
                                    (err, result, fields) => {
                                        connection.release();
                                        if (err) {
                                            console.error('Error querying the database:', err);
                                            return res.status(500).send('Internal server error');
                                        }
                                        empValues = result;

                                        // Once all queries are done, render the view
                                        res.render("add-sale", {
                                            SaleID: saleID + 1,
                                            CustomerID: undefined,
                                            VehicleID: undefined,
                                            EmployeeID: undefined,
                                            custValues,
                                            vehicleValues,
                                            empValues,
                                            SaleDate: undefined,
                                            SaleAmount: undefined,
                                            pageTitle: "Add Sale",
                                            heading: "Add Sale"
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
};

exports.postAddSale = (req, res) => {
    let { CustomerID, VehicleID, EmployeeID, SaleDate, SaleAmount } = req.body;
    let fromEditSale = req.session.fromEditSale;
    let saleID = req.session.saleID;

    let sqlQuery, queryParams;

    if (!fromEditSale) {
        sqlQuery = `INSERT INTO ${table4} (CustomerID, VehicleID, EmployeeID, SaleDate, SaleAmount) VALUES (?, ?, ?, ?, ?)`;
        queryParams = [CustomerID, VehicleID, EmployeeID, SaleDate, SaleAmount];
    } else {
        sqlQuery = `UPDATE ${table4}
                    SET CustomerID=?, VehicleID=?, EmployeeID=?, SaleDate=?, SaleAmount=?
                    WHERE SaleID=?`;
        queryParams = [CustomerID, VehicleID, EmployeeID, SaleDate, SaleAmount, saleID];
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            sqlQuery,
            queryParams,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                res.redirect("/sales");
            }
        );
    });
};

// Show the Edit Sale Page
exports.editSale = (req, res) => {
    let saleID = req.params.id;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `SELECT * FROM ${table4} WHERE SaleID = ?`,
            [saleID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                console.log("This is result and result length", result, result.length);
                if (result.length === 0) {
                    return res.status(404).send('Sale not found');
                }
                const { SaleID, CustomerID, VehicleID, EmployeeID, SaleDate, SaleAmount } = result[0];
                req.session.saleID = SaleID;
                req.session.fromEditSale = true;

                pool.getConnection((err, connection) => {
                    if (err) {
                        console.error('Error connecting to the database:', err);
                        return res.status(500).send('Internal server error');
                    }

                    console.log('Connected to DB as ID ' + connection.threadId);

                    connection.query(
                        `SELECT CustomerID FROM ${table2} WHERE Status='active'`,
                        (err, result, fields) => {
                            if (err) {
                                console.error('Error querying the database:', err);
                                connection.release();
                                return res.status(500).send('Internal server error');
                            }
                            console.log("Result and result length are", result, result.length);
                            const custValues = result;

                            pool.getConnection((err, connection) => {
                                if (err) {
                                    console.error('Error connecting to the database:', err);
                                    return res.status(500).send('Internal server error');
                                }

                                console.log('Connected to DB as ID ' + connection.threadId);

                                connection.query(
                                    `SELECT VehicleID FROM ${table3} WHERE Status='active'`,
                                    (err, result, fields) => {
                                        if (err) {
                                            console.error('Error querying the database:', err);
                                            connection.release();
                                            return res.status(500).send('Internal server error');
                                        }
                                        console.log("Result and result length are", result, result.length);
                                        const vehicleValues = result;

                                        pool.getConnection((err, connection) => {
                                            if (err) {
                                                console.error('Error connecting to the database:', err);
                                                return res.status(500).send('Internal server error');
                                            }

                                            console.log('Connected to DB as ID ' + connection.threadId);

                                            connection.query(
                                                `SELECT EmployeeID FROM ${table1} WHERE Status='active'`,
                                                (err, result, fields) => {
                                                    connection.release();
                                                    if (err) {
                                                        console.error('Error querying the database:', err);
                                                        return res.status(500).send('Internal server error');
                                                    }
                                                    console.log("Result and result length are", result, result.length);
                                                    const empValues = result;

                                                    res.render("add-sale", {
                                                        SaleID,
                                                        CustomerID,
                                                        VehicleID,
                                                        EmployeeID,
                                                        custValues,
                                                        vehicleValues,
                                                        empValues,
                                                        SaleDate,
                                                        SaleAmount,
                                                        pageTitle: "Edit Sale",
                                                        heading: "Edit Sale"
                                                    });
                                                }
                                            );
                                        });
                                    }
                                );
                            });
                        }
                    );
                });
            }
        );
    });
};

exports.deleteSale = (req, res) => {
    let saleID = req.params.id;
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        connection.query(
            `UPDATE ${table4} SET Status = 'cancelled' WHERE SaleID = ?`,
            [saleID], // Using parameterized query to prevent SQL injection
            (err, result, fields) => {
                connection.release();
                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }
                res.redirect("/sales");
            }
        );
    });
};

exports.sales = (req,res)=>{
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        let sqlQuery = 
        `SELECT v.Model AS VehicleModel,
        v.Manufacturer AS VehicleManufacturer,
        e.FirstName AS EmployeeFirstName,
        e.LastName AS EmployeeLastName,
        c.FirstName AS CustomerFirstName,
        c.LastName AS CustomerLastName,
        s.SaleID,
        s.SaleDate,
        s.SaleAmount
        FROM Sales s
        INNER JOIN Vehicles v ON s.VehicleID = v.VehicleID
        INNER JOIN Employees e ON s.EmployeeID = e.EmployeeID
        INNER JOIN Customers c ON s.CustomerID = c.CustomerID
        WHERE s.Status = 'confirmed';`;
    let queryWithoutNewlines = sqlQuery.replace(/\n/g, "");
    console.log(queryWithoutNewlines);

        connection.query(
            queryWithoutNewlines,
            (err, result, fields) => {
                connection.release();

                if (err) {
                    console.error('Error querying the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log("Result obtained from query and result length is",result,result.length);

                res.render("sales",{FirstName,LastName,result,pageTitle: 'Sales'});
            }
        );
    });
}

////////////////////////
// Search Functionality //
///////////////////////

exports.searchEmployees = (req, res) => {
    const firstname = req.query.firstname;
    const lastname = req.query.lastname;
    let FirstName = req.session.FirstName;
    let LastName = req.session.LastName;

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        const sqlQuery = 'SELECT * FROM ?? WHERE FirstName LIKE ? AND LastName LIKE ? AND Status = ?;';
        const values = [table1, `%${firstname}%`, `%${lastname}%`, 'active'];

        connection.query(sqlQuery, values, (err, result, fields) => {
            connection.release();

            if (err) {
                console.error('Error querying the database:', err);
                return res.status(500).send('Internal server error');
            }

            // Escape HTML in the FirstName and LastName
            FirstName = escapeHTML(FirstName);
            LastName = escapeHTML(LastName);

            console.log(result, result.length);
            res.render("employees", { FirstName, LastName, result, pageTitle: 'Employees' });
        });
    });
};

exports.searchVehicles = (req, res) => {
    const model = req.query.model; // Model name from query
    let FirstName = req.session.FirstName; // First Name of user logged in
    let LastName = req.session.LastName; // Last Name of user logged in

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        // Using parameterized query to prevent SQL injection
        const sqlQuery = 'SELECT * FROM ?? WHERE Model LIKE ? AND Status="active"';
        const values = [table3, `%${model}%`];


        connection.query(sqlQuery, values, (err, result, fields) => {
            connection.release();

            if (err) {
                console.error('Error querying the database:', err);
                return res.status(500).send('Internal server error');
            }

            // Escape HTML in the FirstName and LastName
            FirstName = escapeHTML(FirstName);
            LastName = escapeHTML(LastName);

            console.log(result, result.length);
            res.render("vehicles", { FirstName, LastName, result, pageTitle: 'Vehicles' });
        });
    });
};

exports.searchCustomers = (req, res) => {
    const firstname = req.query.firstname; // First name from query
    const lastname = req.query.lastname; // Last name from query
    let FirstName = req.session.FirstName; // First Name of user logged in
    let LastName = req.session.LastName; // Last Name of user logged in

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        // Using parameterized query to prevent SQL injection
        const sqlQuery = 'SELECT * FROM ?? WHERE FirstName LIKE ? AND LastName LIKE ? AND Status="active"';
        const values = [table2, `%${firstname}%`, `%${lastname}%`];

        connection.query(sqlQuery, values, (err, result, fields) => {
            connection.release();

            if (err) {
                console.error('Error querying the database:', err);
                return res.status(500).send('Internal server error');
            }

            // Escape HTML in the FirstName and LastName
            FirstName = escapeHTML(FirstName);
            LastName = escapeHTML(LastName);

            console.log(result, result.length);
            res.render("customers", { FirstName, LastName, result, pageTitle: 'Customers' });
        });
    });
};

exports.searchSales = (req, res) => {
    const manufacturer = req.query.manufacturer; // Manufacturer from query
    const model = req.query.model; // Model from query
    let FirstName = req.session.FirstName; // First Name of user logged in
    let LastName = req.session.LastName; // Last Name of user logged in

    console.log("Manufacturer and Model",manufacturer,model);

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return res.status(500).send('Internal server error');
        }

        console.log('Connected to DB as ID ' + connection.threadId);

        // Using parameterized query to prevent SQL injection
        const sqlQuery = 'SELECT VehicleID FROM ?? WHERE Manufacturer LIKE ? AND Model LIKE ? AND Status="active"';
        const values = [table3, `%${manufacturer}%`, `%${model}%`];

        connection.query(sqlQuery, values, (err, result, fields) => {
            connection.release();
            if (err) {
                console.error('Error querying the database:', err);
                return res.status(500).send('Internal server error');
            }

            console.log("This is result and result length", result, result.length);
            if (!result.length) {
                // No rows found
                return res.render("sales", { FirstName, LastName, result, pageTitle: 'Sales' });
            }

            const vehicleID = result[0].VehicleID;

            // Using parameterized query to prevent SQL injection
            const innerSqlQuery = 'SELECT SaleID FROM ?? WHERE VehicleID=?';
            const innerValues = [table4, vehicleID];

            pool.getConnection((err, connection) => {
                if (err) {
                    console.error('Error connecting to the database:', err);
                    return res.status(500).send('Internal server error');
                }

                console.log('Connected to DB as ID ' + connection.threadId);

                connection.query(innerSqlQuery, innerValues, (err, result, fields) => {

                    if (err) {
                        console.error('Error querying the database:', err);
                        return res.status(500).send('Internal server error');
                    }

                    console.log("Result obtained from query and result length is", result, result.length);
                    const saleID = result.length ? result[0].SaleID : null;

                    if (!saleID) {
                        // No sale found for the vehicle
                        return res.render("sales", { FirstName, LastName, result, pageTitle: 'Sales' });
                    }

                    // Using parameterized query to prevent SQL injection
                    const nestedSqlQuery =
                        `SELECT v.Model AS VehicleModel,
                        v.Manufacturer AS VehicleManufacturer,
                        e.FirstName AS EmployeeFirstName,
                        e.LastName AS EmployeeLastName,
                        c.FirstName AS CustomerFirstName,
                        c.LastName AS CustomerLastName,
                        s.SaleID,
                        s.SaleDate,
                        s.SaleAmount
                        FROM Sales s
                        INNER JOIN Vehicles v ON s.VehicleID = v.VehicleID
                        INNER JOIN Employees e ON s.EmployeeID = e.EmployeeID
                        INNER JOIN Customers c ON s.CustomerID = c.CustomerID
                        WHERE s.Status = 'confirmed' AND s.SaleID=?`;
                        const nestedValues = [saleID];

                    connection.query(nestedSqlQuery, nestedValues, (err, result, fields) => {
                        connection.release();

                        if (err) {
                            console.error('Error querying the database:', err);
                            return res.status(500).send('Internal server error');
                        }

                        console.log("Result obtained from query and result length is", result, result.length);

                        res.render("sales", { FirstName, LastName, result, pageTitle: 'Sales' });
                    });
                });
            });
        });
    });
};


///////////////
// Error //
/////////////

exports.error = (req, res) => {
    // Sanitize user session data to prevent XSS
    let FirstName = escapeHTML(req.session.FirstName);
    let LastName = escapeHTML(req.session.LastName);
    
    res.render("404", { FirstName, LastName, pageTitle: 'Page Not Found' });
}

