PruebaTecnicaSanCharbel
=========================

Descripción
-----------
App con login (JWT), consumo de APIs públicas y una ruta protegida.
Usuarios guardados en MySQL con contraseña en hash (bcrypt). La interfaz muestra
información de animales consultando Wikipedia/Unsplash, y un bloque de "Ruta
protegida" que consulta la API pública de GitHub.

Requisitos
----------
- Python 3.x
- MySQL en local (puede ser XAMPP o similar)

1) Cómo ejecutar 
----------------------------
1. Instala dependencias:
   pip install  Flask flask-cors flask-bcrypt bcrypt flask-jwt-extended flask-sqlalchemy PyMySQL python-dotenv requests

2. Crea la base y tabla ejecutando el script SQL (ver sección "Script SQL").

3. (Si tu MySQL tiene contraseña) ajusta la cadena de conexión en app.py
   (por defecto: mysql+pymysql://root:@localhost/auth_app).

4. Inicia el servidor:
   python app.py

5. Abre en el navegador:
   http://127.0.0.1:5000/
   - Regístrate y luego inicia sesión para entrar a la app.

2) Script SQL (crear base y tabla)
----------------------------------
Ejecuta esto en MySQL:

CREATE DATABASE IF NOT EXISTS auth_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE auth_app;

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(72) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

3) Login (JWT) y almacenamiento seguro
--------------------------------------
- Registro: POST /auth/register  (name, email, password)
- Login:    POST /auth/login     (email, password) -> devuelve token JWT
- Perfil:   GET  /me             (protegido con JWT)
El front almacena el token en localStorage y lo envía como:
Authorization: Bearer <token>