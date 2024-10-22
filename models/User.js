import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, require: true },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true, minLength: 8 },
});

userSchema.pre("save", function (next) {
    if (this.password && this.isModified("password")) {
        bcrypt.hash(this.password, 10, (err, hashed) => {
            if (err) return next(err);
            this.password = hashed;
            next();
        });
    } else {
        next();
    }
});

userSchema.methods.checkPassword = function (password, callback) {
    bcrypt.compare(password, this.password, (err, result) => {
        return callback(err, result);
    });
};

let User = mongoose.model("User", userSchema);

export default User;
