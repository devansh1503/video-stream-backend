const mongoose = require('mongoose')

const connectDB = async() => {
    try{
        const options = {
            useNewUrlParser: true,
        }
        const connection = await mongoose.connect('mongodb://mongo:27017/streaming', options)
        if(connection){
            console.log("Database connected successfully!")
        }
    }
    catch(err){
        console.log("MONGO ERROR: ", err)
    }
}

module.exports = {
    connectDB
}