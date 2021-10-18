import json
import sqlite3
import aiosql

from uuid import uuid4

from bottle import Bottle, static_file, run, jinja2_view, request

from jinja2 import Environment, FileSystemLoader, select_autoescape

app = Bottle()

env = Environment(
    loader=FileSystemLoader(''),
    autoescape=select_autoescape(['html', 'xml'])
)

widget_states = dict()
"""
    TODO:
        Handle arbitrary number of arguments on first load
        Cache arguments on first load
        Handle argument override on subsequent loads, and
        argument conflict resolution
"""

#### TEST SETUP ####

conn = sqlite3.connect(':memory:')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute('create table books (id primary key, title, author, year);')
cur.execute('insert into books values (1, "The Origin of Species", "Darwin, Charles", 1859)')
conn.commit()

####  END SETUP ####

@app.get('/')
@jinja2_view('index.html')
def index():
    return {}

@app.get('/static/<fname:path>')
def static(fname):
    return static_file(fname, root='')

@app.post('/add-book')
def add_book():
    """ Add a book to the database """
    args = request.json
    cur.execute('insert into books (title, author, year) values (?, ?, ?)', (args['title'], args['author'], args['year']))
    conn.commit()

    return json.dumps(dict(status='ok'))

@app.get('/dynamic-widget')
def dynamic_widget():
    args = request.params
    filename = f'{args["name"]}.html'
    results = load_sql_from_template(filename, **args)
    template = env.get_template(filename)
    newBody = template.render(**results, **args)
    
    return json.dumps({
        'newBody': newBody,
        'uuid': uuid,
    })


def load_sql_from_template(template, **kwargs):
    """ Load aiosql-formatted comment block from Jinja template file """
    sql_block = list()
    with open(template, 'r') as t:
        for l in t.readlines():
            if ('{#' in l and 'queries:' in l) or l == '\n':
                continue
            if '#}' in l:
                break
            sql_block.append(l.strip())
    
    queries = aiosql.from_str('\n'.join(sql_block), 'sqlite3')
    results = dict()
    for q in [x for x in queries.available_queries if '_cursor' not in x]:
        q_ = getattr(queries, q)
        comments = q_.__doc__.split('\n')
        for comment in comments:
            if 'args:' in comment:
                expected_args = json.loads(comment.split(':')[1].strip())
            elif 'key:' in comment:
                key = comment.split(':')[1].strip()
        q_args = {k: v for k, v in kwargs.items() if k in expected_args}
        result = q_(conn, **q_args)
        results[key] = result
    
    return results
            

run(app, host='localhost', port=9999)