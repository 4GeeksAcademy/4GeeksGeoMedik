# Role-Based JWT + GET /api/appointments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add role claims to JWT tokens and implement GET /api/appointments with role-based filtering.

**Architecture:** One new route (GET), 4 endpoint modifications (login/doctor, login/client, POST/PUT appointments). All changes in `routes.py` and `app.py` (no new files).

**Tech Stack:** Flask, Flask-JWT-Extended, SQLAlchemy, Python 3.14

## Global Constraints

- JWT role claim must be `"client"` or `"doctor"` exactly
- Existing login endpoint response shapes must not change (only JWT internals)
- Optional query params for GET: `estado`, `fecha_desde`, `fecha_hasta`
- Counterpart data in GET response: `name` and `email` only

---
### Task 1: Create branch from developer

**Files:**
- Modify: git (no code changes)

- [ ] **Step 1: Stash current work and switch to developer, create new branch**

```bash
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
git stash
git checkout developer
git pull origin developer
git checkout -b GET-/api/appointments
```

- [ ] **Step 2: Verify branch**

```bash
git branch --show-current
# Expected: GET-/api/appointments
```

---
### Task 2: Add role claims to login endpoints

**Files:**
- Modify: `src/api/routes.py:123-159` (login_doctor), `src/api/routes.py:203-239` (login_client)

**Interfaces:**
- Produces: JWT tokens with `additional_claims={"role": "doctor"}` / `{"role": "client"}`

- [ ] **Step 1: Update `/login/doctor` — add role claim**

Edit `src/api/routes.py`, change the `create_access_token` call:

```python
    access_token = create_access_token(
        identity=str(doctor.id),
        additional_claims={"role": "doctor"}
    )
```

- [ ] **Step 2: Update `/login/client` — add role claim**

Edit `src/api/routes.py`, change the `create_access_token` call:

```python
    access_token = create_access_token(
        identity=str(client.id),
        additional_claims={"role": "client"}
    )
```

- [ ] **Step 3: Run login test to verify tokens carry role**

```bash
export PYTHONPATH=/home/angelo/Escritorio/proyecto/4GeeksGeoMedik/src
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
source .venv/bin/activate
python -c "
import json
from app import app
from api.models import db, Client, Doctor
from werkzeug.security import generate_password_hash

with app.app_context():
    db.drop_all(); db.create_all()
    c = Client(name='A', email='a@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS')
    d = Doctor(name='B', email='b@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS', specialty='X', credentials='L', id_number='V-1')
    db.session.add_all([c,d]); db.session.commit()

app.testing=True
tc = app.test_client()
from flask_jwt_extended import decode_token
r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
token = r.get_json()['token']
decoded = decode_token(token)
print('client role:', decoded.get('role'))
assert decoded.get('role') == 'client', f'Expected client, got {decoded.get(\"role\")}'

r = tc.post('/api/login/doctor', data=json.dumps({'email':'b@t.com','password':'p'}), content_type='application/json')
token = r.get_json()['token']
decoded = decode_token(token)
print('doctor role:', decoded.get('role'))
assert decoded.get('role') == 'doctor', f'Expected doctor, got {decoded.get(\"role\")}'
print('OK')
"
```

Expected output: `client role: client` / `doctor role: doctor` / `OK`

- [ ] **Step 4: Commit**

```bash
git add src/api/routes.py
git commit -m "feat: add role claim (client/doctor) to JWT tokens on login"
```

---
### Task 3: Add role check to POST /api/appointments

**Files:**
- Modify: `src/api/routes.py:242-309` (create_appointment)

- [ ] **Step 1: Add role guard after `get_jwt_identity()`**

In `create_appointment`, right after `client_id = get_jwt_identity()`:

```python
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Only clients can create appointments"}), 403
```

- [ ] **Step 2: Test POST — doctor tries to create (should 403)**

