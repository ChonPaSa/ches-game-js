import express from "express";
import User from "../models/User.js";

const router = express.Router();

//register new user
router.get("/register", (req, res, next) => {
    res.render("userRegistrationForm");
});

router.post("/register", (req, res, next) => {
    let data = req.body;
    if (data) {
        User.create(data)
            .then(() => {
                res.redirect("/users/login");
            })
            .catch((err) => {
                return next(err);
            });
    } else {
        res.redirect("/");
    }
});

//Login user
router.get("/login", (req, res, next) => {
    res.render("userLoginForm");
});

router.post("/login", (req, res, next) => {
    let { email, password } = req.body;
    if (!email || !password) return res.redirect("/login");

    User.findOne({ email })
        .then((user) => {
            if (!user) {
                return res.redirect("/login");
            } else {
                user.checkPassword(password, (err, result) => {
                    if (err) return next(err);
                    if (!result) {
                        res.render("/login", { error: "invalid Password"});
                    } else {
                        res.render("index", { userName: user.name});
                    }
                });
            }
        })
        .catch((err) => {
            next(err);
        });
});

router.get("/games", (req, res, next) => {
    res.render("userGames");
});

export default router;
