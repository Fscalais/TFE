# Démarrage rapide  
## Cloner le repo  
`git clone https://github.com/Fscalais/TFE.git`  

## Lancer le backend (Docker Compose)  
Depuis /tfe  
`docker compose up --build`  

## Lancer le frontend  
Depuis /tfe  
`cd client  
npm ci  
npm start  
`  
## Pour lancer les tests  
Depuis /tfe  
`cd server  
npm ci  
npx jest --runInBand
`  
# Ce qui ne fonctionnera pas :  
Google OAuth -> pas de clé API car pas de .env  
Bot Discord -> pas de clé API car pas de .env  