```bash
export PYTHONPATH=/home/angelo/Escritorio/proyecto/4GeeksGeoMedik/src
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
source .venv/bin/activate
python -c "
import json
from app import app
from api.models import db, Client, Doctor, Availability
from werkzeug.security import generate_password_hash
from datetime import time

with app.app_context():
    db.drop_all(); db.create_all()
    c = Client(name='A', email='a@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS')
    d = Doctor(name='B', email='b@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS', specialty='X', credentials='L', id_number='V-1')
    db.session.add_all([c,d]); db.session.flush()
    db.session.add(Availability(doctor_id=d.id, day=0, time_start=time(9,0), time_end=time(17,0)))
    db.session.commit()
    did=d.id

app.testing=True; tc = app.test_client()

# Doctor tries to create — should fail
r = tc.post('/api/login/doctor', data=json.dumps({'email':'b@t.com','password':'p'}), content_type='application/json')
h = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-27T10:00:00'}), content_type='application/json', headers=h)
print('Doctor POST:', r.status_code, r.get_json()['message'])
assert r.status_code == 403

# Client creates — should work
r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
h = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-27T10:00:00'}), content_type='application/json', headers=h)
print('Client POST:', r.status_code, r.get_json()['appointment']['status'])
assert r.status_code == 201
print('OK')
"
```

- [ ] **Step 3: Commit**

```bash
git add src/api/routes.py
git commit -m "feat: restrict POST /api/appointments to client role"
```

---
### Task 4: Update PUT /api/appointments/<id> to use role claim

**Files:**
- Modify: `src/api/routes.py:330-405` (update_appointment)

- [ ] **Step 1: Replace `Doctor.query.get(user_id)` logic with `get_jwt()["role"]`**

In `update_appointment`, replace this block (lines ~383-391):

```python
        doctor = Doctor.query.get(user_id)
        if doctor and appointment.doctor_id == doctor.id:
            appointment.status = new_status
            updated = True
        else:
            if new_status != "cancelada":
                return jsonify({"message": "Clients can only cancel appointments"}), 403
            appointment.status = new_status
            updated = True
```

With:

```python
        if get_jwt()["role"] == "doctor" and user_id == appointment.doctor_id:
            appointment.status = new_status
            updated = True
        elif get_jwt()["role"] == "client" and new_status == "cancelada":
            appointment.status = new_status
            updated = True
        else:
            return jsonify({"message": "You are not authorized to change this appointment status"}), 403
```

- [ ] **Step 2: Run PUT tests (doctor confirms, client cancels, client cannot complete)**

```bash
export PYTHONPATH=/home/angelo/Escritorio/proyecto/4GeeksGeoMedik/src
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
source .venv/bin/activate
python -c "
import json
from app import app
from api.models import db, Client, Doctor, Availability
from werkzeug.security import generate_password_hash
from datetime import time

with app.app_context():
    db.drop_all(); db.create_all()
    c = Client(name='A', email='a@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS')
    d = Doctor(name='B', email='b@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS', specialty='X', credentials='L', id_number='V-1')
    db.session.add_all([c,d]); db.session.flush()
    db.session.add(Availability(doctor_id=d.id, day=0, time_start=time(9,0), time_end=time(17,0)))
    db.session.add(Availability(doctor_id=d.id, day=1, time_start=time(9,0), time_end=time(17,0)))
    db.session.commit()
    did=d.id

app.testing=True; tc = app.test_client()

r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
ch = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-27T10:00:00'}), content_type='application/json', headers=ch)
aid = r.get_json()['appointment']['id']
print('Created:', aid)

r = tc.post('/api/login/doctor', data=json.dumps({'email':'b@t.com','password':'p'}), content_type='application/json')
dh = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}

r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'confirmada'}), content_type='application/json', headers=dh)
print('Doctor confirm:', r.status_code, r.get_json()['appointment']['status'])
assert r.status_code == 200

r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'completada'}), content_type='application/json', headers=ch)
print('Client try complete:', r.status_code, r.get_json()['message'])
assert r.status_code == 403

r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'cancelada'}), content_type='application/json', headers=ch)
print('Client cancel:', r.status_code, r.get_json()['appointment']['status'])
assert r.status_code == 200
print('OK')
"
```

