import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Archive, Package, Snowflake, Home, Wrench, Shirt, Plus, X, Camera,
  AlertTriangle, Trash2, Settings, Check, Loader2, Barcode, ShoppingCart,
  CheckCircle2, XCircle, ImageOff, RotateCcw, Globe
} from "lucide-react";

/* ===================================================================
   i18n — all 24 official EU languages
=================================================================== */

const LANGS = [
  { code: "bg", name: "Български" }, { code: "hr", name: "Hrvatski" }, { code: "cs", name: "Čeština" },
  { code: "da", name: "Dansk" }, { code: "nl", name: "Nederlands" }, { code: "en", name: "English" },
  { code: "et", name: "Eesti" }, { code: "fi", name: "Suomi" }, { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" }, { code: "el", name: "Ελληνικά" }, { code: "hu", name: "Magyar" },
  { code: "ga", name: "Gaeilge" }, { code: "it", name: "Italiano" }, { code: "lv", name: "Latviešu" },
  { code: "lt", name: "Lietuvių" }, { code: "mt", name: "Malti" }, { code: "pl", name: "Polski" },
  { code: "pt", name: "Português" }, { code: "ro", name: "Română" }, { code: "sk", name: "Slovenčina" },
  { code: "sl", name: "Slovenščina" }, { code: "es", name: "Español" }, { code: "sv", name: "Svenska" },
];

// TR[key][langCode] -> string. Falls back to English if a language is missing a key.
const TR = {
  tagline: { bg:"Всичко от дома ви, на един допир", hr:"Sve što imate u kući, na dohvat ruke", cs:"Vše, co máte doma, na jedno klepnutí", da:"Alt i hjemmet, ét tryk væk", nl:"Alles in huis, één tik verwijderd", en:"Everything in the house, one tap away", et:"Kõik, mis kodus, ühe puudutuse kaugusel", fi:"Kaikki kotoa, yhden napautuksen päässä", fr:"Tout ce qu'il y a chez vous, en un geste", de:"Alles im Haus, einen Klick entfernt", el:"Όλα όσα έχεις στο σπίτι, μ' ένα άγγιγμα", hu:"Minden, ami otthon van, egy érintésre", ga:"Gach rud sa teach, cliceáil amháin uait", it:"Tutto ciò che hai in casa, a portata di tocco", lv:"Viss, kas mājās, viena pieskāriena attālumā", lt:"Viskas, kas namuose, per vieną prisilietimą", mt:"Kollox f'darek, b'mess wieħed 'il bogħod", pl:"Wszystko, co masz w domu, na wyciągnięcie ręki", pt:"Tudo o que tens em casa, a um toque", ro:"Tot ce ai în casă, la o atingere distanță", sk:"Všetko, čo máte doma, na jedno klepnutie", sl:"Vse, kar imate doma, na dosegu prsta", es:"Todo lo de tu casa, a un toque", sv:"Allt i hemmet, ett klick bort" },
  nav_food: { bg:"Храна", hr:"Hrana", cs:"Jídlo", da:"Mad", nl:"Voedsel", en:"Food", et:"Toit", fi:"Ruoka", fr:"Nourriture", de:"Essen", el:"Φαγητό", hu:"Élelmiszer", ga:"Bia", it:"Cibo", lv:"Ēdiens", lt:"Maistas", mt:"Ikel", pl:"Jedzenie", pt:"Comida", ro:"Alimente", sk:"Jedlo", sl:"Hrana", es:"Comida", sv:"Mat" },
  nav_tools: { bg:"Инструменти", hr:"Alati", cs:"Nářadí", da:"Værktøj", nl:"Gereedschap", en:"Tools", et:"Tööriistad", fi:"Työkalut", fr:"Outils", de:"Werkzeuge", el:"Εργαλεία", hu:"Szerszámok", ga:"Uirlisí", it:"Attrezzi", lv:"Instrumenti", lt:"Įrankiai", mt:"Għodda", pl:"Narzędzia", pt:"Ferramentas", ro:"Unelte", sk:"Náradie", sl:"Orodje", es:"Herramientas", sv:"Verktyg" },
  nav_wardrobe: { bg:"Гардероб", hr:"Ormar", cs:"Šatník", da:"Garderobe", nl:"Garderobe", en:"Wardrobe", et:"Garderoob", fi:"Vaatekaappi", fr:"Garde-robe", de:"Kleiderschrank", el:"Ντουλάπα", hu:"Ruhatár", ga:"Vardrús", it:"Guardaroba", lv:"Garderobe", lt:"Spinta", mt:"Gardarobba", pl:"Garderoba", pt:"Guarda-roupa", ro:"Garderobă", sk:"Šatník", sl:"Garderoba", es:"Armario", sv:"Garderob" },
  nav_locations: { bg:"Места", hr:"Lokacije", cs:"Umístění", da:"Placeringer", nl:"Locaties", en:"Locations", et:"Asukohad", fi:"Sijainnit", fr:"Emplacements", de:"Standorte", el:"Τοποθεσίες", hu:"Helyszínek", ga:"Suímh", it:"Postazioni", lv:"Vietas", lt:"Vietos", mt:"Postijiet", pl:"Lokalizacje", pt:"Locais", ro:"Locații", sk:"Umiestnenia", sl:"Lokacije", es:"Ubicaciones", sv:"Platser" },
  banner_attention: { bg:"се нуждаят от внимание скоро", hr:"uskoro treba obratiti pažnju", cs:"vyžaduje brzy pozornost", da:"kræver snart opmærksomhed", nl:"hebben binnenkort aandacht nodig", en:"need attention soon", et:"vajavad peagi tähelepanu", fi:"tarvitsevat pian huomiota", fr:"nécessitent votre attention bientôt", de:"brauchen bald Aufmerksamkeit", el:"χρειάζονται σύντομα προσοχή", hu:"hamarosan figyelmet igényelnek", ga:"ag teastáil aird go luath", it:"richiedono presto attenzione", lv:"drīz būs jāpievērš uzmanība", lt:"netrukus reikės dėmesio", mt:"se jeħtieġu attenzjoni dalwaqt", pl:"wkrótce będą wymagać uwagi", pt:"precisam de atenção em breve", ro:"au nevoie de atenție în curând", sk:"čoskoro budú potrebovať pozornosť", sl:"bodo kmalu potrebovali pozornost", es:"necesitarán atención pronto", sv:"behöver snart uppmärksamhet" },
  filter_all: { bg:"Всички", hr:"Sve", cs:"Vše", da:"Alle", nl:"Alle", en:"All", et:"Kõik", fi:"Kaikki", fr:"Tout", de:"Alle", el:"Όλα", hu:"Összes", ga:"Gach", it:"Tutti", lv:"Visi", lt:"Visi", mt:"Kollha", pl:"Wszystkie", pt:"Todos", ro:"Toate", sk:"Všetko", sl:"Vse", es:"Todos", sv:"Alla" },
  filter_expiring: { bg:"Изтичащи", hr:"Ističe uskoro", cs:"Brzy expiruje", da:"Udløber snart", nl:"Verloopt binnenkort", en:"Expiring", et:"Aegumas", fi:"Vanhenee pian", fr:"Bientôt périmé", de:"Läuft bald ab", el:"Λήγει σύντομα", hu:"Hamarosan lejár", ga:"Ag dul in éag", it:"In scadenza", lv:"Drīz beigsies derīguma termiņš", lt:"Baigiasi galiojimas", mt:"Se jiskadi", pl:"Traci ważność", pt:"A expirar", ro:"Expiră curând", sk:"Čoskoro exspiruje", sl:"Kmalu poteče", es:"Caduca pronto", sv:"Går ut snart" },
  food_empty_title: { bg:"Все още няма нищо тук", hr:"Ovdje još nema ničega", cs:"Zatím tu nic není", da:"Der er intet her endnu", nl:"Hier staat nog niets", en:"Nothing here yet", et:"Siin pole veel midagi", fi:"Täällä ei ole vielä mitään", fr:"Rien ici pour l'instant", de:"Hier ist noch nichts", el:"Δεν υπάρχει τίποτα εδώ ακόμα", hu:"Itt még nincs semmi", ga:"Níl aon rud anseo fós", it:"Ancora niente qui", lv:"Šeit vēl nekā nav", lt:"Čia kol kas nieko nėra", mt:"Għadu m'hemm xejn hawn", pl:"Tutaj jeszcze nic nie ma", pt:"Ainda não há nada aqui", ro:"Nu este nimic aici încă", sk:"Zatiaľ tu nič nie je", sl:"Tukaj še ni ničesar", es:"Todavía no hay nada aquí", sv:"Inget här än" },
  food_empty_sub: { bg:"Добавете храна ръчно или чрез сканиране на баркод.", hr:"Dodajte hranu ručno ili skeniranjem barkoda.", cs:"Přidejte potraviny ručně nebo naskenováním čárového kódu.", da:"Tilføj mad manuelt eller ved at scanne en stregkode.", nl:"Voeg voedsel handmatig toe of scan een barcode.", en:"Add food manually or by scanning a barcode.", et:"Lisa toit käsitsi või triipkoodi skannides.", fi:"Lisää ruokaa käsin tai skannaamalla viivakoodi.", fr:"Ajoutez un aliment manuellement ou en scannant un code-barres.", de:"Füge Lebensmittel manuell hinzu oder scanne einen Barcode.", el:"Προσθέστε τρόφιμα χειροκίνητα ή σαρώνοντας ένα barcode.", hu:"Adjon hozzá élelmiszert kézzel vagy vonalkód beolvasásával.", ga:"Cuir bia leis de láimh nó trí bharrachód a scanadh.", it:"Aggiungi un alimento manualmente o scansionando un codice a barre.", lv:"Pievieno pārtiku manuāli vai skenējot svītrkodu.", lt:"Pridėkite maistą rankiniu būdu arba nuskaitydami brūkšninį kodą.", mt:"Żid ikel manwalment jew billi tiskennja barcode.", pl:"Dodaj produkt ręcznie lub skanując kod kreskowy.", pt:"Adicione alimentos manualmente ou digitalizando um código de barras.", ro:"Adaugă alimente manual sau scanând un cod de bare.", sk:"Pridajte potraviny ručne alebo naskenovaním čiarového kódu.", sl:"Dodajte živilo ročno ali s skeniranjem črtne kode.", es:"Añade comida manualmente o escaneando un código de barras.", sv:"Lägg till mat manuellt eller genom att skanna en streckkod." },
  uncategorized: { bg:"Без категория", hr:"Nekategorizirano", cs:"Nezařazeno", da:"Ukategoriseret", nl:"Ongecategoriseerd", en:"Uncategorized", et:"Kategoriseerimata", fi:"Luokittelematon", fr:"Non catégorisé", de:"Nicht kategorisiert", el:"Χωρίς κατηγορία", hu:"Kategorizálatlan", ga:"Gan chatagóiriú", it:"Non categorizzato", lv:"Nekategorizēts", lt:"Nepriskirta kategorijai", mt:"Mhux ikkategorizzat", pl:"Bez kategorii", pt:"Sem categoria", ro:"Fără categorie", sk:"Bez kategórie", sl:"Nekategorizirano", es:"Sin categoría", sv:"Okategoriserad" },
  stamp_fresh: { bg:"ПРЯСНО", hr:"SVJEŽE", cs:"ČERSTVÉ", da:"FRISK", nl:"VERS", en:"FRESH", et:"VÄRSKE", fi:"TUORE", fr:"FRAIS", de:"FRISCH", el:"ΦΡΕΣΚΟ", hu:"FRISS", ga:"ÚR", it:"FRESCO", lv:"SVAIGS", lt:"ŠVIEŽIA", mt:"FRISK", pl:"ŚWIEŻE", pt:"FRESCO", ro:"PROASPĂT", sk:"ČERSTVÉ", sl:"SVEŽE", es:"FRESCO", sv:"FÄRSK" },
  stamp_expired: { bg:"ИЗТЕКЛО", hr:"ISTEKLO", cs:"PROŠLÉ", da:"UDLØBET", nl:"VERLOPEN", en:"EXPIRED", et:"AEGUNUD", fi:"VANHENTUNUT", fr:"PÉRIMÉ", de:"ABGELAUFEN", el:"ΛΗΓΜΕΝΟ", hu:"LEJÁRT", ga:"AS DÁTA", it:"SCADUTO", lv:"BEIDZIES", lt:"PASIBAIGĘS", mt:"SKADUT", pl:"PRZETERMINOWANE", pt:"EXPIRADO", ro:"EXPIRAT", sk:"PREŠLÉ", sl:"POTEKLO", es:"CADUCADO", sv:"UTGÅNGEN" },
  stamp_today: { bg:"ДНЕС", hr:"DANAS", cs:"DNES", da:"I DAG", nl:"VANDAAG", en:"TODAY", et:"TÄNA", fi:"TÄNÄÄN", fr:"AUJOURD'HUI", de:"HEUTE", el:"ΣΗΜΕΡΑ", hu:"MA", ga:"INNIU", it:"OGGI", lv:"ŠODIEN", lt:"ŠIANDIEN", mt:"ILLUM", pl:"DZIŚ", pt:"HOJE", ro:"AZI", sk:"DNES", sl:"DANES", es:"HOY", sv:"IDAG" },
  stamp_no_date: { bg:"БЕЗ ДАТА", hr:"BEZ DATUMA", cs:"BEZ DATA", da:"INGEN DATO", nl:"GEEN DATUM", en:"NO DATE", et:"KUUPÄEV PUUDUB", fi:"EI PÄIVÄYSTÄ", fr:"SANS DATE", de:"KEIN DATUM", el:"ΧΩΡΙΣ ΗΜΕΡΟΜΗΝΙΑ", hu:"NINCS DÁTUM", ga:"GAN DÁTA", it:"SENZA DATA", lv:"BEZ DATUMA", lt:"BE DATOS", mt:"MINGĦAJR DATA", pl:"BRAK DATY", pt:"SEM DATA", ro:"FĂRĂ DATĂ", sk:"BEZ DÁTUMU", sl:"BREZ DATUMA", es:"SIN FECHA", sv:"INGET DATUM" },
  stamp_days_left: { bg:"ОЩЕ {d}Д", hr:"JOŠ {d}D", cs:"ZBÝVÁ {d}D", da:"{d}D TILBAGE", nl:"NOG {d}D", en:"{d}D LEFT", et:"{d}P JÄREL", fi:"{d}PV JÄLJELLÄ", fr:"{d}J RESTANTS", de:"NOCH {d}T", el:"{d}Η ΑΠΟΜΕΝΟΥΝ", hu:"MÉG {d} NAP", ga:"{d} LÁ FÁGTHA", it:"{d}G RIMASTI", lv:"ATLIKUŠI {d}D", lt:"LIKO {d}D", mt:"{d}T FADAL", pl:"ZOSTAŁO {d}D", pt:"FALTAM {d}D", ro:"{d}Z RĂMASE", sk:"ZOSTÁVA {d}D", sl:"ŠE {d}D", es:"QUEDAN {d}D", sv:"{d}D KVAR" },
  add_food_title: { bg:"Добавяне на храна", hr:"Dodaj hranu", cs:"Přidat potravinu", da:"Tilføj mad", nl:"Voedsel toevoegen", en:"Add food", et:"Lisa toit", fi:"Lisää ruokaa", fr:"Ajouter un aliment", de:"Lebensmittel hinzufügen", el:"Προσθήκη τροφίμου", hu:"Élelmiszer hozzáadása", ga:"Cuir bia leis", it:"Aggiungi alimento", lv:"Pievienot pārtiku", lt:"Pridėti maistą", mt:"Żid ikel", pl:"Dodaj produkt", pt:"Adicionar alimento", ro:"Adaugă aliment", sk:"Pridať potravinu", sl:"Dodaj živilo", es:"Añadir alimento", sv:"Lägg till mat" },
  mode_manual: { bg:"Ръчно", hr:"Ručno", cs:"Ručně", da:"Manuelt", nl:"Handmatig", en:"Manual", et:"Käsitsi", fi:"Manuaalinen", fr:"Manuel", de:"Manuell", el:"Χειροκίνητα", hu:"Kézi", ga:"De láimh", it:"Manuale", lv:"Manuāli", lt:"Rankiniu būdu", mt:"Manwali", pl:"Ręcznie", pt:"Manual", ro:"Manual", sk:"Ručne", sl:"Ročno", es:"Manual", sv:"Manuellt" },
  mode_scan: { bg:"Сканиране на баркод", hr:"Skeniraj barkod", cs:"Skenovat čárový kód", da:"Scan stregkode", nl:"Barcode scannen", en:"Scan barcode", et:"Skanni triipkood", fi:"Skannaa viivakoodi", fr:"Scanner le code-barres", de:"Barcode scannen", el:"Σάρωση barcode", hu:"Vonalkód beolvasása", ga:"Scan barrachód", it:"Scansiona codice a barre", lv:"Skenēt svītrkodu", lt:"Nuskaityti brūkšninį kodą", mt:"Skennja barcode", pl:"Skanuj kod kreskowy", pt:"Digitalizar código de barras", ro:"Scanează codul de bare", sk:"Naskenovať čiarový kód", sl:"Skeniraj črtno kodo", es:"Escanear código de barras", sv:"Skanna streckkod" },
  start_camera: { bg:"Стартиране на камерата", hr:"Pokreni skeniranje kamerom", cs:"Spustit skenování kamerou", da:"Start kamera-scanning", nl:"Camera scan starten", en:"Start camera scan", et:"Alusta kaamera skannimist", fi:"Aloita kameraskannaus", fr:"Démarrer le scan caméra", de:"Kamera-Scan starten", el:"Έναρξη σάρωσης κάμερας", hu:"Kamerás beolvasás indítása", ga:"Tosaigh scanadh ceamara", it:"Avvia scansione con fotocamera", lv:"Sākt kameras skenēšanu", lt:"Pradėti skenavimą kamera", mt:"Ibda skennjar bil-kamera", pl:"Rozpocznij skanowanie kamerą", pt:"Iniciar leitura pela câmara", ro:"Pornește scanarea cu camera", sk:"Spustiť skenovanie kamerou", sl:"Začni skeniranje s kamero", es:"Iniciar escaneo con cámara", sv:"Starta kameraskanning" },
  stop_camera: { bg:"Спиране на камерата", hr:"Zaustavi kameru", cs:"Zastavit kameru", da:"Stop kamera", nl:"Camera stoppen", en:"Stop camera", et:"Peata kaamera", fi:"Pysäytä kamera", fr:"Arrêter la caméra", de:"Kamera stoppen", el:"Διακοπή κάμερας", hu:"Kamera leállítása", ga:"Stop an ceamara", it:"Ferma fotocamera", lv:"Apturēt kameru", lt:"Sustabdyti kamerą", mt:"Waqqaf il-kamera", pl:"Zatrzymaj kamerę", pt:"Parar câmara", ro:"Oprește camera", sk:"Zastaviť kameru", sl:"Ustavi kamero", es:"Detener cámara", sv:"Stoppa kameran" },
  looking_up: { bg:"Търсене на продукт…", hr:"Traženje proizvoda…", cs:"Vyhledávám produkt…", da:"Slår produkt op…", nl:"Product opzoeken…", en:"Looking up product…", et:"Toote otsimine…", fi:"Haetaan tuotetta…", fr:"Recherche du produit…", de:"Produkt wird gesucht…", el:"Αναζήτηση προϊόντος…", hu:"Termék keresése…", ga:"Ag cuardach an táirge…", it:"Ricerca del prodotto…", lv:"Meklē produktu…", lt:"Ieškoma produkto…", mt:"Qed infittex il-prodott…", pl:"Wyszukiwanie produktu…", pt:"A procurar produto…", ro:"Se caută produsul…", sk:"Vyhľadávam produkt…", sl:"Iskanje izdelka…", es:"Buscando producto…", sv:"Söker upp produkt…" },
  or_type_barcode: { bg:"или въведете номера от баркода", hr:"ili upišite broj s barkoda", cs:"nebo zadejte číslo z čárového kódu", da:"eller indtast tallet på stregkoden", nl:"of typ het nummer op de barcode", en:"or type the number on the barcode", et:"või sisesta triipkoodi number", fi:"tai kirjoita viivakoodin numero", fr:"ou saisissez le numéro du code-barres", de:"oder gib die Nummer des Barcodes ein", el:"ή πληκτρολογήστε τον αριθμό του barcode", hu:"vagy írja be a vonalkód számát", ga:"nó clóscríobh an uimhir ar an mbarrachód", it:"oppure digita il numero del codice a barre", lv:"vai ievadi svītrkoda numuru", lt:"arba įveskite brūkšninio kodo numerį", mt:"jew ittajpja n-numru fuq il-barcode", pl:"lub wpisz numer z kodu kreskowego", pt:"ou digite o número do código de barras", ro:"sau introdu numărul de pe codul de bare", sk:"alebo zadajte číslo z čiarového kódu", sl:"ali vnesite številko črtne kode", es:"o escribe el número del código de barras", sv:"eller skriv in numret på streckkoden" },
  look_up_btn: { bg:"Търсене", hr:"Pretraži", cs:"Vyhledat", da:"Slå op", nl:"Opzoeken", en:"Look up", et:"Otsi", fi:"Hae", fr:"Rechercher", de:"Suchen", el:"Αναζήτηση", hu:"Keresés", ga:"Cuardaigh", it:"Cerca", lv:"Meklēt", lt:"Ieškoti", mt:"Fittex", pl:"Wyszukaj", pt:"Procurar", ro:"Caută", sk:"Vyhľadať", sl:"Poišči", es:"Buscar", sv:"Slå upp" },
  field_name: { bg:"Име", hr:"Naziv", cs:"Název", da:"Navn", nl:"Naam", en:"Name", et:"Nimi", fi:"Nimi", fr:"Nom", de:"Name", el:"Όνομα", hu:"Név", ga:"Ainm", it:"Nome", lv:"Nosaukums", lt:"Pavadinimas", mt:"Isem", pl:"Nazwa", pt:"Nome", ro:"Nume", sk:"Názov", sl:"Ime", es:"Nombre", sv:"Namn" },
  name_placeholder_food: { bg:"напр. Замразен грах", hr:"npr. Smrznuti grašak", cs:"např. Mražený hrášek", da:"f.eks. Frosne ærter", nl:"bijv. Diepvriesdoperwten", en:"e.g. Frozen peas", et:"nt Külmutatud herned", fi:"esim. Pakastetut herneet", fr:"ex. Petits pois surgelés", de:"z. B. Tiefkühlerbsen", el:"π.χ. Κατεψυγμένα μπιζέλια", hu:"pl. Fagyasztott zöldborsó", ga:"m.sh. Piseanna reoite", it:"es. Piselli surgelati", lv:"piem., Saldēti zirnīši", lt:"pvz., Šaldyti žirneliai", mt:"eż. Piżelli ffriżati", pl:"np. Mrożony groszek", pt:"ex. Ervilhas congeladas", ro:"ex. Mazăre congelată", sk:"napr. Mrazený hrášok", sl:"npr. Zamrznjen grah", es:"ej. Guisantes congelados", sv:"t.ex. Frysta ärtor" },
  field_category: { bg:"Категория", hr:"Kategorija", cs:"Kategorie", da:"Kategori", nl:"Categorie", en:"Category", et:"Kategooria", fi:"Kategoria", fr:"Catégorie", de:"Kategorie", el:"Κατηγορία", hu:"Kategória", ga:"Catagóir", it:"Categoria", lv:"Kategorija", lt:"Kategorija", mt:"Kategorija", pl:"Kategoria", pt:"Categoria", ro:"Categorie", sk:"Kategória", sl:"Kategorija", es:"Categoría", sv:"Kategori" },
  choose_category: { bg:"Изберете категория…", hr:"Odaberi kategoriju…", cs:"Vyberte kategorii…", da:"Vælg en kategori…", nl:"Kies een categorie…", en:"Choose a category…", et:"Vali kategooria…", fi:"Valitse kategoria…", fr:"Choisissez une catégorie…", de:"Kategorie wählen…", el:"Επιλέξτε κατηγορία…", hu:"Válasszon kategóriát…", ga:"Roghnaigh catagóir…", it:"Scegli una categoria…", lv:"Izvēlies kategoriju…", lt:"Pasirinkite kategoriją…", mt:"Agħżel kategorija…", pl:"Wybierz kategorię…", pt:"Escolha uma categoria…", ro:"Alege o categorie…", sk:"Vyberte kategóriu…", sl:"Izberite kategorijo…", es:"Elige una categoría…", sv:"Välj en kategori…" },
  field_quantity: { bg:"Количество", hr:"Količina", cs:"Množství", da:"Mængde", nl:"Hoeveelheid", en:"Quantity", et:"Kogus", fi:"Määrä", fr:"Quantité", de:"Menge", el:"Ποσότητα", hu:"Mennyiség", ga:"Cainníocht", it:"Quantità", lv:"Daudzums", lt:"Kiekis", mt:"Kwantità", pl:"Ilość", pt:"Quantidade", ro:"Cantitate", sk:"Množstvo", sl:"Količina", es:"Cantidad", sv:"Mängd" },
  field_unit: { bg:"Мерна единица", hr:"Jedinica", cs:"Jednotka", da:"Enhed", nl:"Eenheid", en:"Unit", et:"Ühik", fi:"Yksikkö", fr:"Unité", de:"Einheit", el:"Μονάδα", hu:"Mértékegység", ga:"Aonad", it:"Unità", lv:"Mērvienība", lt:"Vienetas", mt:"Unità", pl:"Jednostka", pt:"Unidade", ro:"Unitate", sk:"Jednotka", sl:"Enota", es:"Unidad", sv:"Enhet" },
  field_location: { bg:"Място за съхранение", hr:"Mjesto skladištenja", cs:"Místo uložení", da:"Opbevaringssted", nl:"Opslaglocatie", en:"Storage location", et:"Hoiukoht", fi:"Säilytyspaikka", fr:"Lieu de stockage", de:"Lagerort", el:"Τοποθεσία αποθήκευσης", hu:"Tárolási hely", ga:"Suíomh stórála", it:"Luogo di conservazione", lv:"Uzglabāšanas vieta", lt:"Laikymo vieta", mt:"Post tal-ħażna", pl:"Miejsce przechowywania", pt:"Local de armazenamento", ro:"Loc de depozitare", sk:"Miesto uloženia", sl:"Mesto shranjevanja", es:"Lugar de almacenamiento", sv:"Förvaringsplats" },
  choose_location: { bg:"Изберете място…", hr:"Odaberi lokaciju…", cs:"Vyberte místo…", da:"Vælg en placering…", nl:"Kies een locatie…", en:"Choose a location…", et:"Vali asukoht…", fi:"Valitse sijainti…", fr:"Choisissez un emplacement…", de:"Ort wählen…", el:"Επιλέξτε τοποθεσία…", hu:"Válasszon helyet…", ga:"Roghnaigh suíomh…", it:"Scegli un luogo…", lv:"Izvēlies vietu…", lt:"Pasirinkite vietą…", mt:"Agħżel post…", pl:"Wybierz miejsce…", pt:"Escolha um local…", ro:"Alege un loc…", sk:"Vyberte miesto…", sl:"Izberite mesto…", es:"Elige un lugar…", sv:"Välj en plats…" },
  mismatch_text: { bg:"{cat} обикновено се съхранява в {loc}.", hr:"{cat} obično ide u {loc}.", cs:"{cat} obvykle patří do {loc}.", da:"{cat} placeres normalt i {loc}.", nl:"{cat} hoort meestal in de {loc}.", en:"{cat} usually goes in the {loc}.", et:"{cat} käib tavaliselt kohta {loc}.", fi:"{cat} kuuluu yleensä sijaintiin {loc}.", fr:"{cat} se range généralement dans {loc}.", de:"{cat} gehört normalerweise in den Bereich {loc}.", el:"{cat} συνήθως πάει στο {loc}.", hu:"A(z) {cat} általában a(z) {loc} helyre kerül.", ga:"Téann {cat} de ghnáth i {loc}.", it:"{cat} di solito va in {loc}.", lv:"{cat} parasti glabājas {loc}.", lt:"{cat} paprastai laikoma {loc}.", mt:"{cat} normalment tmur fi {loc}.", pl:"{cat} zwykle trafia do {loc}.", pt:"{cat} normalmente vai para {loc}.", ro:"{cat} de obicei merge în {loc}.", sk:"{cat} zvyčajne patrí do {loc}.", sl:"{cat} običajno spada v {loc}.", es:"{cat} normalmente va en {loc}.", sv:"{cat} brukar förvaras i {loc}." },
  mismatch_note: { bg:"Все пак можете да го запазите тук.", hr:"Ipak ga možete spremiti ovdje.", cs:"Přesto to sem můžete uložit.", da:"Du kan stadig gemme det her.", nl:"Je kunt het hier toch opslaan.", en:"You can still save it here.", et:"Võid selle siiski siia salvestada.", fi:"Voit silti tallentaa sen tänne.", fr:"Vous pouvez quand même l'enregistrer ici.", de:"Du kannst es trotzdem hier speichern.", el:"Μπορείτε να το αποθηκεύσετε εδώ ούτως ή άλλως.", hu:"Ide is elmentheti.", ga:"Is féidir leat é a shábháil anseo mar sin féin.", it:"Puoi comunque salvarlo qui.", lv:"Tomēr vari to saglabāt šeit.", lt:"Vis tiek galite tai išsaugoti čia.", mt:"Xorta tista' ssalvah hawn.", pl:"Nadal możesz to tu zapisać.", pt:"Ainda pode guardar aqui.", ro:"Îl poți salva totuși aici.", sk:"Aj tak to sem môžete uložiť.", sl:"Vseeno lahko shranite tukaj.", es:"Aún puedes guardarlo aquí.", sv:"Du kan ändå spara det här." },
  use_instead_btn: { bg:"Използвай {loc} вместо това", hr:"Koristi {loc} umjesto toga", cs:"Použít místo toho {loc}", da:"Brug {loc} i stedet", nl:"Gebruik in plaats daarvan {loc}", en:"Use {loc} instead", et:"Kasuta selle asemel {loc}", fi:"Käytä sen sijaan kohdetta {loc}", fr:"Utiliser plutôt {loc}", de:"Stattdessen {loc} verwenden", el:"Χρήση {loc} αντ' αυτού", hu:"Használja inkább: {loc}", ga:"Úsáid {loc} ina ionad sin", it:"Usa invece {loc}", lv:"Tā vietā izmanto {loc}", lt:"Vietoj to naudokite {loc}", mt:"Uża {loc} minflok", pl:"Użyj zamiast tego {loc}", pt:"Usar {loc} em vez disso", ro:"Folosește în schimb {loc}", sk:"Použiť namiesto toho {loc}", sl:"Namesto tega uporabi {loc}", es:"Usar {loc} en su lugar", sv:"Använd {loc} istället" },
  field_expiry: { bg:"Срок на годност (незадължително)", hr:"Rok trajanja (neobavezno)", cs:"Datum spotřeby (volitelné)", da:"Udløbsdato (valgfrit)", nl:"Vervaldatum (optioneel)", en:"Expiry date (optional)", et:"Aegumiskuupäev (valikuline)", fi:"Viimeinen käyttöpäivä (valinnainen)", fr:"Date de péremption (facultatif)", de:"Ablaufdatum (optional)", el:"Ημερομηνία λήξης (προαιρετικό)", hu:"Lejárati dátum (opcionális)", ga:"Dáta éaga (roghnach)", it:"Data di scadenza (opzionale)", lv:"Derīguma termiņš (nav obligāts)", lt:"Galiojimo data (neprivaloma)", mt:"Data ta' skadenza (mhux obbligatorja)", pl:"Data ważności (opcjonalnie)", pt:"Data de validade (opcional)", ro:"Data expirării (opțional)", sk:"Dátum spotreby (voliteľné)", sl:"Rok uporabe (neobvezno)", es:"Fecha de caducidad (opcional)", sv:"Bäst-före-datum (valfritt)" },
  add_to_warehouse_btn: { bg:"Добавяне в склада", hr:"Dodaj u skladište", cs:"Přidat do skladu", da:"Tilføj til lageret", nl:"Toevoegen aan het magazijn", en:"Add to warehouse", et:"Lisa lattu", fi:"Lisää varastoon", fr:"Ajouter à l'entrepôt", de:"Zum Lager hinzufügen", el:"Προσθήκη στην αποθήκη", hu:"Hozzáadás a raktárhoz", ga:"Cuir leis an stóras", it:"Aggiungi al magazzino", lv:"Pievienot noliktavai", lt:"Pridėti į sandėlį", mt:"Żid fil-maħżen", pl:"Dodaj do magazynu", pt:"Adicionar ao armazém", ro:"Adaugă în depozit", sk:"Pridať do skladu", sl:"Dodaj v skladišče", es:"Añadir al almacén", sv:"Lägg till i lagret" },
  scan_err_no_product: { bg:"Не е намерен продукт за този баркод.", hr:"Nije pronađen proizvod za taj barkod.", cs:"Pro tento čárový kód nebyl nalezen žádný produkt.", da:"Intet produkt fundet for denne stregkode.", nl:"Geen product gevonden voor deze barcode.", en:"No product found for that barcode.", et:"Selle triipkoodi jaoks toodet ei leitud.", fi:"Tälle viivakoodille ei löytynyt tuotetta.", fr:"Aucun produit trouvé pour ce code-barres.", de:"Kein Produkt für diesen Barcode gefunden.", el:"Δεν βρέθηκε προϊόν για αυτό το barcode.", hu:"Nem található termék ehhez a vonalkódhoz.", ga:"Níor aimsíodh aon táirge don bharrachód sin.", it:"Nessun prodotto trovato per questo codice a barre.", lv:"Šim svītrkodam produkts nav atrasts.", lt:"Šiam brūkšniniam kodui produktas nerastas.", mt:"Ma nstab l-ebda prodott għal dak il-barcode.", pl:"Nie znaleziono produktu dla tego kodu kreskowego.", pt:"Nenhum produto encontrado para esse código de barras.", ro:"Niciun produs găsit pentru acest cod de bare.", sk:"Pre tento čiarový kód sa nenašiel žiadny produkt.", sl:"Za to črtno kodo ni bilo najdenega izdelka.", es:"No se encontró ningún producto para ese código de barras.", sv:"Ingen produkt hittades för den streckkoden." },
  scan_err_lookup_fail: { bg:"Неуспешно търсене на баркода. Опитайте отново или въведете ръчно.", hr:"Nije uspjelo pretraživanje barkoda. Pokušajte ponovno ili unesite ručno.", cs:"Nepodařilo se vyhledat čárový kód. Zkuste to znovu nebo zadejte ručně.", da:"Kunne ikke slå stregkoden op. Prøv igen eller udfyld manuelt.", nl:"Kon de barcode niet opzoeken. Probeer opnieuw of vul het handmatig in.", en:"Couldn't look up that barcode. Try again or fill it in manually.", et:"Triipkoodi ei õnnestunud otsida. Proovi uuesti või sisesta käsitsi.", fi:"Viivakoodia ei voitu hakea. Yritä uudelleen tai täytä manuaalisesti.", fr:"Impossible de rechercher ce code-barres. Réessayez ou remplissez manuellement.", de:"Der Barcode konnte nicht gefunden werden. Versuche es erneut oder gib die Daten manuell ein.", el:"Δεν ήταν δυνατή η αναζήτηση αυτού του barcode. Δοκιμάστε ξανά ή συμπληρώστε χειροκίνητα.", hu:"Nem sikerült megkeresni a vonalkódot. Próbálja újra, vagy töltse ki kézzel.", ga:"Níorbh fhéidir an barrachód sin a chuardach. Bain triail eile as nó líon isteach de láimh é.", it:"Impossibile cercare questo codice a barre. Riprova o compila manualmente.", lv:"Neizdevās atrast šo svītrkodu. Mēģini vēlreiz vai aizpildi manuāli.", lt:"Nepavyko rasti šio brūkšninio kodo. Bandykite dar kartą arba užpildykite rankiniu būdu.", mt:"Ma stajtx infittex dak il-barcode. Erġa' pprova jew imla manwalment.", pl:"Nie udało się wyszukać tego kodu kreskowego. Spróbuj ponownie lub wypełnij ręcznie.", pt:"Não foi possível procurar esse código de barras. Tente novamente ou preencha manualmente.", ro:"Codul de bare nu a putut fi căutat. Încearcă din nou sau completează manual.", sk:"Nepodarilo sa vyhľadať čiarový kód. Skúste to znova alebo vyplňte ručne.", sl:"Črtne kode ni bilo mogoče poiskati. Poskusite znova ali izpolnite ročno.", es:"No se pudo buscar ese código de barras. Inténtalo de nuevo o complétalo manualmente.", sv:"Det gick inte att slå upp streckkoden. Försök igen eller fyll i manuellt." },
  scan_err_camera: { bg:"Камерата не е достъпна: {msg}", hr:"Kamera nije dostupna: {msg}", cs:"Kamera není dostupná: {msg}", da:"Kamera ikke tilgængeligt: {msg}", nl:"Camera niet beschikbaar: {msg}", en:"Camera unavailable: {msg}", et:"Kaamera pole saadaval: {msg}", fi:"Kamera ei ole käytettävissä: {msg}", fr:"Caméra indisponible : {msg}", de:"Kamera nicht verfügbar: {msg}", el:"Η κάμερα δεν είναι διαθέσιμη: {msg}", hu:"A kamera nem elérhető: {msg}", ga:"Níl an ceamara ar fáil: {msg}", it:"Fotocamera non disponibile: {msg}", lv:"Kamera nav pieejama: {msg}", lt:"Kamera nepasiekiama: {msg}", mt:"Kamera mhux disponibbli: {msg}", pl:"Kamera niedostępna: {msg}", pt:"Câmara indisponível: {msg}", ro:"Camera indisponibilă: {msg}", sk:"Kamera nie je dostupná: {msg}", sl:"Kamera ni na voljo: {msg}", es:"Cámara no disponible: {msg}", sv:"Kameran är inte tillgänglig: {msg}" },
  scan_err_unsupported: { bg:"Сканирането с камера не се поддържа тук. Въведете баркода по-долу.", hr:"Skeniranje kamerom nije podržano ovdje. Upišite barkod ispod.", cs:"Skenování kamerou zde není podporováno. Zadejte čárový kód níže.", da:"Kamera-scanning understøttes ikke her. Indtast stregkoden nedenfor.", nl:"Camerascan wordt hier niet ondersteund. Typ de barcode hieronder.", en:"Camera scanning isn't supported here. Type the barcode below.", et:"Kaamera skannimist siin ei toetata. Sisesta triipkood allpool.", fi:"Kameraskannaus ei ole tuettu täällä. Kirjoita viivakoodi alle.", fr:"Le scan par caméra n'est pas pris en charge ici. Saisissez le code-barres ci-dessous.", de:"Kamera-Scan wird hier nicht unterstützt. Gib den Barcode unten ein.", el:"Η σάρωση με κάμερα δεν υποστηρίζεται εδώ. Πληκτρολογήστε το barcode παρακάτω.", hu:"A kamerás beolvasás itt nem támogatott. Írja be a vonalkódot alább.", ga:"Ní thacaítear le scanadh ceamara anseo. Clóscríobh an barrachód thíos.", it:"La scansione con fotocamera non è supportata qui. Digita il codice a barre qui sotto.", lv:"Kameras skenēšana šeit nav atbalstīta. Ievadi svītrkodu zemāk.", lt:"Skenavimas kamera čia nepalaikomas. Įveskite brūkšninį kodą žemiau.", mt:"L-iskennjar bil-kamera mhux appoġġjat hawn. Ittajpja l-barcode hawn taħt.", pl:"Skanowanie kamerą nie jest tu obsługiwane. Wpisz kod kreskowy poniżej.", pt:"A leitura pela câmara não é suportada aqui. Digite o código de barras abaixo.", ro:"Scanarea cu camera nu este acceptată aici. Introdu codul de bare mai jos.", sk:"Skenovanie kamerou tu nie je podporované. Zadajte čiarový kód nižšie.", sl:"Skeniranje s kamero tukaj ni podprto. Spodaj vnesite črtno kodo.", es:"El escaneo con cámara no es compatible aquí. Escribe el código de barras abajo.", sv:"Kameraskanning stöds inte här. Skriv streckkoden nedan." },
  tools_empty_title: { bg:"Все още няма инструменти", hr:"Još nema alata", cs:"Zatím žádné nářadí", da:"Ingen værktøjer endnu", nl:"Nog geen gereedschap", en:"No tools yet", et:"Tööriistu pole veel", fi:"Ei työkaluja vielä", fr:"Aucun outil pour l'instant", de:"Noch keine Werkzeuge", el:"Δεν υπάρχουν εργαλεία ακόμα", hu:"Még nincs szerszám", ga:"Níl aon uirlisí fós", it:"Ancora nessun attrezzo", lv:"Vēl nav instrumentu", lt:"Kol kas nėra įrankių", mt:"Għadu m'hemm ebda għodda", pl:"Brak narzędzi", pt:"Ainda sem ferramentas", ro:"Nicio unealtă încă", sk:"Zatiaľ žiadne náradie", sl:"Še ni orodja", es:"Todavía no hay herramientas", sv:"Inga verktyg än" },
  tools_empty_sub: { bg:"Добавете инструментите, които притежавате.", hr:"Dodajte alate koje posjedujete.", cs:"Přidejte nářadí, které vlastníte.", da:"Tilføj de værktøjer, du ejer.", nl:"Voeg het gereedschap toe dat je bezit.", en:"Add the tools you own to track what's ready to use.", et:"Lisa tööriistad, mis sul on.", fi:"Lisää omistamasi työkalut.", fr:"Ajoutez les outils que vous possédez.", de:"Füge die Werkzeuge hinzu, die du besitzt.", el:"Προσθέστε τα εργαλεία που έχετε.", hu:"Adja hozzá a birtokában lévő szerszámokat.", ga:"Cuir leis na huirlisí atá agat.", it:"Aggiungi gli attrezzi che possiedi.", lv:"Pievieno instrumentus, kas tev pieder.", lt:"Pridėkite turimus įrankius.", mt:"Żid l-għodda li għandek.", pl:"Dodaj narzędzia, które posiadasz.", pt:"Adicione as ferramentas que possui.", ro:"Adaugă uneltele pe care le deții.", sk:"Pridajte náradie, ktoré vlastníte.", sl:"Dodajte orodje, ki ga imate.", es:"Añade las herramientas que tienes.", sv:"Lägg till verktygen du äger." },
  stamp_owned: { bg:"ПРИТЕЖАВАН", hr:"U VLASNIŠTVU", cs:"VLASTNÍM", da:"EJET", nl:"IN BEZIT", en:"OWNED", et:"OLEMAS", fi:"OMISTUKSESSA", fr:"POSSÉDÉ", de:"VORHANDEN", el:"ΚΑΤΕΧΕΤΑΙ", hu:"MEGVAN", ga:"AR SEILBH", it:"POSSEDUTO", lv:"PIEDER", lt:"TURIMA", mt:"GĦANDEK", pl:"POSIADANE", pt:"POSSUÍDO", ro:"DEȚINUT", sk:"VLASTNÍM", sl:"V LASTI", es:"EN POSESIÓN", sv:"ÄGS" },
  stamp_need_buy: { bg:"ЗА ПОКУПКА", hr:"TREBA KUPITI", cs:"JE TŘEBA KOUPIT", da:"SKAL KØBES", nl:"MOET GEKOCHT WORDEN", en:"NEED TO BUY", et:"TULEB OSTA", fi:"PITÄÄ OSTAA", fr:"À ACHETER", de:"MUSS GEKAUFT WERDEN", el:"ΠΡΕΠΕΙ ΝΑ ΑΓΟΡΑΣΤΕΙ", hu:"MEG KELL VENNI", ga:"LE CEANNACH", it:"DA ACQUISTARE", lv:"JĀNOPĒRK", lt:"REIKIA PIRKTI", mt:"JEĦTIEĠ JINXTARA", pl:"DO KUPIENIA", pt:"A COMPRAR", ro:"DE CUMPĂRAT", sk:"TREBA KÚPIŤ", sl:"JE TREBA KUPITI", es:"POR COMPRAR", sv:"BEHÖVER KÖPAS" },
  add_tool_title: { bg:"Добавяне на инструмент", hr:"Dodaj alat", cs:"Přidat nářadí", da:"Tilføj værktøj", nl:"Gereedschap toevoegen", en:"Add tool", et:"Lisa tööriist", fi:"Lisää työkalu", fr:"Ajouter un outil", de:"Werkzeug hinzufügen", el:"Προσθήκη εργαλείου", hu:"Szerszám hozzáadása", ga:"Cuir uirlis leis", it:"Aggiungi attrezzo", lv:"Pievienot instrumentu", lt:"Pridėti įrankį", mt:"Żid għodda", pl:"Dodaj narzędzie", pt:"Adicionar ferramenta", ro:"Adaugă unealtă", sk:"Pridať náradie", sl:"Dodaj orodje", es:"Añadir herramienta", sv:"Lägg till verktyg" },
  name_placeholder_tool: { bg:"напр. Акумулаторна бормашина", hr:"npr. Bežična bušilica", cs:"např. Aku vrtačka", da:"f.eks. Batteridrevet boremaskine", nl:"bijv. Accuboormachine", en:"e.g. Cordless drill", et:"nt Juhtmeta trell", fi:"esim. Akkuporakone", fr:"ex. Perceuse sans fil", de:"z. B. Akku-Bohrmaschine", el:"π.χ. Ασύρματο δράπανο", hu:"pl. Vezeték nélküli fúrógép", ga:"m.sh. Druilire gan sreang", it:"es. Trapano a batteria", lv:"piem., Bezvadu urbjmašīna", lt:"pvz., Belaidis gręžtuvas", mt:"eż. Tħaffira mingħajr wajer", pl:"np. Wiertarka akumulatorowa", pt:"ex. Berbequim sem fios", ro:"ex. Bormașină fără fir", sk:"napr. Aku vŕtačka", sl:"npr. Brezžični vrtalnik", es:"ej. Taladro inalámbrico", sv:"t.ex. Sladdlös borrmaskin" },
  own_this: { bg:"Притежавам го", hr:"Posjedujem ovo", cs:"Vlastním to", da:"Jeg ejer det", nl:"Ik heb dit", en:"I own this", et:"See on mul olemas", fi:"Omistan tämän", fr:"Je le possède", de:"Ich besitze das", el:"Το έχω", hu:"Ez megvan nekem", ga:"Tá seo agam", it:"Lo possiedo", lv:"Man tas ir", lt:"Aš tai turiu", mt:"Għandi dan", pl:"Posiadam to", pt:"Tenho isto", ro:"Dețin acest lucru", sk:"Vlastním to", sl:"To imam", es:"Lo tengo", sv:"Jag äger det här" },
  need_to_buy: { bg:"Трябва да купя", hr:"Treba kupiti", cs:"Je třeba koupit", da:"Skal købes", nl:"Moet gekocht worden", en:"Need to buy", et:"Tuleb osta", fi:"Pitää ostaa", fr:"À acheter", de:"Muss gekauft werden", el:"Πρέπει να αγοραστεί", hu:"Meg kell venni", ga:"Le ceannach", it:"Da acquistare", lv:"Jānopērk", lt:"Reikia pirkti", mt:"Jeħtieġ jinxtara", pl:"Do kupienia", pt:"A comprar", ro:"De cumpărat", sk:"Treba kúpiť", sl:"Treba je kupiti", es:"Por comprar", sv:"Behöver köpas" },
  job_check_title: { bg:"Мога ли да свърша тази работа?", hr:"Mogu li obaviti ovaj posao?", cs:"Mohu tuto práci udělat?", da:"Kan jeg klare denne opgave?", nl:"Kan ik deze klus doen?", en:"Can I do this job?", et:"Kas ma saan selle tööga hakkama?", fi:"Pystynkö tekemään tämän työn?", fr:"Puis-je faire ce travail ?", de:"Kann ich diese Arbeit erledigen?", el:"Μπορώ να κάνω αυτή τη δουλειά;", hu:"El tudom végezni ezt a munkát?", ga:"An féidir liom an post seo a dhéanamh?", it:"Posso fare questo lavoro?", lv:"Vai es varu paveikt šo darbu?", lt:"Ar galiu atlikti šį darbą?", mt:"Nista' nagħmel dan ix-xogħol?", pl:"Czy mogę wykonać to zadanie?", pt:"Consigo fazer este trabalho?", ro:"Pot să fac această treabă?", sk:"Môžem urobiť túto prácu?", sl:"Ali lahko opravim to delo?", es:"¿Puedo hacer este trabajo?", sv:"Kan jag göra det här jobbet?" },
  pick_job: { bg:"Изберете задача…", hr:"Odaberi posao…", cs:"Vyberte úkol…", da:"Vælg en opgave…", nl:"Kies een klus…", en:"Pick a job…", et:"Vali töö…", fi:"Valitse työ…", fr:"Choisissez une tâche…", de:"Aufgabe wählen…", el:"Επιλέξτε εργασία…", hu:"Válasszon feladatot…", ga:"Roghnaigh post…", it:"Scegli un lavoro…", lv:"Izvēlies darbu…", lt:"Pasirinkite darbą…", mt:"Agħżel xogħol…", pl:"Wybierz zadanie…", pt:"Escolha uma tarefa…", ro:"Alege o sarcină…", sk:"Vyberte úlohu…", sl:"Izberite opravilo…", es:"Elige una tarea…", sv:"Välj ett jobb…" },
  job_all_set: { bg:"Имате всичко необходимо за тази работа.", hr:"Imate sve za ovaj posao.", cs:"Máte vše potřebné pro tuto práci.", da:"Du har alt, hvad du skal bruge til denne opgave.", nl:"Je hebt alles wat je nodig hebt voor deze klus.", en:"You have everything for this job.", et:"Sul on kõik selle töö jaoks olemas.", fi:"Sinulla on kaikki tähän työhön tarvittava.", fr:"Vous avez tout ce qu'il faut pour ce travail.", de:"Du hast alles für diese Arbeit.", el:"Έχετε ό,τι χρειάζεστε για αυτή τη δουλειά.", hu:"Megvan mindene ehhez a munkához.", ga:"Tá gach rud agat don phost seo.", it:"Hai tutto il necessario per questo lavoro.", lv:"Tev ir viss nepieciešamais šim darbam.", lt:"Turite viską, ko reikia šiam darbui.", mt:"Għandek kollox għal dan ix-xogħol.", pl:"Masz wszystko, co potrzebne do tego zadania.", pt:"Tem tudo o que precisa para este trabalho.", ro:"Ai tot ce-ți trebuie pentru această treabă.", sk:"Máte všetko potrebné na túto prácu.", sl:"Imate vse za to delo.", es:"Tienes todo lo necesario para este trabajo.", sv:"Du har allt du behöver för det här jobbet." },
  job_buy_or_borrow: { bg:"Все още липсва: {list}", hr:"Još treba: {list}", cs:"Ještě chybí: {list}", da:"Mangler stadig: {list}", nl:"Nog nodig: {list}", en:"Still needed: {list}", et:"Vajalik veel: {list}", fi:"Vielä tarvitaan: {list}", fr:"Encore nécessaire : {list}", de:"Noch benötigt: {list}", el:"Χρειάζεται ακόμα: {list}", hu:"Még kell: {list}", ga:"Fós ag teastáil: {list}", it:"Manca ancora: {list}", lv:"Vēl nepieciešams: {list}", lt:"Dar reikia: {list}", mt:"Għadu meħtieġ: {list}", pl:"Nadal potrzebne: {list}", pt:"Ainda é preciso: {list}", ro:"Încă este nevoie de: {list}", sk:"Ešte potrebné: {list}", sl:"Še potrebno: {list}", es:"Todavía necesitas: {list}", sv:"Behövs fortfarande: {list}" },
  cloth_stat_total: { bg:"Общо", hr:"Ukupno", cs:"Celkem", da:"I alt", nl:"Totaal", en:"Total", et:"Kokku", fi:"Yhteensä", fr:"Total", de:"Gesamt", el:"Σύνολο", hu:"Összesen", ga:"Iomlán", it:"Totale", lv:"Kopā", lt:"Iš viso", mt:"Total", pl:"Razem", pt:"Total", ro:"Total", sk:"Spolu", sl:"Skupaj", es:"Total", sv:"Totalt" },
  cloth_stat_ready: { bg:"Готово", hr:"Spremno", cs:"Připraveno", da:"Klar", nl:"Klaar", en:"Ready", et:"Valmis", fi:"Valmis", fr:"Prêt", de:"Bereit", el:"Έτοιμο", hu:"Kész", ga:"Réidh", it:"Pronto", lv:"Gatavs", lt:"Paruošta", mt:"Lest", pl:"Gotowe", pt:"Pronto", ro:"Gata", sk:"Pripravené", sl:"Pripravljeno", es:"Listo", sv:"Klart" },
  cloth_stat_dirty: { bg:"За пране", hr:"Za pranje", cs:"V prádle", da:"I vasketøjet", nl:"In de was", en:"In laundry", et:"Pesus", fi:"Pyykissä", fr:"À laver", de:"In der Wäsche", el:"Στο πλυντήριο", hu:"Mosásban", ga:"Sa níochán", it:"In lavatrice", lv:"Veļas mazgāšanā", lt:"Skalbinuose", mt:"Fil-ħasil", pl:"W praniu", pt:"Na roupa suja", ro:"La spălat", sk:"V bielizni", sl:"V pranju", es:"En la colada", sv:"I tvätten" },
  filter_all_types: { bg:"Всички видове", hr:"Sve vrste", cs:"Všechny druhy", da:"Alle typer", nl:"Alle types", en:"All types", et:"Kõik tüübid", fi:"Kaikki tyypit", fr:"Tous les types", de:"Alle Typen", el:"Όλοι οι τύποι", hu:"Minden típus", ga:"Gach cineál", it:"Tutti i tipi", lv:"Visi veidi", lt:"Visi tipai", mt:"It-tipi kollha", pl:"Wszystkie typy", pt:"Todos os tipos", ro:"Toate tipurile", sk:"Všetky typy", sl:"Vse vrste", es:"Todos los tipos", sv:"Alla typer" },
  cloth_empty_sub: { bg:"Добавете дрехи със снимка, за да изградите гардероба си.", hr:"Dodajte odjeću sa slikom kako biste izgradili svoj ormar.", cs:"Přidejte oblečení s fotkou a vybudujte si šatník.", da:"Tilføj tøj med et billede for at opbygge din garderobe.", nl:"Voeg kleding met een foto toe om je garderobe op te bouwen.", en:"Add clothing with a photo to build out your wardrobe.", et:"Lisa riideid koos pildiga.", fi:"Lisää vaatteita kuvan kanssa.", fr:"Ajoutez des vêtements avec une photo pour constituer votre garde-robe.", de:"Füge Kleidung mit einem Foto hinzu.", el:"Προσθέστε ρούχα με φωτογραφία.", hu:"Adjon hozzá ruhákat fényképpel.", ga:"Cuir éadaí le grianghraf leis.", it:"Aggiungi capi con una foto.", lv:"Pievieno apģērbu ar foto.", lt:"Pridėkite drabužių su nuotrauka.", mt:"Żid ħwejjeġ b'ritratt.", pl:"Dodaj ubranie ze zdjęciem.", pt:"Adicione roupas com uma foto.", ro:"Adaugă haine cu o fotografie.", sk:"Pridajte oblečenie s fotkou.", sl:"Dodajte oblačila s fotografijo.", es:"Añade ropa con una foto.", sv:"Lägg till kläder med ett foto." },
  stamp_ready: { bg:"ГОТОВО", hr:"SPREMNO", cs:"PŘIPRAVENO", da:"KLAR", nl:"KLAAR", en:"READY", et:"VALMIS", fi:"VALMIS", fr:"PRÊT", de:"BEREIT", el:"ΕΤΟΙΜΟ", hu:"KÉSZ", ga:"RÉIDH", it:"PRONTO", lv:"GATAVS", lt:"PARUOŠTA", mt:"LEST", pl:"GOTOWE", pt:"PRONTO", ro:"GATA", sk:"PRIPRAVENÉ", sl:"PRIPRAVLJENO", es:"LISTO", sv:"KLAR" },
  stamp_dirty: { bg:"МРЪСНО", hr:"PRLJAVO", cs:"ŠPINAVÉ", da:"BESKIDT", nl:"VUIL", en:"DIRTY", et:"MÄÄRDUNUD", fi:"LIKAINEN", fr:"SALE", de:"SCHMUTZIG", el:"ΛΕΡΩΜΕΝΟ", hu:"PISZKOS", ga:"SALACH", it:"SPORCO", lv:"NETĪRS", lt:"NEŠVARU", mt:"MEDNUX", pl:"BRUDNE", pt:"SUJO", ro:"MURDAR", sk:"ŠPINAVÉ", sl:"UMAZANO", es:"SUCIO", sv:"SMUTSIG" },
  add_clothing_title: { bg:"Добавяне на дреха", hr:"Dodaj odjeću", cs:"Přidat oblečení", da:"Tilføj tøj", nl:"Kleding toevoegen", en:"Add clothing", et:"Lisa riie", fi:"Lisää vaate", fr:"Ajouter un vêtement", de:"Kleidung hinzufügen", el:"Προσθήκη ρούχου", hu:"Ruhadarab hozzáadása", ga:"Cuir éadaí leis", it:"Aggiungi capo", lv:"Pievienot apģērbu", lt:"Pridėti drabužį", mt:"Żid ħwejjeġ", pl:"Dodaj ubranie", pt:"Adicionar roupa", ro:"Adaugă haină", sk:"Pridať oblečenie", sl:"Dodaj oblačilo", es:"Añadir prenda", sv:"Lägg till plagg" },
  choose_photo: { bg:"Изберете снимка", hr:"Odaberi sliku", cs:"Vybrat fotku", da:"Vælg billede", nl:"Kies foto", en:"Choose photo", et:"Vali pilt", fi:"Valitse kuva", fr:"Choisir une photo", de:"Foto auswählen", el:"Επιλογή φωτογραφίας", hu:"Fénykép kiválasztása", ga:"Roghnaigh grianghraf", it:"Scegli foto", lv:"Izvēlies foto", lt:"Pasirinkite nuotrauką", mt:"Agħżel ritratt", pl:"Wybierz zdjęcie", pt:"Escolher foto", ro:"Alege o fotografie", sk:"Vybrať fotku", sl:"Izberi fotografijo", es:"Elegir foto", sv:"Välj foto" },
  processing_photo: { bg:"Обработка…", hr:"Obrada…", cs:"Zpracovávám…", da:"Behandler…", nl:"Verwerken…", en:"Processing…", et:"Töötlemine…", fi:"Käsitellään…", fr:"Traitement…", de:"Wird verarbeitet…", el:"Επεξεργασία…", hu:"Feldolgozás…", ga:"Á phróiseáil…", it:"Elaborazione…", lv:"Apstrādā…", lt:"Apdorojama…", mt:"Qed tiġi pproċessata…", pl:"Przetwarzanie…", pt:"A processar…", ro:"Se procesează…", sk:"Spracúvam…", sl:"Obdelava…", es:"Procesando…", sv:"Bearbetar…" },
  name_placeholder_clothing: { bg:"напр. Синьо худи", hr:"npr. Plava hoodica", cs:"např. Modrá mikina", da:"f.eks. Blå hættetrøje", nl:"bijv. Blauwe hoodie", en:"e.g. Blue hoodie", et:"nt Sinine dressipluus", fi:"esim. Sininen huppari", fr:"ex. Sweat à capuche bleu", de:"z. B. Blauer Hoodie", el:"π.χ. Μπλε φούτερ", hu:"pl. Kék kapucnis pulóver", ga:"m.sh. Húdaí gorm", it:"es. Felpa blu", lv:"piem., Zils džemperis ar kapuci", lt:"pvz., Mėlynas džemperis su gobtuvu", mt:"eż. Hoodie blu", pl:"np. Niebieska bluza z kapturem", pt:"ex. Casaco azul com capuz", ro:"ex. Hanorac albastru", sk:"napr. Modrá mikina", sl:"npr. Modri pulover s kapuco", es:"ej. Sudadera azul", sv:"t.ex. Blå hoodie" },
  field_color: { bg:"Цвят", hr:"Boja", cs:"Barva", da:"Farve", nl:"Kleur", en:"Color", et:"Värv", fi:"Väri", fr:"Couleur", de:"Farbe", el:"Χρώμα", hu:"Szín", ga:"Dath", it:"Colore", lv:"Krāsa", lt:"Spalva", mt:"Kulur", pl:"Kolor", pt:"Cor", ro:"Culoare", sk:"Farba", sl:"Barva", es:"Color", sv:"Färg" },
  add_to_wardrobe_btn: { bg:"Добавяне в гардероба", hr:"Dodaj u ormar", cs:"Přidat do šatníku", da:"Tilføj til garderoben", nl:"Toevoegen aan garderobe", en:"Add to wardrobe", et:"Lisa garderoobi", fi:"Lisää vaatekaappiin", fr:"Ajouter à la garde-robe", de:"Zum Kleiderschrank hinzufügen", el:"Προσθήκη στη ντουλάπα", hu:"Hozzáadás a ruhatárhoz", ga:"Cuir leis an vardrús", it:"Aggiungi al guardaroba", lv:"Pievienot garderobei", lt:"Pridėti į spintą", mt:"Żid mal-gardarobba", pl:"Dodaj do garderoby", pt:"Adicionar ao guarda-roupa", ro:"Adaugă în garderobă", sk:"Pridať do šatníka", sl:"Dodaj v garderobo", es:"Añadir al armario", sv:"Lägg till i garderoben" },
  locations_title: { bg:"Вашите места за съхранение", hr:"Vaše lokacije za skladištenje", cs:"Vaše místa uložení", da:"Dine opbevaringssteder", nl:"Jouw opslaglocaties", en:"Your storage locations", et:"Sinu hoiukohad", fi:"Säilytyspaikkasi", fr:"Vos emplacements de stockage", de:"Deine Lagerorte", el:"Οι τοποθεσίες αποθήκευσής σας", hu:"Az Ön tárolási helyei", ga:"Do shuímh stórála", it:"I tuoi luoghi di conservazione", lv:"Tavas uzglabāšanas vietas", lt:"Jūsų laikymo vietos", mt:"Il-postijiet tal-ħażna tiegħek", pl:"Twoje miejsca przechowywania", pt:"Os seus locais de armazenamento", ro:"Locurile tale de depozitare", sk:"Vaše miesta uloženia", sl:"Vaša mesta shranjevanja", es:"Tus lugares de almacenamiento", sv:"Dina förvaringsplatser" },
  add_location_title: { bg:"Добавяне на място", hr:"Dodaj lokaciju", cs:"Přidat místo", da:"Tilføj en placering", nl:"Locatie toevoegen", en:"Add a location", et:"Lisa asukoht", fi:"Lisää sijainti", fr:"Ajouter un emplacement", de:"Ort hinzufügen", el:"Προσθήκη τοποθεσίας", hu:"Hely hozzáadása", ga:"Cuir suíomh leis", it:"Aggiungi un luogo", lv:"Pievienot vietu", lt:"Pridėti vietą", mt:"Żid post", pl:"Dodaj miejsce", pt:"Adicionar um local", ro:"Adaugă un loc", sk:"Pridať miesto", sl:"Dodaj mesto", es:"Añadir un lugar", sv:"Lägg till en plats" },
  name_placeholder_location: { bg:"напр. Рафт в гаража", hr:"npr. Polica u garaži", cs:"např. Police v garáži", da:"f.eks. Hylde i garagen", nl:"bijv. Plank in de garage", en:"e.g. Garage shelf", et:"nt Garaaži riiul", fi:"esim. Autotallin hylly", fr:"ex. Étagère du garage", de:"z. B. Regal in der Garage", el:"π.χ. Ράφι γκαράζ", hu:"pl. Garázspolc", ga:"m.sh. Seilf gharáiste", it:"es. Scaffale del garage", lv:"piem., Garāžas plaukts", lt:"pvz., Garažo lentyna", mt:"eż. Xkaffa tal-garaxx", pl:"np. Półka w garażu", pt:"ex. Prateleira da garagem", ro:"ex. Raft în garaj", sk:"napr. Polica v garáži", sl:"npr. Polica v garaži", es:"ej. Estante del garaje", sv:"t.ex. Hylla i garaget" },
  field_behaves_like: { bg:"Държи се като", hr:"Ponaša se kao", cs:"Chová se jako", da:"Fungerer som", nl:"Gedraagt zich als", en:"Behaves like", et:"Käitub nagu", fi:"Toimii kuten", fr:"Se comporte comme", de:"Verhält sich wie", el:"Συμπεριφέρεται σαν", hu:"Úgy viselkedik, mint", ga:"Iompraíonn sé cosúil le", it:"Si comporta come", lv:"Uzvedas kā", lt:"Elgiasi kaip", mt:"Jaġixxi bħal", pl:"Zachowuje się jak", pt:"Comporta-se como", ro:"Se comportă ca", sk:"Chová sa ako", sl:"Obnaša se kot", es:"Se comporta como", sv:"Beter sig som" },
  kind_full_pantry: { bg:"Килер (стайна температура)", hr:"Smočnica (sobna temperatura)", cs:"Spíž (pokojová teplota)", da:"Spisekammer (stuetemperatur)", nl:"Voorraadkast (kamertemperatuur)", en:"Pantry (room temperature)", et:"Sahver (toatemperatuur)", fi:"Ruokakomero (huoneenlämpö)", fr:"Garde-manger (température ambiante)", de:"Vorratsschrank (Zimmertemperatur)", el:"Κελάρι (θερμοκρασία δωματίου)", hu:"Kamra (szobahőmérséklet)", ga:"Lardrús (teocht an tseomra)", it:"Dispensa (temperatura ambiente)", lv:"Pieliekamais (istabas temperatūrā)", lt:"Sandėliukas (kambario temperatūra)", mt:"Maħżen tal-ikel (temperatura tal-kamra)", pl:"Spiżarnia (temperatura pokojowa)", pt:"Despensa (temperatura ambiente)", ro:"Cămară (temperatura camerei)", sk:"Špajza (izbová teplota)", sl:"Shramba (sobna temperatura)", es:"Despensa (temperatura ambiente)", sv:"Skafferi (rumstemperatur)" },
  kind_full_fridge: { bg:"Хладилник (охладено)", hr:"Hladnjak (rashlađeno)", cs:"Lednice (chlazené)", da:"Køleskab (kølet)", nl:"Koelkast (gekoeld)", en:"Fridge (chilled)", et:"Külmik (jahutatud)", fi:"Jääkaappi (kylmä)", fr:"Réfrigérateur (frais)", de:"Kühlschrank (gekühlt)", el:"Ψυγείο (ψυχρό)", hu:"Hűtő (hűtött)", ga:"Cuisneoir (fuaraithe)", it:"Frigorifero (refrigerato)", lv:"Ledusskapis (dzesēts)", lt:"Šaldytuvas (šaldytas)", mt:"Fridge (mkessaħ)", pl:"Lodówka (chłodzone)", pt:"Frigorífico (refrigerado)", ro:"Frigider (răcit)", sk:"Chladnička (chladené)", sl:"Hladilnik (hlajeno)", es:"Frigorífico (refrigerado)", sv:"Kylskåp (kylt)" },
  kind_full_freezer: { bg:"Фризер (замразено)", hr:"Zamrzivač (smrznuto)", cs:"Mraznička (mražené)", da:"Fryser (frossen)", nl:"Vriezer (bevroren)", en:"Freezer (frozen)", et:"Sügavkülmik (külmutatud)", fi:"Pakastin (pakaste)", fr:"Congélateur (surgelé)", de:"Gefrierschrank (gefroren)", el:"Καταψύκτης (κατεψυγμένο)", hu:"Fagyasztó (fagyasztott)", ga:"Reoiteoir (reoite)", it:"Congelatore (surgelato)", lv:"Saldētava (saldēts)", lt:"Šaldiklis (šaldyta)", mt:"Freezer (iffriżat)", pl:"Zamrażarka (mrożone)", pt:"Congelador (congelado)", ro:"Congelator (congelat)", sk:"Mraznička (mrazené)", sl:"Zamrzovalnik (zamrznjeno)", es:"Congelador (congelado)", sv:"Frys (fryst)" },
  kind_full_other: { bg:"Общо съхранение", hr:"Opće skladištenje", cs:"Obecné úložiště", da:"Generel opbevaring", nl:"Algemene opslag", en:"General storage", et:"Üldine hoiukoht", fi:"Yleinen säilytys", fr:"Rangement général", de:"Allgemeiner Stauraum", el:"Γενική αποθήκευση", hu:"Általános tárolás", ga:"Stóráil ghinearálta", it:"Deposito generico", lv:"Vispārēja uzglabāšana", lt:"Bendra laikymo vieta", mt:"Ħażna ġenerali", pl:"Magazyn ogólny", pt:"Armazenamento geral", ro:"Depozitare generală", sk:"Všeobecné úložisko", sl:"Splošno skladišče", es:"Almacenamiento general", sv:"Allmän förvaring" },
  add_location_btn: { bg:"Добавяне на място", hr:"Dodaj lokaciju", cs:"Přidat místo", da:"Tilføj placering", nl:"Locatie toevoegen", en:"Add location", et:"Lisa asukoht", fi:"Lisää sijainti", fr:"Ajouter l'emplacement", de:"Ort hinzufügen", el:"Προσθήκη τοποθεσίας", hu:"Hely hozzáadása", ga:"Cuir suíomh leis", it:"Aggiungi luogo", lv:"Pievienot vietu", lt:"Pridėti vietą", mt:"Żid post", pl:"Dodaj miejsce", pt:"Adicionar local", ro:"Adaugă loc", sk:"Pridať miesto", sl:"Dodaj mesto", es:"Añadir lugar", sv:"Lägg till plats" },
  reset_demo_btn: { bg:"Нулиране на демо данните", hr:"Resetiraj demo podatke", cs:"Obnovit demo data", da:"Nulstil demodata", nl:"Demogegevens resetten", en:"Reset demo data", et:"Lähtesta demoandmed", fi:"Palauta demotiedot", fr:"Réinitialiser les données de démo", de:"Demodaten zurücksetzen", el:"Επαναφορά δεδομένων επίδειξης", hu:"Demóadatok visszaállítása", ga:"Athshocraigh sonraí taispeána", it:"Ripristina i dati demo", lv:"Atiestatīt demo datus", lt:"Atkurti demonstracinius duomenis", mt:"Irrisettja d-dejta demo", pl:"Zresetuj dane demo", pt:"Repor dados de demonstração", ro:"Resetează datele demo", sk:"Obnoviť demo dáta", sl:"Ponastavi demo podatke", es:"Restablecer datos de demostración", sv:"Återställ demodata" },
  delete_location_blocked_alert: { bg:"Първо преместете или премахнете храната, съхранявана тук.", hr:"Prvo premjestite ili uklonite hranu pohranjenu ovdje.", cs:"Nejprve přesuňte nebo odeberte potraviny uložené zde.", da:"Flyt eller fjern først maden, der er opbevaret her.", nl:"Verplaats of verwijder eerst het voedsel dat hier is opgeslagen.", en:"Move or remove the food stored here first.", et:"Kõigepealt liiguta või eemalda siin hoitav toit.", fi:"Siirrä tai poista täällä säilytettävä ruoka ensin.", fr:"Déplacez ou retirez d'abord les aliments stockés ici.", de:"Verschiebe oder entferne zuerst die hier gelagerten Lebensmittel.", el:"Μετακινήστε ή αφαιρέστε πρώτα τα τρόφιμα που είναι αποθηκευμένα εδώ.", hu:"Először mozgassa el vagy távolítsa el az itt tárolt élelmiszert.", ga:"Bog nó bain an bia atá stóráilte anseo ar dtús.", it:"Sposta o rimuovi prima gli alimenti conservati qui.", lv:"Vispirms pārvieto vai noņem šeit uzglabāto pārtiku.", lt:"Pirmiausia perkelkite arba pašalinkite čia laikomą maistą.", mt:"Iċċaqlaq jew neħħi l-ikel maħżun hawn l-ewwel.", pl:"Najpierw przenieś lub usuń jedzenie przechowywane tutaj.", pt:"Mova ou remova primeiro os alimentos guardados aqui.", ro:"Mută sau elimină mai întâi alimentele depozitate aici.", sk:"Najprv presuňte alebo odstráňte potraviny uložené tu.", sl:"Najprej premaknite ali odstranite tukaj shranjeno hrano.", es:"Mueve o elimina primero la comida guardada aquí.", sv:"Flytta eller ta bort maten som förvaras här först." },
  kind_placement_pantry: { bg:"Съхранение като в килер", hr:"Skladištenje kao u smočnici", cs:"Uložení jako ve spíži", da:"Opbevaring som i spisekammer", nl:"Opslag zoals in een voorraadkast", en:"Pantry-style placement", et:"Sahvritüüpi hoiukoht", fi:"Ruokakomerotyylinen säilytys", fr:"Rangement type garde-manger", de:"Lagerung wie im Vorratsschrank", el:"Τοποθέτηση τύπου κελαριού", hu:"Kamra jellegű elhelyezés", ga:"Suíomh de chineál lardrúis", it:"Conservazione tipo dispensa", lv:"Pieliekamā tipa novietojums", lt:"Sandėliuko tipo laikymas", mt:"Tqegħid tat-tip maħżen tal-ikel", pl:"Przechowywanie w stylu spiżarni", pt:"Colocação tipo despensa", ro:"Amplasare tip cămară", sk:"Umiestnenie v štýle špajze", sl:"Namestitev v slogu shrambe", es:"Colocación tipo despensa", sv:"Placering i skafferistil" },
  kind_placement_fridge: { bg:"Съхранение като в хладилник", hr:"Skladištenje kao u hladnjaku", cs:"Uložení jako v lednici", da:"Opbevaring som i køleskab", nl:"Opslag zoals in een koelkast", en:"Fridge-style placement", et:"Külmikutüüpi hoiukoht", fi:"Jääkaappityylinen säilytys", fr:"Rangement type réfrigérateur", de:"Lagerung wie im Kühlschrank", el:"Τοποθέτηση τύπου ψυγείου", hu:"Hűtő jellegű elhelyezés", ga:"Suíomh de chineál cuisneora", it:"Conservazione tipo frigorifero", lv:"Ledusskapja tipa novietojums", lt:"Šaldytuvo tipo laikymas", mt:"Tqegħid tat-tip fridge", pl:"Przechowywanie w stylu lodówki", pt:"Colocação tipo frigorífico", ro:"Amplasare tip frigider", sk:"Umiestnenie v štýle chladničky", sl:"Namestitev v slogu hladilnika", es:"Colocación tipo frigorífico", sv:"Placering i kylskåpsstil" },
  kind_placement_freezer: { bg:"Съхранение като във фризер", hr:"Skladištenje kao u zamrzivaču", cs:"Uložení jako v mrazničce", da:"Opbevaring som i fryser", nl:"Opslag zoals in een vriezer", en:"Freezer-style placement", et:"Sügavkülmikutüüpi hoiukoht", fi:"Pakastintyylinen säilytys", fr:"Rangement type congélateur", de:"Lagerung wie im Gefrierschrank", el:"Τοποθέτηση τύπου καταψύκτη", hu:"Fagyasztó jellegű elhelyezés", ga:"Suíomh de chineál reoiteora", it:"Conservazione tipo congelatore", lv:"Saldētavas tipa novietojums", lt:"Šaldiklio tipo laikymas", mt:"Tqegħid tat-tip freezer", pl:"Przechowywanie w stylu zamrażarki", pt:"Colocação tipo congelador", ro:"Amplasare tip congelator", sk:"Umiestnenie v štýle mrazničky", sl:"Namestitev v slogu zamrzovalnika", es:"Colocación tipo congelador", sv:"Placering i frysstil" },
  kind_placement_other: { bg:"Общо съхранение", hr:"Opće skladištenje", cs:"Obecné uložení", da:"Generel opbevaring", nl:"Algemene opslag", en:"General placement", et:"Üldine paigutus", fi:"Yleinen säilytys", fr:"Rangement général", de:"Allgemeine Lagerung", el:"Γενική τοποθέτηση", hu:"Általános elhelyezés", ga:"Suíomh ginearálta", it:"Conservazione generica", lv:"Vispārējs novietojums", lt:"Bendras laikymas", mt:"Tqegħid ġenerali", pl:"Przechowywanie ogólne", pt:"Colocação geral", ro:"Amplasare generală", sk:"Všeobecné umiestnenie", sl:"Splošna namestitev", es:"Colocación general", sv:"Allmän placering" },
  loading_text: { bg:"Зареждане на склада ви…", hr:"Učitavanje vašeg skladišta…", cs:"Načítání vašeho skladu…", da:"Indlæser dit lager…", nl:"Je magazijn wordt geladen…", en:"Loading your warehouse…", et:"Sinu lao laadimine…", fi:"Ladataan varastoasi…", fr:"Chargement de votre entrepôt…", de:"Dein Lager wird geladen…", el:"Φόρτωση της αποθήκης σας…", hu:"Az Ön raktárának betöltése…", ga:"Do stóras á lódáil…", it:"Caricamento del tuo magazzino…", lv:"Tavas noliktavas ielāde…", lt:"Kraunamas jūsų sandėlis…", mt:"Qed jitgħabba l-maħżen tiegħek…", pl:"Wczytywanie Twojego magazynu…", pt:"A carregar o seu armazém…", ro:"Se încarcă depozitul tău…", sk:"Načítava sa váš sklad…", sl:"Nalaganje vašega skladišča…", es:"Cargando tu almacén…", sv:"Laddar ditt lager…" },
  language_title: { bg:"Език на приложението", hr:"Jezik aplikacije", cs:"Jazyk aplikace", da:"Appsprog", nl:"Apptaal", en:"App language", et:"Rakenduse keel", fi:"Sovelluksen kieli", fr:"Langue de l'application", de:"App-Sprache", el:"Γλώσσα εφαρμογής", hu:"Alkalmazás nyelve", ga:"Teanga na haipe", it:"Lingua dell'app", lv:"Lietotnes valoda", lt:"Programėlės kalba", mt:"Lingwa tal-app", pl:"Język aplikacji", pt:"Idioma da aplicação", ro:"Limba aplicației", sk:"Jazyk aplikácie", sl:"Jezik aplikacije", es:"Idioma de la aplicación", sv:"Appspråk" },
  unit_pcs: { bg:"бр.", hr:"kom", cs:"ks", da:"stk", nl:"st", en:"pcs", et:"tk", fi:"kpl", fr:"pce", de:"Stk", el:"τεμ", hu:"db", ga:"pcs", it:"pz", lv:"gab", lt:"vnt", mt:"biċċiet", pl:"szt", pt:"un", ro:"buc", sk:"ks", sl:"kos", es:"ud", sv:"st" },

  // Food categories
  cat_snacks: { bg:"Снаксове и чипс", hr:"Grickalice i čips", cs:"Svačinky a chipsy", da:"Snacks og chips", nl:"Snacks & chips", en:"Snacks & Chips", et:"Suupisted ja krõpsud", fi:"Naposteltavat ja perunalastut", fr:"Snacks et chips", de:"Snacks & Chips", el:"Σνακ και πατατάκια", hu:"Rágcsálnivalók és chips", ga:"Sneaic agus brioscáin", it:"Snack e patatine", lv:"Uzkodas un čipsi", lt:"Užkandžiai ir traškučiai", mt:"Snacks u chips", pl:"Przekąski i chipsy", pt:"Snacks e batatas fritas", ro:"Gustări și chipsuri", sk:"Desiaty a čipsy", sl:"Prigrizki in čips", es:"Aperitivos y patatas fritas", sv:"Snacks och chips" },
  cat_grains: { bg:"Паста, ориз и зърнени храни", hr:"Tjestenina, riža i žitarice", cs:"Těstoviny, rýže a cereálie", da:"Pasta, ris og morgenmadsprodukter", nl:"Pasta, rijst en graanproducten", en:"Pasta, Rice & Cereal", et:"Pasta, riis ja teraviljatooted", fi:"Pasta, riisi ja murot", fr:"Pâtes, riz et céréales", de:"Nudeln, Reis & Getreide", el:"Ζυμαρικά, ρύζι και δημητριακά", hu:"Tészta, rizs és gabonapehely", ga:"Pasta, rís agus gránach", it:"Pasta, riso e cereali", lv:"Makaroni, rīsi un labība", lt:"Makaronai, ryžiai ir dribsniai", mt:"Pasta, ross u ċereali", pl:"Makaron, ryż i płatki zbożowe", pt:"Massa, arroz e cereais", ro:"Paste, orez și cereale", sk:"Cestoviny, ryža a cereálie", sl:"Testenine, riž in žita", es:"Pasta, arroz y cereales", sv:"Pasta, ris och flingor" },
  cat_canned: { bg:"Консерви и буркани", hr:"Konzervirana hrana", cs:"Konzervy a zavařeniny", da:"Dåsevarer og henkogt", nl:"Blik- en potconserven", en:"Canned & Jarred Goods", et:"Konserv- ja purgitooted", fi:"Säilykkeet", fr:"Conserves et bocaux", de:"Konserven & Eingemachtes", el:"Κονσέρβες", hu:"Konzervek és befőttek", ga:"Earraí stánaithe", it:"Scatolame e conserve", lv:"Konservi", lt:"Konservai", mt:"Ikel fil-landa", pl:"Konserwy i przetwory", pt:"Enlatados e conservas", ro:"Conserve", sk:"Konzervy", sl:"Konzervirana hrana", es:"Conservas", sv:"Konserver" },
  cat_baking: { bg:"Печене и подправки", hr:"Pečenje i začini", cs:"Pečení a koření", da:"Bagning og krydderier", nl:"Bakken en kruiden", en:"Baking & Spices", et:"Küpsetamine ja maitseained", fi:"Leivonta ja mausteet", fr:"Pâtisserie et épices", de:"Backen & Gewürze", el:"Ζαχαροπλαστική και μπαχαρικά", hu:"Sütés és fűszerek", ga:"Bácáil agus spíosraí", it:"Prodotti da forno e spezie", lv:"Cepšana un garšvielas", lt:"Kepimas ir prieskoniai", mt:"Ħami u ħwawar", pl:"Wypieki i przyprawy", pt:"Pastelaria e especiarias", ro:"Copt și condimente", sk:"Pečenie a korenie", sl:"Peka in začimbe", es:"Repostería y especias", sv:"Bakning och kryddor" },
  cat_bread: { bg:"Хляб и печива", hr:"Kruh i pekarski proizvodi", cs:"Pečivo", da:"Brød og bagværk", nl:"Brood en bakkerij", en:"Bread & Bakery", et:"Leib ja pagaritooted", fi:"Leipä ja leivonnaiset", fr:"Pain et boulangerie", de:"Brot & Backwaren", el:"Ψωμί και αρτοποιήματα", hu:"Kenyér és pékáru", ga:"Arán agus bácús", it:"Pane e prodotti da forno", lv:"Maize un konditorejas izstrādājumi", lt:"Duona ir kepiniai", mt:"Ħobż u għaġin", pl:"Pieczywo", pt:"Pão e padaria", ro:"Pâine și produse de panificație", sk:"Pečivo", sl:"Kruh in pekovski izdelki", es:"Pan y bollería", sv:"Bröd och bageri" },
  cat_dairy: { bg:"Млечни продукти и яйца", hr:"Mliječni proizvodi i jaja", cs:"Mléčné výrobky a vejce", da:"Mejeriprodukter og æg", nl:"Zuivel en eieren", en:"Dairy & Eggs", et:"Piimatooted ja munad", fi:"Maitotuotteet ja munat", fr:"Produits laitiers et œufs", de:"Milchprodukte & Eier", el:"Γαλακτοκομικά και αυγά", hu:"Tejtermékek és tojás", ga:"Táirgí déiríochta agus uibheacha", it:"Latticini e uova", lv:"Piena produkti un olas", lt:"Pieno produktai ir kiaušiniai", mt:"Prodotti tal-ħalib u bajd", pl:"Nabiał i jajka", pt:"Laticínios e ovos", ro:"Lactate și ouă", sk:"Mliečne výrobky a vajcia", sl:"Mlečni izdelki in jajca", es:"Lácteos y huevos", sv:"Mejeriprodukter och ägg" },
  cat_produce: { bg:"Пресни плодове и зеленчуци", hr:"Svježe voće i povrće", cs:"Čerstvé ovoce a zelenina", da:"Friske råvarer", nl:"Verse groenten en fruit", en:"Fresh Produce", et:"Värsked puu- ja juurviljad", fi:"Tuoretuotteet", fr:"Fruits et légumes frais", de:"Frisches Obst & Gemüse", el:"Φρέσκα προϊόντα", hu:"Friss zöldség és gyümölcs", ga:"Táirgí úra", it:"Frutta e verdura fresca", lv:"Svaigi augļi un dārzeņi", lt:"Švieži vaisiai ir daržovės", mt:"Frott u ħaxix frisk", pl:"Świeże warzywa i owoce", pt:"Produtos frescos", ro:"Fructe și legume proaspete", sk:"Čerstvé ovocie a zelenina", sl:"Sveža zelenjava in sadje", es:"Frutas y verduras frescas", sv:"Färska råvaror" },
  cat_meat_fresh: { bg:"Прясно месо и риба", hr:"Svježe meso i riba", cs:"Čerstvé maso a ryby", da:"Frisk kød og fisk", nl:"Verse vlees en vis", en:"Fresh Meat & Fish", et:"Värske liha ja kala", fi:"Tuore liha ja kala", fr:"Viande et poisson frais", de:"Frisches Fleisch & Fisch", el:"Φρέσκο κρέας και ψάρι", hu:"Friss hús és hal", ga:"Feoil agus iasc úr", it:"Carne e pesce freschi", lv:"Svaiga gaļa un zivis", lt:"Šviežia mėsa ir žuvis", mt:"Laħam u ħut frisk", pl:"Świeże mięso i ryby", pt:"Carne e peixe frescos", ro:"Carne și pește proaspăt", sk:"Čerstvé mäso a ryby", sl:"Sveže meso in ribe", es:"Carne y pescado frescos", sv:"Färskt kött och fisk" },
  cat_condiments: { bg:"Подправки и сосове", hr:"Začini i umaci", cs:"Koření a omáčky", da:"Krydderier og saucer", nl:"Kruiden en sauzen", en:"Condiments & Sauces", et:"Maitseained ja kastmed", fi:"Mausteet ja kastikkeet", fr:"Condiments et sauces", de:"Gewürze & Saucen", el:"Καρυκεύματα και σάλτσες", hu:"Fűszerek és szószok", ga:"Anlainn agus sáis", it:"Condimenti e salse", lv:"Garšvielas un mērces", lt:"Prieskoniai ir padažai", mt:"Kondimenti u zlazi", pl:"Przyprawy i sosy", pt:"Condimentos e molhos", ro:"Condimente și sosuri", sk:"Koreniny a omáčky", sl:"Začimbe in omake", es:"Condimentos y salsas", sv:"Kryddor och såser" },
  cat_beverages: { bg:"Напитки", hr:"Pića", cs:"Nápoje", da:"Drikkevarer", nl:"Dranken", en:"Beverages", et:"Joogid", fi:"Juomat", fr:"Boissons", de:"Getränke", el:"Ροφήματα", hu:"Italok", ga:"Deochanna", it:"Bevande", lv:"Dzērieni", lt:"Gėrimai", mt:"Xorb", pl:"Napoje", pt:"Bebidas", ro:"Băuturi", sk:"Nápoje", sl:"Pijače", es:"Bebidas", sv:"Drycker" },
  cat_leftovers: { bg:"Остатъци от храна", hr:"Ostaci hrane", cs:"Zbytky jídla", da:"Rester", nl:"Restjes", en:"Leftovers", et:"Ülejäägid", fi:"Tähteet", fr:"Restes", de:"Reste", el:"Υπολείμματα φαγητού", hu:"Maradékok", ga:"Fuílleach bia", it:"Avanzi", lv:"Ēdiena atlikumi", lt:"Likučiai", mt:"Fdal ta' ikel", pl:"Resztki jedzenia", pt:"Sobras", ro:"Resturi", sk:"Zvyšky jedla", sl:"Ostanki hrane", es:"Sobras", sv:"Rester" },
  cat_frozen_veg: { bg:"Замразени зеленчуци и плодове", hr:"Smrznuto povrće i voće", cs:"Mražená zelenina a ovoce", da:"Frosne grøntsager og frugt", nl:"Diepvriesgroenten en -fruit", en:"Frozen Vegetables & Fruit", et:"Külmutatud köögi- ja puuviljad", fi:"Pakastevihannekset ja -hedelmät", fr:"Légumes et fruits surgelés", de:"Tiefkühlgemüse & -obst", el:"Κατεψυγμένα λαχανικά και φρούτα", hu:"Fagyasztott zöldség és gyümölcs", ga:"Glasraí agus torthaí reoite", it:"Verdura e frutta surgelata", lv:"Saldēti dārzeņi un augļi", lt:"Šaldytos daržovės ir vaisiai", mt:"Ħaxix u frott iffriżat", pl:"Mrożone warzywa i owoce", pt:"Vegetais e frutas congelados", ro:"Legume și fructe congelate", sk:"Mrazená zelenina a ovocie", sl:"Zamrznjena zelenjava in sadje", es:"Verduras y frutas congeladas", sv:"Frysta grönsaker och frukt" },
  cat_frozen_meat: { bg:"Замразено месо и риба", hr:"Smrznuto meso i riba", cs:"Mražené maso a ryby", da:"Frosset kød og fisk", nl:"Diepvriesvlees en -vis", en:"Frozen Meat & Fish", et:"Külmutatud liha ja kala", fi:"Pakasteliha ja -kala", fr:"Viande et poisson surgelés", de:"Tiefkühlfleisch & -fisch", el:"Κατεψυγμένο κρέας και ψάρι", hu:"Fagyasztott hús és hal", ga:"Feoil agus iasc reoite", it:"Carne e pesce surgelati", lv:"Saldēta gaļa un zivis", lt:"Šaldyta mėsa ir žuvis", mt:"Laħam u ħut iffriżat", pl:"Mrożone mięso i ryby", pt:"Carne e peixe congelados", ro:"Carne și pește congelat", sk:"Mrazené mäso a ryby", sl:"Zamrznjeno meso in ribe", es:"Carne y pescado congelados", sv:"Fryst kött och fisk" },
  cat_frozen_meals: { bg:"Замразени готови ястия и сладолед", hr:"Smrznuta gotova jela i sladoled", cs:"Mražená jídla a zmrzlina", da:"Frostretter og is", nl:"Diepvriesmaaltijden en ijs", en:"Frozen Meals & Ice Cream", et:"Külmutatud toidud ja jäätis", fi:"Pakasteateriat ja jäätelö", fr:"Plats surgelés et glaces", de:"Fertiggerichte & Eis", el:"Κατεψυγμένα γεύματα και παγωτό", hu:"Fagyasztott ételek és fagylalt", ga:"Béilí reoite agus uachtar reoite", it:"Piatti pronti surgelati e gelato", lv:"Saldēti ēdieni un saldējums", lt:"Šaldyti patiekalai ir ledai", mt:"Ikliet iffriżati u ġelat", pl:"Dania mrożone i lody", pt:"Refeições congeladas e gelado", ro:"Mâncăruri congelate și înghețată", sk:"Mrazené jedlá a zmrzlina", sl:"Zamrznjeni obroki in sladoled", es:"Platos congelados y helado", sv:"Fryst mat och glass" },

  // Tool categories
  tcat_hand: { bg:"Ръчни инструменти", hr:"Ručni alati", cs:"Ruční nářadí", da:"Håndværktøj", nl:"Handgereedschap", en:"Hand tools", et:"Käsitööriistad", fi:"Käsityökalut", fr:"Outils à main", de:"Handwerkzeug", el:"Χειροκίνητα εργαλεία", hu:"Kéziszerszámok", ga:"Uirlisí láimhe", it:"Utensili manuali", lv:"Rokas instrumenti", lt:"Rankiniai įrankiai", mt:"Għodda tal-idejn", pl:"Narzędzia ręczne", pt:"Ferramentas manuais", ro:"Unelte manuale", sk:"Ručné náradie", sl:"Ročno orodje", es:"Herramientas manuales", sv:"Handverktyg" },
  tcat_power: { bg:"Електроинструменти", hr:"Električni alati", cs:"Elektrické nářadí", da:"Elværktøj", nl:"Elektrisch gereedschap", en:"Power tools", et:"Elektritööriistad", fi:"Sähkötyökalut", fr:"Outils électriques", de:"Elektrowerkzeug", el:"Ηλεκτρικά εργαλεία", hu:"Elektromos szerszámok", ga:"Uirlisí cumhachta", it:"Utensili elettrici", lv:"Elektroinstrumenti", lt:"Elektriniai įrankiai", mt:"Għodda bl-elettriku", pl:"Elektronarzędzia", pt:"Ferramentas elétricas", ro:"Unelte electrice", sk:"Elektrické náradie", sl:"Električno orodje", es:"Herramientas eléctricas", sv:"Elverktyg" },
  tcat_painting: { bg:"Боядисване", hr:"Bojanje", cs:"Malování", da:"Maling", nl:"Schilderen", en:"Painting", et:"Värvimine", fi:"Maalaus", fr:"Peinture", de:"Malerarbeiten", el:"Βαφή", hu:"Festés", ga:"Péintéireacht", it:"Pittura", lv:"Krāsošana", lt:"Dažymas", mt:"Żebgħa", pl:"Malowanie", pt:"Pintura", ro:"Vopsire", sk:"Maľovanie", sl:"Slikanje", es:"Pintura", sv:"Målning" },
  tcat_plumbing: { bg:"Водопровод", hr:"Vodoinstalacije", cs:"Instalatérství", da:"VVS", nl:"Loodgieterswerk", en:"Plumbing", et:"Torutööd", fi:"Putkityöt", fr:"Plomberie", de:"Sanitär", el:"Υδραυλικά", hu:"Vízvezeték-szerelés", ga:"Pluiméireacht", it:"Idraulica", lv:"Santehnika", lt:"Santechnika", mt:"Plumbing", pl:"Hydraulika", pt:"Canalização", ro:"Instalații sanitare", sk:"Vodoinštalácia", sl:"Vodovodne inštalacije", es:"Fontanería", sv:"VVS" },
  tcat_electrical: { bg:"Електричество", hr:"Električarski radovi", cs:"Elektrikářské práce", da:"El-arbejde", nl:"Elektra", en:"Electrical", et:"Elektritööd", fi:"Sähkötyöt", fr:"Électricité", de:"Elektrik", el:"Ηλεκτρολογικά", hu:"Elektromos munkák", ga:"Leictreachas", it:"Elettricità", lv:"Elektrība", lt:"Elektros darbai", mt:"Elettriku", pl:"Elektryka", pt:"Elétrica", ro:"Electricitate", sk:"Elektrikárske práce", sl:"Električna dela", es:"Electricidad", sv:"Elarbete" },
  tcat_garden: { bg:"Градина", hr:"Vrt", cs:"Zahrada", da:"Have", nl:"Tuin", en:"Garden", et:"Aed", fi:"Puutarha", fr:"Jardin", de:"Garten", el:"Κήπος", hu:"Kert", ga:"Gairdín", it:"Giardino", lv:"Dārzs", lt:"Sodas", mt:"Ġnien", pl:"Ogród", pt:"Jardim", ro:"Grădină", sk:"Záhrada", sl:"Vrt", es:"Jardín", sv:"Trädgård" },
  tcat_safety: { bg:"Безопасност и достъп", hr:"Sigurnost i pristup", cs:"Bezpečnost a přístup", da:"Sikkerhed og adgang", nl:"Veiligheid en toegang", en:"Safety & access", et:"Ohutus ja ligipääs", fi:"Turvallisuus ja tikkaat", fr:"Sécurité et accès", de:"Sicherheit & Zugang", el:"Ασφάλεια και πρόσβαση", hu:"Biztonság és hozzáférés", ga:"Sábháilteacht agus rochtain", it:"Sicurezza e accesso", lv:"Drošība un piekļuve", lt:"Sauga ir prieiga", mt:"Sikurezza u aċċess", pl:"Bezpieczeństwo i dostęp", pt:"Segurança e acesso", ro:"Siguranță și acces", sk:"Bezpečnosť a prístup", sl:"Varnost in dostop", es:"Seguridad y acceso", sv:"Säkerhet och åtkomst" },

  // Clothing categories
  ccat_tops: { bg:"Горнища", hr:"Majice i gornji dio", cs:"Trička a halenky", da:"Overdele", nl:"Bovenkleding", en:"Tops", et:"Pealisrõivad", fi:"Yläosat", fr:"Hauts", de:"Oberteile", el:"Πάνω μέρη", hu:"Felsők", ga:"Bairr", it:"Top", lv:"Augšdrēbes", lt:"Viršutiniai drabužiai", mt:"Ħwejjeġ ta' fuq", pl:"Góry", pt:"Partes de cima", ro:"Bluze", sk:"Vrchné diely", sl:"Zgornji deli", es:"Partes de arriba", sv:"Överdelar" },
  ccat_bottoms: { bg:"Долнища", hr:"Donji dio", cs:"Kalhoty a sukně", da:"Underdele", nl:"Onderkleding", en:"Bottoms", et:"Alusrõivad", fi:"Alaosat", fr:"Bas", de:"Unterteile", el:"Κάτω μέρη", hu:"Alsók", ga:"Bunanna", it:"Pantaloni e gonne", lv:"Bikses un svārki", lt:"Kelnės ir sijonai", mt:"Ħwejjeġ t'isfel", pl:"Doły", pt:"Partes de baixo", ro:"Pantaloni și fuste", sk:"Spodné diely", sl:"Spodnji deli", es:"Partes de abajo", sv:"Underdelar" },
  ccat_outerwear: { bg:"Връхни дрехи", hr:"Vanjska odjeća", cs:"Svrchní oděvy", da:"Yderbeklædning", nl:"Buitenkleding", en:"Outerwear", et:"Välisriided", fi:"Ulkovaatteet", fr:"Vêtements d'extérieur", de:"Oberbekleidung", el:"Ρούχα εξωτερικού χώρου", hu:"Felsőruházat", ga:"Éadaí seachtracha", it:"Capispalla", lv:"Virsdrēbes", lt:"Viršutiniai apdarai", mt:"Ilbies ta' barra", pl:"Odzież wierzchnia", pt:"Casacos", ro:"Îmbrăcăminte exterioară", sk:"Vrchné odevy", sl:"Vrhnja oblačila", es:"Abrigos", sv:"Ytterkläder" },
  ccat_dresses: { bg:"Рокли", hr:"Haljine", cs:"Šaty", da:"Kjoler", nl:"Jurken", en:"Dresses", et:"Kleidid", fi:"Mekot", fr:"Robes", de:"Kleider", el:"Φορέματα", hu:"Ruhák", ga:"Gúnaí", it:"Vestiti", lv:"Kleitas", lt:"Suknelės", mt:"Ilbiesi", pl:"Sukienki", pt:"Vestidos", ro:"Rochii", sk:"Šaty", sl:"Obleke", es:"Vestidos", sv:"Klänningar" },
  ccat_shoes: { bg:"Обувки", hr:"Obuća", cs:"Boty", da:"Sko", nl:"Schoenen", en:"Shoes", et:"Jalatsid", fi:"Kengät", fr:"Chaussures", de:"Schuhe", el:"Παπούτσια", hu:"Cipők", ga:"Bróga", it:"Scarpe", lv:"Apavi", lt:"Batai", mt:"Żraben", pl:"Buty", pt:"Sapatos", ro:"Încălțăminte", sk:"Topánky", sl:"Čevlji", es:"Zapatos", sv:"Skor" },
  ccat_accessories: { bg:"Аксесоари", hr:"Modni dodaci", cs:"Doplňky", da:"Accessories", nl:"Accessoires", en:"Accessories", et:"Aksessuaarid", fi:"Asusteet", fr:"Accessoires", de:"Accessoires", el:"Αξεσουάρ", hu:"Kiegészítők", ga:"Feistis", it:"Accessori", lv:"Aksesuāri", lt:"Aksesuarai", mt:"Aċċessorji", pl:"Dodatki", pt:"Acessórios", ro:"Accesorii", sk:"Doplnky", sl:"Dodatki", es:"Accesorios", sv:"Accessoarer" },

  // Tool names
  tool_drill: { bg:"Бормашина", hr:"Bušilica", cs:"Vrtačka", da:"Boremaskine", nl:"Boormachine", en:"Drill", et:"Trell", fi:"Pora", fr:"Perceuse", de:"Bohrmaschine", el:"Δράπανο", hu:"Fúrógép", ga:"Druilire", it:"Trapano", lv:"Urbjmašīna", lt:"Gręžtuvas", mt:"Tħaffira", pl:"Wiertarka", pt:"Berbequim", ro:"Bormașină", sk:"Vŕtačka", sl:"Vrtalnik", es:"Taladro", sv:"Borrmaskin" },
  tool_screwdriver: { bg:"Отвертка", hr:"Odvijač", cs:"Šroubovák", da:"Skruetrækker", nl:"Schroevendraaier", en:"Screwdriver", et:"Kruvikeeraja", fi:"Ruuvimeisseli", fr:"Tournevis", de:"Schraubenzieher", el:"Κατσαβίδι", hu:"Csavarhúzó", ga:"Scriúire", it:"Cacciavite", lv:"Skrūvgriezis", lt:"Atsuktuvas", mt:"Cacciavit", pl:"Śrubokręt", pt:"Chave de fendas", ro:"Șurubelniță", sk:"Skrutkovač", sl:"Izvijač", es:"Destornillador", sv:"Skruvmejsel" },
  tool_level: { bg:"Нивелир", hr:"Libela", cs:"Vodováha", da:"Vaterpas", nl:"Waterpas", en:"Level", et:"Loodimõõdik", fi:"Vesivaaka", fr:"Niveau", de:"Wasserwaage", el:"Αλφάδι", hu:"Vízmérték", ga:"Leibhéal", it:"Livella", lv:"Līmeņrādis", lt:"Gulsčiukas", mt:"Livella", pl:"Poziomica", pt:"Nível", ro:"Nivelă", sk:"Vodováha", sl:"Vodna tehtnica", es:"Nivel", sv:"Vattenpass" },
  tool_tape_measure: { bg:"Ролетка", hr:"Metar", cs:"Svinovací metr", da:"Målebånd", nl:"Rolmaat", en:"Tape measure", et:"Mõõdulint", fi:"Mittanauha", fr:"Mètre ruban", de:"Maßband", el:"Μεζούρα", hu:"Mérőszalag", ga:"Ribín tomhais", it:"Metro a nastro", lv:"Mērlente", lt:"Ruletė", mt:"Metru tal-mira", pl:"Miara zwijana", pt:"Fita métrica", ro:"Ruletă", sk:"Zvinovací meter", sl:"Merilni trak", es:"Cinta métrica", sv:"Måttband" },
  tool_wall_anchors: { bg:"Дюбели", hr:"Tipli", cs:"Hmoždinky", da:"Rawlplugs", nl:"Pluggen", en:"Wall anchors", et:"Tüüblid", fi:"Seinätulpat", fr:"Chevilles murales", de:"Dübel", el:"Ούπα", hu:"Tipli", ga:"Ancairí balla", it:"Tasselli", lv:"Sienas dībeļi", lt:"Sieniniai kaiščiai", mt:"Ankri tal-ħajt", pl:"Kołki rozporowe", pt:"Buchas de parede", ro:"Dibluri", sk:"Hmoždinky", sl:"Zidni vložki", es:"Tacos de pared", sv:"Väggpluggar" },
  tool_adjustable_wrench: { bg:"Френски ключ", hr:"Francuski ključ", cs:"Francouzský klíč", da:"Svensknøgle", nl:"Bahco-sleutel", en:"Adjustable wrench", et:"Reguleeritav mutrivõti", fi:"Jakoavain", fr:"Clé à molette", de:"Rollgabelschlüssel", el:"Γαλλικό κλειδί", hu:"Franciakulcs", ga:"Rinse inchoigeartaithe", it:"Chiave inglese", lv:"Regulējamā uzgriežņu atslēga", lt:"Reguliuojamas veržliaraktis", mt:"Chiave Inglisa", pl:"Klucz nastawny", pt:"Chave inglesa", ro:"Cheie reglabilă", sk:"Francúzsky kľúč", sl:"Francoski ključ", es:"Llave inglesa", sv:"Skiftnyckel" },
  tool_plumbers_tape: { bg:"Тефлонова лента", hr:"Teflonska traka", cs:"Teflonová páska", da:"Teflontape", nl:"Teflontape", en:"Plumber's tape", et:"Teflonlint", fi:"Teflonteippi", fr:"Ruban téflon", de:"Teflonband", el:"Ταινία τεφλόν", hu:"Teflonszalag", ga:"Téip phlaimbéara", it:"Nastro teflon", lv:"Teflona lente", lt:"Teflono juosta", mt:"Tejp tal-plamber", pl:"Taśma teflonowa", pt:"Fita veda-roscas", ro:"Bandă de teflon", sk:"Teflónová páska", sl:"Teflonski trak", es:"Cinta de teflón", sv:"Teflontejp" },
  tool_bucket: { bg:"Кофа", hr:"Kanta", cs:"Kbelík", da:"Spand", nl:"Emmer", en:"Bucket", et:"Ämber", fi:"Ämpäri", fr:"Seau", de:"Eimer", el:"Κουβάς", hu:"Vödör", ga:"Buicéad", it:"Secchio", lv:"Spainis", lt:"Kibiras", mt:"Bramla", pl:"Wiadro", pt:"Balde", ro:"Găleată", sk:"Vedro", sl:"Vedro", es:"Cubo", sv:"Hink" },
  tool_paint_roller: { bg:"Валяк за боядисване", hr:"Valjak za bojanje", cs:"Malířský váleček", da:"Malerrulle", nl:"Verfroller", en:"Paint roller", et:"Värvirull", fi:"Maalitela", fr:"Rouleau à peinture", de:"Farbroller", el:"Ρολό βαφής", hu:"Festőhenger", ga:"Rollóir péinte", it:"Rullo per vernice", lv:"Krāsas veltnis", lt:"Dažymo velenėlis", mt:"Rombla taż-żebgħa", pl:"Wałek malarski", pt:"Rolo de pintura", ro:"Trafalet", sk:"Maliarsky valček", sl:"Slikarski valj", es:"Rodillo de pintura", sv:"Målarrulle" },
  tool_paint_brush: { bg:"Четка за боядисване", hr:"Kist za bojanje", cs:"Malířský štětec", da:"Malerpensel", nl:"Verfkwast", en:"Paint brush", et:"Värvipintsel", fi:"Maalisivellin", fr:"Pinceau", de:"Pinsel", el:"Πινέλο", hu:"Festőecset", ga:"Scuab péinte", it:"Pennello", lv:"Krāsošanas ota", lt:"Dažymo šepetys", mt:"Pinzell taż-żebgħa", pl:"Pędzel", pt:"Pincel", ro:"Pensulă", sk:"Maliarska štetka", sl:"Slikarski čopič", es:"Brocha", sv:"Målarpensel" },
  tool_painters_tape: { bg:"Хартиено тиксо", hr:"Slikarska traka", cs:"Malířská páska", da:"Malertape", nl:"Schildertape", en:"Painter's tape", et:"Maalriteip", fi:"Maalarinteippi", fr:"Ruban de masquage", de:"Malerkrepp", el:"Χαρτοταινία", hu:"Festőszalag", ga:"Téip phéintéara", it:"Nastro carta", lv:"Krāsotāju lente", lt:"Dažytojo juosta", mt:"Tejp tal-pittur", pl:"Taśma malarska", pt:"Fita de pintor", ro:"Bandă de mascare", sk:"Maliarska páska", sl:"Slikarski trak", es:"Cinta de pintor", sv:"Maskeringstejp" },
  tool_drop_cloth: { bg:"Покривало", hr:"Zaštitna cerada", cs:"Ochranná plachta", da:"Malerdug", nl:"Afdekzeil", en:"Drop cloth", et:"Kaitsekate", fi:"Suojapeite", fr:"Bâche de protection", de:"Abdeckplane", el:"Προστατευτικό ύφασμα", hu:"Védőponyva", ga:"Éadach cosanta", it:"Telo protettivo", lv:"Aizsargpārklājs", lt:"Apsauginė medžiaga", mt:"Għata ta' protezzjoni", pl:"Folia malarska", pt:"Pano de proteção", ro:"Prelată de protecție", sk:"Ochranná plachta", sl:"Zaščitna folija", es:"Lona protectora", sv:"Skyddsduk" },
  tool_ladder: { bg:"Стълба", hr:"Ljestve", cs:"Žebřík", da:"Stige", nl:"Ladder", en:"Ladder", et:"Redel", fi:"Tikkaat", fr:"Échelle", de:"Leiter", el:"Σκάλα", hu:"Létra", ga:"Dréimire", it:"Scala", lv:"Kāpnes", lt:"Kopėčios", mt:"Sellum", pl:"Drabina", pt:"Escada", ro:"Scară", sk:"Rebrík", sl:"Lestev", es:"Escalera", sv:"Stege" },
  tool_allen_key_set: { bg:"Комплект имбусни ключове", hr:"Imbus ključevi", cs:"Imbusové klíče", da:"Unbrakonøgler", nl:"Inbussleutels", en:"Allen key set", et:"Kuuskantvõtmed", fi:"Kuusiokoloavaimet", fr:"Clés Allen", de:"Inbusschlüssel-Set", el:"Κλειδιά Άλεν", hu:"Imbuszkulcs-készlet", ga:"Sraith eochracha Allen", it:"Set di chiavi a brugola", lv:"Sešstūra atslēgu komplekts", lt:"Šešiabriaunių raktų rinkinys", mt:"Sett ta' Allen keys", pl:"Klucze imbusowe", pt:"Chaves Allen", ro:"Set chei Allen", sk:"Imbusové kľúče", sl:"Imbus ključi", es:"Juego de llaves Allen", sv:"Insexnycklar" },
  tool_rubber_mallet: { bg:"Гумен чук", hr:"Gumeni čekić", cs:"Gumová palice", da:"Gummihammer", nl:"Rubberen hamer", en:"Rubber mallet", et:"Kummihaamer", fi:"Kumivasara", fr:"Maillet en caoutchouc", de:"Gummihammer", el:"Λαστιχένιο σφυρί", hu:"Gumikalapács", ga:"Casúr rubair", it:"Mazzuolo di gomma", lv:"Gumijas āmurs", lt:"Guminis kūjis", mt:"Martell tal-lastku", pl:"Młotek gumowy", pt:"Maço de borracha", ro:"Ciocan de cauciuc", sk:"Gumené kladivo", sl:"Gumeno kladivo", es:"Mazo de goma", sv:"Gummiklubba" },
  tool_jack: { bg:"Крик", hr:"Dizalica", cs:"Zvedák", da:"Donkraft", nl:"Krik", en:"Jack", et:"Tungraud", fi:"Tunkki", fr:"Cric", de:"Wagenheber", el:"Γρύλος", hu:"Emelő", ga:"Seac", it:"Cric", lv:"Domkrats", lt:"Domkratas", mt:"Jack", pl:"Podnośnik", pt:"Macaco", ro:"Cric", sk:"Zdvihák", sl:"Dvigalo", es:"Gato", sv:"Domkraft" },
  tool_lug_wrench: { bg:"Кръстат ключ", hr:"Ključ za kotače", cs:"Klíč na kola", da:"Fælgnøgle", nl:"Wielsleutel", en:"Lug wrench", et:"Rattavõti", fi:"Vanneavain", fr:"Clé en croix", de:"Radkreuz", el:"Κλειδί τροχών", hu:"Keréktőkulcs", ga:"Rinse rotha", it:"Chiave a croce", lv:"Riteņu atslēga", lt:"Ratų raktas", mt:"Chiave tar-roti", pl:"Klucz do kół", pt:"Chave de rodas", ro:"Cheie roți", sk:"Kľúč na kolesá", sl:"Križni ključ", es:"Llave de ruedas", sv:"Fälgkors" },
  tool_tire_gauge: { bg:"Манометър за гуми", hr:"Mjerač tlaka guma", cs:"Tlakoměr na pneumatiky", da:"Dæktryksmåler", nl:"Bandenspanningsmeter", en:"Tire pressure gauge", et:"Rehvirõhumõõtja", fi:"Rengaspainemittari", fr:"Manomètre de pneu", de:"Reifendruckmesser", el:"Μετρητής πίεσης ελαστικών", hu:"Gumiabroncs-nyomásmérő", ga:"Gásmhéadar bonn", it:"Manometro per pneumatici", lv:"Riepu spiediena mērītājs", lt:"Padangų slėgio matuoklis", mt:"Mkejjel tal-pressjoni tat-tajers", pl:"Manometr do opon", pt:"Medidor de pressão dos pneus", ro:"Manometru anvelope", sk:"Tlakomer na pneumatiky", sl:"Merilnik tlaka v pnevmatikah", es:"Manómetro de neumáticos", sv:"Däcktrycksmätare" },
  tool_voltage_tester: { bg:"Тестер за напрежение", hr:"Ispitivač napona", cs:"Zkoušečka napětí", da:"Spændingstester", nl:"Spanningstester", en:"Voltage tester", et:"Pingetestija", fi:"Jännitteenkoetin", fr:"Testeur de tension", de:"Spannungsprüfer", el:"Δοκιμαστικό τάσης", hu:"Feszültségmérő", ga:"Tástálaí voltas", it:"Tester di tensione", lv:"Sprieguma testeris", lt:"Įtampos testeris", mt:"Tester tal-vultaġġ", pl:"Tester napięcia", pt:"Testador de tensão", ro:"Tester de tensiune", sk:"Skúšačka napätia", sl:"Preizkuševalnik napetosti", es:"Probador de voltaje", sv:"Spänningsprovare" },
  tool_wire_strippers: { bg:"Клещи за оголване", hr:"Kliješta za skidanje izolacije", cs:"Odizolovací kleště", da:"Afisoleringstang", nl:"Striptang", en:"Wire strippers", et:"Isolatsioonieemaldustangid", fi:"Kuorimapihdit", fr:"Pince à dénuder", de:"Abisolierzange", el:"Πένσα απογύμνωσης καλωδίων", hu:"Kábellehúzó fogó", ga:"Stiallairí sreinge", it:"Pinza spellafili", lv:"Izolācijas noņemšanas knaibles", lt:"Izoliacijos nuėmimo replės", mt:"Pinzi għall-iżolament", pl:"Szczypce do zdejmowania izolacji", pt:"Alicate de descascar fios", ro:"Cleşte de dezizolat", sk:"Odizolovacie kliešte", sl:"Klešče za odstranjevanje izolacije", es:"Alicates pelacables", sv:"Skalningstång" },
  tool_electrical_tape: { bg:"Изолирбанд", hr:"Izolir traka", cs:"Izolepa", da:"Isoleringstape", nl:"Isolatietape", en:"Electrical tape", et:"Isolatsiooniteip", fi:"Eristysteippi", fr:"Ruban isolant", de:"Isolierband", el:"Μονωτική ταινία", hu:"Szigetelőszalag", ga:"Téip leictreach", it:"Nastro isolante", lv:"Izolācijas lente", lt:"Izoliacinė juosta", mt:"Tejp elettriku", pl:"Taśma izolacyjna", pt:"Fita isolante", ro:"Bandă izolatoare", sk:"Izolačná páska", sl:"Izolirni trak", es:"Cinta aislante", sv:"Isoleringstejp" },

  // Job names
  job_shelf: { bg:"Окачване на рафт", hr:"Vješanje police", cs:"Pověšení police", da:"Ophængning af hylde", nl:"Een plank ophangen", en:"Hang a shelf", et:"Riiuli üles panemine", fi:"Hyllyn ripustus", fr:"Accrocher une étagère", de:"Ein Regal aufhängen", el:"Κρέμασμα ραφιού", hu:"Polc felszerelése", ga:"Seilf a chrochadh", it:"Appendere una mensola", lv:"Plaukta piestiprināšana", lt:"Lentynos pakabinimas", mt:"Tqiegħed xkaffa", pl:"Powieszenie półki", pt:"Pendurar uma prateleira", ro:"Montarea unui raft", sk:"Zavesenie police", sl:"Obešanje police", es:"Colgar una balda", sv:"Hänga upp en hylla" },
  job_faucet: { bg:"Ремонт на течащ кран", hr:"Popravak curenja slavine", cs:"Oprava kapajícího kohoutku", da:"Reparation af utæt vandhane", nl:"Lekkende kraan repareren", en:"Fix a leaky faucet", et:"Lekkiva kraani parandamine", fi:"Vuotavan hanan korjaus", fr:"Réparer un robinet qui fuit", de:"Einen tropfenden Wasserhahn reparieren", el:"Επισκευή βρύσης που στάζει", hu:"Csöpögő csap javítása", ga:"Sconna atá ag sceitheadh a dheisiú", it:"Riparare un rubinetto che perde", lv:"Tekoša krāna remonts", lt:"Varvančio čiaupo remontas", mt:"Tiswija ta' vjol li jnixxi", pl:"Naprawa cieknącego kranu", pt:"Reparar uma torneira a pingar", ro:"Repararea unui robinet care curge", sk:"Oprava tečúceho kohútika", sl:"Popravilo puščajoče pipe", es:"Reparar un grifo que gotea", sv:"Laga en droppande kran" },
  job_paint: { bg:"Боядисване на стая", hr:"Bojanje sobe", cs:"Malování pokoje", da:"Maling af et rum", nl:"Een kamer schilderen", en:"Paint a room", et:"Toa värvimine", fi:"Huoneen maalaus", fr:"Peindre une pièce", de:"Ein Zimmer streichen", el:"Βαφή δωματίου", hu:"Szoba festése", ga:"Seomra a phéinteáil", it:"Dipingere una stanza", lv:"Istabas krāsošana", lt:"Kambario dažymas", mt:"Iżebbaħ kamra", pl:"Malowanie pokoju", pt:"Pintar uma divisão", ro:"Vopsirea unei camere", sk:"Maľovanie izby", sl:"Slikanje sobe", es:"Pintar una habitación", sv:"Måla ett rum" },
  job_furniture: { bg:"Сглобяване на мебели", hr:"Sastavljanje namještaja", cs:"Montáž nábytku", da:"Samling af møbler", nl:"Meubels in elkaar zetten", en:"Assemble flat-pack furniture", et:"Lamemööbli kokkupanek", fi:"Litteän huonekalun kokoaminen", fr:"Monter un meuble en kit", de:"Flachpack-Möbel aufbauen", el:"Συναρμολόγηση επίπλου", hu:"Lapra szerelt bútor összeszerelése", ga:"Troscán réidhphacáilte a chur le chéile", it:"Montare un mobile", lv:"Mēbeļu salikšana", lt:"Baldų surinkimas", mt:"Immuntar għamara", pl:"Montaż mebli", pt:"Montar móveis", ro:"Asamblarea mobilierului", sk:"Montáž nábytku", sl:"Sestavljanje pohištva", es:"Montar un mueble", sv:"Montera möbler" },
  job_tire: { bg:"Смяна на гума", hr:"Zamjena gume", cs:"Výměna kola", da:"Skift af dæk", nl:"Een band verwisselen", en:"Change a tire", et:"Rehvi vahetamine", fi:"Renkaan vaihto", fr:"Changer un pneu", de:"Einen Reifen wechseln", el:"Αλλαγή λάστιχου", hu:"Gumiabroncs cseréje", ga:"Bonn a athrú", it:"Cambiare una gomma", lv:"Riepas nomaiņa", lt:"Padangos keitimas", mt:"Tibdil ta' tajer", pl:"Wymiana koła", pt:"Mudar um pneu", ro:"Schimbarea unei roți", sk:"Výmena kolesa", sl:"Menjava pnevmatike", es:"Cambiar una rueda", sv:"Byta däck" },
  job_electrical: { bg:"Основен електрически ремонт", hr:"Osnovni električarski popravak", cs:"Základní elektrikářská oprava", da:"Grundlæggende elreparation", nl:"Basis elektrische reparatie", en:"Basic electrical repair", et:"Lihtne elektriremont", fi:"Perussähkökorjaus", fr:"Réparation électrique de base", de:"Einfache Elektroreparatur", el:"Βασική ηλεκτρολογική επισκευή", hu:"Alapvető elektromos javítás", ga:"Deisiú leictreach bunúsach", it:"Riparazione elettrica di base", lv:"Vienkāršs elektrības remonts", lt:"Paprastas elektros remontas", mt:"Tiswija elettrika bażika", pl:"Podstawowa naprawa elektryczna", pt:"Reparação elétrica básica", ro:"Reparație electrică de bază", sk:"Základná elektrikárska oprava", sl:"Osnovno električno popravilo", es:"Reparación eléctrica básica", sv:"Enkel elreparation" },

  // Default location names (seed data — user-renamed locations keep their typed name instead)
  loc_pantry: { bg:"Килер", hr:"Smočnica", cs:"Spíž", da:"Spisekammer", nl:"Voorraadkast", en:"Pantry", et:"Sahver", fi:"Ruokakomero", fr:"Garde-manger", de:"Vorratsschrank", el:"Κελάρι", hu:"Kamra", ga:"Lardrús", it:"Dispensa", lv:"Pieliekamais", lt:"Sandėliukas", mt:"Maħżen tal-ikel", pl:"Spiżarnia", pt:"Despensa", ro:"Cămară", sk:"Špajza", sl:"Shramba", es:"Despensa", sv:"Skafferi" },
  loc_fridge: { bg:"Хладилник", hr:"Hladnjak", cs:"Lednice", da:"Køleskab", nl:"Koelkast", en:"Fridge", et:"Külmik", fi:"Jääkaappi", fr:"Réfrigérateur", de:"Kühlschrank", el:"Ψυγείο", hu:"Hűtő", ga:"Cuisneoir", it:"Frigorifero", lv:"Ledusskapis", lt:"Šaldytuvas", mt:"Fridge", pl:"Lodówka", pt:"Frigorífico", ro:"Frigider", sk:"Chladnička", sl:"Hladilnik", es:"Frigorífico", sv:"Kylskåp" },
  loc_freezer: { bg:"Фризер", hr:"Zamrzivač", cs:"Mraznička", da:"Fryser", nl:"Vriezer", en:"Freezer", et:"Sügavkülmik", fi:"Pakastin", fr:"Congélateur", de:"Gefrierschrank", el:"Καταψύκτης", hu:"Fagyasztó", ga:"Reoiteoir", it:"Congelatore", lv:"Saldētava", lt:"Šaldiklis", mt:"Freezer", pl:"Zamrażarka", pt:"Congelador", ro:"Congelator", sk:"Mraznička", sl:"Zamrzovalnik", es:"Congelador", sv:"Frys" },
  loc_cellar: { bg:"Мазе", hr:"Podrum", cs:"Sklep", da:"Kælder", nl:"Kelder", en:"Cellar", et:"Kelder", fi:"Kellari", fr:"Cave", de:"Keller", el:"Υπόγειο", hu:"Pince", ga:"Íoslach", it:"Cantina", lv:"Pagrabs", lt:"Rūsys", mt:"Kantina", pl:"Piwnica", pt:"Cave", ro:"Pivniță", sk:"Pivnica", sl:"Klet", es:"Bodega", sv:"Källare" },

  // Default demo food item names (seed data — items you add yourself keep the name you typed)
  food_frozen_peas: { bg:"Замразен грах", hr:"Smrznuti grašak", cs:"Mražený hrášek", da:"Frosne ærter", nl:"Diepvriesdoperwten", en:"Frozen Peas", et:"Külmutatud herned", fi:"Pakastetut herneet", fr:"Petits pois surgelés", de:"Tiefkühlerbsen", el:"Κατεψυγμένα μπιζέλια", hu:"Fagyasztott zöldborsó", ga:"Piseanna reoite", it:"Piselli surgelati", lv:"Saldēti zirnīši", lt:"Šaldyti žirneliai", mt:"Piżelli ffriżati", pl:"Mrożony groszek", pt:"Ervilhas congeladas", ro:"Mazăre congelată", sk:"Mrazený hrášok", sl:"Zamrznjen grah", es:"Guisantes congelados", sv:"Frysta ärtor" },
  food_whole_milk: { bg:"Пълномаслено мляко", hr:"Punomasno mlijeko", cs:"Plnotučné mléko", da:"Sødmælk", nl:"Volle melk", en:"Whole Milk", et:"Täispiim", fi:"Täysmaito", fr:"Lait entier", de:"Vollmilch", el:"Πλήρες γάλα", hu:"Teljes tejszínű tej", ga:"Bainne lán-mhéine", it:"Latte intero", lv:"Pilnpiens", lt:"Pilno riebumo pienas", mt:"Ħalib sħiħ", pl:"Mleko pełnotłuste", pt:"Leite gordo", ro:"Lapte integral", sk:"Plnotučné mlieko", sl:"Polnomastno mleko", es:"Leche entera", sv:"Standardmjölk" },
  food_potato_chips: { bg:"Чипс", hr:"Čips", cs:"Bramborové chipsy", da:"Chips", nl:"Chips", en:"Potato Chips", et:"Kartulikrõpsud", fi:"Perunalastut", fr:"Chips", de:"Kartoffelchips", el:"Πατατάκια", hu:"Burgonyachips", ga:"Brioscáin phrátaí", it:"Patatine", lv:"Kartupeļu čipsi", lt:"Bulvių traškučiai", mt:"Chips tal-patata", pl:"Chipsy ziemniaczane", pt:"Batatas fritas (pacote)", ro:"Chipsuri", sk:"Zemiakové čipsy", sl:"Krompirjev čips", es:"Patatas fritas", sv:"Chips" },
  food_greek_yogurt: { bg:"Гръцко кисело мляко", hr:"Grčki jogurt", cs:"Řecký jogurt", da:"Græsk yoghurt", nl:"Griekse yoghurt", en:"Greek Yogurt", et:"Kreeka jogurt", fi:"Kreikkalainen jogurtti", fr:"Yaourt grec", de:"Griechischer Joghurt", el:"Ελληνικό γιαούρτι", hu:"Görög joghurt", ga:"Iógart Gréagach", it:"Yogurt greco", lv:"Grieķu jogurts", lt:"Graikiškas jogurtas", mt:"Jogurt Grieg", pl:"Jogurt grecki", pt:"Iogurte grego", ro:"Iaurt grecesc", sk:"Grécky jogurt", sl:"Grški jogurt", es:"Yogur griego", sv:"Grekisk yoghurt" },
};

function tFactory(lang) {
  return function t(key, vars) {
    const entry = TR[key];
    let str = (entry && (entry[lang] || entry.en)) || key;
    if (vars) Object.keys(vars).forEach((k) => { str = str.split(`{${k}}`).join(vars[k]); });
    return str;
  };
}

const LangContext = createContext((k) => k);
function useT() { return useContext(LangContext); }

/* ---------------------------------------------------------------
   Constants
--------------------------------------------------------------- */

const KIND_ICON = { pantry: Archive, fridge: Package, freezer: Snowflake, other: Home };

const FOOD_CATEGORIES = [
  { id: "snacks", kind: "pantry" }, { id: "grains", kind: "pantry" }, { id: "canned", kind: "pantry" },
  { id: "baking", kind: "pantry" }, { id: "bread", kind: "pantry" }, { id: "dairy", kind: "fridge" },
  { id: "produce", kind: "fridge" }, { id: "meat_fresh", kind: "fridge" }, { id: "condiments", kind: "fridge" },
  { id: "beverages", kind: "fridge" }, { id: "leftovers", kind: "fridge" }, { id: "frozen_veg", kind: "freezer" },
  { id: "frozen_meat", kind: "freezer" }, { id: "frozen_meals", kind: "freezer" },
];

const UNITS = ["pcs", "g", "kg", "ml", "l"];

const TOOL_CATEGORIES = ["hand", "power", "painting", "plumbing", "electrical", "garden", "safety"];

const JOBS = [
  { id: "shelf", toolKeys: ["drill", "level", "screwdriver", "tape_measure", "wall_anchors"] },
  { id: "faucet", toolKeys: ["adjustable_wrench", "plumbers_tape", "screwdriver", "bucket"] },
  { id: "paint", toolKeys: ["paint_roller", "paint_brush", "painters_tape", "drop_cloth", "ladder"] },
  { id: "furniture", toolKeys: ["screwdriver", "allen_key_set", "rubber_mallet"] },
  { id: "tire", toolKeys: ["jack", "lug_wrench", "tire_gauge"] },
  { id: "electrical", toolKeys: ["voltage_tester", "wire_strippers", "screwdriver", "electrical_tape"] },
];

const CLOTHING_CATEGORIES = ["tops", "bottoms", "outerwear", "dresses", "shoes", "accessories"];

// Displays a translated name for seed/demo data (via nameKey), or the literal
// name the person typed for anything they added themselves.
function displayName(obj, t) {
  return obj.nameKey ? t(obj.nameKey) : obj.name;
}

const DEFAULT_LOCATIONS = [
  { id: "loc_pantry", nameKey: "loc_pantry", kind: "pantry" },
  { id: "loc_fridge", nameKey: "loc_fridge", kind: "fridge" },
  { id: "loc_freezer", nameKey: "loc_freezer", kind: "freezer" },
  { id: "loc_cellar", nameKey: "loc_cellar", kind: "other" },
];

const inDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const DEFAULT_FOOD = [
  { id: "f1", nameKey: "food_frozen_peas", category: "frozen_veg", location: "loc_freezer", quantity: 1, unit: "kg", expiry: inDays(120) },
  { id: "f2", nameKey: "food_whole_milk", category: "dairy", location: "loc_fridge", quantity: 1, unit: "l", expiry: inDays(3) },
  { id: "f3", nameKey: "food_potato_chips", category: "snacks", location: "loc_pantry", quantity: 2, unit: "pcs", expiry: inDays(60) },
  { id: "f4", nameKey: "food_greek_yogurt", category: "dairy", location: "loc_fridge", quantity: 4, unit: "pcs", expiry: inDays(1) },
];

const DEFAULT_TOOLS = [
  { id: "t1", key: "drill", category: "power", owned: true },
  { id: "t2", key: "screwdriver", category: "hand", owned: true },
  { id: "t3", key: "level", category: "hand", owned: true },
  { id: "t4", key: "tape_measure", category: "hand", owned: true },
  { id: "t5", key: "adjustable_wrench", category: "hand", owned: false },
  { id: "t6", key: "ladder", category: "safety", owned: true },
  { id: "t7", key: "paint_roller", category: "painting", owned: false },
];

const DEFAULT_CLOTHING = [
  { id: "c1", name: "Denim Jacket", category: "outerwear", color: "#3F5B8C", photo: null, status: "clean" },
  { id: "c2", name: "White Tee", category: "tops", color: "#e8e5dc", photo: null, status: "dirty" },
  { id: "c3", name: "Running Shoes", category: "shoes", color: "#4a453c", photo: null, status: "clean" },
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------------------------------------------------------------
   Storage helpers (Claude artifact storage, falls back to localStorage)
--------------------------------------------------------------- */

const hasClaudeStorage = typeof window !== "undefined" && !!window.storage;

async function loadKey(key, fallback) {
  try {
    if (hasClaudeStorage) {
      const res = await window.storage.get(key);
      return res && res.value ? JSON.parse(res.value) : fallback;
    }
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    if (hasClaudeStorage) { await window.storage.set(key, JSON.stringify(value)); }
    else { window.localStorage.setItem(key, JSON.stringify(value)); }
  } catch { /* noop */ }
}

/* ---------------------------------------------------------------
   Domain logic
--------------------------------------------------------------- */

function expiryStatus(dateStr) {
  if (!dateStr) return { tone: "neutral", kind: "no_date", days: null };
  const days = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000);
  if (days < 0) return { tone: "danger", kind: "expired", days };
  if (days === 0) return { tone: "danger", kind: "today", days };
  if (days <= 3) return { tone: "warn", kind: "days_left", days };
  return { tone: "ok", kind: "fresh", days };
}

function expiryLabel(t, st) {
  if (st.kind === "no_date") return t("stamp_no_date");
  if (st.kind === "expired") return t("stamp_expired");
  if (st.kind === "today") return t("stamp_today");
  if (st.kind === "days_left") return t("stamp_days_left", { d: st.days });
  return t("stamp_fresh");
}

const OFF_RULES = [
  { kw: ["ice-cream", "ice cream", "sorbet", "frozen-desserts", "frozen-meals", "ready-meals"], cat: "frozen_meals" },
  { kw: ["frozen-vegetables", "frozen-fruits", "frozen"], cat: "frozen_veg" },
  { kw: ["frozen-meats", "frozen-fish"], cat: "frozen_meat" },
  { kw: ["dairies", "milk", "cheese", "yogurt", "cream", "eggs"], cat: "dairy" },
  { kw: ["fresh-vegetables", "fresh-fruits", "vegetables", "fruits"], cat: "produce" },
  { kw: ["meats", "poultry", "fish-and-fish-products", "seafood"], cat: "meat_fresh" },
  { kw: ["breads", "bakery", "viennoiseries"], cat: "bread" },
  { kw: ["snacks", "chips", "crisps", "biscuits", "cookies", "candies", "chocolates"], cat: "snacks" },
  { kw: ["beverages", "drinks", "waters", "sodas", "juices", "coffees", "teas"], cat: "beverages" },
  { kw: ["sauces", "condiments", "ketchups", "mustards", "spreads"], cat: "condiments" },
  { kw: ["pastas", "rices", "cereals", "flours"], cat: "grains" },
  { kw: ["spices", "herbs", "baking"], cat: "baking" },
  { kw: ["canned", "tinned", "jarred", "preserved"], cat: "canned" },
];

function guessCategoryFromTags(tagsStr) {
  const s = (tagsStr || "").toLowerCase();
  for (const rule of OFF_RULES) if (rule.kw.some((k) => s.includes(k))) return rule.cat;
  return null;
}

function suggestedLocation(categoryId, locations) {
  const cat = FOOD_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;
  return locations.find((l) => l.kind === cat.kind) || null;
}

function resizeImage(file, maxSize = 320, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------
   Small shared UI
--------------------------------------------------------------- */

function Stamp({ children, tone = "neutral" }) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>;
}

function Chip({ active, onClick, icon: Icon, children }) {
  return (
    <button className={`chip ${active ? "chip-active" : ""}`} onClick={onClick} type="button">
      {Icon && <Icon size={13} strokeWidth={2.3} />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty">
      <Icon size={30} strokeWidth={1.5} />
      <div className="empty-title">{title}</div>
      <div className="empty-sub">{subtitle}</div>
    </div>
  );
}

function Sheet({ title, onClose, children, accent }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" style={{ "--accent": accent }} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">{title}</span>
          <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

/* ---------------------------------------------------------------
   Food domain
--------------------------------------------------------------- */

function FoodTicket({ item, location, onDelete }) {
  const t = useT();
  const st = expiryStatus(item.expiry);
  const cat = FOOD_CATEGORIES.find((c) => c.id === item.category);
  return (
    <div className="ticket">
      <div className="ticket-row">
        <div>
          <div className="ticket-name">{displayName(item, t)}</div>
          <div className="ticket-meta">{cat ? t(`cat_${cat.id}`) : t("uncategorized")} · {location ? displayName(location, t) : "—"}</div>
        </div>
        <button className="icon-btn ghost" onClick={() => onDelete(item.id)} type="button" aria-label="Remove item"><Trash2 size={15} /></button>
      </div>
      <div className="ticket-row bottom">
        <span className="mono">{item.quantity} {item.unit === "pcs" ? t("unit_pcs") : item.unit}</span>
        <Stamp tone={st.tone}>{expiryLabel(t, st)}</Stamp>
      </div>
    </div>
  );
}

function AddFoodModal({ locations, onClose, onAdd, accent }) {
  const t = useT();
  const [mode, setMode] = useState("manual");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [locationId, setLocationId] = useState("");
  const [expiry, setExpiry] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);

  const suggested = category ? suggestedLocation(category, locations) : null;
  const chosen = locations.find((l) => l.id === locationId);
  const mismatch = suggested && chosen && chosen.id !== suggested.id;

  useEffect(() => () => stopScan(), []);

  function applyCategory(newCategory) {
    setCategory(newCategory);
    const s = suggestedLocation(newCategory, locations);
    if (s) setLocationId(s.id);
  }

  function stopScan() {
    scanningRef.current = false;
    setScanning(false);
    if (streamRef.current) { streamRef.current.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; }
  }

  async function startScan() {
    setScanError("");
    if (!("BarcodeDetector" in window)) {
      setScanError(t("scan_err_unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      scanningRef.current = true;
      setScanning(true);
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      loop(detector);
    } catch (e) {
      setScanError(t("scan_err_camera", { msg: e.message || "permission denied" }));
    }
  }

  function loop(detector) {
    if (!scanningRef.current || !videoRef.current) return;
    detector.detect(videoRef.current)
      .then((codes) => {
        if (codes.length > 0) { handleCode(codes[0].rawValue); }
        else if (scanningRef.current) requestAnimationFrame(() => loop(detector));
      })
      .catch(() => { if (scanningRef.current) requestAnimationFrame(() => loop(detector)); });
  }

  async function handleCode(code) {
    stopScan();
    await lookup(code);
  }

  async function lookup(code) {
    setLookupLoading(true);
    setScanError("");
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setScanError(t("scan_err_no_product"));
      } else {
        const p = data.product;
        setName(p.product_name || p.generic_name || "Scanned item");
        const guess = guessCategoryFromTags(p.categories_tags ? p.categories_tags.join(" ") : p.categories || "");
        if (guess) applyCategory(guess);
      }
    } catch {
      setScanError(t("scan_err_lookup_fail"));
    } finally {
      setLookupLoading(false);
      setMode("manual");
    }
  }

  function submit() {
    if (!name.trim() || !locationId) return;
    onAdd({ id: uid(), name: name.trim(), category, location: locationId, quantity: Number(quantity) || 1, unit, expiry });
    onClose();
  }

  return (
    <Sheet title={t("add_food_title")} onClose={onClose} accent={accent}>
      <div className="seg">
        <button className={`seg-btn ${mode === "manual" ? "seg-active" : ""}`} onClick={() => { stopScan(); setMode("manual"); }} type="button">{t("mode_manual")}</button>
        <button className={`seg-btn ${mode === "scan" ? "seg-active" : ""}`} onClick={() => setMode("scan")} type="button">
          <Barcode size={14} /> {t("mode_scan")}
        </button>
      </div>

      {mode === "scan" && (
        <div className="scan-block">
          {scanning ? (
            <div className="camera-wrap">
              <video ref={videoRef} className="camera-video" muted playsInline />
              <div className="scan-line" />
              <button className="btn btn-danger" onClick={stopScan} type="button">{t("stop_camera")}</button>
            </div>
          ) : (
            <button className="btn btn-accent" onClick={startScan} type="button" disabled={lookupLoading}>
              <Camera size={16} /> {t("start_camera")}
            </button>
          )}
          {lookupLoading && <div className="inline-note"><Loader2 size={14} className="spin" /> {t("looking_up")}</div>}
          {scanError && <div className="warn-box"><AlertTriangle size={14} />{scanError}</div>}
          <div className="or-row">{t("or_type_barcode")}</div>
          <div className="row-inline">
            <input className="input" placeholder="e.g. 7622210951309" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} />
            <button className="btn btn-accent" type="button" disabled={!manualBarcode || lookupLoading} onClick={() => lookup(manualBarcode)}>{t("look_up_btn")}</button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="form">
          <Field label={t("field_name")}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_food")} />
          </Field>
          <Field label={t("field_category")}>
            <select className="input" value={category} onChange={(e) => applyCategory(e.target.value)}>
              <option value="">{t("choose_category")}</option>
              {FOOD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(`cat_${c.id}`)}</option>)}
            </select>
          </Field>
          <div className="row-inline">
            <Field label={t("field_quantity")}>
              <input className="input" type="number" min="0" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </Field>
            <Field label={t("field_unit")}>
              <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u === "pcs" ? t("unit_pcs") : u}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t("field_location")}>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">{t("choose_location")}</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{displayName(l, t)}</option>)}
            </select>
          </Field>

          {mismatch && (
            <div className="warn-box">
              <AlertTriangle size={16} />
              <div>
                {t("mismatch_text", { cat: t(`cat_${category}`), loc: displayName(suggested, t) })} {t("mismatch_note")}
                <div className="warn-actions">
                  <button className="btn btn-ghost small" type="button" onClick={() => setLocationId(suggested.id)}>{t("use_instead_btn", { loc: displayName(suggested, t) })}</button>
                </div>
              </div>
            </div>
          )}

          <Field label={t("field_expiry")}>
            <input className="input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </Field>

          <button className="btn btn-primary" type="button" disabled={!name.trim() || !locationId} onClick={submit}>{t("add_to_warehouse_btn")}</button>
        </div>
      )}
    </Sheet>
  );
}

