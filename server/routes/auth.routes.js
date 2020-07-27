const express = require("express")
const router = express.Router()
const passport = require("passport")

const User = require("../models/user.model")
const bcrypt = require("bcrypt")
const { ensureLoggedIn, ensureLoggedOut} = require("connect-ensure-login");

//Users 

router.post('/signup', (req, res, next) => {

    const {
        username,
        password,
    } = req.body


    if (!username || !password) {
        res.status(400).json({ message: 'Provide username and password' });
        return;
    }

    if (password.length < 2) {
        res.status(400).json({ message: 'Please make your password at least 8 characters long for security purposes.' });
        return;
    }

    User.findOne({ username }, (err, foundUser) => {

        if (err) {
            res.status(500).json({ message: "Username check went bad." });
            return;
        }

        if (foundUser) {
            res.status(400).json({ message: 'Username taken. Choose another one.' });
            return;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(password, salt);

        const aNewUser = new User({
            username: username,
            password: hashPass
        });

        aNewUser.save(err => {
            if (err) {
                res.status(400).json({ message: 'Saving user to database went wrong.' });
                return;
            }

            req.login(aNewUser, (err) => {

                if (err) {
                    res.status(500).json({ message: 'Login after signup went bad.' });
                    return;
                }
                res.status(200).json(aNewUser);
            });
        });
    });
});

router.post('/login', ensureLoggedOut(),(req, res, next) => {
    passport.authenticate('local', (err, theUser, failureDetails) => {
        if (err) {
            debugger
            res.status(500).json({ message: 'Something went wrong authenticating user' });
            return;
        }

        if (!theUser) {
            res.status(401).json(failureDetails);
            return;
        }

        req.login(theUser, (err) => {
            if (err) {
                res.status(500).json({ message: 'Session save went bad.' });
                return;
            }

            res.status(200).json(theUser);
        });
    })(req, res, next);
});



router.post('/logout', ensureLoggedIn(), (req, res) => {
    req.logout();
    res.status(200).json({ message: 'Log out success!' });
});


router.get('/loggedin', ensureLoggedIn(), (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json(req.user);
        return;
    }
    res.status(403).json({ message: 'Unauthorized' });
});




module.exports = router