- [ ] **Step 3: Commit**

```bash
git add src/api/routes.py
git commit -m "feat: use JWT role claim in PUT /api/appointments/<id>"
```

---
### Task 5: Implement GET /api/appointments

**Files:**
- Modify: `src/api/routes.py` (add new route before or after appointments POST/PUT)

- [ ] **Step 1: Add GET /api/appointments route**

Add after `create_appointment` (or in a logical location):

```python
@api.route("/appointments", methods=["GET"])
@jwt_required()
def get_appointments():
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    query = Appointment.query

    if role == "client":
        query = query.filter_by(client_id=user_id)
    elif role == "doctor":
        query = query.filter_by(doctor_id=user_id)
    else:
        return jsonify({"message": "Invalid role"}), 403

    estado = request.args.get("estado")
    if estado:
        query = query.filter(Appointment.status == estado)

    fecha_desde = request.args.get("fecha_desde")
    if fecha_desde:
        try:
            dt_desde = datetime.fromisoformat(fecha_desde)
            query = query.filter(Appointment.date_time >= dt_desde)
        except:
            return jsonify({"message": "Invalid fecha_desde format. Use ISO format"}), 400

    fecha_hasta = request.args.get("fecha_hasta")
    if fecha_hasta:
        try:
            dt_hasta = datetime.fromisoformat(fecha_hasta)
            query = query.filter(Appointment.date_time <= dt_hasta)
        except:
            return jsonify({"message": "Invalid fecha_hasta format. Use ISO format"}), 400

    appointments = query.order_by(Appointment.date_time.desc()).all()

    result = []
    for apt in appointments:
        data = apt.serialize()
        if role == "client":
            doctor = Doctor.query.get(apt.doctor_id)
            data["doctor"] = {"name": doctor.name, "email": doctor.email} if doctor else None
        elif role == "doctor":
            client = Client.query.get(apt.client_id)
            data["client"] = {"name": client.name, "email": client.email} if client else None
        result.append(data)

    return jsonify(result), 200
```

- [ ] **Step 2: Run GET test — full scenario**

```bash
export PYTHONPATH=/home/angelo/Escritorio/proyecto/4GeeksGeoMedik/src
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
source .venv/bin/activate
python -c "
import json
from app import app
from api.models import db, Client, Doctor, Availability
from werkzeug.security import generate_password_hash
from datetime import time

with app.app_context():
    db.drop_all(); db.create_all()
    c = Client(name='A', email='a@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS')
    d = Doctor(name='B', email='b@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS', specialty='X', credentials='L', id_number='V-1')
    db.session.add_all([c,d]); db.session.flush()
    for day in [0,1]:
        db.session.add(Availability(doctor_id=d.id, day=day, time_start=time(9,0), time_end=time(17,0)))
    db.session.commit()
    did=d.id

app.testing=True; tc = app.test_client()

# Client creates 2 appointments
r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
ch = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-27T10:00:00'}), content_type='application/json', headers=ch)
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-28T11:00:00'}), content_type='application/json', headers=ch)

# Client GET
r = tc.get('/api/appointments', headers=ch)
data = r.get_json()
print('Client GET count:', len(data), 'has doctor name:', data[0].get('doctor',{}).get('name'))
assert len(data) == 2
assert data[0]['doctor']['name'] == 'B'

# Doctor GET
r = tc.post('/api/login/doctor', data=json.dumps({'email':'b@t.com','password':'p'}), content_type='application/json')
dh = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.get('/api/appointments', headers=dh)
data = r.get_json()
print('Doctor GET count:', len(data), 'has client name:', data[0].get('client',{}).get('name'))
assert len(data) == 2
assert data[0]['client']['name'] == 'A'

# Filter by estado
r = tc.get('/api/appointments?estado=agendada', headers=ch)
print('Filter estado:', r.status_code, 'count:', len(r.get_json()))
assert r.status_code == 200

# Filter by fecha_desde
r = tc.get('/api/appointments?fecha_desde=2026-07-28T00:00:00', headers=ch)
print('Filter fecha_desde:', r.status_code, 'count:', len(r.get_json()))
assert r.status_code == 200

print('OK')
"
```

