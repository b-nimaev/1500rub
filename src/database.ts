import mongoose from 'mongoose';

// @ts-ignore
const username = encodeURIComponent("alexandr")
const password = encodeURIComponent(<string>process.env.password?.replace(/"/g, ''))

console.log(username)
console.log(password)

mongoose.connect(`mongodb://${username}:${password}@87.236.22.124:27017/1500?authSource=admin`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as any).catch(error => { console.error(error) });

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB!');
});