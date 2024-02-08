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

router.get("/create-employee",mainController.createEmployee);
// router.get("/edit-employee/:id",mainController.editEmployee);
// router.get("/delete-employee/:id",mainController.deleteEmployee);

router.get("/employees",requireLogin,mainController.employees);

router.get("/vehicles",requireLogin,mainController.vehicles);

router.get("/sales",requireLogin,mainController.sales);

router.get("/customers",requireLogin,mainController.customers);

router.get("*",mainController.error);

module.exports = router;