function FoodTab({ locations, foodItems, onAdd, onDelete, accent }) {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const expiring = foodItems.filter((f) => ["danger", "warn"].includes(expiryStatus(f.expiry).tone));
  const visible = foodItems.filter((f) => {
    if (filter === "all") return true;
    if (filter === "expiring") return ["danger", "warn"].includes(expiryStatus(f.expiry).tone);
    return f.location === filter;
  });

  const grouped = locations.map((l) => ({ location: l, items: visible.filter((f) => f.location === l.id) })).filter((g) => g.items.length > 0 || filter === g.location.id);

  return (
    <div className="tab-pane">
      {expiring.length > 0 && (
        <div className="banner" onClick={() => setFilter("expiring")}>
          <AlertTriangle size={15} />
          {expiring.length} {t("banner_attention")}
        </div>
      )}
      <div className="chip-row">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t("filter_all")}</Chip>
        <Chip active={filter === "expiring"} onClick={() => setFilter("expiring")} icon={AlertTriangle}>{t("filter_expiring")}</Chip>
        {locations.map((l) => <Chip key={l.id} active={filter === l.id} onClick={() => setFilter(l.id)} icon={KIND_ICON[l.kind]}>{displayName(l, t)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Package} title={t("food_empty_title")} subtitle={t("food_empty_sub")} />
      ) : filter === "all" || filter === "expiring" ? (
        grouped.map((g) => g.items.length > 0 && (
          <div key={g.location.id} className="group">
            <div className="group-title">{displayName(g.location, t)}</div>
            <div className="ticket-list">
              {g.items.map((it) => <FoodTicket key={it.id} item={it} location={g.location} onDelete={onDelete} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="ticket-list">
          {visible.map((it) => <FoodTicket key={it.id} item={it} location={locations.find((l) => l.id === it.location)} onDelete={onDelete} />)}
        </div>
      )}

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add food"><Plus size={22} /></button>
      {showAdd && <AddFoodModal locations={locations} onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   Tools domain
--------------------------------------------------------------- */

function AddToolModal({ onClose, onAdd, accent }) {
  const t = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("hand");
  const [owned, setOwned] = useState(true);
  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), category, owned });
    onClose();
  }
  return (
    <Sheet title={t("add_tool_title")} onClose={onClose} accent={accent}>
      <div className="form">
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_tool")} />
        </Field>
        <Field label={t("field_category")}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{t(`tcat_${c}`)}</option>)}
          </select>
        </Field>
        <div className="seg">
          <button className={`seg-btn ${owned ? "seg-active" : ""}`} type="button" onClick={() => setOwned(true)}>{t("own_this")}</button>
          <button className={`seg-btn ${!owned ? "seg-active" : ""}`} type="button" onClick={() => setOwned(false)}>{t("need_to_buy")}</button>
        </div>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_tool_title")}</button>
      </div>
    </Sheet>
  );
}

