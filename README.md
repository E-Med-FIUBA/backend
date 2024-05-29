<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Setup

### Comentarios generales
Vamos a tener 2 bases de datos en un container de Docker. La primera la vamos a usar exclusivamente para el desarrollo (_dev_). Por el otro lado, la segunda la vamos a usar solo para ejecutar tests (_test_). Esto evita interferencia entre las bases de datos.

### Docker

Seguir [este tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04) para instalarlo en Ubuntu. Tambien pueden bajarse Docker Desktop usando [este link](https://www.docker.com/).

### .env

1. Crear un nuevo archivo en la carpeta backend que se llame _.env_ y otro que se llame _.env.test_
2. Copiar los contenidos del archivo _.env.template_ al archivo que creaste en el paso anterior
3. En el archivo _.env_ asignar el puerto **5434** para PostgreSQL. Por el otro lado, en el archivo _.env.test_ asignar el puerto **5435** para PostgreSQL. (en DATABASE_URL).
4. Reemplazar los valores entre "< >" por los que corresponda (espero que hayas guardado ese username y password 👀)


## ⚡ Quick start

### 🔌 Inicializar DB 

En la consola correr el comando

```bash
yarn db:dev:up
```

### 🔄 Aplicar migraciones de Prisma 

En la consola correr el comando

```bash
yarn prisma:dev:deploy
```

### 🚀 Como levantar el proyecto 

Para levantar el proyecto, primero hay que inicializar la DB de _dev_. Luego, es necesario iniciar el microservicio. Para lograr esto, debemos ejecutar los siguientes comandos:
1. `yarn db:dev:up`
2. `yarn start`

### 🧪 Como ejecutar los tests 
Para ejecutar los tests, primero hay que inicializar la DB de _test_. Luego, ejecutamos el comando adecuado en base a que test queremos ejecutar ([comandos](#comandos))

## 📄 Documentacion relevante 

- [Documentacion oficial de NestJS](https://docs.nestjs.com/)
- Documentacion [Prisma](https://www.prisma.io/docs/) que es el [ORM](https://docs.google.com/document/d/1YLmp9vMnSzKg2emt3Bx564Tf1CLalShPc98Z8nCoi7s) que vamos a estar usando.
- [NestJS + Prisma](https://docs.nestjs.com/recipes/prisma)
- [Que es el .env???](https://github.com/motdotla/dotenv#readme)

## 📄 Comandos 

### `yarn start`

Para levantar el proyecto. 

Flags opcionales:
- `--watch`: Permite levantar el proyecto en modo _watch_ (cada vez que se hace un cambio en el codigo, se reinicia el proyecto).

### `yarn db:dev:up` / `yarn db:test:up`

Levanta la base de datos de dev/test.

### `yarn db:dev:rm` / `yarn db:test:rm`

Elimina la base de datos de dev/test.

### `yarn db:dev:restart` / `yarn db:test:restart`

Elimina la base de datos de dev/test, luego la vuelve a crear y aplica las migraciones de Prisma.

### `yarn prisma:dev:deploy` / `yarn prisma:test:deploy`

Aplica las migraciones de Prisma a la base de datos de dev/test.

### `yarn prisma generate`

Si hicimos algun cambio al schema este comando actualiza prisma. Si ya corriste las migrations este comando ya se llamo.

### `yarn test`

Correr tests.

### `yarn test:e2e`

Correr tests end-to-end. 

Flags opcionales: 
- `--watch`: Permite correrlo en modo watch (los tests se ejecutan cada vez que se actualiza el codigo).

### `yarn prisma studio`

Abrir prisma studio para visualizar la base de datos.