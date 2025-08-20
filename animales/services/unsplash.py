import requests  # Se usa para hacer peticiones HTTP a la API de Unsplash
import urllib.parse  # Sirve para codificar correctamente el texto en la URL

# Clave de acceso API 
UNSPLASH_KEY = "51oNeqnIiDtsy97uM_OA3emvAbzjaL-zeUrQVY3xfqE"


# Esta función busca una imagen relacionada a lo q pusiste
def search_unsplash_image(query):
    # Convierte el texto en un querito a un formato que se pueda usar en la URL (espacios, ñ, etc.)
    # Y arma la URL para buscar 1 foto que coincida con ese texto
    url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&per_page=1"

    
    # Este es el encabezado que se manda con la petición, incluye tu Access Key como identificación
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_KEY}"
    }


       # Se hace la petición a Unsplash con la URL y los headers
    response = requests.get(url, headers=headers)


    # Si la respuesta fue exitosa y hay al menos un resultado
    if response.status_code == 200:
        data = response.json()
                # Si la lista de resultados no está vacía
        if data['results']:
            # Se devuelve la URL de la imagen (formato 'regular', tamaño medio)
            return data['results'][0]['urls']['regular']

    
    # Si no encontró nada o falló la petición, devuelve un string vacío
    return ""