function toolDisplayName(tool, t) {
  return tool.key ? t(`tool_${tool.key}`) : tool.name;
}

function JobChecklist({ tools, accent }) {
  const t = useT();
  const [jobId, setJobId] = useState("");
  const job = JOBS.find((j) => j.id === jobId);
  const ownedKeys = new Set(tools.filter((tl) => tl.owned && tl.key).map((tl) => tl.key));
  const missing = job ? job.toolKeys.filter((k) => !ownedKeys.has(k)) : [];

  return (
    <div className="job-block" style={{ "--accent": accent }}>
      <div className="group-title">{t("job_check_title")}</div>
      <select className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>
        <option value="">{t("pick_job")}</option>
        {JOBS.map((j) => <option key={j.id} value={j.id}>{t(`job_${j.id}`)}</option>)}
      </select>
      {job && (
        <>
          <div className="job-list">
            {job.toolKeys.map((k) => {
              const have = ownedKeys.has(k);
              return (
                <div key={k} className="job-row">
                  {have ? <CheckCircle2 size={16} className="tone-ok" /> : <XCircle size={16} className="tone-danger" />}
                  <span className={have ? "" : "strike-muted"}>{t(`tool_${k}`)}</span>
                </div>
              );
            })}
          </div>
          {missing.length === 0 ? (
            <div className="summary-ok"><Check size={14} /> {t("job_all_set")}</div>
          ) : (
            <div className="summary-warn"><ShoppingCart size={14} /> {t("job_buy_or_borrow", { list: missing.map((k) => t(`tool_${k}`)).join(", ") })}</div>
          )}
        </>
      )}
    </div>
  );
}

