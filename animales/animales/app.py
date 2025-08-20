import requests
import os
import unicodedata
from datetime import timedelta
from urllib.parse import unquote

from flask import Flask, request, jsonify, render_template
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# servicios locales
from services.wikipedia import normalize_name, search_title, get_summary
from services.unsplash import search_unsplash_image
from services.habitats import habitats  # diccionario con coordenadas

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)

# config de DB y JWT
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "MYSQL_URI", "mysql+pymysql://root:@localhost/auth_app"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_key")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt_dev_key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
    days=int(os.getenv("JWT_EXPIRES_DAYS", "1"))
)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# errores JWT
@jwt.unauthorized_loader
def missing_token(err):
    return jsonify({"message": "Falta token o formato inválido (usa 'Bearer <token>')"}), 401

@jwt.invalid_token_loader
def invalid_token(reason):
    return jsonify({"message": f"Token inválido: {reason}"}), 401

@jwt.expired_token_loader
def expired_token_callback(header, payload):
    return jsonify({"message": "Token expirado, inicia sesión de nuevo"}), 401

@jwt.revoked_token_loader
def revoked_token_callback(header, payload):
    return jsonify({"message": "Token revocado"}), 401

# modelo de usuario
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(190), unique=True, nullable=False)
    password_hash = db.Column(db.String(72), nullable=False)

# utilidades
def _norm(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = s.lower().strip()
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def find_location(*names):
    keys_norm = {_norm(k): coords for k, coords in habitats.items()}
    for n in names:
        key = _norm(n or "")
        if key in keys_norm:
            return keys_norm[key]
    return None

# auth
@app.post("/auth/register")
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"message": "name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(name=name, email=email, password_hash=pw_hash)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id, additional_claims={"email": user.email})
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}), 201

@app.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id, additional_claims={"email": user.email})
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}), 200

@app.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"id": user.id, "name": user.name, "email": user.email})

# categorías
animal_categories = {
    "Mamíferos": [
        "León","Oso polar","Tigre de bengala","Elefante africano","Cebra","Lobo gris",
        "Murciélago","Rinoceronte blanco","Jirafa","Hipopótamo","Oso pardo","Mapache",
        "Zorro ártico","Mono aullador","Chimpancé","Nutria","Perezoso"
    ],
    "Reptiles": [
        "Cocodrilo del Nilo","Iguana verde","Serpiente pitón","Gecko leopardo",
        "Dragón de Komodo","Serpiente coralillo","Boa constrictor","Caimán",
        "Serpiente cascabel","Tortuga de tierra gigante","Anaconda verde",
        "Varano del desierto","Tortuga de orejas rojas","Lagarto espinoso",
        "Tortuga caimán","Serpiente rey de California","Basilisco verde",
        "Skink de lengua azul"
    ],
    "Aves": [
        "Águila calva","Pingüino emperador","Guacamaya roja","Colibrí","Búho nival",
        "Tucán","Águila arpía","Cacatúa","Avestruz","Halcón peregrino",
        "Loro gris africano","Pelícano blanco","Cuervo común","Gaviota argéntea",
        "Pavo real","Cisne blanco","Golondrina común","Cóndor andino"
    ],
    "Anfibios": [
        "Rana dardo venenosa","Axolote","Salamandra tigre","Sapo gigante",
        "Rana arborícola verde","Tritón crestado","Salamandra de fuego","Tritón alpino",
        "Rana toro americana","Cecilia","Rana de cristal","Rana tomate",
        "Sapo de Surinam","Rana leopardo","Rana del Goliat","Rana venenosa azul",
        "Tritón japonés","Sapo común europeo","Rana patilarga","Salamandra axantica"
    ],
    "Peces": [
        "Pez payaso","Tiburón blanco","Pez león","Caballito de mar","Atún azul",
        "Manta raya","Pez ángel","Tiburón martillo","Pez cirujano","Pez betta",
        "Pez globo","Tiburón tigre","Pez koi","Pez gato","Pez espada","Pez luna",
        "Pez mandarín","Pez loro","Pez linterna","Tiburón ballena"
    ],
    "Insectos": [
        "Mariposa monarca","Escarabajo rinoceronte","Libélula","Abeja europea","Grillo común",
        "Escarabajo joya","Hormiga roja","Mantis religiosa","Chinche apestosa","Cigarra",
        "Escarabajo Hércules","Mariposa atlas","Avispa papelera","Polilla lunar",
        "Luciérnaga","Saltamontes","Tijereta","Abejorro","Catarina de siete puntos","Hormiga león"
    ],
    "Animales marinos": [
        "Ballena azul","Orca","Pulpo gigante","Delfín nariz de botella","Calamar gigante",
        "Foca leopardo","León marino","Tiburón blanco","Morsa","Pez espada","Tiburón martillo",
        "Medusa luna","Tortuga laúd","Manta raya oceánica","Tiburón ballena","Pez abisal",
        "Foca común","Langosta gigante","Pez abadejo"
    ],
    "Extintos": [
        "Dodo","Tigre de Tasmania","Mamut lanudo","Megalodon","Moas","Pájaro elefante",
        "Gliptodonte","Smilodon","Aurochs","Perezoso gigante","Ichthyosaurus",
        "Trilobite","Thylacoleo","Elasmotherium","Quagga","Gastornis",
        "Andrewsarchus","Titanoboa","Mamut colombiano","Toxodon"
    ]
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/categorias")
def get_categories():
    return jsonify(list(animal_categories.keys()))

@app.route("/api/categoria/<path:categoria>")
def get_animals_by_category(categoria):
    categoria = unquote(categoria)
    return jsonify(animal_categories.get(categoria, []))

@app.route("/api/animal/<path:name>")
def get_animal_info(name):
    raw_name = unquote(name)
    norm_name = normalize_name(raw_name)

    title = search_title(norm_name, lang="es")
    animal_data = get_summary(title, lang="es") if title else None

    if not animal_data:
        title = search_title(norm_name, lang="en")
        animal_data = get_summary(title, lang="en") if title else None

    if not animal_data:
        return jsonify({"error": "No encontré información de ese animal"}), 404

    animal_data["wiki_image"] = animal_data.get("image")
    animal_data["unsplash_image"] = search_unsplash_image(animal_data["name"])
    loc = find_location(animal_data.get("name"), title, raw_name, norm_name)
    animal_data["location"] = loc

    return jsonify(animal_data)

@app.get("/secure/tmdb")
@jwt_required()
def secure_tmdb():
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        return jsonify({"message": "Falta TMDB_API_KEY en .env"}), 500

    try:
        r = requests.get(
            "https://api.themoviedb.org/3/trending/movie/day",
            params={"api_key": api_key, "language": "es-ES"},
            timeout=10
        )
        if r.status_code != 200:
            try:
                detail = r.json()
            except Exception:
                detail = r.text
            return jsonify({"message": f"TMDB error {r.status_code}", "detail": detail}), 502

        results = r.json().get("results", [])
        out = [{
            "id": m.get("id"),
            "title": m.get("title") or m.get("name"),
            "vote_average": m.get("vote_average"),
            "release_date": m.get("release_date")
        } for m in results[:15]]
        return jsonify(out), 200

    except requests.RequestException as e:
        return jsonify({"message": f"Error al contactar TMDB: {e}"}), 502

if __name__ == "__main__":
    app.run(debug=True)
