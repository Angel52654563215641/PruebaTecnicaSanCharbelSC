import requests  # Para hacer peticiones HTTP a las APIs (Wikipedia)
import urllib.parse  # Para codificar texto y que sea compatible en URLs
import unicodedata  # Para quitar acentos o caracteres raros del texto


# Esta función recibe un nombre y lo prepara para que funcione bien en las búsquedas
def normalize_name(name):
    name = name.strip().title()  # Quita espacios y pone mayúscula inicial a cada palabra
    name = unicodedata.normalize('NFD', name)  # Separa letras de sus acentos (por ejemplo: á → a + ´)
    name = ''.join([c for c in name if unicodedata.category(c) != 'Mn'])  # Borra los acentos (categoría 'Mn')
    return name  # Devuelve el texto limpio, con mayúsculas y sin acentos


# Esta función busca un título en Wikipedia que coincida con lo que pusiste
def search_title(query, lang='es'):  # Español 
    encoded_query = urllib.parse.quote(query)  # Convierte el texto para que se pueda usar en una URL 
    url = f"https://{lang}.wikipedia.org/w/rest.php/v1/search/title?q={encoded_query}&limit=1"  
    # Armamos la URL para hacer la búsqueda del título en Wikipedia, limitamos a 1 resultado

    response = requests.get(url)  # Hacemos la petición  a esa URL

    if response.status_code == 200:  # Si la respuesta fue exitosa 
        data = response.json()  # Convertimos la respuesta en formato JSON 
        if data.get("pages"):  # Si hay resultados encontrados 
            return data["pages"][0]["title"]  # Devolvemos el título del primer resultado
    return None  # Si no encontró nada, devuelve None


# Esta función recibe un título y devuelve su resumen con nombre, descripción, imagen 
def get_summary(title, lang='es'):  #idi
    encoded_title = urllib.parse.quote(title.replace(" ", "_"))  # Reemplaza espacios por guiones bajos y codifica para URL
    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{encoded_title}"  # URL del resumen de Wikipedia

    response = requests.get(url)  # Hacemos la petición para obtener el resumen de esa página

    if response.status_code == 200:  # Si todo salió bien
        data = response.json()  # Convertimos la respuesta en diccionario

        if data.get("type") != "disambiguation":  # Verificamos que no sea una página de desambiguación
            return {
                "name": data.get("title", "Desconocido"),  # Nombre del artículo
                "description": data.get("extract", "Sin descripción disponible."),  # Resumen del contenido
                "image": data.get("thumbnail", {}).get("source", ""),  # Imagen en miniatura 
                "lang": lang  # Idioma que usamos
            }

    return None  # Si no se encontró o es una desambiguación, devolvemos None


# Esta función revisa si un texto (la descripción) parece hablar de un animal
def parece_animal(descripcion):
    palabras_clave = [  # Lista de palabras típicas que aparecen en descripciones de animales
        "animal", "especie", "mamífero", "ave", "pez",
        "reptil", "anfibio", "insecto", "fauna", "vertebrado", "zoológico"
    ]

    # Recorremos cada palabra clave y vemos si aparece dentro de la descripción (en minúsculas para comparar bien)
    return any(palabra in descripcion.lower() for palabra in palabras_clave)  
    # Si al menos una palabra clave aparece, devuelve True