function ToolsTab({ tools, onAdd, onToggle, onDelete, accent }) {
  const t = useT();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const visible = filter === "all" ? tools : tools.filter((tl) => tl.category === filter);

  return (
    <div className="tab-pane">
      <div className="chip-row">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>{t("filter_all")}</Chip>
        {TOOL_CATEGORIES.map((c) => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{t(`tcat_${c}`)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Wrench} title={t("tools_empty_title")} subtitle={t("tools_empty_sub")} />
      ) : (
        <div className="ticket-list">
          {visible.map((tl) => (
            <div key={tl.id} className="ticket">
              <div className="ticket-row">
                <div>
                  <div className="ticket-name">{toolDisplayName(tl, t)}</div>
                  <div className="ticket-meta">{t(`tcat_${tl.category}`)}</div>
                </div>
                <button className="icon-btn ghost" onClick={() => onDelete(tl.id)} type="button" aria-label="Remove tool"><Trash2 size={15} /></button>
              </div>
              <div className="ticket-row bottom">
                <button className="stamp-btn" onClick={() => onToggle(tl.id)} type="button">
                  <Stamp tone={tl.owned ? "ok" : "danger"}>{tl.owned ? t("stamp_owned") : t("stamp_need_buy")}</Stamp>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobChecklist tools={tools} accent={accent} />

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add tool"><Plus size={22} /></button>
      {showAdd && <AddToolModal onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   Clothing domain
--------------------------------------------------------------- */

function AddClothingModal({ onClose, onAdd, accent }) {
  const t = useT();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CLOTHING_CATEGORIES[0]);
  const [color, setColor] = useState("#3F5B8C");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { setPhoto(await resizeImage(file)); } finally { setBusy(false); }
  }

  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), category, color, photo, status: "clean" });
    onClose();
  }

  return (
    <Sheet title={t("add_clothing_title")} onClose={onClose} accent={accent}>
      <div className="form">
        <div className="photo-upload">
          {photo ? <img src={photo} alt="" className="photo-preview" /> : <div className="photo-placeholder"><ImageOff size={22} /></div>}
          <label className="btn btn-ghost small file-btn">
            {busy ? t("processing_photo") : t("choose_photo")}
            <input type="file" accept="image/*" hidden onChange={handleFile} />
          </label>
        </div>
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_clothing")} />
        </Field>
        <Field label={t("field_category")}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CLOTHING_CATEGORIES.map((c) => <option key={c} value={c}>{t(`ccat_${c}`)}</option>)}
          </select>
        </Field>
        <Field label={t("field_color")}>
          <input className="input color-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </Field>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_to_wardrobe_btn")}</button>
      </div>
    </Sheet>
  );
}

