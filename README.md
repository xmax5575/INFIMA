## INFIMA
Ovo je službeni repozitorij za Platformu za online poduke INFIMA.

Cilj ove platforme je ponuditi svima brz i jednostavan pristup kvalitetnim podukama iz STEM područja.


## Članovi tima
- Max Matišić - max.matisic@fer.unizg.hr
- Fabian Serdarušić - fabian.serdarusic@fer.unizg.hr
- Lucija Kuzminski - lucija.kuzminski@fer.unizg.hr
- Matija Bürgler - matija.burgler@fer.unizg.hr
- Marija Dundović - marija.dundovic@fer.unizg.hr
- Noa Topic - noa.topic@fer.unizg.hr
- Karlo Krstić - karlo.krstic@fer.unizg.hr


## Glavni funkcijski zahtjevi
- F01 Sustav omogućuje učenicima plaćanje rezerviranih satova. 
- F02 Sustav omogućuje korisnicima rezervaciju termina instrukcija.
- F03 Sustav omogućuje korisnicima registraciju i prijavu putem OAuth 2.0 standarda uz mogućnost klasične registracije e-poštom.
- F06 Sustav omogućuje instruktorima oglašavanje termina s detaljnim parametrima (trajanje, cijena, format).
- F013 Sustav omogućuje učenicima ocjenjivanje i recenziranje instruktora nakon održane sesije.

Svi funkcijski zahtjevi: [Wiki stranica](https://github.com/xmax5575/INFIMA/wiki/2.-Analiza-zahtjeva)


## Tehnologije
- Dokumentacija: Wiki, Draw.io

- Frontend: React, Figma, Vite

- Backend: Python, Django, OAuth 2.0

- Baza podataka: PostgreSQL, Supabase

- Razvojni alat: Visual studio code

- Deployment: Render, Vercel

- Komunikacija: WhatsApp, Microsoft Teams, Discord

- Version control: Git, GitHub, Github desktop



## Napomene

---

### Plaćanje (testni podaci)

Za testiranje plaćanja koriste se sljedeći podaci:

- **Datum isteka:** `12 / 34`
- **CVV:** `123`

**Testni brojevi kartica:**

- `4242 4242 4242 4242` – uspješno plaćanje  
- `4000 0000 0000 9555` – nedovoljno sredstava  
- `4000 0000 0000 0002` – kartica odbijena  

---

### Admin pristup

Za administratorski pristup moguće je:

- prijaviti se putem frontenda  
- ili direktno putem Django admin sučelja:  
  👉 https://infima.onrender.com/admin

**Admin korisnički podaci:**

- **Email:** `infima.instrukcije@gmail.com`
- **Lozinka:** `Infima123`

---

### Google prijava i kalendar

- Za prijavu putem Google računa korisnik mora biti dodan u **test users** na Google Cloudu.
- Za integraciju s **Google Calendarom**, kalendar mora biti postavljen kao javan:

**Postupak:**
1. Postavke
2. Kalendar
3. Dozvole za pristup za događaje
4. Postaviti da je kalendar dostupan svima

> Integracija Google kalendara moguća je **isključivo ako se korisnik prijavi putem Google prijave**.

---

### Napomene o free instancama

- Zbog korištenja **free instance na Renderu**, prilikom prvog logina može doći do kašnjenja od približno **jedne minute**.
- Zbog **free instance na Vercelu**, sustav šalje **najviše dva emaila dnevno**, u **12:30**.

---

### Pokretanje testova

#### Backend testiranje

U direktoriju `src/backend` pokrenuti:
_python manage.py test api.tests_

### Frontend testiranje

U direktoriju src/frontend pokrenuti:
_npm test_

### Logika kviza

* Ako student na kvizu ostvari više od 90%, povećava mu se razina znanja za taj predmet.

* Ako student ostvari manje od 40%, razina znanja mu se smanjuje.