- [ ] **Step 3: Commit**

```bash
git add src/api/routes.py
git commit -m "feat: add GET /api/appointments with role-based filtering and query params"
```

---
### Task 6: Run full integration test

**Files:**
- Run: existing test for POST+PUT (previous session's test) plus new GET scenarios

- [ ] **Step 1: Run complete integration test**

```bash
export PYTHONPATH=/home/angelo/Escritorio/proyecto/4GeeksGeoMedik/src
cd /home/angelo/Escritorio/proyecto/4GeeksGeoMedik
source .venv/bin/activate
python -c "
import json
from app import app
from api.models import db, Client, Doctor, Availability
from werkzeug.security import generate_password_hash
from datetime import time

with app.app_context():
    db.drop_all(); db.create_all()
    c = Client(name='Ana', email='a@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS')
    d = Doctor(name='Dr. Perez', email='p@t.com', password=generate_password_hash('p'), phone_number='+58', address='CCS', specialty='Cardio', credentials='Lic', id_number='V-1')
    db.session.add_all([c,d]); db.session.flush()
    for day in range(7):
        db.session.add(Availability(doctor_id=d.id, day=day, time_start=time(9,0), time_end=time(17,0)))
    db.session.commit()
    did=d.id

app.testing=True; tc = app.test_client()

# Client login + create
r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
ch = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-27T10:00:00'}), content_type='application/json', headers=ch)
aid = r.get_json()['appointment']['id']
print('1 POST:', r.status_code, 'id=', aid)
assert r.status_code == 201

# Doctor login + confirm
r = tc.post('/api/login/doctor', data=json.dumps({'email':'p@t.com','password':'p'}), content_type='application/json')
dh = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'confirmada'}), content_type='application/json', headers=dh)
print('2 PUT confirm:', r.status_code, r.get_json()['appointment']['status'])
assert r.status_code == 200

# Client reschedule
r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'date_time':'2026-07-28T11:00:00'}), content_type='application/json', headers=ch)
print('3 PUT reschedule:', r.status_code)
assert r.status_code == 200

# Doctor GET
r = tc.get('/api/appointments', headers=dh)
print('4 GET doctor:', r.status_code, 'count:', len(r.get_json()))
assert r.status_code == 200

# Client GET with filter
r = tc.get('/api/appointments?estado=confirmada', headers=ch)
print('5 GET filtered:', r.status_code, 'count:', len(r.get_json()))
assert r.status_code == 200

# Client cancel
r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'cancelada'}), content_type='application/json', headers=ch)
print('6 PUT cancel:', r.status_code, r.get_json()['appointment']['status'])
assert r.status_code == 200

# 404
r = tc.put('/api/appointments/999', data=json.dumps({'status':'confirmada'}), content_type='application/json', headers=dh)
print('7 404:', r.status_code)
assert r.status_code == 404

# 403 - client tries to complete
r = tc.post('/api/login/client', data=json.dumps({'email':'a@t.com','password':'p'}), content_type='application/json')
ch = {'Authorization': f'Bearer {r.get_json()[\"token\"]}'}
r = tc.put(f'/api/appointments/{aid}', data=json.dumps({'status':'completada'}), content_type='application/json', headers=ch)
print('8 403 complete:', r.status_code)
assert r.status_code == 403

# 403 - doctor tries to create
r = tc.post('/api/appointments', data=json.dumps({'doctor_id':did,'date_time':'2026-07-30T10:00:00'}), content_type='application/json', headers=dh)
print('9 403 doctor create:', r.status_code)
assert r.status_code == 403

print()
print('ALL TESTS PASSED')
"
```

- [ ] **Step 2: Commit final test (optional, or just a verification run)**

```bash
git log --oneline -5
```
