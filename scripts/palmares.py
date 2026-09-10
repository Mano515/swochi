# -*- coding: utf-8 -*-
"""
Resout un palmares (titre + annee de sortie) en identifiants TMDB.

TMDB n'expose aucune donnee de recompense : les mots-cles "award winner",
"oscar" ou "palme d'or" totalisent 44 films, presque tous obscurs. Le seul
moyen fiable de proposer un filtre "films primes" est donc de figer la liste
des laureats et de la resoudre une fois pour toutes en identifiants.

Usage : python scripts/palmares.py   (lit REACT_APP_TMDB_KEY dans .env)
Sortie : src/data/palmares.json
"""
import json, os, re, sys, time, urllib.parse, urllib.request

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def cle_api():
    with open(os.path.join(RACINE, ".env"), encoding="utf-8") as f:
        for ligne in f:
            if ligne.startswith("REACT_APP_TMDB_KEY"):
                return ligne.split("=", 1)[1].strip()
    sys.exit("REACT_APP_TMDB_KEY introuvable dans .env")

CLE = cle_api()

def chercher(titre, annee):
    """Premier resultat TMDB pour ce titre. On tente l'annee exacte, puis
    l'annee precedente : une sortie festival de decembre est souvent datee
    de l'annee suivante chez TMDB (et inversement)."""
    for a in (annee, annee - 1, annee + 1, None):
        params = {"api_key": CLE, "query": titre, "language": "en-US"}
        if a:
            params["primary_release_year"] = a
        url = "https://api.themoviedb.org/3/search/movie?" + urllib.parse.urlencode(params)
        for essai in range(3):
            try:
                with urllib.request.urlopen(url, timeout=20) as r:
                    res = json.load(r).get("results", [])
                break
            except Exception:
                time.sleep(1)
        else:
            res = []
        if res:
            return res[0], a
    return None, None

def resoudre(nom, palmares):
    ids, rapport = [], []
    for titre, annee in palmares:
        film, a = chercher(titre, annee)
        if not film:
            rapport.append(("INTROUVABLE", titre, annee, "", ""))
            continue
        sortie = (film.get("release_date") or "")[:4]
        ecart = abs(int(sortie) - annee) if sortie.isdigit() else 99
        ids.append(film["id"])
        rapport.append(("OK" if ecart <= 2 else "VERIFIER",
                        titre, annee, film.get("title", ""), sortie))
    print("\n=== %s : %d/%d resolus ===" % (nom, len(ids), len(palmares)))
    for etat, dem, an, trouve, sortie in rapport:
        if etat != "OK":
            print("  %-12s %-45s %s -> %s (%s)" % (etat, dem[:45], an, trouve, sortie))
    return ids, rapport


# ── Oscar du meilleur film — laureats (annee de sortie du film) ──────────────
OSCARS = [
    ("Wings", 1927), ("The Broadway Melody", 1929),
    ("All Quiet on the Western Front", 1930), ("Cimarron", 1931),
    ("Grand Hotel", 1932), ("Cavalcade", 1933),
    ("It Happened One Night", 1934), ("Mutiny on the Bounty", 1935),
    ("The Great Ziegfeld", 1936), ("The Life of Emile Zola", 1937),
    ("You Can't Take It with You", 1938), ("Gone with the Wind", 1939),
    ("Rebecca", 1940), ("How Green Was My Valley", 1941),
    ("Mrs. Miniver", 1942), ("Casablanca", 1942),
    ("Going My Way", 1944), ("The Lost Weekend", 1945),
    ("The Best Years of Our Lives", 1946), ("Gentleman's Agreement", 1947),
    ("Hamlet", 1948), ("All the King's Men", 1949),
    ("All About Eve", 1950), ("An American in Paris", 1951),
    ("The Greatest Show on Earth", 1952), ("From Here to Eternity", 1953),
    ("On the Waterfront", 1954), ("Marty", 1955),
    ("Around the World in 80 Days", 1956), ("The Bridge on the River Kwai", 1957),
    ("Gigi", 1958), ("Ben-Hur", 1959),
    ("The Apartment", 1960), ("West Side Story", 1961),
    ("Lawrence of Arabia", 1962), ("Tom Jones", 1963),
    ("My Fair Lady", 1964), ("The Sound of Music", 1965),
    ("A Man for All Seasons", 1966), ("In the Heat of the Night", 1967),
    ("Oliver!", 1968), ("Midnight Cowboy", 1969),
    ("Patton", 1970), ("The French Connection", 1971),
    ("The Godfather", 1972), ("The Sting", 1973),
    ("The Godfather Part II", 1974), ("One Flew Over the Cuckoo's Nest", 1975),
    ("Rocky", 1976), ("Annie Hall", 1977),
    ("The Deer Hunter", 1978), ("Kramer vs. Kramer", 1979),
    ("Ordinary People", 1980), ("Chariots of Fire", 1981),
    ("Gandhi", 1982), ("Terms of Endearment", 1983),
    ("Amadeus", 1984), ("Out of Africa", 1985),
    ("Platoon", 1986), ("The Last Emperor", 1987),
    ("Rain Man", 1988), ("Driving Miss Daisy", 1989),
    ("Dances with Wolves", 1990), ("The Silence of the Lambs", 1991),
    ("Unforgiven", 1992), ("Schindler's List", 1993),
    ("Forrest Gump", 1994), ("Braveheart", 1995),
    ("The English Patient", 1996), ("Titanic", 1997),
    ("Shakespeare in Love", 1998), ("American Beauty", 1999),
    ("Gladiator", 2000), ("A Beautiful Mind", 2001),
    ("Chicago", 2002), ("The Lord of the Rings: The Return of the King", 2003),
    ("Million Dollar Baby", 2004), ("Crash", 2004),
    ("The Departed", 2006), ("No Country for Old Men", 2007),
    ("Slumdog Millionaire", 2008), ("The Hurt Locker", 2008),
    ("The King's Speech", 2010), ("The Artist", 2011),
    ("Argo", 2012), ("12 Years a Slave", 2013),
    ("Birdman", 2014), ("Spotlight", 2015),
    ("Moonlight", 2016), ("The Shape of Water", 2017),
    ("Green Book", 2018), ("Parasite", 2019),
    ("Nomadland", 2020), ("CODA", 2021),
    ("Everything Everywhere All at Once", 2022), ("Oppenheimer", 2023),
    ("Anora", 2024),
]

