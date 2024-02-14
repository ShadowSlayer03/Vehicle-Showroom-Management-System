const express = require("express");
const router = express.Router();
const mainController = require("../controllers/main.controllers.js");
const requireLogin = require("../middlewares/authentication.js");

router.get("/",requireLogin,mainController.home);

router.get("/login",mainController.login);
router.post("/login",mainController.postLogin);

router.get("/logout",mainController.logout);

router.get("/create-account",mainController.createAccount);
router.post("/create-account",mainController.postCreateAccount);

router.get("/create-employee",requireLogin,mainController.createEmployee);
router.post("/create-employee",mainController.postCreateEmployee);

router.get("/edit-employee/:id",requireLogin,mainController.editEmployee);
router.get("/delete-employee/:id",requireLogin,mainController.deleteEmployee);

router.get("/add-vehicle",requireLogin,mainController.addVehicle);
router.post("/add-vehicle",mainController.postAddVehicle);

router.get("/edit-vehicle/:id",requireLogin,mainController.editVehicle);
router.get("/delete-vehicle/:id",requireLogin,mainController.deleteVehicle);

router.get("/add-customer",requireLogin,mainController.addCustomer);
router.post("/add-customer",mainController.postAddCustomer);

router.get("/edit-customer/:id",requireLogin,mainController.editCustomer);
router.get("/delete-customer/:id",requireLogin,mainController.deleteCustomer);

router.get("/add-sale",requireLogin,mainController.addSale);
router.post("/add-sale",mainController.postAddSale);

router.get("/edit-sale/:id",requireLogin,mainController.editSale);
router.get("/delete-sale/:id",requireLogin,mainController.deleteSale);

router.get("/employees/search",requireLogin,mainController.searchEmployees);
router.get("/vehicles/search",requireLogin,mainController.searchVehicles);
router.get("/customers/search",requireLogin,mainController.searchCustomers);
router.get("/sales/search",requireLogin,mainController.searchSales);

router.get("/employees",requireLogin,mainController.employees);
router.get("/vehicles",requireLogin,mainController.vehicles);
router.get("/sales",requireLogin,mainController.sales);
router.get("/customers",requireLogin,mainController.customers);
router.get("*",mainController.error);

module.exports = router;