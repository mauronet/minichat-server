const socket = io()

const inputMsg = document.querySelector('#message')
const sendBtn = document.querySelector('#send')
const sendLocationBtn = document.querySelector('#sendLocation')
const messages = document.querySelector('#messages')
const sideBar = document.querySelector('#sidebar')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight

    const containerHeight = messages.scrollHeight

    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight
    }

}

socket.on('serverMsg', (msg) => {
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('serverLocationMsg', (msg) => {
    const html = Mustache.render(locationTemplate, {
        username: msg.username,
        link: msg.link,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    sideBar.innerHTML = html
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

sendBtn.addEventListener('click', () => {
    sendBtn.setAttribute('disabled','disabled')
    socket.emit('clientMsg', inputMsg.value, (ackMsg) => {
        inputMsg.value = ""
        sendBtn.removeAttribute('disabled')
        inputMsg.focus()
        console.log(ackMsg)
    })
})

sendLocationBtn.addEventListener('click', () => {
    sendLocationBtn.setAttribute('disabled','disabled')    
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = position.coords
        socket.emit(
            'clientLocation',
            { longitude: longitude, latitude: latitude},
            (ackMsg) => {
                console.log(ackMsg)
                sendLocationBtn.removeAttribute('disabled')
            }
        )
    })
})


