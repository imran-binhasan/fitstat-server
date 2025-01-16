const express = require('express');
const cors = require('cors');
const {configDotenv} = require('dotenv')

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 4000;
configDotenv()
