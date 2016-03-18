#!/bin/env python

from flask import Flask, jsonify, request, copy_current_request_context, url_for, send_from_directory
from werkzeug.serving import run_simple
from werkzeug.wsgi import DispatcherMiddleware
import atexit
import json
import uuid
import time
import config
import logging

app = Flask(__name__, static_url_path='/habits')
app.config['SECRET_KEY'] = 'secret!'
app.config['APPLICATION_ROOT'] = '/habits'
app.debug = True

def simple(env, resp):
    resp(b'200 OK', [(b'Content-Type', b'text/plain')])
    return [b'Hello World']

parent_app = DispatcherMiddleware(simple, {'/habits': app})

################
# Routes
################

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/events', methods=['GET'])
def get_all_habits():
    with open('json/january.json') as jan:
        habit_json = jan.read()
    return habit_json

@app.route('/events', methods=['POST'])
def post_new_habit():
    content = request.get_json()
    content['id'] = uuid.uuid4()
    return jsonify(content)

@app.route('/events/<event_id>', methods=['PUT'])
def update_habit(event_id):
    content = request.get_json()
    return jsonify(content)

# This is slow and not recommended for production.
# I'm in "production" becuase I'm using werkzeug
# and I'm doing that becuase I wanted "/habits" to be middleware
@app.route('/<path:filename>')
def send_file(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    run_simple('localhost', 80, parent_app)

