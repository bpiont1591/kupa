document.addEventListener('DOMContentLoaded', function () {
    var termsModal = document.getElementById('terms-modal');
    var acceptButton = document.getElementById('accept-terms-button');
    var declineButton = document.getElementById('decline-terms-button');

    // Show the modal
    termsModal.style.display = 'block';

    acceptButton.onclick = function() {
        termsModal.style.display = 'none';
    }

    declineButton.onclick = function() {
        alert('Musisz zaakceptować regulamin i politykę prywatności, aby korzystać z serwisu.');
        window.location.href = 'https://www.google.com'; // Redirect to another site or show a message
    }

    window.onclick = function(event) {
        if (event.target == termsModal) {
            alert('Musisz zaakceptować regulamin i politykę prywatności, aby korzystać z serwisu.');
            window.location.href = 'https://www.google.com';
        }
    }

    // Nowy kod do nasłuchiwania focus na polach tekstowych i textarea
    var inputFields = document.querySelectorAll('input[type="text"], textarea');
    inputFields.forEach(function(field) {
        field.addEventListener('focus', function() {
            if (window.AndroidInterface) {
                window.AndroidInterface.onFocus();
            }
        });
    });
});

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

form.style.display = 'none';
disconnectButton.style.display = 'none';
newPartnerButton.style.display = 'none';
typingIndicator.style.display = 'none';

function escapeHTML(string) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(string));
    return div.innerHTML;
}

let messageTimeout;

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
});

newPartnerButton.addEventListener('click', () => {
    const region = regionSelect.value;
    messages.innerHTML = 'Szukam nowego obcego...';
    socket.emit('find partner', region);
    newPartnerButton.style.display = 'none';
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = escapeHTML(input.value);
    if (message) {
        clearTimeout(messageTimeout);  // Clear previous timeout
        socket.emit('message', message);
        addMessage('Ty', message);
        input.value = '';
        socket.emit('stop typing');
    }
});

input.addEventListener('input', () => {
    clearTimeout(messageTimeout);  // Clear previous timeout
    if (input.value) {
        socket.emit('typing');
        messageTimeout = setTimeout(() => {
            socket.emit('stop typing');
        }, 3000);  // Stop typing after 3 seconds of inactivity
    } else {
        socket.emit('stop typing');
    }
});

socket.on('message', (msg) => {
    addMessage(escapeHTML(msg.user), escapeHTML(msg.text));
});

socket.on('partner found', (partnerName) => {
    messages.innerHTML = 'Połączono z ' + escapeHTML(partnerName) + '.';
    form.style.display = 'flex';
    disconnectButton.style.display = 'block';
    newPartnerButton.style.display = 'none';
});

socket.on('partner disconnected', () => {
    messages.innerHTML = 'Twój partner się rozłączył. Szukam nowego partnera...';
    form.style.display = 'none';
    typingIndicator.style.display = 'none';
    disconnectButton.style.display = 'none';
    newPartnerButton.style.display = 'block';
    socket.emit('find partner', regionSelect.value);
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

socket.on('error', (error) => {
    console.error('Error received from server:', error);
    alert('Wystąpił błąd: ' + error.message);
});

function addMessage(user, text) {
    const item = document.createElement('div');
    item.classList.add('message');
    item.innerHTML = `<strong>${escapeHTML(user)}:</strong> ${escapeHTML(text)}`;
    messages.appendChild(item);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

