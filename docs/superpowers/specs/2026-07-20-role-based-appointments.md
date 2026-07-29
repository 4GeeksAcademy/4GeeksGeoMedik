# Role-Based JWT Claims + GET /api/appointments

## Changes

### 1. JWT Role Claims (login endpoints)
- `/login/client`: add `additional_claims={"role": "client"}`
- `/login/doctor`: add `additional_claims={"role": "doctor"}`

### 2. GET /api/appointments (new)
- Protected with `@jwt_required()`
- Reads `get_jwt_identity()` and `get_jwt()["role"]`
- `role=client` → `Appointment.query.filter_by(client_id=user_id)`
- `role=doctor` → `Appointment.query.filter_by(doctor_id=user_id)`
- Optional query params: `estado` (matches `status`), `fecha_desde` / `fecha_hasta` (filter `date_time`)
- Returns 200 with list of serialized appointments, each including counterpart's `name` and `email`

### 3. POST /api/appointments (modify)
- Add role check: if `get_jwt()["role"]` != `"client"`, return 403
- Identity is still used as `client_id`

### 4. PUT /api/appointments/<id> (modify)
- Replace `Doctor.query.get(user_id)` lookup with `get_jwt()["role"]`
- If `role == "doctor"` can change any status
- If `role == "client"` can only cancel
