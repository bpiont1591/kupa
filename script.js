const socket = io();

const connectButton = document.getElementById('connect-button');
const disconnectButton = document.getElementById('disconnect-button');
const newPartnerButton = document.getElementById('new-partner-button');
const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const messages = document.getElementById('messages');
const typingIndicator = document.getElementById('typing');
const onlineUsers = document.getElementById('online-users');
const onlineCount = document.getElementById('online-count');
const regionSelect = document.getElementById('region-select');
const chatContainer = document.getElementById('chat-container');

const prevAnnouncementButton = document.getElementById('prev-announcement');
const nextAnnouncementButton = document.getElementById('next-announcement');
const announcements = document.querySelectorAll('.announcement');
let currentAnnouncementIndex = 0;

prevAnnouncementButton.addEventListener('click', () => {
    announcements[currentAnnouncementIndex].style.display = 'none';
    currentAnnouncementIndex = (currentAnnouncementIndex - 1 + announcements.length) % announcements.length;
    announcements[currentAnnouncementIndex].style.display = 'block';
});

nextAnnouncementButton.addEventListener('click', () => {
    announcements[currentAnnouncementIndex].style.display = 'none';
    currentAnnouncementIndex = (currentAnnouncementIndex + 1) % announcements.length;
    announcements[currentAnnouncementIndex].style.display = 'block';
});

connectButton.addEventListener('click', () => {
    const region = regionSelect.value;
    if (!region) {
        alert('Proszę wybrać województwo.');
        return;
    }
    connectButton.style.display = 'none';
    regionSelect.style.display = 'none';
    messages.innerHTML = 'Szukam nowego obcego...';
    socket.emit('find partner', region);
});

disconnectButton.addEventListener('click', () => {
    socket.emit('disconnect partner');
    form.style.display = 'none';
    typingIndicator.style.display = 'none';
    messages.innerHTML = 'Rozłączono. Możesz połączyć się z nowym obcym.';
    disconnectButton.style.display = 'none';
    newPartnerButton.style.display = 'block';
    document.body.classList.remove('expanded');
    chatContainer.classList.remove('expanded');
});

newPartnerButton.addEventListener('click', () => {
    const region = regionSelect.value;
    messages.innerHTML = 'Szukam nowego obcego...';
    socket.emit('find partner', region);
    newPartnerButton.style.display = 'none';
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit('message', input.value);
        addMessage('Ty', input.value);
        input.value = '';
        socket.emit('stop typing');
    }
});

input.addEventListener('input', () => {
    if (input.value) {
        socket.emit('typing');
    } else {
        socket.emit('stop typing');
    }
});

socket.on('message', (msg) => {
    addMessage(msg.user, msg.text);
});

socket.on('partner found', (partnerName) => {
    messages.innerHTML = 'Połączono z ' + partnerName + '.';
    form.style.display = 'flex';
    disconnectButton.style.display = 'block';
    newPartnerButton.style.display = 'none';
    document.body.classList.add('expanded');
    chatContainer.classList.add('expanded');
});

socket.on('partner disconnected', () => {
    messages.innerHTML = 'Twój partner się rozłączył. Szukam nowego partnera...';
    form.style.display = 'none';
    typingIndicator.style.display = 'none';
    disconnectButton.style.display = 'none';
    newPartnerButton.style.display = 'block';
    socket.emit('find partner', regionSelect.value);
    document.body.classList.remove('expanded');
    chatContainer.classList.remove('expanded');
});

socket.on('typing', () => {
    typingIndicator.style.display = 'block';
});

socket.on('stop typing', () => {
    typingIndicator.style.display = 'none';
});

socket.on('online users', (count) => {
    onlineCount.textContent = count;
    onlineUsers.classList.add('highlight');
    setTimeout(() => onlineUsers.classList.remove('highlight'), 500);
});

function addMessage(user, text) {
    const item = document.createElement('div');
    item.classList.add('message');
    item.innerHTML = `<strong>${user}:</strong> ${text}`;
    messages.appendChild(item);
    // Scroll to the bottom of the messages container
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
