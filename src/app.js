const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    // socket.emit('serverMsg', generateMessage('Welcome to the chat room'))
    // socket.broadcast.emit('serverMsg', generateMessage('A new user jas joined!'))

    socket.on('clientMsg', (text, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('serverMsg', generateMessage(user.username, text))
        cb("Message was received!")
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('serverMsg', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })            
        }
    })

    socket.on('clientLocation', (coords, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('serverLocationMsg', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        cb('Location shared')
    })

    socket.on('join', (options, cb) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error){
            return cb(error)
        }

        socket.join(user.room)
        socket.emit('serverMsg', generateMessage('Admin', 'Welcome to the chat room'))
        socket.broadcast.to(user.room).emit('serverMsg', generateMessage('Admin', `${user.username} jas joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        cb()
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}...`)
})