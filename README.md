# INTRO

- Music has been an important part of human culture for centuries.
Many people enjoy listening to music and appreciate the artistry and
skill of professional musicians. However, not everyone is born with a
natural talent for creating music. For some, the idea of composing
their own music can be intimidating or seem impossible.

- Despite this, many people still have a deep love for music and a
desire to create it themselves.

- This project aims to give people a chance to create their own music. Hope you enjoy it!

# PREREQUISITE

- VScode is preferred to run the project.
- Docker should be installed beforehand. 
https://www.docker.com/products/docker-desktop/
- Node version should be between 16 and 18.
https://nodejs.org/en/download Or you can use nvm to install from the command line.

# INSTALLATION

0. Clone the repository using the `git clone` command
1. Install the necessary packages: `yarn install`
2. Create docker image: `docker-compose -f docker-compose.yml up -d --build`
3. Create env file: `cp .env.example .env`
4. Deploy the tables to the database: `yarn prisma migrate dev`.

# Start the server

- Start the server using the command `node index.js`