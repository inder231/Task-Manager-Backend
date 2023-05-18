var GoogleStrategy = require("passport-google-oauth20");
const passport = require("passport");
const { User } = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOne({ email: profile.emails[0].value })
        .then(async (user) => {
          if (!user) {
            let newUser = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              password: uuidv4(),
            });
            await newUser.save();
            return cb(null, { userId: newUser._id, email: newUser.email });
          } else {
            return cb(null, { userId: user._id, email: user.email });
          }
        })
        .catch((err) => {
          if (err) return cb(err, null);
        });
    }
  )
);

