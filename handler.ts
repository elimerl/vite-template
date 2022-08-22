import express, { urlencoded, json } from "express";
import cookieParser from "cookie-parser";
import { Auth, memStore } from "hunter2";
import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.db",
});
const Account = sequelize.define("Account", {
  username: { type: DataTypes.STRING, primaryKey: true },
  display_name: DataTypes.STRING,
  password: DataTypes.STRING,
});

// Why is this not top level await? Because it breaks builds but works fine in dev mode. Just pray that everything is fine.

Account.sync();

const app = express();
const authentication = new Auth({
  sessionStore: memStore(),
  cookie: {
    httpOnly: true,
  },
});

authentication.addAuth("local", async (req) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await Account.findOne({ where: { username } });
  console.log(user);
  if (!user) {
    return {
      message: "Incorrect username or password.",
    };
  }

  const ok = await bcrypt.compare(password, user.get("password") as string);
  if (ok) {
    return username;
  } else {
    return {
      message: "Incorrect username or password.",
    };
  }
});

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(authentication.middleware());

app.post(
  "/api/signin",
  authentication.authenticate("local", true),
  (req, res) => {
    if (req.authError) {
      res.send(req.authError + '<br><a href="/signup">Go back</a>');
    }
    return res.redirect("/");
  }
);
app.post("/api/signup", (req, res) => {
  if (req.user) {
    return res
      .status(400)
      .send('already signed in<br><a href="/signup">Go back</a>');
  }
  const username = req.body.username;
  if (!/^[a-z][a-zA-Z0-9_]*$/g.test(username)) {
    return res
      .status(400)
      .send(
        'invalid username; must start with a letter and cannot contain spaces or dashes<br><a href="/signup">Go back</a>'
      );
  }
  bcrypt.hash(req.body.password, 12).then((password) => {
    Account.findByPk(username).then((user) => {
      if (user != null) {
        return res.status(400).send("username taken");
      }
      Account.create({
        display_name: username,
        bio: "Change your bio lol",
        username,
        password: password,
      }).then((created) => {
        req.login(username).then(() => {
          return res.redirect("/");
        });
      });
    });
  });
});
app.get("/api/signout", (req, res) => {
  req.logout().then(() => {
    res.redirect("/");
  });
});

app.get("/api/whoami", (req, res) => {
  if (!req.user) return res.json(null);
  Account.findOne({ where: { username: req.user } }).then((account) => {
    if (!account) return res.json(null);
    let accountJSON = account.toJSON();
    delete accountJSON.password;
    res.json(accountJSON);
  });
});
export const handler = app;
