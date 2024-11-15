const express = require('express');
const dotenv = require('dotenv');
const db = require('./models/db');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDoc = YAML.load('./docs/swagger.yaml');


dotenv.config();

const app = express();
app.use(express.json());
const PORT = process.env.SERVER_PORT || 3000;

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

db.getConnection()
    .then(connection => {
        console.log('Database connected successfully!');

        connection.release();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        });

    })
    .catch(error => {
        console.error('Database connection failed:', error);
        process.exit(1);
    });

app.use('/', require('./routes/userRoutes'));
