# AdonisJS API Scafffolding

An API Infrastructure in AdonisJS.

This project is just a starter setup for Register, Login and Forgot Password. It includes role management too.

Database used in MySQL.

The frontend repo of the project: [https://github.com/base234/KnowYourLocal-backend](https://github.com/base234/KnowYourLocal-backend)

# Getting Started
## Requirements

- Node v21+
- Docker

## Project setup
### 1. Download the project to your local machine (SSH)
```
git clone git@github.com:base234/KnowYourLocal-backend.git
```

### 2. Navigate to the project directory
```
cd KnowYourLocal-backend
```

### 3. Setup .env
Copy the ***.env.example*** and rename it to ***.env**.

### 4. Make sure to update the Database name as per your project in `.env`

### 5. Build the image
```
docker compose up -d --build
```

### 6. Run the image
```
docker compose up -d
```

### 7. Running migrations (in container)
Inside the container, run the database migrations:
```
node ace migration:run
```

### 8. Database seeding (in container)
Inside the container, run the database seeding:
```
node ace db:seed
```

---
## Things to understand here for seeder.

Below is the folder structure
```
├── config/
│   └── database.ts
├── database
    └── seeder/
        └── main/
            └── index.ts
```

**Note**: The ```config/database.ts``` is configured to use seeders from ```database/seeders/main``` (paths: ['database/seeders/main']). It will automatically run the seeders in the ```database/seeders/main``` directory.

Since, this main directory contains only one seed file, namely ```index.ts```, it will run that file only. But that index.ts contains multiple seeders, which are imported and run one by one in ordered sequence. So, thus maintaining the order of seed files is very important.

#### Optional: Running a single seed file
Suppose, you want to run a single seed file, say ```role_seeder.ts```. You can do so by running the following command:
```
node ace db:seed --files="./database/seeders/role_seeder.ts"
```

#### Tip: Running seeder in interactive mode
You can run the seeder in interactive mode by running the following command:
```
node ace db:seed -i
```
---

The API server is running at: [http://localhost:3333](http://localhost:3333)