function ClothingTab({ items, onAdd, onToggle, onDelete, accent }) {
  const t = useT();
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const visible = items.filter((c) => (catFilter === "all" || c.category === catFilter) && (statusFilter === "all" || c.status === statusFilter));
  const dirtyCount = items.filter((c) => c.status === "dirty").length;

  return (
    <div className="tab-pane">
      <div className="stats-row">
        <div className="stat"><span className="stat-num">{items.length}</span><span className="stat-label">{t("cloth_stat_total")}</span></div>
        <div className="stat"><span className="stat-num">{items.length - dirtyCount}</span><span className="stat-label">{t("cloth_stat_ready")}</span></div>
        <div className="stat"><span className="stat-num">{dirtyCount}</span><span className="stat-label">{t("cloth_stat_dirty")}</span></div>
      </div>
      <div className="chip-row">
        <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>{t("filter_all")}</Chip>
        <Chip active={statusFilter === "clean"} onClick={() => setStatusFilter("clean")}>{t("cloth_stat_ready")}</Chip>
        <Chip active={statusFilter === "dirty"} onClick={() => setStatusFilter("dirty")}>{t("cloth_stat_dirty")}</Chip>
      </div>
      <div className="chip-row">
        <Chip active={catFilter === "all"} onClick={() => setCatFilter("all")}>{t("filter_all_types")}</Chip>
        {CLOTHING_CATEGORIES.map((c) => <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{t(`ccat_${c}`)}</Chip>)}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Shirt} title={t("food_empty_title")} subtitle={t("cloth_empty_sub")} />
      ) : (
        <div className="cloth-grid">
          {visible.map((c) => (
            <div key={c.id} className="cloth-card">
              <div className="cloth-photo" style={{ background: c.photo ? "transparent" : c.color }}>
                {c.photo ? <img src={c.photo} alt={c.name} /> : <Shirt size={26} color="rgba(255,255,255,0.85)" />}
                <button className="icon-btn ghost overlay-btn" onClick={() => onDelete(c.id)} type="button" aria-label="Remove"><Trash2 size={13} /></button>
              </div>
              <div className="cloth-name">{c.name}</div>
              <div className="cloth-meta">{t(`ccat_${c.category}`)}</div>
              <button className="stamp-btn" onClick={() => onToggle(c.id)} type="button">
                <Stamp tone={c.status === "clean" ? "ok" : "warn"}>{c.status === "clean" ? t("stamp_ready") : t("stamp_dirty")}</Stamp>
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="fab" style={{ "--accent": accent }} onClick={() => setShowAdd(true)} type="button" aria-label="Add clothing"><Plus size={22} /></button>
      {showAdd && <AddClothingModal onClose={() => setShowAdd(false)} onAdd={onAdd} accent={accent} />}
    </div>
  );
}

/* ---------------------------------------------------------------
   Locations settings
--------------------------------------------------------------- */

function LocationsTab({ locations, foodItems, onAdd, onDelete, onReset }) {
  const t = useT();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("pantry");

  function submit() {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), kind });
    setName("");
  }

  function tryDelete(id) {
    if (foodItems.some((f) => f.location === id)) {
      window.alert(t("delete_location_blocked_alert"));
      return;
    }
    onDelete(id);
  }

  return (
    <div className="tab-pane">
      <div className="group-title">{t("locations_title")}</div>
      <div className="ticket-list">
        {locations.map((l) => {
          const Icon = KIND_ICON[l.kind];
          return (
            <div key={l.id} className="loc-row">
              <Icon size={17} />
              <div className="loc-info">
                <div className="ticket-name">{displayName(l, t)}</div>
                <div className="ticket-meta">{t(`kind_placement_${l.kind}`)}</div>
              </div>
              <button className="icon-btn ghost" onClick={() => tryDelete(l.id)} type="button" aria-label="Delete location"><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>

      <div className="group-title">{t("add_location_title")}</div>
      <div className="form">
        <Field label={t("field_name")}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_placeholder_location")} />
        </Field>
        <Field label={t("field_behaves_like")}>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="pantry">{t("kind_full_pantry")}</option>
            <option value="fridge">{t("kind_full_fridge")}</option>
            <option value="freezer">{t("kind_full_freezer")}</option>
            <option value="other">{t("kind_full_other")}</option>
          </select>
        </Field>
        <button className="btn btn-primary" type="button" disabled={!name.trim()} onClick={submit}>{t("add_location_btn")}</button>
      </div>

      <button className="btn btn-ghost small reset-btn" type="button" onClick={onReset}><RotateCcw size={13} /> {t("reset_demo_btn")}</button>
    </div>
  );
}

/* ---------------------------------------------------------------
   App shell
--------------------------------------------------------------- */

export default function WarehouseApp() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [foodItems, setFoodItems] = useState([]);
  const [tools, setTools] = useState([]);
  const [clothing, setClothing] = useState([]);
  const [tab, setTab] = useState("food");

  useEffect(() => {
    (async () => {
      const [locs, food, tls, cloth, savedLang] = await Promise.all([
        loadKey("wh_locations", DEFAULT_LOCATIONS),
        loadKey("wh_food", DEFAULT_FOOD),
        loadKey("wh_tools", DEFAULT_TOOLS),
        loadKey("wh_clothing", DEFAULT_CLOTHING),
        loadKey("wh_lang", "en"),
      ]);
      setLocations(locs); setFoodItems(food); setTools(tls); setClothing(cloth); setLang(savedLang);
      setLoading(false);
    })();
  }, []);

  const t = tFactory(lang);

  function changeLang(code) {
    setLang(code);
    saveKey("wh_lang", code);
  }

  const persist = {
    locations: (v) => { setLocations(v); saveKey("wh_locations", v); },
    food: (v) => { setFoodItems(v); saveKey("wh_food", v); },
    tools: (v) => { setTools(v); saveKey("wh_tools", v); },
    clothing: (v) => { setClothing(v); saveKey("wh_clothing", v); },
  };

  const addFood = (item) => persist.food([item, ...foodItems]);
  const deleteFood = (id) => persist.food(foodItems.filter((f) => f.id !== id));

  const addTool = (tItem) => persist.tools([tItem, ...tools]);
  const toggleTool = (id) => persist.tools(tools.map((tl) => (tl.id === id ? { ...tl, owned: !tl.owned } : tl)));
  const deleteTool = (id) => persist.tools(tools.filter((tl) => tl.id !== id));

  const addCloth = (c) => persist.clothing([c, ...clothing]);
  const toggleCloth = (id) => persist.clothing(clothing.map((c) => (c.id === id ? { ...c, status: c.status === "clean" ? "dirty" : "clean" } : c)));
  const deleteCloth = (id) => persist.clothing(clothing.filter((c) => c.id !== id));

  const addLocation = (l) => persist.locations([...locations, l]);
  const deleteLocation = (id) => persist.locations(locations.filter((l) => l.id !== id));

  const resetDemo = () => {
    persist.locations(DEFAULT_LOCATIONS);
    persist.food(DEFAULT_FOOD);
    persist.tools(DEFAULT_TOOLS);
    persist.clothing(DEFAULT_CLOTHING);
  };

  const TABS = [
    { id: "food", label: t("nav_food"), icon: Package, accent: "var(--food)" },
    { id: "tools", label: t("nav_tools"), icon: Wrench, accent: "var(--tools)" },
    { id: "clothing", label: t("nav_wardrobe"), icon: Shirt, accent: "var(--clothing)" },
    { id: "locations", label: t("nav_locations"), icon: Settings, accent: "var(--ink)" },
  ];

  return (
    <LangContext.Provider value={t}>
      <div className="app-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

          .app-root {
            --bg: #E9E5DB; --surface: #FFFFFF; --surface-alt: #F3F0E8; --ink: #221F1A; --ink-soft: #766F60;
            --line: #D7D0BF; --food: #3F6B4F; --tools: #B5651D; --clothing: #3F5B8C;
            --danger: #C1443C; --warn: #C97F1E; --ok: #3F6B4F;
            font-family: 'Inter', sans-serif; color: var(--ink); background: var(--bg);
            max-width: 440px; width: 100%; margin: 0 auto; min-height: 100vh; min-height: 100dvh; position: relative;
            display: flex; flex-direction: column; padding-bottom: 76px; box-sizing: border-box;
          }
          .app-root * { box-sizing: border-box; }
          .mono { font-family: 'JetBrains Mono', monospace; }

          .app-header { padding: calc(22px + env(safe-area-inset-top)) calc(18px + env(safe-area-inset-right)) 12px calc(18px + env(safe-area-inset-left)); display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
          .wordmark { font-family: 'Anton', sans-serif; font-size: 26px; letter-spacing: 1.5px; line-height: 1; }
          .tagline { font-size: 12px; color: var(--ink-soft); margin-top: 4px; letter-spacing: 0.3px; }
          .lang-picker { display: flex; align-items: center; gap: 5px; background: var(--surface); border: 1px solid var(--line);
            border-radius: 8px; padding: 5px 6px; }
          .lang-select { border: none; background: none; font-size: 12px; font-weight: 600; color: var(--ink); max-width: 92px; }
          .lang-select:focus { outline: none; }

          .banner { margin: 0 18px 10px; background: #FBE9D8; border: 1px solid #ECC48D; color: #8A4B0E;
            padding: 10px 12px; border-radius: 10px; font-size: 13px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; }

          .tab-pane { padding: 4px calc(18px + env(safe-area-inset-right)) 12px calc(18px + env(safe-area-inset-left)); flex: 1; }

          .chip-row { display: flex; gap: 7px; overflow-x: auto; padding: 6px 0 12px; }
          .chip-row::-webkit-scrollbar { display: none; }
          .chip { flex: none; display: flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 999px;
            border: 1px solid var(--line); background: var(--surface); font-size: 12.5px; font-weight: 600; color: var(--ink-soft);
            cursor: pointer; white-space: nowrap; }
          .chip-active { background: var(--ink); border-color: var(--ink); color: #fff; }

          .group { margin-bottom: 6px; }
          .group-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--ink-soft); margin: 14px 0 8px; }

          .ticket-list { display: flex; flex-direction: column; gap: 10px; }
          .ticket { position: relative; background: var(--surface); border: 1px solid var(--line); border-left: 3px dashed var(--line);
            border-radius: 10px; padding: 12px 14px; }
          .ticket-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
          .ticket-row.bottom { margin-top: 8px; }
          .ticket-name { font-weight: 700; font-size: 14.5px; }
          .ticket-meta { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }

          .stamp { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 700;
            letter-spacing: 0.6px; padding: 3px 8px; border-radius: 4px; border: 1.5px solid; transform: rotate(-3deg); }
          .stamp-ok { color: var(--ok); border-color: var(--ok); background: rgba(63,107,79,0.08); }
          .stamp-warn { color: var(--warn); border-color: var(--warn); background: rgba(201,127,30,0.1); }
          .stamp-danger { color: var(--danger); border-color: var(--danger); background: rgba(193,68,60,0.09); }
          .stamp-neutral { color: var(--ink-soft); border-color: var(--line); }
          .stamp-btn { background: none; border: none; padding: 0; cursor: pointer; }

          .icon-btn { background: none; border: none; color: var(--ink-soft); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
          .icon-btn.ghost:hover { background: var(--surface-alt); color: var(--danger); }

          .loc-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line);
            border-radius: 10px; padding: 11px 13px; }
          .loc-info { flex: 1; }

          .stats-row { display: flex; gap: 10px; margin: 6px 0 12px; }
          .stat { flex: 1; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px; text-align: center; }
          .stat-num { display: block; font-family: 'Anton', sans-serif; font-size: 20px; }
          .stat-label { font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.4px; }

          .cloth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .cloth-card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 10px; }
          .cloth-photo { position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden;
            display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
          .cloth-photo img { width: 100%; height: 100%; object-fit: cover; }
          .overlay-btn { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.35); color: #fff; }
          .overlay-btn:hover { background: rgba(0,0,0,0.55); color: #fff; }
          .cloth-name { font-weight: 700; font-size: 13px; }
          .cloth-meta { font-size: 11px; color: var(--ink-soft); margin: 1px 0 6px; }

          .job-block { margin-top: 18px; background: var(--surface-alt); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
          .job-list { display: flex; flex-direction: column; gap: 7px; margin: 10px 0; }
          .job-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
          .tone-ok { color: var(--ok); flex: none; } .tone-danger { color: var(--danger); flex: none; }
          .strike-muted { color: var(--ink-soft); }
          .summary-ok { color: var(--ok); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
          .summary-warn { color: var(--danger); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }

          .empty { text-align: center; padding: 40px 20px; color: var(--ink-soft); }
          .empty-title { font-weight: 700; margin-top: 10px; color: var(--ink); }
          .empty-sub { font-size: 13px; margin-top: 3px; }

          .fab { position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); right: calc(50% - 220px + 18px + env(safe-area-inset-right)); width: 52px; height: 52px; border-radius: 50%;
            background: var(--accent, var(--ink)); color: #fff; border: none; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 6px 16px rgba(0,0,0,0.25); cursor: pointer; }
          @media (max-width: 480px) { .fab { right: calc(18px + env(safe-area-inset-right)); } }

          .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; max-width: 440px; margin: 0 auto; background: var(--surface);
            border-top: 1px solid var(--line); display: flex; padding: 8px calc(6px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(6px + env(safe-area-inset-left)); }
          .nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none;
            color: var(--ink-soft); font-size: 10.5px; font-weight: 600; padding: 6px 0; cursor: pointer; border-radius: 8px; }
          .nav-btn.active { color: var(--accent); }

          .overlay { position: fixed; inset: 0; background: rgba(20,18,14,0.45); display: flex; align-items: flex-end; z-index: 50; }
          .sheet { background: var(--surface); width: 100%; max-width: 440px; margin: 0 auto; border-radius: 18px 18px 0 0;
            max-height: 88vh; overflow-y: auto; animation: slideup 0.18s ease-out; }
          @keyframes slideup { from { transform: translateY(24px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
          .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--line);
            position: sticky; top: 0; background: var(--surface); }
          .sheet-title { font-family: 'Anton', sans-serif; font-size: 17px; letter-spacing: 0.4px; }
          .sheet-body { padding: 16px 18px 26px; }

          .form { display: flex; flex-direction: column; gap: 12px; }
          .field { display: flex; flex-direction: column; gap: 5px; flex: 1; }
          .field-label { font-size: 12px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.4px; }
          .input { border: 1px solid var(--line); border-radius: 8px; padding: 10px 11px; font-size: 14px; font-family: inherit;
            background: var(--surface); color: var(--ink); width: 100%; }
          .input:focus { outline: 2px solid var(--accent, var(--ink)); outline-offset: 1px; }
          .color-input { padding: 3px; height: 40px; cursor: pointer; }
          .row-inline { display: flex; gap: 10px; }

          .seg { display: flex; background: var(--surface-alt); border-radius: 9px; padding: 3px; gap: 3px; margin-bottom: 4px; }
          .seg-btn { flex: 1; border: none; background: none; padding: 8px 6px; border-radius: 7px; font-size: 12.5px; font-weight: 700;
            color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }
          .seg-active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

          .btn { border: none; border-radius: 9px; padding: 11px 16px; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 7px; font-family: inherit; }
          .btn:disabled { opacity: 0.45; cursor: not-allowed; }
          .btn-primary { background: var(--ink); color: #fff; }
          .btn-accent { background: var(--accent, var(--ink)); color: #fff; }
          .btn-danger { background: var(--danger); color: #fff; margin-top: 10px; }
          .btn-ghost { background: var(--surface-alt); color: var(--ink); }
          .btn.small { padding: 7px 12px; font-size: 12.5px; }
          .reset-btn { margin-top: 18px; }
          .file-btn { position: relative; }

          .scan-block { display: flex; flex-direction: column; gap: 10px; }
          .camera-wrap { position: relative; border-radius: 12px; overflow: hidden; background: #000; }
          .camera-video { width: 100%; display: block; aspect-ratio: 4/3; object-fit: cover; }
          .scan-line { position: absolute; left: 8%; right: 8%; top: 50%; height: 2px; background: #FF5B4C; box-shadow: 0 0 8px #FF5B4C; }
          .camera-wrap .btn { position: absolute; bottom: 10px; left: 10px; right: 10px; }
          .inline-note { font-size: 12.5px; color: var(--ink-soft); display: flex; align-items: center; gap: 6px; }
          .or-row { text-align: center; font-size: 11.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
          .spin { animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }

          .warn-box { display: flex; gap: 9px; background: #FBE9D8; border: 1px solid #ECC48D; color: #8A4B0E;
            padding: 10px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.4; }
          .warn-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }

          .photo-upload { display: flex; align-items: center; gap: 12px; }
          .photo-preview { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; }
          .photo-placeholder { width: 64px; height: 64px; border-radius: 10px; background: var(--surface-alt); color: var(--ink-soft);
            display: flex; align-items: center; justify-content: center; }

          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 10px; color: var(--ink-soft); }
        `}</style>

        {loading ? (
          <div className="loading-screen"><Loader2 size={22} className="spin" /> {t("loading_text")}</div>
        ) : (
          <>
            <div className="app-header">
              <div>
                <div className="wordmark">WAREHOUSE</div>
                <div className="tagline">{t("tagline")}</div>
              </div>
              <div className="lang-picker" title={t("language_title")}>
                <Globe size={14} />
                <select className="lang-select" value={lang} onChange={(e) => changeLang(e.target.value)} aria-label={t("language_title")}>
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {tab === "food" && <FoodTab locations={locations} foodItems={foodItems} onAdd={addFood} onDelete={deleteFood} accent="var(--food)" />}
            {tab === "tools" && <ToolsTab tools={tools} onAdd={addTool} onToggle={toggleTool} onDelete={deleteTool} accent="var(--tools)" />}
            {tab === "clothing" && <ClothingTab items={clothing} onAdd={addCloth} onToggle={toggleCloth} onDelete={deleteCloth} accent="var(--clothing)" />}
            {tab === "locations" && <LocationsTab locations={locations} foodItems={foodItems} onAdd={addLocation} onDelete={deleteLocation} onReset={resetDemo} />}

            <div className="bottom-nav">
              {TABS.map((tb) => {
                const Icon = tb.icon;
                return (
                  <button key={tb.id} className={`nav-btn ${tab === tb.id ? "active" : ""}`} style={{ "--accent": tb.accent }} onClick={() => setTab(tb.id)} type="button">
                    <Icon size={19} strokeWidth={tab === tb.id ? 2.4 : 2} />
                    {tb.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </LangContext.Provider>
  );
}
