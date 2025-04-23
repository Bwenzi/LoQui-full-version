//socket connection
const socket = io();

//temporal user data
const userProfile = {
    user: 'gern',
}

//variables
//sign form elements
const signIn = setElement('.sign-in');
const submit = setElement('#submit');
const user = setElement('#user');

//active users bar
const chatInterface = setElement(".chat");
const activeUsers = setElement('.users');

//Notification Feature Variables
const newUser = setElement('.upper-mid');
const newUserChild = setElement('#new_user');
const newActivity = setElement('.lower-mid');
const newActivityChild = setElement('#activity');

//chat message and input elements
const chats = setElement('.chat-msg');
const sendBtn = setElement('#send');
const textarea = setElement('#write_msg');

//custom functions
//connected succesfully signal (only happens after user joins the chat)
function connected(){
    socket.emit('connected', {name: userProfile.user});
};

//custom function for assigning variables to elements
function setElement(elementName){
    ele = document.querySelector(elementName);
    return ele
};

//classes

//element custom feature
class customElement{
    constructor(element, classes){
        this.element = document.createElement(element);
        this.element.classList += classes;
    }

    childAppend(child){
        this.element.appendChild(child);
    }

    addContent(content){
        this.element.innerHTML = content;
    }

    __render__(){
        return this.element
    }

};

//message feature
class Message{
    constructor(user, text){
        this.user = user;
        this.text =  text;
        this.who = (user == userProfile.user)? 'msg-wrap me': 'msg-wrap other';
    }

    __render__(){
        return this.text
    }
}

//Notification Feature
class Notify{
    constructor(parent, child, type=0){
        this.parent = parent;
        this.child = child;
        this.options = ['user', 'text'];
        this.type = this.options[type];
    }

    sendNotification(text){
        this.child.innerHTML = text;
        this.parent.classList.remove('hide');
    }

    hideNotification(){
        this.parent.classList += ' hide';
    }
    
}

//Nofication types (object variables)
const chatJoin = new Notify(newUser, newUserChild, 0);
const activity = new Notify(newActivity, newActivity, 1);

//user class
class User{
    constructor(name){
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

    __render__(){
        return this.wrapper.__render__()
    }
}

//active users side bar
class ActiveUsersBar{
    constructor(users){
        this.container = setElement('.user-list');
        this.users = users;
    }

    updateUsers(users){
        this.users = users;
        this.__render__();
    }

    __render__(){
        this.container.innerHTML = '';
        this.users.forEach(user =>{
            const newUser = new User(user);
            this.container.appendChild(newUser.__render__());
        })

    }
}

// activeUsers
const activeUsersList = new ActiveUsersBar([]);

class AppFunctions{
    sendMessage(user, msg){
        if(user && msg){
            socket.emit('message', {user: user, text: msg });
            this.addMessage(msg, user);
        }
    }

    addMessage(msg, user, date=''){
        newActivity.classList += ' hide';
    
        //create the message
        const newMessage = new Message(user, msg);
        const MSGcontainer = new customElement('div', newMessage.who);
    
        //add the username
        const Profile = new customElement('div', 'profile');
        Profile.addContent(user);
    
        //add the message
        const MSGelement = new customElement('div', 'msg');
        MSGelement.addContent(newMessage.__render__());
    
        //add the elements to the constainer
        MSGcontainer.childAppend(Profile.__render__());
        MSGcontainer.childAppend(MSGelement.__render__());
    
        //add the container to the page
        chats.appendChild(MSGcontainer.__render__());

        //scroll to the message
        this.scrollToBottom();
    };

    scrollToBottom() {
        chats.scrollTop = chats.scrollHeight;
    };

    currentTime(){
        const time = new Date();
        document.querySelector('#time').innerHTML =  `${time.getHours()}:${(time.getMinutes()<10)? `0${time.getMinutes()}`: time.getMinutes()}`;
    };
}

const App = new AppFunctions();
setInterval(App.currentTime, 1000);

//custom events
//user disconected signal
window.addEventListener('beforeunload', ()=>{
    socket.emit('exit_chat', {name: userProfile.user});
});

//sign in submit button click event functionality
submit.addEventListener('click', () =>{
    userProfile.user = user.value;
    signIn.className += " hide";
    activeUsers.classList.remove('hide');
    chatInterface.classList.remove('hide');
    document.querySelector('#username').innerHTML = userProfile.user;
    connected();
});

//expand height-animation for textarea element and emit typing signal
textarea.addEventListener('input', ()=>{
    textarea.style.height = '60px';
    socket.emit('typing', {name : userProfile});
});

textarea.addEventListener('mouseout', ()=>{
    textarea.style.height = '20px';
});

//send message button functionality
sendBtn.addEventListener('click', ()=>{
    App.sendMessage(userProfile.user, textarea.value);
    textarea.style.height = '20px';
    textarea.value = '';
    socket.emit('not_typing', {name : userProfile});
});

//socket events
//recieve message signal
socket.on('receive_message', (msg)=>{
    if(userProfile.user != msg.user){
        App.addMessage(msg.text, msg.user);
    }
    else{
        console.log('sent successfully')
    }
});

//user left signal
socket.on('user_exit', (users)=>{
    activeUsersList.updateUsers(users);
});

//Notification Socket events
//chat join notification
socket.on('newUser', (users)=>{
    activeUsersList.updateUsers(users);
    chatJoin.sendNotification(`${users[users.length - 1]} has joined`);
    setTimeout(chatJoin.hideNotification(), 2500);
});

//user typing notification
socket.on('typing_event', (user)=>{
    activity.sendNotification(`${user['user']} is typing...`, 'typing');
});

//user stops typing
socket.on('not_typing_event', ()=>{
    activity.hideNotification();
});

textarea.addEventListener('focusout', ()=>{
    socket.emit('not_typing', {name : userProfile});
    activity.classList += ' hide';
});