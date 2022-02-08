# A Dynamic Web Component Widget
See [my blog](https://billchandos.dev/blog/create_a_self-contained_dynamic.html) for details.

### To Run
After cloning, create a Python virtual environment:
```
python3 -m venv venv/
```

Activate the environment (Linux instruction):
```
source venv/bin/activate
```

Install dependencies:
```
pip install -r requirements.txt
```

Run:
```
python3 server.py
```

If you are not using `localhost:3000`, be sure to update `BASE_URL` in `index.js`