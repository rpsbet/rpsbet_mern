// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../../model/User'); // Adjust the path as necessary

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists in our db
    let user = await User.findOne({ googleId: profile.id });
    if (user) {
      // If user exists, call done with user
      done(null, user);
    } else {
      // If not, create a new user
      user = await new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName
      }).save();
      done(null, user);
    }
  } catch (err) {
    console.error(err);
    done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error(err);
    done(err, null);
  }
});
