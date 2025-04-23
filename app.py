from flask import Flask, render_template,send_from_directory
from flask_socketio import SocketIO, emit

import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret1'
socketio = SocketIO(app, cors_allowed_origins="*")


'''messages from memory'''
users = [] 
FILE_DIRECTORY_CSS = os.path.join(os.getcwd(), 'templates/static/css')
FILE_DIRECTORY_JS = os.path.join(os.getcwd(), 'templates/static/js')
        

@app.route('/home', methods=['GET'])
def home():
    return render_template('index.html')

@app.route('/css', methods=['GET'])
def get_css():
    return send_from_directory(FILE_DIRECTORY_CSS, 'style.css', as_attachment=False)

@app.route('/js', methods=['GET'])
def get_js():
    return send_from_directory(FILE_DIRECTORY_JS, 'script.js', as_attachment=False)


@socketio.on('connected')
def new_user(data):
    users.append(data['name'])
    emit('newUser', users, broadcast=True)

@socketio.on('exit_chat')
def exit_chat(data):
    users.remove(data['name'])
    emit('user_exit', users, broadcast=True)

@socketio.on('typing')
def typing(data):
    emit('typing_event', data['name'], broadcast=True)

@socketio.on('not_typing')
def typing(data):
    emit('not_typing_event', data['name'], broadcast=True)

@socketio.on('message')
def get_messages(msg):
    emit('receive_message',msg, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, port='5100', debug=True)
