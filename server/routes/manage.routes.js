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

router.get("/create-emp",mainController.createEmployee);

router.get("/employees",mainController.employees);

router.get("/vehicles",mainController.vehicles);

router.get("/sales",mainController.sales);

router.get("/customers",mainController.customers);

router.get("/tables",mainController.tables);


router.get("*",mainController.error);

module.exports = router;