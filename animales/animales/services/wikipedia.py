import requests  # Para pedir info a Wikipedia
import urllib.parse  # Para que el texto quede bien en la URL
import unicodedata  # Para quitar acentos y cosas raras del texto


# Arregla el nombre para que se vea limpio y sirva en las búsquedas
def normalize_name(name):
    name = name.strip().title()  # Quita espacios y pone mayúscula inicial
    name = unicodedata.normalize('NFD', name)  # Separa letras de los acentos
    name = ''.join([c for c in name if unicodedata.category(c) != 'Mn'])  # Borra los acentos
    return name  # Devuelve el nombre ya limpio


# Busca un título en Wikipedia según el texto que pongas
def search_title(query, lang='es'):
    encoded_query = urllib.parse.quote(query)  # Convierte el texto para usarlo en URL
    url = f"https://{lang}.wikipedia.org/w/rest.php/v1/search/title?q={encoded_query}&limit=1"  
    # Armamos la URL para buscar el título (solo un resultado)

    response = requests.get(url)  # Pedimos los datos a Wikipedia

    if response.status_code == 200:  # Si respondió bien
        data = response.json()  # Pasamos la respuesta a JSON
        if data.get("pages"):  # Si encontró algo
            return data["pages"][0]["title"]  # Devuelve el primer título
    return None  # Si no hay nada, regresa None


# Pide el resumen de Wikipedia con nombre, descripción e imagen
def get_summary(title, lang='es'):
    encoded_title = urllib.parse.quote(title.replace(" ", "_"))  # Cambia espacios y lo hace URL
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{encoded_title}"  # URL del resumen

    response = requests.get(url)  # Pedimos el resumen

    if response.status_code == 200:  # Si salió bien
        data = response.json()  # Convertimos la respuesta
        if data.get("type") != "disambiguation":  # Revisamos que no sea página de varios significados
            return {
                "name": data.get("title", "Desconocido"),  # Nombre del artículo
                "description": data.get("extract", "Sin descripción disponible."),  # Texto resumen
                "image": data.get("thumbnail", {}).get("source", ""),  # Imagen miniatura
                "lang": lang  # El idioma usado
            }

    return None  # Si no se pudo, regresa None


# Checa si una descripción parece de un animal
def parece_animal(descripcion):
    palabras_clave = [  # Palabras típicas que salen en textos de animales
        "animal", "especie", "mamífero", "ave", "pez",
        "reptil", "anfibio", "insecto", "fauna", "vertebrado", "zoológico"
    ]

    # Ve si alguna de esas palabras está en la descripción
    return any(palabra in descripcion.lower() for palabra in palabras_clave)
