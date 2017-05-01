var express               = require("express"),
    app                   = express(),
    mongoose              = require("mongoose"),
    Blog                  = require("./models/blog"),
    User                  = require("./models/user"),
    bodyParser            = require("body-parser"),
    methodOverride        = require("method-override"),
    expressSanitizer      = require("express-sanitizer"),
    passport              = require("passport"),
    passportLocalMongoose = require("passport-local-mongoose"),
    localStrategy         = require("passport-local")
    
// ********** //
// App config //
// ********** //

app.use(require("express-session")({ 
    secret: "The failed man never sleeps a restful sleep.",
    resave: false,
    saveUninitialized: false
}));

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
    
mongoose.connect("mongodb://localhost/blog_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(passport.initialize());
app.use(passport.session());

// ************** //
// RESTful routes //
// ************** //


// index route

app.get("/", function(req, res) {
   res.redirect("/blogs"); 
});

app.get("/blogs", function(req, res) {
    Blog.find({}, function(err, blogs) {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {blogs: blogs});
        }
    });
});

// login routes

app.get("/blogs/login", function(req, res) {
    res.render("login");
})

app.post("/blogs/login", passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/blogs/login",
}), function(req, res) {
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

// auth routes

app.get("/blogs/register", function(req, res) {
    res.render("register");    
});

app.post("/blogs/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/blogs");
            });
        }
    });
});

// new route

app.get("/blogs/new", isLoggedIn, function(req, res){
    res.render("new");
});

// create route

app.post("/blogs", isLoggedIn, function(req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog, function(err, newBlog) {
        if (err) {
            res.render("new");
        } else {
            res.redirect("/blogs");
        }
    });
});

// show route

app.get("/blogs/:id", function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog){
       if (err) {
           res.redirect("/blogs");
       } else {
          res.render("show", {blog: foundBlog}); 
       }
    });
});

// edit route

app.get("/blogs/:id/edit", isLoggedIn, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog) {
        if (err) {
            console.log(err)
        } else {
            res.render("edit", {blog: foundBlog});
        }
    });
});

// update route

app.put("/blogs/:id", isLoggedIn, function(req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog) {
        if (err) {
           res.redirect("/"); 
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    }); 
});

// delete route

app.delete("/blogs/:id", isLoggedIn, function(req, res) {
    Blog.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }  
  res.redirect("/blogs/login");
};

app.listen(process.env.PORT, process.env.IP, function (){
    console.log("Server is running");
});

