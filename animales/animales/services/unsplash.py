import requests  # Para hacer peticiones a la API de Unsplash
import urllib.parse  # Para que el texto quede bien en la URL

# Tu clave de acceso a Unsplash
UNSPLASH_KEY = "51oNeqnIiDtsy97uM_OA3emvAbzjaL-zeUrQVY3xfqE"

# Busca una imagen según el texto que pongas
def search_unsplash_image(query):
    # Pone el texto en formato URL (espacios, acentos, etc.)
    # Y arma la dirección para pedir una foto
    url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&per_page=1"

    # Encabezado que lleva la clave de acceso
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_KEY}"
    }

    # Hace la petición a Unsplash
    response = requests.get(url, headers=headers)

    # Si todo salió bien y hay resultados
    if response.status_code == 200:
        data = response.json()
        # Si encontró al menos una foto
        if data['results']:
            # Devuelve la URL de la imagen en tamaño medio
            return data['results'][0]['urls']['regular']

    # Si no hubo resultados o falló la petición
    return ""
