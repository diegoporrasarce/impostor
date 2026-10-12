/*
 * Parejas de palabras para el modo "Infiltrado".
 * En este modo TODOS reciben una palabra, pero la del impostor es parecida
 * (y distinta) a la del resto. Nadie sabe de primeras quién tiene la diferente.
 * Formato: ["palabra mayoritaria", "palabra del impostor"].
 */
window.IMPOSTOR_PAIRS = [
  // Comida
  ["Pizza", "Hamburguesa"], ["Café", "Té"], ["Cerveza", "Vino"], ["Helado", "Yogur"],
  ["Sushi", "Ceviche"], ["Tortilla de patatas", "Revuelto"], ["Paella", "Arroz caldoso"],
  ["Croissant", "Napolitana de chocolate"], ["Churros", "Porras"], ["Gelatina", "Flan"],
  ["Lentejas", "Garbanzos"], ["Sopa", "Crema de verduras"], ["Zumo de naranja", "Batido"],
  ["Agua", "Agua con gas"], ["Mayonesa", "Kétchup"], ["Sal", "Azúcar"], ["Miel", "Sirope"],
  ["Pollo", "Pavo"], ["Cerdo", "Ternera"], ["Salmón", "Atún"], ["Tarta", "Pastel"],
  ["Galleta", "Donut"], ["Chicle", "Caramelo"], ["Palomitas", "Patatas fritas"],
  ["Chocolate", "Turrón"], ["Pizza margarita", "Pizza cuatro quesos"], ["Tapas", "Pinchos"],
  ["Bocadillo", "Bocata de calamares"], ["Ensalada", "Ensaladilla"], ["Salsa", "Alioli"],

  // Bebidas sociales
  ["Copa de vino", "Copa de cava"], ["Cubata", "Cóctel"], ["Batido", "Smoothie"],
  ["Refresco", "Mosto"], ["Horchata", "Leche merengada"], ["Chocolate a la taza", "Cola Cao"],

  // Animales
  ["Perro", "Gato"], ["Caballo", "Burro"], ["León", "Tigre"], ["Lobo", "Zorro"],
  ["Ratón", "Hámster"], ["Conejo", "Liebre"], ["Pato", "Ganso"], ["Pingüino", "Foca"],
  ["Delfín", "Ballena"], ["Tiburón", "Orca"], ["Rana", "Sapo"], ["Lagartija", "Lagarto"],
  ["Mariposa", "Polilla"], ["Abeja", "Avispa"], ["Hormiga", "Termita"], ["Mosca", "Mosquito"],
  ["Araña", "Escorpión"], ["Serpiente", "Culebra"], ["Tortuga", "Caracol"],
  ["Águila", "Halcón"], ["Búho", "Lechuza"], ["Loro", "Cotorra"], ["Gallina", "Pavo"],
  ["Elefante", "Rinoceronte"], ["Jirafa", "Camello"], ["Mono", "Chimpancé"],
  ["Oveja", "Cabra"], ["Vaca", "Buey"], ["Cerdo", "Jabalí"], ["Pulpo", "Calamar"],
  ["Cangrejo", "Bogavante"], ["Estrella de mar", "Erizo de mar"], ["Murciélago", "Golondrina"],

  // Naturaleza
  ["Playa", "Piscina"], ["Río", "Arroyo"], ["Montaña", "Colina"], ["Bosque", "Selva"],
  ["Lluvia", "Granizo"], ["Nieve", "Escarcha"], ["Niebla", "Bruma"], ["Sol", "Luna"],
  ["Estrella", "Planeta"], ["Nube", "Humo"], ["Volcán", "Geiser"], ["Lago", "Laguna"],
  ["Desierto", "Sabana"], ["Isla", "Península"], ["Cascada", "Fuente"], ["Arcoíris", "Aurora"],
  ["Tormenta", "Huracán"], ["Relámpago", "Trueno"], ["Árbol", "Arbusto"], ["Rosa", "Clavel"],

  // Lugares
  ["Hospital", "Clínica"], ["Colegio", "Instituto"], ["Hotel", "Hostal"],
  ["Bar", "Cafetería"], ["Discoteca", "Pub"], ["Cine", "Teatro"], ["Museo", "Galería"],
  ["Parque", "Jardín"], ["Plaza", "Plazoleta"], ["Supermercado", "Mercadillo"],
  ["Aeropuerto", "Estación de tren"], ["Biblioteca", "Librería"], ["Farmacia", "Parafarmacia"],
  ["Gimnasio", "Pista de atletismo"], ["Iglesia", "Catedral"], ["Castillo", "Palacio"],
  ["Estadio", "Campo de fútbol"], ["Zoológico", "Acuario"], ["Montaña rusa", "Tobogán"],

  // Países y ciudades (parecidos geográficos)
  ["España", "Portugal"], ["Italia", "Grecia"], ["Francia", "Bélgica"],
  ["Alemania", "Austria"], ["Madrid", "Barcelona"], ["Roma", "Milán"],
  ["París", "Londres"], ["Nueva York", "Chicago"], ["Tokio", "Seúl"],
  ["Buenos Aires", "Montevideo"], ["México", "Colombia"], ["Egipto", "Marruecos"],
  ["Islandia", "Noruega"], ["Brasil", "Argentina"], ["Marrakech", "El Cairo"],

  // Cine y series
  ["Titanic", "Pearl Harbor"], ["Star Wars", "Star Trek"], ["Batman", "Superman"],
  ["Harry Potter", "El Señor de los Anillos"], ["Spider-Man", "Iron Man"],
  ["Tiburón", "Anaconda"], ["Zombi", "Vampiro"], ["El Rey León", "El Libro de la Selva"],
  ["Toy Story", "Cars"], ["Shrek", "Madagascar"], ["Frozen", "Encanto"],
  ["Los Simpsons", "Padre de familia"], ["Friends", "The Big Bang Theory"],
  ["Juego de Tronos", "Vikingos"], ["La Casa de Papel", "Élite"], ["Stranger Things", "Dark"],
  ["Narcos", "Breaking Bad"], ["Dragon Ball", "Naruto"],

  // Música
  ["Guitarra", "Ukelele"], ["Piano", "Órgano"], ["Violín", "Violonchelo"],
  ["Flauta", "Clarinete"], ["Trompeta", "Trombón"], ["Batería", "Pandereta"],
  ["Rock", "Heavy metal"], ["Pop", "Reggaetón"], ["Salsa", "Bachata"],
  ["Flamenco", "Sevillanas"], ["Karaoke", "Concierto"], ["DJ", "Cantante"],
  ["Auriculares", "Altavoces"], ["Vinilo", "CD"], ["Micrófono", "Amplificador"],

  // Deportes
  ["Fútbol", "Baloncesto"], ["Tenis", "Pádel"], ["Bádminton", "Tenis de mesa"],
  ["Natación", "Waterpolo"], ["Ciclismo", "Atletismo"], ["Boxeo", "Lucha libre"],
  ["Judo", "Karate"], ["Esquí", "Snowboard"], ["Surf", "Windsurf"],
  ["Golf", "Minigolf"], ["Ajedrez", "Damas"], ["Billar", "Dardos"], ["Maratón", "Carrera"],
  ["Correr", "Caminar"], ["Gimnasio", "Crossfit"], ["Árbitro", "Entrenador"],
  ["Balón", "Pelota"], ["Portero", "Defensa"], ["Medalla", "Trofeo"], ["Gol", "Canasta"],

  // Profesiones
  ["Médico", "Enfermero"], ["Veterinario", "Médico"], ["Maestro", "Profesor"],
  ["Policía", "Guardia civil"], ["Bombero", "Socorrista"], ["Abogado", "Juez"],
  ["Cocinero", "Camarero"], ["Peluquero", "Barbero"], ["Carpintero", "Albañil"],
  ["Electricista", "Fontanero"], ["Programador", "Diseñador"], ["Actor", "Bailarín"],
  ["Cantante", "Músico"], ["Escritor", "Periodista"], ["Fotógrafo", "Cámara"],
  ["Piloto", "Azafata"], ["Taxista", "Conductor de autobús"], ["Cartero", "Repartidor"],
  ["Panadero", "Pastelero"], ["Agricultor", "Ganadero"], ["Soldado", "Detective"],
  ["Youtuber", "Influencer"], ["Astronauta", "Piloto de avión"], ["Contable", "Banquero"],

  // Objetos
  ["Lápiz", "Bolígrafo"], ["Tenedor", "Cuchara"], ["Cuchillo", "Tijeras"],
  ["Plato", "Vaso"], ["Silla", "Banco"], ["Sofá", "Sillón"], ["Cama", "Colchón"],
  ["Reloj", "Cronómetro"], ["Mochila", "Bolso"], ["Cartera", "Monedero"],
  ["Gafas de sol", "Gafas de ver"], ["Zapatos", "Zapatillas"], ["Gorra", "Sombrero"],
  ["Bufanda", "Pañuelo"], ["Guantes", "Manoplas"], ["Cinturón", "Tirantes"],
  ["Paraguas", "Chubasquero"], ["Manta", "Edredón"], ["Almohada", "Cojín"],
  ["Espejo", "Retrato"], ["Vela", "Linterna"], ["Mechero", "Cerillas"],
  ["Llaves", "Candado"], ["Escoba", "Fregona"], ["Cubo", "Barreño"],
  ["Toalla", "Albornoz"], ["Jabón", "Gel de baño"], ["Champú", "Suavizante"],
  ["Peine", "Cepillo"], ["Martillo", "Mazo"], ["Destornillador", "Llave inglesa"],
  ["Taladro", "Sierra"], ["Clavo", "Tornillo"], ["Cuerda", "Cadena"],
  ["Lata", "Botella"], ["Caja", "Baúl"], ["Sobre", "Sello"], ["Cuaderno", "Agenda"],
  ["Libro", "Revista"], ["Periódico", "Revista"], ["Mapa", "Brújula"],
  ["Cargador", "Pila"], ["Mando a distancia", "Teclado"], ["Televisor", "Monitor"],
  ["Ordenador", "Tableta"], ["Móvil", "Teléfono fijo"], ["Auriculares", "Altavoz"],

  // Casa
  ["Cocina", "Comedor"], ["Baño", "Aseo"], ["Dormitorio", "Salón"],
  ["Azotea", "Terraza"], ["Garaje", "Trastero"], ["Escalera", "Ascensor"],
  ["Puerta", "Ventana"], ["Chimenea", "Estufa"], ["Lámpara", "Flexo"],
  ["Alfombra", "Moqueta"], ["Cortina", "Persiana"], ["Armario", "Cómoda"],
  ["Nevera", "Congelador"], ["Horno", "Microondas"], ["Lavadora", "Lavavajillas"],
  ["Sartén", "Olla"], ["Plato hondo", "Plato llano"], ["Taza", "Vaso de agua"],

  // Fiesta y tradiciones
  ["Navidad", "Nochevieja"], ["Reyes Magos", "Papá Noel"], ["Cumpleaños", "Aniversario"],
  ["Boda", "Bautizo"], ["Halloween", "Carnaval"], ["Disfraz", "Máscara"],
  ["Globos", "Confeti"], ["Tarta", "Tarta de cumpleaños"], ["Regalo", "Sobre con dinero"],
  ["Fuegos artificiales", "Petardos"], ["Turrón", "Mazapán"], ["Roscón", "Bizcocho"],

  // Emociones
  ["Alegría", "Euforia"], ["Tristeza", "Melancolía"], ["Miedo", "Terror"],
  ["Rabia", "Frustración"], ["Amor", "Cariño"], ["Amistad", "Compañerismo"],
  ["Envidia", "Celos"], ["Orgullo", "Arrogancia"], ["Vergüenza", "Culpa"],
  ["Sorpresa", "Asombro"], ["Nervios", "Ansiedad"], ["Calma", "Tranquilidad"],
  ["Risa", "Sonrisa"], ["Llanto", "Lágrima"], ["Aburrimiento", "Pereza"],

  // Fantasía
  ["Dragón", "Dinosaurio"], ["Hada", "Elfa"], ["Mago", "Bruja"], ["Vampiro", "Hombre lobo"],
  ["Zombi", "Momia"], ["Fantasma", "Espectro"], ["Espada", "Hacha"],
  ["Escudo", "Armadura"], ["Poción", "Amuleto"], ["Castillo", "Fortaleza"],
  ["Rey", "Emperador"], ["Príncipe", "Caballero"], ["Unicornio", "Pegaso"],

  // Tecnología
  ["WhatsApp", "Telegram"], ["Instagram", "TikTok"], ["Netflix", "HBO"],
  ["YouTube", "Twitch"], ["Google", "Bing"], ["PlayStation", "Xbox"],
  ["Apple", "Samsung"], ["Wifi", "Cable"], ["Emoji", "GIF"], ["Contraseña", "PIN"],
  ["Página web", "Aplicación"], ["Robot", "Dron"], ["Realidad virtual", "Realidad aumentada"],
  ["Correo electrónico", "Mensaje de texto"], ["USB", "Cargador"],

  // Vehículos
  ["Coche", "Furgoneta"], ["Moto", "Bicicleta"], ["Autobús", "Tranvía"],
  ["Avión", "Helicóptero"], ["Barco", "Lancha"], ["Tren", "Metro"],
  ["Taxi", "Autobús urbano"], ["Camión", "Camioneta"], ["Patinete", "Monopatín"],
  ["Tractor", "Excavadora"], ["Globo aerostático", "Dirigible"], ["Submarino", "Nave espacial"],

  // Conceptos
  ["Libertad", "Independencia"], ["Verdad", "Mentira"], ["Paz", "Tregua"],
  ["Amor", "Desamor"], ["Éxito", "Fracaso"], ["Suerte", "Destino"],
  ["Fama", "Poder"], ["Orden", "Caos"], ["Teoría", "Hipótesis"],
  ["Secreto", "Misterio"], ["Historia", "Prehistoria"], ["Pasado", "Futuro"],
  ["Trabajo", "Estudio"], ["Dinero", "Riqueza"], ["Salud", "Belleza"]
];
