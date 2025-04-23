// Establish socket connection
const socket = io();

// Temporary user data
const userProfile = {
    user: 'gern',
};

// Variables for DOM elements
// Sign-in form elements
const signIn = setElement('.sign-in');
const submit = setElement('#submit');
const user = setElement('#user');

// Chat interface and active users bar
const chatInterface = setElement(".chat");
const activeUsers = setElement('.users');

// Notification feature elements
const newUser = setElement('.upper-mid');
const newUserChild = setElement('#new_user');
const newActivity = setElement('.lower-mid');
const newActivityChild = setElement('#activity');

// Chat message and input elements
const chats = setElement('.chat-msg');
const sendBtn = setElement('#send');
const textarea = setElement('#write_msg');

// Custom functions
// Emit "connected" event when user joins the chat
function connected() {
    socket.emit('connected', { name: userProfile.user });
}

// Helper function to assign variables to DOM elements
function setElement(elementName) {
    ele = document.querySelector(elementName);
    return ele;
}

// Classes

// Class for creating custom elements with additional features
class customElement {
    constructor(element, classes) {
        this.element = document.createElement(element);
        this.element.classList += classes;
    }

    // Append a child element
    childAppend(child) {
        this.element.appendChild(child);
    }

    // Add content to the element
    addContent(content) {
        this.element.innerHTML = content;
    }

    // Render the element
    __render__() {
        return this.element;
    }
}

// Class for handling chat messages
class Message {
    constructor(user, text) {
        this.user = user;
        this.text = text;
        this.who = (user == userProfile.user) ? 'msg-wrap me' : 'msg-wrap other';
    }

    // Render the message text
    __render__() {
        return this.text;
    }
}

// Class for handling notifications
class Notify {
    constructor(parent, child, type = 0) {
        this.parent = parent;
        this.child = child;
        this.options = ['user', 'text'];
        this.type = this.options[type];
    }

    // Display a notification
    sendNotification(text) {
        this.child.innerHTML = text;
        this.parent.classList.remove('hide');
    }

    // Hide the notification
    hideNotification() {
        this.parent.classList += ' hide';
    }
}

// Notification instances for chat join and activity
const chatJoin = new Notify(newUser, newUserChild, 0);
const activity = new Notify(newActivity, newActivity, 1);

// Class for managing user elements
class User {
    constructor(name) {
        this.name = name;
        this.wrapper = new customElement('li', 'user flex-center');
        const ico_wrap = new customElement('div', 'ico');
        const ico = new customElement('i', 'ri-user-5-line');
        ico_wrap.childAppend(ico.__render__());
        const username = new customElement('div', 'name');
        username.addContent(name);

        this.wrapper.childAppend(ico_wrap.__render__());
        this.wrapper.childAppend(username.__render__());
    }

    // Render the user element
    __render__() {
        return this.wrapper.__render__();
    }
}

// Class for managing the active users sidebar
class ActiveUsersBar {
    constructor(users) {
        this.container = setElement('.user-list');
        this.users = users;
    }

    // Update the list of active users
    updateUsers(users) {
        this.users = users;
        this.__render__();
    }

    // Render the active users list
    __render__() {
        this.container.innerHTML = '';
        this.users.forEach(user => {
            const newUser = new User(user);
            this.container.appendChild(newUser.__render__());
        });
    }
}

// Instance of ActiveUsersBar
const activeUsersList = new ActiveUsersBar([]);

// Class for managing app functionalities
class AppFunctions {
    // Send a message
    sendMessage(user, msg) {
        if (user && msg) {
            socket.emit('message', { user: user, text: msg });
            this.addMessage(msg, user);
        }
    }

    // Add a message to the chat
    addMessage(msg, user) {
        newActivity.classList += ' hide';

        // Create the message
        const newMessage = new Message(user, msg);
        const MSGcontainer = new customElement('div', newMessage.who);

        // Add the username
        const Profile = new customElement('div', 'profile');
        Profile.addContent(user);

        // Add the message
        const MSGelement = new customElement('div', 'msg');
        MSGelement.addContent(newMessage.__render__());

        // Add elements to the container
        MSGcontainer.childAppend(Profile.__render__());
        MSGcontainer.childAppend(MSGelement.__render__());

        // Add the container to the page
        chats.appendChild(MSGcontainer.__render__());

        // Scroll to the latest message
        this.scrollToBottom();
    }

    // Scroll to the bottom of the chat
    scrollToBottom() {
        chats.scrollTop = chats.scrollHeight;
    }

    // Display the current time
    currentTime() {
        const time = new Date();
        document.querySelector('#time').innerHTML = `${time.getHours()}:${(time.getMinutes() < 10) ? `0${time.getMinutes()}` : time.getMinutes()}`;
    }
}

// Instance of AppFunctions
const App = new AppFunctions();

// Update the current time every second
setInterval(App.currentTime, 1000);

// Custom events
// Emit "exit_chat" event when user disconnects
window.addEventListener('beforeunload', () => {
    socket.emit('exit_chat', { name: userProfile.user });
});

// Sign-in button functionality
submit.addEventListener('click', () => {
    userProfile.user = user.value;
    signIn.className += " hide";
    activeUsers.classList.remove('hide');
    chatInterface.classList.remove('hide');
    document.querySelector('#username').innerHTML = userProfile.user;
    connected();
});

// Expand textarea height and emit "typing" event
textarea.addEventListener('input', () => {
    textarea.style.height = '60px';
    socket.emit('typing', { name: userProfile });
});

// Reset textarea height on mouseout
textarea.addEventListener('mouseout', () => {
    textarea.style.height = '20px';
});

// Send message button functionality
sendBtn.addEventListener('click', () => {
    App.sendMessage(userProfile.user, textarea.value);
    textarea.style.height = '20px';
    textarea.value = '';
    socket.emit('not_typing', { name: userProfile });
});

// Socket events
// Receive message event
socket.on('receive_message', (msg) => {
    if (userProfile.user != msg.user) {
        App.addMessage(msg.text, msg.user);
    } else {
        console.log('sent successfully');
    }
});

// User exit event
socket.on('user_exit', (users) => {
    activeUsersList.updateUsers(users);
});

// Chat join notification event
socket.on('newUser', (users) => {
    activeUsersList.updateUsers(users);
    chatJoin.sendNotification(`${users[users.length - 1]} has joined`);
    setTimeout(chatJoin.hideNotification(), 2500);
});

// User typing notification event
socket.on('typing_event', (user) => {
    activity.sendNotification(`${user['user']} is typing...`, 'typing');
});

// User stops typing event
socket.on('not_typing_event', () => {
    activity.hideNotification();
});

// Emit "not_typing" event when textarea loses focus
textarea.addEventListener('focusout', () => {
    socket.emit('not_typing', { name: userProfile });
    activity.classList += ' hide';
});