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

router.get("/edit-employee/:id",mainController.editEmployee);
router.get("/delete-employee/:id",mainController.deleteEmployee);

router.get("/add-vehicle",mainController.addVehicle);
router.post("/add-vehicle",mainController.postAddVehicle);

router.get("/edit-vehicle/:id",mainController.editVehicle);
router.get("/delete-vehicle/:id",mainController.deleteVehicle);

router.get("/add-customer",mainController.addCustomer);
router.post("/add-customer",mainController.postAddCustomer);

router.get("/edit-customer/:id",mainController.editCustomer);
router.get("/delete-customer/:id",mainController.deleteCustomer);

router.get("/employees",requireLogin,mainController.employees);
router.get("/vehicles",requireLogin,mainController.vehicles);
router.get("/sales",requireLogin,mainController.sales);
router.get("/customers",requireLogin,mainController.customers);
router.get("*",mainController.error);

module.exports = router;