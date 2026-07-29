#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

pip install pipenv
pipenv install

export PYTHONPATH=src
export FLASK_APP=src/app.py

# 1. Migraciones normales de Flask-Migrate
pipenv run upgrade || true

# 2. Red de seguridad: si alguna tabla falta, la crea desde los modelos.
#    Va con "pipenv run" a proposito: el python del sistema no tiene Flask
#    instalado y la linea falla con ModuleNotFoundError.
pipenv run python -c "from app import db, app; app.app_context().push(); db.create_all()"