# ── Palme d'or de Cannes — laureats (ex aequo inclus) ────────────────────────
CANNES = [
    ("Marty", 1955), ("The Silent World", 1956),
    ("Friendly Persuasion", 1956), ("The Cranes Are Flying", 1957),
    ("Black Orpheus", 1959), ("La Dolce Vita", 1960),
    ("Viridiana", 1961), ("Une aussi longue absence", 1961),
    ("The Given Word", 1962), ("The Leopard", 1963),
    ("The Umbrellas of Cherbourg", 1964), ("The Knack ...and How to Get It", 1965),
    ("A Man and a Woman", 1966), ("The Birds, the Bees and the Italians", 1966),
    ("Blowup", 1966), ("If....", 1968),
    ("MASH", 1970), ("The Go-Between", 1971),
    ("The Working Class Goes to Heaven", 1971), ("The Mattei Affair", 1972),
    ("Scarecrow", 1973), ("The Hireling", 1973),
    ("The Conversation", 1974), ("Chronicle of the Years of Fire", 1975),
    ("Taxi Driver", 1976), ("Padre Padrone", 1977),
    ("The Tree of Wooden Clogs", 1978), ("Apocalypse Now", 1979),
    ("The Tin Drum", 1979), ("All That Jazz", 1979),
    ("Kagemusha", 1980), ("Man of Iron", 1981),
    ("Missing", 1982), ("Yol", 1982),
    ("The Ballad of Narayama", 1983), ("Paris, Texas", 1984),
    ("When Father Was Away on Business", 1985), ("The Mission", 1986),
    ("Under the Sun of Satan", 1987), ("Pelle the Conqueror", 1987),
    ("Sex, Lies, and Videotape", 1989), ("Wild at Heart", 1990),
    ("Barton Fink", 1991), ("The Best Intentions", 1992),
    ("Farewell My Concubine", 1993), ("The Piano", 1993),
    ("Pulp Fiction", 1994), ("Underground", 1995),
    ("Secrets & Lies", 1996), ("Taste of Cherry", 1997),
    ("The Eel", 1997), ("Eternity and a Day", 1998),
    ("Rosetta", 1999), ("Dancer in the Dark", 2000),
    ("The Son's Room", 2001), ("The Pianist", 2002),
    ("Elephant", 2003), ("Fahrenheit 9/11", 2004),
    ("L'Enfant", 2005), ("The Wind That Shakes the Barley", 2006),
    ("4 Months, 3 Weeks and 2 Days", 2007), ("The Class", 2008),
    ("The White Ribbon", 2009), ("Uncle Boonmee Who Can Recall His Past Lives", 2010),
    ("The Tree of Life", 2011), ("Amour", 2012),
    ("Blue Is the Warmest Colour", 2013), ("Winter Sleep", 2014),
    ("Dheepan", 2015), ("I, Daniel Blake", 2016),
    ("The Square", 2017), ("Shoplifters", 2018),
    ("Parasite", 2019), ("Titane", 2021),
    ("Triangle of Sadness", 2022), ("Anatomy of a Fall", 2023),
    ("Anora", 2024),
]

if __name__ == "__main__":
    oscars, _ = resoudre("Oscars", OSCARS)
    cannes, _ = resoudre("Cannes", CANNES)
    sortie = os.path.join(RACINE, "src", "data", "palmares.json")
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump({"oscars": oscars, "cannes": cannes}, f, indent=0)
    print("\n%d oscars + %d cannes -> %s" % (len(oscars), len(cannes), sortie))
